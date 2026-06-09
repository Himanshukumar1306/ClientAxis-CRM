import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_DB_DIR = path.join(__dirname, 'local_db');
const LEADS_FILE = path.join(LOCAL_DB_DIR, 'leads.json');
const USERS_FILE = path.join(LOCAL_DB_DIR, 'users.json');

let fallbackMode = false;

// Ensure local JSON directory and files exist
async function ensureLocalDbFiles() {
  try {
    await fs.mkdir(LOCAL_DB_DIR, { recursive: true });
    
    try {
      await fs.access(LEADS_FILE);
    } catch {
      await fs.writeFile(LEADS_FILE, JSON.stringify([], null, 2));
    }

    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error initializing local database files:', error);
  }
}

// Read helper
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// Write helper
async function writeJsonFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
}

// DB connection
export async function connectDb(mongoUri) {
  await ensureLocalDbFiles();
  
  if (!mongoUri) {
    console.warn('⚠️ No MONGODB_URI provided. Falling back to local JSON database.');
    fallbackMode = true;
    return false;
  }

  try {
    // Attempt Mongoose connection with a short timeout to fail fast if MongoDB isn't running
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('🚀 Successfully connected to MongoDB database.');
    fallbackMode = false;
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to connect to MongoDB:', error.message);
    console.warn('⚠️ Falling back to local JSON database.');
    fallbackMode = true;
    return false;
  }
}

export function isFallback() {
  return fallbackMode;
}

// Mongoose Models (imported dynamically or registered via mongoose)
// We will import them in the db interface to query them if not fallback
import { LeadModel } from '../models/Lead.js';
import { UserModel } from '../models/User.js';

export const db = {
  leads: {
    find: async (query = {}) => {
      if (!fallbackMode) {
        // Build Mongoose query
        let mongoQuery = LeadModel.find();
        if (query.search) {
          const searchRegex = new RegExp(query.search, 'i');
          mongoQuery = mongoQuery.or([
            { name: searchRegex },
            { email: searchRegex },
            { message: searchRegex }
          ]);
        }
        if (query.status && query.status !== 'all') {
          mongoQuery = mongoQuery.where('status').equals(query.status);
        }
        if (query.source && query.source !== 'all') {
          mongoQuery = mongoQuery.where('source').equals(query.source);
        }
        if (query.assignedTo && query.assignedTo !== 'all') {
          mongoQuery = mongoQuery.where('assignedTo').equals(query.assignedTo);
        }
        // Sort descending by date
        return await mongoQuery.sort({ date: -1 }).exec();
      } else {
        let leads = await readJsonFile(LEADS_FILE);
        
        // Filter search
        if (query.search) {
          const term = query.search.toLowerCase();
          leads = leads.filter(l => 
            (l.name && l.name.toLowerCase().includes(term)) || 
            (l.email && l.email.toLowerCase().includes(term)) || 
            (l.message && l.message.toLowerCase().includes(term))
          );
        }
        // Filter status
        if (query.status && query.status !== 'all') {
          leads = leads.filter(l => l.status === query.status);
        }
        // Filter source
        if (query.source && query.source !== 'all') {
          leads = leads.filter(l => l.source === query.source);
        }
        // Filter assignedTo
        if (query.assignedTo && query.assignedTo !== 'all') {
          leads = leads.filter(l => l.assignedTo === query.assignedTo);
        }
        
        // Sort descending by date
        return leads.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    },

    findById: async (id) => {
      if (!fallbackMode) {
        return await LeadModel.findById(id);
      } else {
        const leads = await readJsonFile(LEADS_FILE);
        return leads.find(l => l._id === id) || null;
      }
    },

    create: async (leadData) => {
      if (!fallbackMode) {
        const newLead = new LeadModel(leadData);
        return await newLead.save();
      } else {
        const leads = await readJsonFile(LEADS_FILE);
        const newLead = {
          _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          ...leadData,
          status: leadData.status || 'New',
          notes: leadData.notes || [],
          date: leadData.date || new Date().toISOString()
        };
        leads.push(newLead);
        await writeJsonFile(LEADS_FILE, leads);
        return newLead;
      }
    },

    findByIdAndUpdate: async (id, updateData) => {
      if (!fallbackMode) {
        return await LeadModel.findByIdAndUpdate(id, updateData, { new: true });
      } else {
        const leads = await readJsonFile(LEADS_FILE);
        const index = leads.findIndex(l => l._id === id);
        if (index === -1) return null;
        
        // Update fields (handling status, notes, etc.)
        leads[index] = {
          ...leads[index],
          ...updateData,
          // Mongoose findByIdAndUpdate doesn't change ID
          _id: id 
        };
        await writeJsonFile(LEADS_FILE, leads);
        return leads[index];
      }
    },

    findByIdAndDelete: async (id) => {
      if (!fallbackMode) {
        return await LeadModel.findByIdAndDelete(id);
      } else {
        let leads = await readJsonFile(LEADS_FILE);
        const leadToDelete = leads.find(l => l._id === id);
        if (!leadToDelete) return null;
        
        leads = leads.filter(l => l._id !== id);
        await writeJsonFile(LEADS_FILE, leads);
        return leadToDelete;
      }
    }
  },

  users: {
    findOne: async (query) => {
      if (!fallbackMode) {
        return await UserModel.findOne(query);
      } else {
        const users = await readJsonFile(USERS_FILE);
        if (query.username) {
          return users.find(u => u.username === query.username) || null;
        }
        return null;
      }
    },

    create: async (userData) => {
      if (!fallbackMode) {
        const newUser = new UserModel(userData);
        return await newUser.save();
      } else {
        const users = await readJsonFile(USERS_FILE);
        const newUser = {
          _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          ...userData
        };
        users.push(newUser);
        await writeJsonFile(USERS_FILE, users);
        return newUser;
      }
    },

    countDocuments: async () => {
      if (!fallbackMode) {
        return await UserModel.countDocuments();
      } else {
        const users = await readJsonFile(USERS_FILE);
        return users.length;
      }
    },

    updatePassword: async (username, newHashedPassword) => {
      if (!fallbackMode) {
        return await UserModel.findOneAndUpdate({ username }, { password: newHashedPassword });
      } else {
        const users = await readJsonFile(USERS_FILE);
        const index = users.findIndex(u => u.username === username);
        if (index !== -1) {
          users[index].password = newHashedPassword;
          await writeJsonFile(USERS_FILE, users);
          return true;
        }
        return false;
      }
    }
  }
};
