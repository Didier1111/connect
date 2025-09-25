// tests/server.test.js
// Basic tests for Task Completion Agents API

const request = require('supertest');
const app = require('../src/app');

describe('Task Completion Agents API', () => {
  // Test health check endpoint
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // Test authentication endpoints
  describe('Authentication', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'contributor'
      };

      const res = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);
      
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('name', userData.name);
      expect(res.body.user).toHaveProperty('email', userData.email);
      expect(res.body.user).toHaveProperty('role', userData.role);
    });

    it('should login existing user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);
      
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('name');
      expect(res.body.user).toHaveProperty('email', loginData.email);
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      };

      await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);
    });
  });

  // Test task endpoints (requires authentication)
  describe('Tasks', () => {
    let authToken;
    let taskId;

    // Login before task tests
    beforeAll(async () => {
      // Register and login user for testing
      const userData = {
        name: 'Task Tester',
        email: 'tasktester@example.com',
        password: 'password123',
        role: 'contributor'
      };

      const registerRes = await request(app)
        .post('/auth/register')
        .send(userData);

      authToken = registerRes.body.token;
    });

    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        category: 'development',
        skillsRequired: ['JavaScript', 'Node.js'],
        budget: {
          amount: 500,
          currency: 'USD',
          type: 'fixed'
        },
        timeline: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
        },
        status: 'pending'
      };

      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);
      
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title', taskData.title);
      expect(res.body).toHaveProperty('description', taskData.description);
      expect(res.body).toHaveProperty('category', taskData.category);
      taskId = res.body.id;
    });

    it('should retrieve tasks', async () => {
      const res = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body).toHaveProperty('tasks');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.tasks)).toBe(true);
    });

    it('should retrieve specific task', async () => {
      const res = await request(app)
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body).toHaveProperty('id', taskId);
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('description');
    });

    it('should update task', async () => {
      const updateData = {
        title: 'Updated Test Task',
        status: 'inProgress'
      };

      const res = await request(app)
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(res.body).toHaveProperty('id', taskId);
      expect(res.body).toHaveProperty('title', updateData.title);
      expect(res.body).toHaveProperty('status', updateData.status);
    });
  });

  // Test agent endpoints
  describe('Agents', () => {
    let authToken;
    let agentId;

    // Login before agent tests
    beforeAll(async () => {
      // Register and login user for testing
      const userData = {
        name: 'Agent Tester',
        email: 'agenttester@example.com',
        password: 'password123',
        role: 'contributor'
      };

      const registerRes = await request(app)
        .post('/auth/register')
        .send(userData);

      authToken = registerRes.body.token;
    });

    it('should create a new agent', async () => {
      const agentData = {
        name: 'Test Agent',
        email: 'testagent@example.com',
        skills: ['JavaScript', 'Python', 'React'],
        rating: 4.5,
        completedTasks: 25,
        hourlyRate: 75,
        availability: 'available',
        agentType: 'human'
      };

      const res = await request(app)
        .post('/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(agentData)
        .expect(201);
      
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', agentData.name);
      expect(res.body).toHaveProperty('email', agentData.email);
      expect(res.body).toHaveProperty('skills');
      agentId = res.body.id;
    });

    it('should retrieve agents', async () => {
      const res = await request(app)
        .get('/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body).toHaveProperty('agents');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.agents)).toBe(true);
    });

    it('should retrieve specific agent', async () => {
      const res = await request(app)
        .get(`/agents/${agentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body).toHaveProperty('id', agentId);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('email');
    });
  });

  // Test 404 handling
  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/non-existent-endpoint')
        .expect(404);
    });

    it('should require authentication for protected endpoints', async () => {
      await request(app)
        .get('/tasks')
        .expect(401);
    });
  });
});