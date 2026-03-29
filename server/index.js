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
    origin: "*", // Adjust as needed for production
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection (Skip if local)
if (!USE_LOCAL_DB) {
  const mongoOptions = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30k
  };

  mongoose.connect(process.env.MONGODB_URI, mongoOptions)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
} else {
  console.log('📂 Running in LOCAL JSON DATABASE mode');
}

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
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user;

    if (USE_LOCAL_DB) {
      const users = readLocal('users.json');
      user = users.find(u => u.email === email && u.password === password);
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });
      user.id = user.id || Date.now().toString(); // Use a temp id if missing
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
    departments.push(newDept);
    writeLocal('departments.json', departments);
    res.status(201).json(newDept);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
       formFields: dept.formFields || null
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
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const users = readLocal('users.json');
    const newUser = { 
      ...req.body, 
      id: 'usr_' + Date.now().toString(),
      departmentId: req.user.departmentId 
    };
    users.push(newUser);
    writeLocal('users.json', users);
    res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
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
