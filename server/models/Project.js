const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  initiatorName: String,
  initiatorId: String,
  description: String,
  type: String,
  product: String,
  status: { type: String, default: 'Nouveau' },
  priority: { type: String, default: 'Moyenne' },
  urgent: { type: Boolean, default: false },
  deadline: String,
  assignedTo: String,
  departmentId: String,
  overdueNotifiedDate: String,
  estimatedHours: Number,
  _customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false, strict: false });

module.exports = mongoose.model('Project', projectSchema);
