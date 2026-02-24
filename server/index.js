const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
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
  description: { type: String, required: true },
  type: { type: String, required: true },
  product: { type: String, required: true },
  deadline: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

// REST API for initial load
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ deadline: 1 });
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
