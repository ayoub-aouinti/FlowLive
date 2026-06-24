const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  _id: { type: String },
  email: String,
  role: String,
  departmentId: String,
  token: { type: String, unique: true },
  expiresAt: Date
}, { versionKey: false });

module.exports = mongoose.model('Invitation', invitationSchema);
