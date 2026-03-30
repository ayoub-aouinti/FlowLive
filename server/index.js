const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); 
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true';
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const readLocal = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
const writeLocal = (file, data) => fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://department-manage.netlify.app',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Connection (Skip if local)
let transporter;
if (!USE_LOCAL_DB) {
  const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  };

  console.log('📡 Connecting to MongoDB Atlas...');
  mongoose.connect(process.env.MONGODB_URI, mongoOptions)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('💡 Tip: Check your MONGODB_URI and Network Access (Whitelist 0.0.0.0/0)');
    });
}

transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER || 'placeholder@ethereal.email',
    pass: process.env.EMAIL_PASS || 'placeholder'
  }
});

let Project;
if (!USE_LOCAL_DB) {
  const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    initiatorName: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    product: { type: String, required: true },
    status: { type: String, default: 'Nouveau' },
    priority: { type: String, default: 'Moyenne' },
    urgent: { type: Boolean, default: false },
    deadline: { type: Date, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  });
  Project = mongoose.model('Project', projectSchema);
} else {
  // Local Project Mock
  Project = {
    find: async (query) => {
      let data = readLocal('projects.json');
      if (query.$or) {
        const userId = query.$or[0].assignedTo;
        const userName = query.$or[1].initiatorName;
        data = data.filter(p => p.assignedTo === userId || p.initiatorName === userName);
      }
      return data;
    },
    save: async (data) => {
      const projects = readLocal('projects.json');
      const newProject = { ...data, _id: Date.now().toString(), createdAt: new Date() };
      projects.push(newProject);
      writeLocal('projects.json', projects);
      return newProject;
    }
  };
}

// AUTH MIDDLEWARE
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

