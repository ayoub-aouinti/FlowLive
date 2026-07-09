const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: String,
  required: Boolean
}, { _id: false });

const deptSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  adminId: String,
  products: [String],
  types: [String],
  activePages: [String],
  pageConfigs: { type: mongoose.Schema.Types.Mixed, default: {} },
  formFields: { type: [formFieldSchema], default: [] },
  coverUrl: { type: String, default: null },
  logoUrl: { type: String, default: null },
  workspaceTitle: { type: String, default: null },
  workspaceSubtitle: { type: String, default: null },
  rolePages: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { versionKey: false });

module.exports = mongoose.model('Department', deptSchema);
