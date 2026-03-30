const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_DIR = path.join(__dirname, 'data');

// Schemas (Minimal for migration)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, required: true },
  role: String,
  departmentId: String,
  localId: String // Temporary to map relations
});

const departmentSchema = new mongoose.Schema({
  id: String,
  name: String,
  adminId: String,
  products: [String],
  types: [String],
  activePages: [String],
  pageConfigs: mongoose.Schema.Types.Mixed,
  formFields: mongoose.Schema.Types.Mixed
});

const projectSchema = new mongoose.Schema({
  name: String,
  initiatorName: String,
  initiatorId: String,
  departmentId: String,
  description: String,
  type: String,
  product: String,
  status: { type: String, default: 'Nouveau' },
  priority: { type: String, default: 'Moyenne' },
  urgent: Boolean,
  deadline: Date,
  assignedTo: mongoose.Schema.Types.ObjectId,
  createdAt: Date
});

const notificationSchema = new mongoose.Schema({
  userId: String, // We'll keep localId or map to mongoId? Let's keep email or localId for simplicity in Notifications for now or map them.
  title: String,
  message: String,
  link: String,
  read: Boolean,
  createdAt: Date
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Dept = mongoose.models.Department || mongoose.model('Department', departmentSchema);
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
const Notif = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

async function migrate() {
  try {
    console.log('🚀 Starting migration to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Departments
    console.log('📦 Migrating Departments...');
    const deptsJson = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'departments.json'), 'utf8'));
    await Dept.deleteMany({});
    await Dept.insertMany(deptsJson);
    console.log(`✅ ${deptsJson.length} departments migrated.`);

    // 2. Users (Need to handle hashing)
    console.log('👤 Migrating Users...');
    const usersJson = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf8'));
    await User.deleteMany({});
    
    const userMapping = {}; // localId -> mongo _id
    for (const u of usersJson) {
      // We don't hash here if they are already hashed, but in users.json they are plain text
      const hashedPassword = await bcrypt.hash(u.password, 10);
      const newUser = await User.create({
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        departmentId: u.departmentId,
        localId: u.id
      });
      userMapping[u.id] = newUser._id;
    }
    console.log(`✅ ${usersJson.length} users migrated.`);

    // 3. Projects (Map assignedTo)
    console.log('📋 Migrating Projects...');
    const projectsJson = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf8'));
    await Project.deleteMany({});
    
    const preparedProjects = projectsJson.map(p => {
      const { _id, id, ...rest } = p;
      return {
        ...rest,
        assignedTo: userMapping[p.assignedTo] || null,
        deadline: new Date(p.deadline),
        createdAt: new Date(p.createdAt)
      };
    });
    await Project.insertMany(preparedProjects);
    console.log(`✅ ${projectsJson.length} projects migrated.`);

    // 4. Notifications
    console.log('🔔 Migrating Notifications...');
    const notifsJson = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'notifications.json'), 'utf8'));
    await Notif.deleteMany({});
    const preparedNotifs = notifsJson.map(n => {
      const { _id, id, ...rest } = n;
      return {
        ...rest,
        userId: userMapping[n.userId] ? userMapping[n.userId].toString() : n.userId,
        createdAt: new Date(n.createdAt)
      };
    });
    await Notif.insertMany(preparedNotifs);
    console.log(`✅ ${notifsJson.length} notifications migrated.`);

    console.log('\n🎉 ALL DATA MIGRATED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
