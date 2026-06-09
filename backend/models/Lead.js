import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  ownerId: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String },
  source: { type: String, default: 'Website Form' },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'], 
    default: 'New' 
  },
  value: { type: Number, default: 0 },
  assignedTo: { type: String, default: 'John Admin' },
  followUpDate: { type: String }, // ISO string or simple YYYY-MM-DD
  aiScore: { type: Number, default: 50 },
  activities: [{
    text: { type: String, required: true },
    type: { type: String, default: 'info' }, // 'creation', 'status', 'note', 'followup', 'deletion'
    date: { type: Date, default: Date.now }
  }],
  notes: [{
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }],
  date: { type: Date, default: Date.now }
});

export const LeadModel = mongoose.model('Lead', LeadSchema);
export default LeadModel;
