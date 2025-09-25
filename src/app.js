// src/app.js
// Express app configuration without server startup for testing
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'project-connect-secret';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB with error handling (only if not in test environment)
const connectDB = async () => {
  // Skip connection in test environment as it's handled by setup.js
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/task-agents';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed:', error.message);
    console.log('📝 Running in development mode without database');
    console.log('💡 To use full functionality, install and start MongoDB locally');
  }
};

// Initialize database connection
connectDB();

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

// Contract Schema
const contractSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  contributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  terms: {
    paymentAmount: { type: Number, required: true },
    paymentType: { type: String, enum: ['fixed', 'hourly', 'milestone'], default: 'fixed' },
    milestones: [{
      description: String,
      amount: Number,
      dueDate: Date,
      status: { type: String, enum: ['pending', 'completed', 'overdue'], default: 'pending' }
    }]
  },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Contract = mongoose.model('Contract', contractSchema);

// Payment Schema
const paymentSchema = new mongoose.Schema({
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  milestoneId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  method: { type: String, enum: ['credit_card', 'paypal', 'bank_transfer', 'cryptocurrency'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  transactionId: { type: String, unique: true },
  processedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

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

// Contract routes
app.post('/contracts', authenticateToken, async (req, res) => {
  try {
    const contractData = {
      ...req.body,
      contributorId: req.user.userId,
    };

    const contract = new Contract(contractData);
    await contract.save();

    // Populate references
    await contract.populate('taskId');
    await contract.populate('contributorId', 'name email');
    await contract.populate('agentId', 'name email');

    res.status(201).json(contract);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/contracts', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const contracts = await Contract.find(filter)
      .populate('taskId', 'title description')
      .populate('contributorId', 'name email')
      .populate('agentId', 'name email')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    const total = await Contract.countDocuments(filter);

    res.json({
      contracts,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/contracts/:contractId', authenticateToken, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId)
      .populate('taskId', 'title description')
      .populate('contributorId', 'name email')
      .populate('agentId', 'name email');

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/contracts/:contractId', authenticateToken, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is authorized to update contract
    if (contract.contributorId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this contract' });
    }

    // Update contract
    Object.assign(contract, req.body);
    contract.updatedAt = Date.now();
    await contract.save();

    // Populate references
    await contract.populate('taskId', 'title description');
    await contract.populate('contributorId', 'name email');
    await contract.populate('agentId', 'name email');

    res.json(contract);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Payment routes
app.post('/payments', authenticateToken, async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      transactionId: 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    };

    const payment = new Payment(paymentData);
    await payment.save();

    // Populate contract reference
    await payment.populate('contractId');

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/payments', authenticateToken, async (req, res) => {
  try {
    const { status, contractId, limit = 20, offset = 0 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (contractId) filter.contractId = contractId;

    const payments = await Payment.find(filter)
      .populate('contractId')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/payments/:paymentId', authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('contractId');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/payments/:paymentId', authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment
    Object.assign(payment, req.body);
    if (req.body.status === 'completed') {
      payment.processedAt = new Date();
    }

    await payment.save();

    // Populate contract reference
    await payment.populate('contractId');

    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

module.exports = app;