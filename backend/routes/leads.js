import express from 'express';
import { db, isFallback } from '../db/db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Helper to calculate AI Score
function calculateAiScore(email, phone, message, source) {
  let score = 40;
  
  // Phone check
  if (phone && phone.trim() !== '') score += 15;
  
  // Message depth check
  if (message && message.trim().length > 60) score += 15;
  
  // Corporate domain check
  const domain = email.split('@')[1] || '';
  const generalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
  if (domain && !generalDomains.includes(domain.toLowerCase())) {
    score += 20;
  }
  
  // Source check
  if (source === 'Referral') score += 10;
  
  return Math.min(score, 100);
}

// Helper to calculate potential value
function calculatePotentialValue(email) {
  const domain = email.split('@')[1] || '';
  const generalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
  
  let baseValue = 30000;
  if (domain && !generalDomains.includes(domain.toLowerCase())) {
    baseValue = 90000; // Corporate accounts have higher value
  }
  
  const randomAddition = Math.floor(Math.random() * 50000) + 10000; // ₹10,000 to ₹60,000
  return baseValue + randomAddition;
}

// POST /api/leads/submit (Public - simulated website contact form)
router.post('/submit', async (req, res) => {
  const { name, email, phone, message, source } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    const calculatedScore = calculateAiScore(email, phone, message, source);
    const calculatedValue = calculatePotentialValue(email);
    
    // Rotate assignments
    const agents = ['Sarah Sales', 'Mike Sales', 'John Admin'];
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];

    const activityText = `Form Submitted via ${source || 'Website Form'}`;

    const newLead = await db.leads.create({
      name,
      email,
      phone: phone || '',
      message: message || '',
      source: source || 'Website Form',
      status: 'New',
      value: calculatedValue,
      assignedTo: randomAgent,
      followUpDate: '',
      aiScore: calculatedScore,
      activities: [
        { text: activityText, type: 'creation', date: new Date().toISOString() }
      ],
      notes: [],
      date: new Date().toISOString()
    });

    res.status(201).json({ success: true, message: 'Lead submitted successfully.', lead: newLead });
  } catch (error) {
    console.error('Lead submission error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// All routes below this middleware require Admin Authentication
router.use(auth);

// GET /api/leads (Admin - list leads with filters)
router.get('/', async (req, res) => {
  const { search, status, source, assignedTo } = req.query;

  try {
    const leads = await db.leads.find({ search, status, source, assignedTo });
    res.json({ leads, isFallback: isFallback() });
  } catch (error) {
    console.error('Fetch leads error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/leads/sources (Admin - get all unique lead sources for filters)
router.get('/sources', async (req, res) => {
  try {
    const leads = await db.leads.find({});
    const sources = [...new Set(leads.map(l => l.source).filter(Boolean))];
    res.json({ sources });
  } catch (error) {
    console.error('Fetch sources error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/leads/:id (Admin - get single lead)
router.get('/:id', async (req, res) => {
  try {
    const lead = await db.leads.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    res.json(lead);
  } catch (error) {
    console.error('Fetch lead details error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/leads/:id/status (Admin - update status)
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid lead status.' });
  }

  try {
    const lead = await db.leads.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const oldStatus = lead.status;
    const activities = lead.activities || [];
    
    // Add status activity log
    activities.push({
      text: `Stage updated from ${oldStatus} to ${status}`,
      type: 'status',
      date: new Date().toISOString()
    });

    const updatedLead = await db.leads.findByIdAndUpdate(
      req.params.id, 
      { status, activities }
    );

    res.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Update lead status error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/leads/:id/details (Admin - update potential value, assigned salesperson, and follow up date)
router.put('/:id/details', async (req, res) => {
  const { value, assignedTo, followUpDate } = req.body;

  try {
    const lead = await db.leads.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const activities = lead.activities || [];
    const updates = {};

    if (value !== undefined) {
      updates.value = Number(value);
      if (Number(value) !== lead.value) {
        activities.push({
          text: `Revenue Potential updated to ₹${Number(value).toLocaleString()}`,
          type: 'info',
          date: new Date().toISOString()
        });
      }
    }

    if (assignedTo !== undefined) {
      updates.assignedTo = assignedTo;
      if (assignedTo !== lead.assignedTo) {
        activities.push({
          text: `Lead assigned to ${assignedTo}`,
          type: 'info',
          date: new Date().toISOString()
        });
      }
    }

    if (followUpDate !== undefined) {
      updates.followUpDate = followUpDate;
      if (followUpDate !== lead.followUpDate) {
        const text = followUpDate 
          ? `Scheduled follow-up set for ${new Date(followUpDate).toLocaleDateString()}`
          : `Removed scheduled follow-up`;
        activities.push({
          text,
          type: 'followup',
          date: new Date().toISOString()
        });
      }
    }

    updates.activities = activities;

    const updatedLead = await db.leads.findByIdAndUpdate(
      req.params.id,
      updates
    );

    res.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Update lead details error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/leads/:id/notes (Admin - add new note)
router.post('/:id/notes', async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Note text cannot be empty.' });
  }

  try {
    const lead = await db.leads.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // Add note
    const notes = lead.notes || [];
    notes.push({
      text,
      date: new Date().toISOString()
    });

    // Add activity log
    const activities = lead.activities || [];
    activities.push({
      text: `Added note: "${text}"`,
      type: 'note',
      date: new Date().toISOString()
    });

    const updatedLead = await db.leads.findByIdAndUpdate(
      req.params.id,
      { notes, activities }
    );

    res.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Add lead note error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/leads/:id (Admin - delete lead)
router.delete('/:id', async (req, res) => {
  try {
    const deletedLead = await db.leads.findByIdAndDelete(req.params.id);
    if (!deletedLead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
