const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['superadmin', 'chef de projet', 'chef de produit', 'worker'],
    default: 'worker'
  },
  departmentId: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('User', userSchema);
