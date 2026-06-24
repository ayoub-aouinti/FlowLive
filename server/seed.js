/**
 * Migration script: JSON flat files → MongoDB Atlas
 * Run once: node server/seed.js
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Department = require('./models/Department');
const Project = require('./models/Project');
const Notification = require('./models/Notification');
const Invitation = require('./models/Invitation');
const Leave = require('./models/Leave');

const DATA_DIR = path.join(__dirname, 'data');
const read = (file) => {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')); }
  catch { return []; }
};

async function seed() {
  console.log('🔗 Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Connected');

  // ── DEPARTMENTS ────────────────────────────────────────────────────────────
  const departments = read('departments.json');
  for (const d of departments) {
    await Department.updateOne(
      { _id: d.id },
      { $set: { _id: d.id, ...d } },
      { upsert: true }
    );
  }
  console.log(`📁 Departments: ${departments.length} seeded`);

  // ── USERS ──────────────────────────────────────────────────────────────────
  const users = read('users.json');
  for (const u of users) {
    const uid = u._id || u.id;
    await User.updateOne(
      { _id: uid },
      { $set: { _id: uid, ...u } },
      { upsert: true }
    );
  }
  console.log(`👤 Users: ${users.length} seeded`);

  // ── PROJECTS ───────────────────────────────────────────────────────────────
  const projects = read('projects.json');
  for (const p of projects) {
    await Project.updateOne(
      { _id: p._id },
      { $set: p },
      { upsert: true }
    );
  }
  console.log(`📋 Projects: ${projects.length} seeded`);

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
  const notifications = read('notifications.json');
  for (const n of notifications) {
    const nid = n._id || n.id;
    await Notification.updateOne(
      { _id: nid },
      { $set: { _id: nid, ...n } },
      { upsert: true }
    );
  }
  console.log(`🔔 Notifications: ${notifications.length} seeded`);

  // ── INVITATIONS ────────────────────────────────────────────────────────────
  const invitations = read('invitations.json');
  for (const i of invitations) {
    await Invitation.updateOne(
      { token: i.token },
      { $set: { _id: i.token, ...i } },
      { upsert: true }
    );
  }
  console.log(`✉️  Invitations: ${invitations.length} seeded`);

  // ── LEAVES ─────────────────────────────────────────────────────────────────
  const leaves = read('leaves.json');
  for (const l of leaves) {
    const lid = l._id || l.id;
    await Leave.updateOne(
      { _id: lid },
      { $set: { _id: lid, ...l } },
      { upsert: true }
    );
  }
  console.log(`🏖️  Leaves: ${leaves.length} seeded`);

  console.log('\n✅ Migration complete! You can now set USE_LOCAL_DB=false and restart the server.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
