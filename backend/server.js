import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDb, db } from './db/db.js';
import authRouter from './routes/auth.js';
import leadsRouter from './routes/leads.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Seed default database data
async function seedDatabase() {
  try {
    // 1. Seed default admin if no users exist
    const userCount = await db.users.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default admin user...');
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'adminpassword123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await db.users.create({
        username: 'admin',
        password: hashedPassword,
      });
      console.log(`✅ Default admin created. Username: admin, Password: ${defaultPassword}`);
    }

    const adminUser = await db.users.findOne({ username: 'admin' });
    const adminUserId = adminUser ? adminUser._id.toString() : 'admin-fallback-id';

    // 2. Seed mock leads if no leads exist
    const leads = await db.leads.find({});
    if (leads.length === 0) {
      console.log('Seeding mock client leads with enterprise data...');
      
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const mockLeads = [
        {
          name: 'Sarah Jenkins',
          email: 'sarah.j@example.com',
          phone: '+1 (555) 019-2834',
          message: "Hi, I'm looking to redesign our corporate website and add an e-commerce catalog. We are looking to get this started by next month. Can we schedule a call?",
          source: 'Homepage Form',
          status: 'Converted',
          value: 120000,
          assignedTo: 'Sarah Sales',
          followUpDate: '',
          aiScore: 92,
          activities: [
            { text: 'Form Submitted via Homepage Form', type: 'creation', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
            { text: 'Stage updated from New to Contacted by Sarah Sales', type: 'status', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
            { text: 'Added note: Spoke to Sarah. They have a budget of $15k and need it by next month.', type: 'note', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
            { text: 'Stage updated from Contacted to Qualified by Sarah Sales', type: 'status', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { text: 'Stage updated from Qualified to Converted: Deal Closed!', type: 'status', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
          ],
          notes: [
            { text: 'Spoke to Sarah. They have a budget of $15k and need it by next month.', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
          ],
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          name: 'Alex Rivera',
          email: 'a.rivera@example.com',
          phone: '+1 (555) 014-9988',
          message: 'I would like to inquire about your SEO marketing packages. Do you provide localized SEO campaigns?',
          source: 'Product Request',
          status: 'Qualified',
          value: 75000,
          assignedTo: 'Mike Sales',
          followUpDate: todayStr, // Follow up today!
          aiScore: 85,
          activities: [
            { text: 'Form Submitted via Product Request', type: 'creation', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
            { text: 'Stage updated from New to Contacted by Mike Sales', type: 'status', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { text: 'Added note: Sent pricing brochure for localized SEO.', type: 'note', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { text: 'Stage updated from Contacted to Qualified: Demo scheduled.', type: 'status', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { text: 'Scheduled follow-up call set for today.', type: 'followup', date: new Date().toISOString() }
          ],
          notes: [
            { text: 'Sent pricing brochure for localized SEO.', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
          ],
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          name: 'Elena Rostova',
          email: 'elena.r@example.com',
          phone: '+1 (555) 012-3344',
          message: 'Interested in hiring a dedicated React developer for a 3-month contract.',
          source: 'Newsletter',
          status: 'Contacted',
          value: 45000,
          assignedTo: 'John Admin',
          followUpDate: tomorrowStr, // Follow up tomorrow!
          aiScore: 68,
          activities: [
            { text: 'Form Submitted via Newsletter Subscription', type: 'creation', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { text: 'Stage updated from New to Contacted by John Admin', type: 'status', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { text: 'Scheduled follow-up call set for tomorrow.', type: 'followup', date: new Date().toISOString() }
          ],
          notes: [],
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          name: 'Michael Chen',
          email: 'mchen@example.com',
          phone: '+1 (555) 017-5511',
          message: 'Hello, we need a custom CRM integration for our sales team. Let me know if you have availability.',
          source: 'Website Form',
          status: 'Lost',
          value: 150000,
          assignedTo: 'Sarah Sales',
          followUpDate: '',
          aiScore: 52,
          activities: [
            { text: 'Form Submitted via Website Form', type: 'creation', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
            { text: 'Stage updated from New to Contacted by Sarah Sales', type: 'status', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
            { text: 'Added note: Called Michael. Unfortunately, their timeline is too tight (needs it in 1 week).', type: 'note', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
            { text: 'Stage updated from Contacted to Lost due to timeline mismatch', type: 'status', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
          ],
          notes: [
            { text: 'Called Michael. Unfortunately, their timeline is too tight (needs it in 1 week). We had to pass on this.', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
          ],
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          name: 'David Kim',
          email: 'david.kim@example.com',
          phone: '+1 (555) 021-9980',
          message: 'Can you build a mobile application for iOS and Android? Please call me to discuss requirements.',
          source: 'Homepage Form',
          status: 'New',
          value: 60000,
          assignedTo: 'Mike Sales',
          followUpDate: todayStr, // Follow up today!
          aiScore: 78,
          activities: [
            { text: 'Form Submitted via Homepage Form', type: 'creation', date: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            { text: 'Scheduled follow-up call set for today.', type: 'followup', date: new Date().toISOString() }
          ],
          notes: [],
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          name: 'Emma Watson',
          email: 'emma@watson.co.uk',
          phone: '+44 7911 123456',
          message: 'Interested in partnering with ClientAxis for sales lead management solutions.',
          source: 'Referral',
          status: 'Converted',
          value: 200000,
          assignedTo: 'Sarah Sales',
          followUpDate: '',
          aiScore: 98,
          activities: [
            { text: 'Lead referred from partner agency', type: 'creation', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
            { text: 'Stage updated from New to Contacted', type: 'status', date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
            { text: 'Stage updated from Contacted to Qualified', type: 'status', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            { text: 'Stage updated from Qualified to Converted: Client signed contract!', type: 'status', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
          ],
          notes: [
            { text: 'Client signed the enterprise licensing contract.', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
          ],
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          name: 'Robert Downey',
          email: 'tony@starkindustries.com',
          phone: '+1 (555) 300-3000',
          message: 'Need a customized sales funnel dashboard connected to our internal databases. Budget is open.',
          source: 'Landing Page',
          status: 'New',
          value: 250000,
          assignedTo: 'John Admin',
          followUpDate: '',
          aiScore: 95,
          activities: [
            { text: 'Form Submitted via Landing Page', type: 'creation', date: new Date(Date.now() - 4 * 60 * 60 * 1000) }
          ],
          notes: [],
          date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ];

      for (const lead of mockLeads) {
        await db.leads.create({
          ...lead,
          ownerId: adminUserId
        });
      }
      console.log('✅ Mock client leads seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Module-level database connection cache for serverless environments (like Vercel)
let isSeeded = false;
app.use(async (req, res, next) => {
  if (process.env.VERCEL) {
    try {
      await connectDb(process.env.MONGODB_URI);
      if (!isSeeded) {
        await seedDatabase();
        isSeeded = true;
      }
    } catch (err) {
      console.error('Serverless DB connection error:', err);
    }
  }
  next();
});

// Start Server locally
async function startServer() {
  // Connect database (with fallback detection)
  await connectDb(process.env.MONGODB_URI);
  
  // Seed initial data
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 CRM Backend Server running on port ${PORT}`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`===================================================`);
  });
}

// Only start listener if NOT running as a Vercel serverless function
if (!process.env.VERCEL) {
  startServer();
}

export default app;
