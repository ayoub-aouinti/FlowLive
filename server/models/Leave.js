const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  _id: { type: String },
  userId: String,
  userName: String,
  departmentId: String,
  startDate: String,
  endDate: String,
  type: { type: String, default: 'congé' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Leave', leaveSchema);
