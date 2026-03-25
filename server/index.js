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
      { id: user._id || user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '8h' }
    );

    res.json({ 
      token, 
      user: { id: user._id || user.id, name: user.name, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// REST API for initial load
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'user') {
      // Users can see projects assigned to them OR projects they initiated
      query = { 
        $or: [
          { assignedTo: req.user.id },
          { initiatorName: req.user.name }
        ]
      };
    }
    const projects = await Project.find(query).sort({ deadline: 1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET users list for assignment
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (USE_LOCAL_DB) {
      const users = readLocal('users.json');
      res.json(users.map(u => ({ name: u.name, role: u.role, _id: u.id || u.email })));
    } else {
      const users = await User.find({}, 'name role _id');
      res.json(users);
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
        newProject = await Project.save(data);
      } else {
        newProject = new Project(data);
        await newProject.save();
      }

      // Broadcast the new project to all connected clients
      io.emit('project_added', newProject);
    } catch (error) {
      console.error('Error adding project:', error);
      socket.emit('error', { message: 'Failed to add project' });
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
