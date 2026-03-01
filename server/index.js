const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Import User model
require('dotenv').config();

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

// MongoDB Connection
const mongoOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30k
};

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Project Schema
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  initiatorName: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true, enum: ['Marketing', 'Développement', 'Design', 'Interne'] },
  product: { type: String, required: true },
  status: { type: String, default: 'Nouveau', enum: ['Nouveau', 'En cours', 'En révision', 'Terminé'] },
  deadline: { type: Date, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Added assignedTo
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

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
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '8h' }
    );

    res.json({ 
      token, 
      user: { id: user._id, name: user.name, role: user.role } 
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
      query = { assignedTo: req.user.id };
    }
    const projects = await Project.find(query).sort({ deadline: 1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('new_project', async (data) => {
    try {
      const newProject = new Project(data);
      await newProject.save();

      // Notification Logic (Stubs)
      console.log(`[Notification] To Team (Slack/Teams): Nouveau projet "${newProject.name}" soumis par ${newProject.initiatorName}.`);
      console.log(`[Notification] To Initiator (Email): Merci ${newProject.initiatorName}, votre demande pour "${newProject.product}" est reçue. Suivi: /track/${newProject._id}`);
      
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