// AUTH ROUTES

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user;

    if (USE_LOCAL_DB) {
      const users = readLocal('users.json');
      const foundUser = users.find(u => u.email === email);
      if (!foundUser) return res.status(400).json({ message: 'Invalid credentials' });
      
      const isMatch = await bcrypt.compare(password, foundUser.password);
      if (!isMatch) {
         // Fallback for non-hashed legacy passwords (like "password123")
         if (password !== foundUser.password) {
           return res.status(400).json({ message: 'Invalid credentials' });
         }
      }
      user = foundUser;
      user.id = user.id || Date.now().toString(); 
    } else {
      user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    }

    const token = jwt.sign(
      { id: user._id || user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '8h' }
    );

    res.json({ 
      token, 
      user: { id: user._id || user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// MULTI-TENANCY ROUTES (DEPARTMENTS)
app.get('/api/departments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
    const departments = readLocal('departments.json');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/departments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
    const departments = readLocal('departments.json');
    const newDept = { 
       ...req.body, 
       id: 'dept_' + Date.now().toString(), 
       products: [], 
       types: [],
       activePages: req.body.activePages || ['table', 'kanban', 'timeline', 'calendrier', 'reporting', 'urgences', 'stats'],
       pageConfigs: {}
    };
    // Check if admin user exists, if not send invitation
    const users = readLocal('users.json');
    const existingUser = users.find(u => u.email === newDept.adminId);
    
    if (!existingUser) {
      console.log(`👤 Creating invitation for new admin: ${newDept.adminId}`);
      const token = crypto.randomBytes(32).toString('hex');
      const invitations = readLocal('invitations.json');
      invitations.push({
        email: newDept.adminId,
        role: 'admin',
        departmentId: newDept.id,
        token: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      writeLocal('invitations.json', invitations);

      const signupLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup/${token}`;
      
      const mailOptions = {
        from: '"WorkPlan System" <noreply@workplan.com>',
        to: newDept.adminId,
        subject: 'Invitation à rejoindre WorkPlan',
        html: `
          <h1>Bienvenue sur WorkPlan</h1>
          <p>Vous avez été invité à gérer le département <b>${newDept.name}</b>.</p>
          <p>Cliquez sur le lien ci-dessous pour configurer votre compte :</p>
          <a href="${signupLink}" style="padding: 10px 20px; background: #1a4f8b; color: white; text-decoration: none; border-radius: 5px;">Configurer mon compte</a>
        `
      };

      transporter.sendMail(mailOptions).catch(err => {
        console.error('📧 Error sending email:', err.message);
        console.log('🔗 Signup Link (Manual):', signupLink);
      });
    } else {
      // Upgrade existing user to Admin for this department
      const userIndex = users.findIndex(u => u.email === newDept.adminId);
      if (userIndex !== -1) {
        users[userIndex].role = 'admin';
        users[userIndex].departmentId = newDept.id;
        writeLocal('users.json', users);
        console.log(`✅ Existing user ${newDept.adminId} upgraded to Admin`);
      }
    }

    departments.push(newDept);
    writeLocal('departments.json', departments);
    res.status(201).json(newDept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/departments/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
    const { id } = req.params;
    const { name, adminId, activePages } = req.body;
    
    let departments = readLocal('departments.json');
    const deptIndex = departments.findIndex(d => d.id === id);
    if (deptIndex === -1) return res.status(404).json({ message: 'Department not found' });

    const oldAdminId = departments[deptIndex].adminId;
    
    // Update basic info
    departments[deptIndex].name = name || departments[deptIndex].name;
    departments[deptIndex].activePages = activePages || departments[deptIndex].activePages;
    
    // Handle Admin change if provided
    if (adminId && adminId !== oldAdminId) {
      departments[deptIndex].adminId = adminId;
      
      const users = readLocal('users.json');
      const newAdmin = users.find(u => u.email === adminId);
      
      if (newAdmin) {
        // Upgrade existing user to admin for this dept
        const userIdx = users.findIndex(u => u.email === adminId);
        users[userIdx].role = 'admin';
        users[userIdx].departmentId = id;
        writeLocal('users.json', users);
        console.log(`✅ User ${adminId} upgraded to Admin via Edit`);
      } else {
        // Create invitation for new email
        console.log(`👤 Creating invitation for new admin (Edit): ${adminId}`);
        const token = crypto.randomBytes(32).toString('hex');
        const invitations = readLocal('invitations.json');
        invitations.push({
          email: adminId,
          role: 'admin',
          departmentId: id,
          token: token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        writeLocal('invitations.json', invitations);

        const signupLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup/${token}`;
        const mailOptions = {
          from: '"WorkPlan System" <noreply@workplan.com>',
          to: adminId,
          subject: 'Invitation à gérer un département sur WorkPlan',
          html: `<h1>Bienvenue sur WorkPlan</h1><p>Vous avez été désigné administrateur pour <b>${name}</b>.</p><a href="${signupLink}">Configurer mon compte</a>`
        };
        transporter.sendMail(mailOptions).catch(e => console.error('📧 Email Error:', e.message));
      }
    }

    writeLocal('departments.json', departments);
    res.json(departments[deptIndex]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/departments/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
    let departments = readLocal('departments.json');
    departments = departments.filter(d => d.id !== req.params.id);
    writeLocal('departments.json', departments);
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// INVITATION COMPLETION
app.get('/api/invitations/verify/:token', async (req, res) => {
  try {
    const invitations = readLocal('invitations.json');
    const invite = invitations.find(i => i.token === req.params.token);
    
    if (!invite) return res.status(404).json({ message: 'Lien invalide ou expiré' });
    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'Invitation expirée' });
    }
    
    res.json({ email: invite.email, role: invite.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/complete-signup', async (req, res) => {
  try {
    const { token, password, name } = req.body;
    let invitations = readLocal('invitations.json');
    const index = invitations.findIndex(i => i.token === token);
    
    if (index === -1) return res.status(404).json({ message: 'Invitation non trouvée' });
    const invite = invitations[index];

    const users = readLocal('users.json');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: `user_${Date.now()}`,
      name: name,
      email: invite.email,
      password: hashedPassword,
      role: invite.role,
      departmentId: invite.departmentId,
      createdAt: new Date()
    };
    
    users.push(newUser);
    writeLocal('users.json', users);

    // Remove invitation
    invitations.splice(index, 1);
    writeLocal('invitations.json', invitations);

    res.json({ message: 'Compte créé avec succès !' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC SIGNUP & VERIFICATION
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const users = readLocal('users.json');
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      role: 'worker', // Default role for public signup
      isVerified: true,
      createdAt: new Date()
    };
    
    users.push(newUser);
    writeLocal('users.json', users);

    res.status(201).json({ message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/auth/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    let users = readLocal('users.json');
    const index = users.findIndex(u => u.verificationToken === token);
    
    if (index === -1) return res.status(404).json({ message: 'Lien de vérification invalide ou expiré' });
    
    users[index].isVerified = true;
    delete users[index].verificationToken;
    writeLocal('users.json', users);

    res.json({ message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/departments/:id/config', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const departments = readLocal('departments.json');
    const index = departments.findIndex(d => d.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Department not found' });

    // Allow: the admin's token departmentId matches, OR the admin is listed as adminId of the dept
    const dept = departments[index];
    const isAuthorized = req.user.departmentId === req.params.id || dept.adminId === req.user.email;
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized for this department' });
    }

    if (req.body.products) departments[index].products = req.body.products;
    if (req.body.types) departments[index].types = req.body.types;
    if (req.body.pageConfigs) departments[index].pageConfigs = req.body.pageConfigs;
    if (req.body.formFields) departments[index].formFields = req.body.formFields;
    if (req.body.coverUrl !== undefined) departments[index].coverUrl = req.body.coverUrl;
    if (req.body.logoUrl !== undefined) departments[index].logoUrl = req.body.logoUrl;
    
    writeLocal('departments.json', departments);
    res.json(departments[index]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/departments/my-config', authenticateToken, async (req, res) => {
  try {
    const departments = readLocal('departments.json');
    // Primary: look up by departmentId in token
    // Fallback: find the first department where this user is adminId (by email)
    let dept;
    if (req.user.role === 'superadmin' && req.query.departmentId) {
      dept = departments.find(d => d.id === req.query.departmentId);
    } else {
      dept = departments.find(d => d.id === req.user.departmentId);
      if (!dept && req.user.role === 'admin') {
        dept = departments.find(d => d.adminId === req.user.email);
      }
    }
    if (!dept) return res.json({ products: [], types: [] });
    res.json({ 
       departmentId: dept.id,
       departmentName: dept.name,
       products: dept.products || [], 
       types: dept.types || [],
       activePages: dept.activePages || ['table', 'kanban', 'timeline', 'calendrier', 'reporting', 'urgences', 'stats'],
       pageConfigs: dept.pageConfigs || {},
       formFields: dept.formFields || null,
       coverUrl: dept.coverUrl || null,
       logoUrl: dept.logoUrl || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NOTIFICATION ROUTES
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = readLocal('notifications.json');
    const userNotifications = notifications
      .filter(n => n.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userNotifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notifications = readLocal('notifications.json');
    const index = notifications.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
    if (index !== -1) {
      notifications[index].read = true;
      writeLocal('notifications.json', notifications);
    }
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const notifications = readLocal('notifications.json');
    notifications.forEach(n => {
      if (n.userId === req.user.id) n.read = true;
    });
    writeLocal('notifications.json', notifications);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    let notifications = readLocal('notifications.json');
    notifications = notifications.filter(n => !(n.id === req.params.id && n.userId === req.user.id));
    writeLocal('notifications.json', notifications);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper to create notifications
const createNotification = (userId, title, message, link = null) => {
  try {
    const notifications = readLocal('notifications.json');
    const newNotif = {
      id: 'notif_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      userId,
      title,
      message,
      link,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(newNotif);
    writeLocal('notifications.json', notifications);
    io.emit('notification_added', newNotif);
    return newNotif;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};
app.post('/api/users/invite-bulk', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const { emails, role } = req.body; // emails is an array
    if (!emails || !Array.isArray(emails)) return res.status(400).json({ message: 'Liste d\'emails invalide' });

    const invitations = readLocal('invitations.json');
    const results = { invited: [], skipped: [] };

    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) continue;

      // Check if already invited or already a user
      const users = readLocal('users.json');
      if (users.find(u => u.email === trimmedEmail)) {
        results.skipped.push({ email: trimmedEmail, reason: 'Utilisateur existe déjà' });
        continue;
      }
      if (invitations.find(i => i.email === trimmedEmail)) {
        results.skipped.push({ email: trimmedEmail, reason: 'Invitation déjà envoyée' });
        continue;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const invite = {
        email: trimmedEmail,
        role: role || 'worker',
        departmentId: req.user.departmentId,
        token: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
      invitations.push(invite);
      results.invited.push(trimmedEmail);

      // Send Email
      const signupLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup/${token}`;
      const mailOptions = {
        from: '"WorkPlan System" <noreply@workplan.com>',
        to: trimmedEmail,
        subject: 'Invitation à rejoindre WorkPlan',
        html: `
          <div style="font-family: sans-serif; color: #334155; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h1 style="color: #1e293b;">Bienvenue sur WorkPlan</h1>
            <p>Vous avez été invité par l'administrateur de votre département à rejoindre la plateforme.</p>
            <p>Cliquez sur le lien ci-dessous pour configurer votre compte (Nom & Mot de passe) :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signupLink}" style="padding: 12px 24px; background: #1e293b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Configurer mon compte</a>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">Ce lien expire dans 7 jours.</p>
          </div>
        `
      };
      transporter.sendMail(mailOptions).catch(err => console.error(`📧 Error sending to ${trimmedEmail}:`, err.message));
    }

    writeLocal('invitations.json', invitations);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/departments/:id/import-resources', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const { products, types } = req.body;
    
    const departments = readLocal('departments.json');
    const index = departments.findIndex(d => d.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Department not found' });

    if (products && Array.isArray(products)) {
      // Add only unique products
      const currentProducts = departments[index].products || [];
      const newProducts = [...new Set([...currentProducts, ...products.map(p => p.trim()).filter(Boolean)])];
      departments[index].products = newProducts;
    }

    if (types && Array.isArray(types)) {
      // Add only unique types
      const currentTypes = departments[index].types || [];
      const newTypes = [...new Set([...currentTypes, ...types.map(t => t.trim()).filter(Boolean)])];
      departments[index].types = newTypes;
    }

    writeLocal('departments.json', departments);
    res.json(departments[index]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// REST API for initial load
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (USE_LOCAL_DB) {
      let projects = readLocal('projects.json');
      
      if (req.user.role === 'admin') {
        projects = projects.filter(p => p.departmentId === req.user.departmentId);
      } else if (req.user.role === 'initiateur') {
        projects = projects.filter(p => p.departmentId === req.user.departmentId && p.initiatorId === req.user.id);
      } else if (req.user.role === 'worker') {
        projects = projects.filter(p => p.departmentId === req.user.departmentId && p.assignedTo === req.user.id);
      } else if (req.user.role === 'superadmin') {
        if (req.query.departmentId) {
          projects = projects.filter(p => p.departmentId === req.query.departmentId);
        } else {
          // By default Superadmin sees nothing unless a department is selected
          projects = [];
        }
      }
      
      projects.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      return res.json(projects);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET users list for assignment
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (USE_LOCAL_DB) {
      const users = readLocal('users.json');
      let filteredUsers = [];
      
      if (req.user.role === 'admin') {
        filteredUsers = users.filter(u => u.departmentId === req.user.departmentId);
      } else if (req.user.role === 'initiateur') {
        filteredUsers = users.filter(u => u.departmentId === req.user.departmentId && u.role === 'worker');
      }

      res.json(filteredUsers.map(u => ({ name: u.name, role: u.role, _id: u.id, email: u.email })));
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.get('/api/departments/members-status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const users = readLocal('users.json').filter(u => u.departmentId === req.user.departmentId);
    const invitations = readLocal('invitations.json').filter(i => i.departmentId === req.user.departmentId);
    
    // Format response
    const members = [
      ...users.map(u => ({ ...u, status: 'Inscrit' })),
      ...invitations.map(i => ({ ...i, status: 'En attente', name: i.email.split('@')[0], _id: i.token, isInvitation: true }))
    ];
    
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const users = readLocal('users.json');
    const index = users.findIndex(u => (u._id === req.params.id || u.id === req.params.id) && u.departmentId === req.user.departmentId);
    
    if (index === -1) {
      // Check invitations
      const invitations = readLocal('invitations.json');
      const invIndex = invitations.findIndex(i => i.token === req.params.id && i.departmentId === req.user.departmentId);
      if (invIndex !== -1) {
        invitations[invIndex] = { ...invitations[invIndex], ...req.body };
        writeLocal('invitations.json', invitations);
        return res.json(invitations[invIndex]);
      }
      return res.status(404).json({ message: 'User or invitation not found' });
    }

    users[index] = { ...users[index], ...req.body };
    writeLocal('users.json', users);
    res.json(users[index]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    
    // Remove from users
    let users = readLocal('users.json');
    users = users.filter(u => !((u._id === req.params.id || u.id === req.params.id) && u.departmentId === req.user.departmentId));
    writeLocal('users.json', users);
    
    // Remove from invitations
    let invitations = readLocal('invitations.json');
    invitations = invitations.filter(i => !(i.token === req.params.id && i.departmentId === req.user.departmentId));
    writeLocal('invitations.json', invitations);
    
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('new_project', async (data) => {
    try {
      let newProject;
      if (USE_LOCAL_DB) {
        // Socket doesn't easily have req.user, so frontend must send departmentId and initiatorId
        newProject = await Project.save(data);
      } else {
        newProject = new Project(data);
        await newProject.save();
      }

      // Broadcast the new project to all connected clients
      io.emit('project_added', newProject);

      // Create notification for assigned user
      if (data.assignedTo) {
        createNotification(
          data.assignedTo,
          'Nouveau projet assigné',
          `On vous a assigné le projet: ${data.name}`,
          `/table` // Default link
        );
      }
    } catch (error) {
      console.error('Error adding project:', error);
      socket.emit('error', { message: 'Failed to add project' });
    }
  });

  socket.on('update_project_status', async (data) => {
    try {
      if (USE_LOCAL_DB) {
        const projects = readLocal('projects.json');
        const pIndex = projects.findIndex(p => p._id === data.projectId);
        if (pIndex !== -1) {
          projects[pIndex].status = data.status;
          writeLocal('projects.json', projects);
          const updatedProject = projects[pIndex];
          io.emit('project_updated', updatedProject);

          // Create notification for project initiator
          if (updatedProject.initiatorId) {
             createNotification(
               updatedProject.initiatorId,
               'Mise à jour du statut',
               `Le statut du projet "${updatedProject.name}" est passé à "${updatedProject.status}"`,
               `/table`
             );
          }
        }
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
