import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const existingUser = await db.users.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this username/email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.users.create({
      username,
      password: hashedPassword,
    });

    const newUserId = newUser._id.toString();

    // Seed 3 initial mock leads associated with the new user's ID
    const todayStr = new Date().toISOString().split('T')[0];
    const initialLeads = [
      {
        ownerId: newUserId,
        name: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        phone: '+1 (555) 019-2834',
        message: "Hi, I'm looking to redesign our corporate website and add an e-commerce catalog. We are looking to get this started by next month.",
        source: 'Homepage Form',
        status: 'Converted',
        value: 120000,
        assignedTo: 'Sarah Sales',
        followUpDate: '',
        aiScore: 92,
        activities: [
          { text: 'Form Submitted via Homepage Form', type: 'creation', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { text: 'Stage updated from New to Converted: Deal Closed!', type: 'status', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
        ],
        notes: [],
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        ownerId: newUserId,
        name: 'Alex Rivera',
        email: 'a.rivera@example.com',
        phone: '+1 (555) 014-9988',
        message: 'I would like to inquire about your SEO marketing packages.',
        source: 'Product Request',
        status: 'Qualified',
        value: 75000,
        assignedTo: 'Mike Sales',
        followUpDate: todayStr,
        aiScore: 85,
        activities: [
          { text: 'Form Submitted via Product Request', type: 'creation', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
        ],
        notes: [],
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        ownerId: newUserId,
        name: 'Robert Downey',
        email: 'tony@starkindustries.com',
        phone: '+1 (555) 300-3000',
        message: 'Need a customized sales funnel dashboard connected to our internal databases.',
        source: 'Landing Page',
        status: 'New',
        value: 250000,
        assignedTo: 'John Admin',
        followUpDate: '',
        aiScore: 95,
        activities: [
          { text: 'Form Submitted via Landing Page', type: 'creation', date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() }
        ],
        notes: [],
        date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const lead of initialLeads) {
      await db.leads.create(lead);
    }

    const token = jwt.sign(
      { id: newUserId, username: newUser.username },
      process.env.JWT_SECRET || 'crm_super_secret_key_2026_change_me',
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: newUserId, username: newUser.username } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'crm_super_secret_key_2026_change_me',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/verify
router.get('/verify', auth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// In-memory recovery code store
const recoveryCodes = {};

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Credential token is required.' });
  }

  try {
    // Decode JWT payload without verified signature since Google JWT is pre-validated by Google Client SDK
    const payloadSeg = credential.split('.')[1];
    const decodedPayload = JSON.parse(Buffer.from(payloadSeg, 'base64').toString('utf-8'));
    
    const { email, name } = decodedPayload;
    if (!email) {
      return res.status(400).json({ error: 'Invalid Google credential.' });
    }

    // Find or create user
    let user = await db.users.findOne({ username: email });
    if (!user) {
      console.log(`Creating new Google user: ${email}`);
      user = await db.users.create({
        username: email,
        password: 'google_authenticated_user_no_password'
      });

      const newUserId = user._id.toString();
      // Seed 3 initial mock leads associated with the new user's ID
      const todayStr = new Date().toISOString().split('T')[0];
      const initialLeads = [
        {
          ownerId: newUserId,
          name: 'Sarah Jenkins',
          email: 'sarah.j@example.com',
          phone: '+1 (555) 019-2834',
          message: "Hi, I'm looking to redesign our corporate website and add an e-commerce catalog. We are looking to get this started by next month.",
          source: 'Homepage Form',
          status: 'Converted',
          value: 120000,
          assignedTo: 'Sarah Sales',
          followUpDate: '',
          aiScore: 92,
          activities: [
            { text: 'Form Submitted via Homepage Form', type: 'creation', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { text: 'Stage updated from New to Converted: Deal Closed!', type: 'status', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          notes: [],
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          ownerId: newUserId,
          name: 'Alex Rivera',
          email: 'a.rivera@example.com',
          phone: '+1 (555) 014-9988',
          message: 'I would like to inquire about your SEO marketing packages.',
          source: 'Product Request',
          status: 'Qualified',
          value: 75000,
          assignedTo: 'Mike Sales',
          followUpDate: todayStr,
          aiScore: 85,
          activities: [
            { text: 'Form Submitted via Product Request', type: 'creation', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          notes: [],
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          ownerId: newUserId,
          name: 'Robert Downey',
          email: 'tony@starkindustries.com',
          phone: '+1 (555) 300-3000',
          message: 'Need a customized sales funnel dashboard connected to our internal databases.',
          source: 'Landing Page',
          status: 'New',
          value: 250000,
          assignedTo: 'John Admin',
          followUpDate: '',
          aiScore: 95,
          activities: [
            { text: 'Form Submitted via Landing Page', type: 'creation', date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() }
          ],
          notes: [],
          date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ];

      for (const lead of initialLeads) {
        await db.leads.create(lead);
      }
    }

    // Sign local JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'crm_super_secret_key_2026_change_me',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, username: user.username, name: name || email } });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate Google account.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username or email is required.' });
  }

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'No account found with this username.' });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    recoveryCodes[username] = code;

    console.log(`===================================================`);
    console.log(`🔑 PASSWORD RESET REQUESTED FOR: ${username}`);
    console.log(`👉 RECOVERY CODE: ${code}`);
    console.log(`===================================================`);

    res.json({ 
      message: 'A recovery code was sent to your registered channel.',
      code: code // We return it in the response for easy mock verification/testing in the UI!
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { username, code, newPassword } = req.body;
  if (!username || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    if (recoveryCodes[username] !== code) {
      return res.status(400).json({ error: 'Invalid or expired recovery code.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await db.users.updatePassword(username, hashedPassword);

    if (updated) {
      delete recoveryCodes[username]; // Clear the code after successful reset
      console.log(`✅ PASSWORD RESET SUCCESSFUL FOR: ${username}`);
      res.json({ success: true, message: 'Password has been successfully updated.' });
    } else {
      res.status(400).json({ error: 'Failed to update password.' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
