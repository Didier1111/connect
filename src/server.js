// src/server.js
// Basic Express server implementation for Task Completion Agents API

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'project-connect-secret';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-agents', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Simple User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['contributor', 'agent', 'admin'] },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Simple Task Schema
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: { type: String, enum: ['development', 'content', 'analysis', 'community', 'strategic'] },
  skillsRequired: [String],
  budget: {
    amount: Number,
    currency: String,
    type: String,
  },
  timeline: {
    startDate: Date,
    endDate: Date,
  },
  status: { type: String, enum: ['pending', 'inProgress', 'completed', 'cancelled'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Task = mongoose.model('Task', taskSchema);

// Simple Agent Schema
const agentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  skills: [String],
  rating: { type: Number, min: 1, max: 5 },
  completedTasks: { type: Number, default: 0 },
  hourlyRate: Number,
  availability: { type: String, enum: ['available', 'busy', 'offline'] },
  agentType: { type: String, enum: ['human', 'ai', 'hybrid'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Agent = mongoose.model('Agent', agentSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Authentication routes
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'contributor',
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Task routes
app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const { status, category, limit = 20, offset = 0 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    const tasks = await Task.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    
    const total = await Task.countDocuments(filter);
    
    res.json({
      tasks,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      createdBy: req.user.userId,
    };
    
    const task = new Task(taskData);
    await task.save();
    
    // Populate references
    await task.populate('createdBy', 'name email');
    
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user is authorized to update task
    if (task.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }
    
    // Update task
    Object.assign(task, req.body);
    task.updatedAt = Date.now();
    await task.save();
    
    // Populate references
    await task.populate('createdBy', 'name email');
    await task.populate('assignedTo', 'name email');
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Agent routes
app.get('/agents', authenticateToken, async (req, res) => {
  try {
    const { skills, rating, availability, limit = 20, offset = 0 } = req.query;
    
    const filter = {};
    if (skills) {
      filter.skills = { $in: skills.split(',') };
    }
    if (rating) filter.rating = { $gte: parseFloat(rating) };
    if (availability) filter.availability = availability;
    
    const agents = await Agent.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ rating: -1, completedTasks: -1 });
    
    const total = await Agent.countDocuments(filter);
    
    res.json({
      agents,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/agents', authenticateToken, async (req, res) => {
  try {
    const agent = new Agent(req.body);
    await agent.save();
    
    res.status(201).json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/agents/:agentId', authenticateToken, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Task Completion Agents API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;