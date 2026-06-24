const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  _id: { type: String },
  userId: { type: String, index: true },
  title: String,
  message: String,
  link: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Notification', notificationSchema);
