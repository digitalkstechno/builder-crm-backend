const mongoose = require('mongoose');

const AdminLeadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['new', 'contacted', 'converted', 'rejected'],
    default: 'new',
  },
  notes: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('AdminLead', AdminLeadSchema);
