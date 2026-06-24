const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const User = require('./models/User');
const Department = require('./models/Department');
const Project = require('./models/Project');
const Notification = require('./models/Notification');
const Invitation = require('./models/Invitation');
const Leave = require('./models/Leave');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] }
});

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://department-manage.netlify.app',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Add id = _id for frontend compatibility (lean() drops virtuals)
const withId = (doc) => (doc ? { ...doc, id: doc._id } : null);
const withIds = (arr) => (arr || []).map(withId);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER || 'placeholder@ethereal.email',
    pass: process.env.EMAIL_PASS || 'placeholder'
  }
});

// ── AUTH MIDDLEWARE ───────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ── AUTH ROUTES ───────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
    if (!isMatch && password !== user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (await User.findOne({ email }).lean()) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    await new User({
      _id: `user_${Date.now()}`,
      name, email,
      password: await bcrypt.hash(password, 10),
      role: 'worker',
      isVerified: true
    }).save();
    res.status(201).json({ message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/auth/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { verificationToken: req.params.token },
      { isVerified: true, $unset: { verificationToken: '' } }
    ).lean();
    if (!user) return res.status(404).json({ message: 'Lien invalide ou expiré' });
    res.json({ message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/invitations/verify/:token', async (req, res) => {
  try {
    const invite = await Invitation.findOne({ token: req.params.token }).lean();
    if (!invite) return res.status(404).json({ message: 'Lien invalide ou expiré' });
    if (new Date(invite.expiresAt) < new Date()) return res.status(400).json({ message: 'Invitation expirée' });
    res.json({ email: invite.email, role: invite.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/complete-signup', async (req, res) => {
  try {
    const { token, password, name } = req.body;
    const invite = await Invitation.findOne({ token }).lean();
    if (!invite) return res.status(404).json({ message: 'Invitation non trouvée' });

    await new User({
      _id: `user_${Date.now()}`,
      name, email: invite.email,
      password: await bcrypt.hash(password, 10),
      role: invite.role,
      departmentId: invite.departmentId,
      isVerified: true
    }).save();
    await Invitation.deleteOne({ token });
    res.json({ message: 'Compte créé avec succès !' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DEPARTMENTS ───────────────────────────────────────────────────────────────
app.get('/api/departments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
    const depts = await Department.find().lean();
    res.json(withIds(depts));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// must be defined before /:id routes
app.get('/api/departments/my-config', authenticateToken, async (req, res) => {
  try {
    let dept = null;
    if (req.user.role === 'superadmin' && req.query.departmentId) {
      dept = await Department.findById(req.query.departmentId).lean();
    } else {
      dept = await Department.findById(req.user.departmentId).lean();
      if (!dept && req.user.role === 'chef de projet') {
        dept = await Department.findOne({ adminId: req.user.email }).lean();
      }
    }
    if (!dept) return res.json({ products: [], types: [] });
    res.json({
      departmentId: dept._id,
      departmentName: dept.name,
      products: dept.products || [],
      types: dept.types || [],
      activePages: dept.activePages || ['table', 'kanban', 'timeline', 'calendrier', 'reporting', 'urgences', 'stats'],
      pageConfigs: dept.pageConfigs || {},
      formFields: dept.formFields || null,
      coverUrl: dept.coverUrl || null,
      logoUrl: dept.logoUrl || null,
      workspaceTitle: dept.workspaceTitle || null,
      workspaceSubtitle: dept.workspaceSubtitle || null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/departments/members-status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'chef de projet') return res.status(403).json({ message: 'Access denied' });
    const [users, invitations] = await Promise.all([
      User.find({ departmentId: req.user.departmentId }).lean(),
      Invitation.find({ departmentId: req.user.departmentId }).lean()
    ]);
    res.json([
      ...users.map(u => ({ ...u, id: u._id, status: 'Inscrit' })),
      ...invitations.map(i => ({ ...i, id: i.token, _id: i.token, status: 'En attente', name: i.email.split('@')[0], isInvitation: true }))
    ]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/departments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
    const deptId = 'dept_' + Date.now();
    const newDept = await new Department({
      _id: deptId,
      ...req.body,
      products: [],
      types: [],
      activePages: req.body.activePages || ['table', 'kanban', 'timeline', 'calendrier', 'reporting', 'urgences', 'stats'],
      pageConfigs: {}
    }).save();

    const existingUser = await User.findOne({ email: req.body.adminId }).lean();
    if (!existingUser) {
      const tok = crypto.randomBytes(32).toString('hex');
      await new Invitation({ _id: tok, email: req.body.adminId, role: 'chef de projet', departmentId: deptId, token: tok, expiresAt: new Date(Date.now() + 7 * 24 * 3600000) }).save();
      const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup/${tok}`;
      console.log(`📧 Invitation link: ${link}`);
      transporter.sendMail({ from: process.env.EMAIL_FROM, to: req.body.adminId, subject: 'Invitation WorkPlan', html: `<a href="${link}">Configurer mon compte</a>` })
        .catch(e => console.error('📧', e.message));
    } else {
      await User.findByIdAndUpdate(existingUser._id, { role: 'chef de projet', departmentId: deptId });
    }
    res.status(201).json(withId(newDept.toObject()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/departments/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
    const dept = await Department.findById(req.params.id).lean();
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    const { name, adminId, activePages } = req.body;
    const patch = {};
    if (name) patch.name = name;
    if (activePages) patch.activePages = activePages;

    if (adminId && adminId !== dept.adminId) {
      patch.adminId = adminId;
      const u = await User.findOne({ email: adminId }).lean();
      if (u) {
        await User.findByIdAndUpdate(u._id, { role: 'chef de projet', departmentId: req.params.id });
      } else {
        const tok = crypto.randomBytes(32).toString('hex');
        await new Invitation({ _id: tok, email: adminId, role: 'chef de projet', departmentId: req.params.id, token: tok, expiresAt: new Date(Date.now() + 7 * 24 * 3600000) }).save();
        const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup/${tok}`;
        transporter.sendMail({ from: process.env.EMAIL_FROM, to: adminId, subject: 'Invitation WorkPlan', html: `<a href="${link}">Configurer</a>` })
          .catch(e => console.error('📧', e.message));
      }
    }
    const updated = await Department.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true }).lean();
    res.json(withId(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/departments/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
    await Department.deleteOne({ _id: req.params.id });
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/departments/:id/config', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'chef de projet') return res.status(403).json({ message: 'Access denied' });
    const dept = await Department.findById(req.params.id).lean();
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    if (req.user.departmentId !== req.params.id && dept.adminId !== req.user.email)
      return res.status(403).json({ message: 'Not authorized for this department' });

    const patch = {};
    if (req.body.products) patch.products = req.body.products;
    if (req.body.types) patch.types = req.body.types;
    if (req.body.pageConfigs) patch.pageConfigs = req.body.pageConfigs;
    if (req.body.formFields) patch.formFields = req.body.formFields;
    if (req.body.coverUrl !== undefined) patch.coverUrl = req.body.coverUrl;
    if (req.body.logoUrl !== undefined) patch.logoUrl = req.body.logoUrl;
    if (req.body.workspaceTitle !== undefined) patch.workspaceTitle = req.body.workspaceTitle;
    if (req.body.workspaceSubtitle !== undefined) patch.workspaceSubtitle = req.body.workspaceSubtitle;

    const updated = await Department.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true }).lean();
    res.json(withId(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/departments/:id/import-resources', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'chef de projet') return res.status(403).json({ message: 'Access denied' });
    const { products, types } = req.body;
    const addToSet = {};
    if (Array.isArray(products)) addToSet.products = { $each: products.map(p => p.trim()).filter(Boolean) };
    if (Array.isArray(types)) addToSet.types = { $each: types.map(t => t.trim()).filter(Boolean) };
    const updated = await Department.findByIdAndUpdate(req.params.id, { $addToSet: addToSet }, { new: true }).lean();
    res.json(withId(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(withIds(notifs));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $set: { read: true } });
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── USERS ─────────────────────────────────────────────────────────────────────
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ departmentId: req.user.departmentId }).lean();
    res.json(users.map(u => ({ name: u.name, role: u.role, _id: u._id, id: u._id, email: u.email })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users/invite-bulk', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'chef de projet') return res.status(403).json({ message: 'Access denied' });
    const { emails, role } = req.body;
    if (!emails || !Array.isArray(emails)) return res.status(400).json({ message: "Liste d'emails invalide" });

    const results = { invited: [], assigned: [], skipped: [] };
    for (const raw of emails) {
      const email = raw.trim().toLowerCase();
      if (!email) continue;

      const existingUser = await User.findOne({ email }).lean();
      if (existingUser) {
        if (existingUser.departmentId === req.user.departmentId) {
          results.skipped.push({ email, reason: 'Déjà membre de ce département' });
        } else {
          await User.findByIdAndUpdate(existingUser._id, { departmentId: req.user.departmentId, ...(role ? { role } : {}) });
          results.assigned.push({ email, name: existingUser.name });
        }
        continue;
      }
      if (await Invitation.findOne({ email, departmentId: req.user.departmentId }).lean()) {
        results.skipped.push({ email, reason: 'Invitation déjà envoyée' });
        continue;
      }
      const tok = crypto.randomBytes(32).toString('hex');
      await new Invitation({ _id: tok, email, role: role || 'worker', departmentId: req.user.departmentId, token: tok, expiresAt: new Date(Date.now() + 7 * 24 * 3600000) }).save();
      results.invited.push(email);

      const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup/${tok}`;
      console.log(`📧 Invitation link for ${email}: ${link}`);
      transporter.sendMail({
        from: process.env.EMAIL_FROM || '"WorkPlan" <noreply@workplan.com>',
        to: email,
        subject: 'Invitation à rejoindre WorkPlan',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px"><h1>Bienvenue sur WorkPlan</h1><p>Vous avez été invité à rejoindre la plateforme.</p><div style="text-align:center;margin:30px 0"><a href="${link}" style="padding:12px 24px;background:#1e293b;color:white;text-decoration:none;border-radius:8px;font-weight:bold">Configurer mon compte</a></div><p style="font-size:12px;color:#94a3b8">Ce lien expire dans 7 jours.</p></div>`
      }).catch(e => { console.error(`📧 Email failed for ${email}:`, e.message); console.log(`📧 Share: ${link}`); });
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'chef de projet') return res.status(403).json({ message: 'Access denied' });
    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, departmentId: req.user.departmentId },
      { $set: req.body }, { new: true }
    ).lean();
    if (updated) return res.json(withId(updated));

    const inv = await Invitation.findOneAndUpdate(
      { token: req.params.id, departmentId: req.user.departmentId },
      { $set: req.body }, { new: true }
    ).lean();
    if (inv) return res.json(inv);
    res.status(404).json({ message: 'User or invitation not found' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'chef de projet') return res.status(403).json({ message: 'Access denied' });
    await User.deleteOne({ _id: req.params.id, departmentId: req.user.departmentId });
    await Invitation.deleteOne({ token: req.params.id, departmentId: req.user.departmentId });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PROJECTS ──────────────────────────────────────────────────────────────────
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { role, id, departmentId } = req.user;
    let filter = {};
    if (role === 'chef de projet') filter.departmentId = departmentId;
    else if (role === 'chef de produit') filter = { departmentId, initiatorId: id };
    else if (role === 'worker') filter = { departmentId, assignedTo: id };
    else if (role === 'superadmin') {
      if (req.query.departmentId) filter.departmentId = req.query.departmentId;
      else return res.json([]);
    }
    const projects = await Project.find(filter).sort({ deadline: 1 }).lean();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── LEAVES (congés) ───────────────────────────────────────────────────────────
app.get('/api/leaves', authenticateToken, async (req, res) => {
  try {
    const leaves = await Leave.find({ departmentId: req.user.departmentId }).lean();
    res.json(withIds(leaves));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/leaves', authenticateToken, async (req, res) => {
  try {
    const { userId, startDate, endDate, type } = req.body;
    if (!userId || !startDate || !endDate) return res.status(400).json({ message: 'Champs manquants' });
    const isSelf = userId === req.user.id || userId === req.user._id;
    if (req.user.role === 'worker' && !isSelf) return res.status(403).json({ message: 'Access denied' });

    const targetUser = await User.findById(userId).lean();
    const leave = await new Leave({
      _id: `leave_${Date.now()}`,
      userId, userName: targetUser?.name || '',
      departmentId: req.user.departmentId,
      startDate, endDate, type: type || 'congé'
    }).save();
    res.json(withId(leave.toObject()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/leaves/:id', authenticateToken, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).lean();
    if (!leave) return res.status(404).json({ message: 'Not found' });
    const isSelf = leave.userId === req.user.id || leave.userId === req.user._id;
    if (req.user.role === 'worker' && !isSelf) return res.status(403).json({ message: 'Access denied' });
    if (leave.departmentId !== req.user.departmentId) return res.status(403).json({ message: 'Access denied' });
    await Leave.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── NOTIFICATION HELPER ───────────────────────────────────────────────────────
const createNotification = async (userId, title, message, link = null) => {
  try {
    const notif = await new Notification({
      _id: 'notif_' + Date.now() + Math.random().toString(36).substr(2, 5),
      userId, title, message, link, read: false
    }).save();
    const plain = { ...notif.toObject(), id: notif._id };
    io.emit('notification_added', plain);
    return plain;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('new_project', async (data) => {
    try {
      const newProject = await new Project({
        _id: Date.now().toString(),
        ...data,
        status: data.status || 'Nouveau',
        createdAt: new Date()
      }).save();
      io.emit('project_added', newProject.toObject());
      if (data.assignedTo) {
        createNotification(data.assignedTo, 'Nouveau projet assigné', `On vous a assigné le projet: ${data.name}`, '/table');
      }
    } catch (err) {
      console.error('Error adding project:', err);
      socket.emit('error', { message: 'Failed to add project' });
    }
  });

  socket.on('update_project_status', async (data) => {
    try {
      const project = await Project.findById(data.projectId).lean();
      if (!project) return;
      const oldStatus = project.status;
      const updated = await Project.findByIdAndUpdate(data.projectId, { $set: { status: data.status } }, { new: true }).lean();
      io.emit('project_updated', updated);

      const msg = `${data.workerName || 'Un membre'} a déplacé "${updated.name}" : ${oldStatus} → ${updated.status}`;
      if (updated.initiatorId) createNotification(updated.initiatorId, 'Statut mis à jour', msg, '/table');
      if (updated.departmentId) {
        const chefs = await User.find({ role: 'chef de projet', departmentId: updated.departmentId }).lean();
        chefs.forEach(chef => createNotification(chef._id, 'Statut mis à jour', msg, '/table'));
      }
    } catch (err) {
      console.error('Error updating project:', err);
    }
  });

  socket.on('disconnect', () => console.log('👋 User disconnected:', socket.id));
});

// ── OVERDUE CHECK ─────────────────────────────────────────────────────────────
const checkOverdueProjects = async () => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = await Project.find({
      status: { $ne: 'Terminé' },
      deadline: { $lt: todayStr },
      overdueNotifiedDate: { $ne: todayStr }
    }).lean();

    for (const p of overdue) {
      if (p.assignedTo) {
        const deadlineFormatted = new Date(p.deadline).toLocaleDateString('fr-FR');
        await createNotification(p.assignedTo, 'Deadline dépassée', `Le projet "${p.name}" a dépassé sa deadline du ${deadlineFormatted}. Mettez à jour son statut.`, '/table');
      }
      await Project.findByIdAndUpdate(p._id, { overdueNotifiedDate: todayStr });
    }
    if (overdue.length > 0) console.log(`🕐 Overdue: ${overdue.length} projet(s) notifié(s)`);
  } catch (err) {
    console.error('Error checking overdue projects:', err);
  }
};

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 15000 })
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    checkOverdueProjects();
    setInterval(checkOverdueProjects, 60 * 60 * 1000);
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
