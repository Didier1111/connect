# Task Completion Agents API Documentation

This document provides comprehensive documentation for the Task Completion Agents API, enabling task delegation, agent management, and revenue sharing within Project Connect.

## Base URL

```
https://api.projectconnect.trade/v1
```

For local development:
```
http://localhost:3000/v1
```

## Authentication

All API requests require authentication using JWT tokens obtained through the authentication endpoints.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Rate Limiting

- **Authenticated Requests**: 1,000 requests per hour per user
- **Unauthenticated Requests**: 100 requests per hour per IP
- **Organization Requests**: 10,000 requests per hour per organization

Exceeding rate limits returns a 429 status code.

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid input data"
}
```

#### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

#### 403 Forbidden
```json
{
  "error": "Not authorized to access this resource"
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## API Endpoints

### Authentication

#### POST /auth/login
**User login**

##### Request
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

##### Response
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "contributor"
  }
}
```

#### POST /auth/register
**User registration**

##### Request
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "secure_password",
  "role": "contributor" // or "agent" or "admin"
}
```

##### Response
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "contributor"
  }
}
```

### Tasks

#### GET /tasks
**List tasks**

##### Query Parameters
- `status`: Filter by status (pending, inProgress, completed, cancelled)
- `category`: Filter by category (development, content, analysis, community, strategic)
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset

##### Response
```json
{
  "tasks": [
    {
      "id": "task_123",
      "title": "Develop Trading Strategy Module",
      "description": "Create a module for backtesting trading strategies",
      "category": "development",
      "skillsRequired": ["JavaScript", "Node.js", "Trading"],
      "budget": {
        "amount": 500,
        "currency": "USD",
        "type": "fixed"
      },
      "timeline": {
        "startDate": "2025-01-15T00:00:00Z",
        "endDate": "2025-02-15T00:00:00Z"
      },
      "status": "pending",
      "createdBy": {
        "id": "user_456",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "assignedTo": null,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### POST /tasks
**Create new task**

##### Request
```json
{
  "title": "Develop Trading Strategy Module",
  "description": "Create a module for backtesting trading strategies",
  "category": "development",
  "skillsRequired": ["JavaScript", "Node.js", "Trading"],
  "budget": {
    "amount": 500,
    "currency": "USD",
    "type": "fixed"
  },
  "timeline": {
    "startDate": "2025-01-15T00:00:00Z",
    "endDate": "2025-02-15T00:00:00Z"
  }
}
```

##### Response
```json
{
  "id": "task_123",
  "title": "Develop Trading Strategy Module",
  "description": "Create a module for backtesting trading strategies",
  "category": "development",
  "skillsRequired": ["JavaScript", "Node.js", "Trading"],
  "budget": {
    "amount": 500,
    "currency": "USD",
    "type": "fixed"
  },
  "timeline": {
    "startDate": "2025-01-15T00:00:00Z",
    "endDate": "2025-02-15T00:00:00Z"
  },
  "status": "pending",
  "createdBy": {
    "id": "user_456",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "assignedTo": null,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### GET /tasks/{taskId}
**Get specific task**

##### Response
```json
{
  "id": "task_123",
  "title": "Develop Trading Strategy Module",
  "description": "Create a module for backtesting trading strategies",
  "category": "development",
  "skillsRequired": ["JavaScript", "Node.js", "Trading"],
  "budget": {
    "amount": 500,
    "currency": "USD",
    "type": "fixed"
  },
  "timeline": {
    "startDate": "2025-01-15T00:00:00Z",
    "endDate": "2025-02-15T00:00:00Z"
  },
  "status": "pending",
  "createdBy": {
    "id": "user_456",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "assignedTo": null,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### PUT /tasks/{taskId}
**Update task**

##### Request
```json
{
  "status": "inProgress",
  "assignedTo": "agent_321"
}
```

##### Response
```json
{
  "id": "task_123",
  "title": "Develop Trading Strategy Module",
  "description": "Create a module for backtesting trading strategies",
  "category": "development",
  "skillsRequired": ["JavaScript", "Node.js", "Trading"],
  "budget": {
    "amount": 500,
    "currency": "USD",
    "type": "fixed"
  },
  "timeline": {
    "startDate": "2025-01-15T00:00:00Z",
    "endDate": "2025-02-15T00:00:00Z"
  },
  "status": "inProgress",
  "createdBy": {
    "id": "user_456",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "assignedTo": {
    "id": "agent_321",
    "name": "Alex Johnson",
    "email": "alex@example.com"
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-03T00:00:00Z"
}
```

### Agents

#### GET /agents
**List agents**

##### Query Parameters
- `skills`: Comma-separated list of skills
- `rating`: Minimum rating (1-5)
- `availability`: Filter by availability (available, busy, offline)
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset

##### Response
```json
{
  "agents": [
    {
      "id": "agent_321",
      "name": "Alex Johnson",
      "email": "alex@example.com",
      "skills": ["JavaScript", "Node.js", "React", "Trading"],
      "rating": 4.8,
      "completedTasks": 45,
      "hourlyRate": 75,
      "availability": "available",
      "agentType": "human",
      "profile": {
        "bio": "Full-stack developer with 5 years experience",
        "location": "New York, NY",
        "languages": ["English", "Spanish"]
      },
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### POST /agents
**Register new agent**

##### Request
```json
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "skills": ["JavaScript", "Node.js", "React", "Trading"],
  "rating": 4.8,
  "completedTasks": 45,
  "hourlyRate": 75,
  "availability": "available",
  "agentType": "human",
  "profile": {
    "bio": "Full-stack developer with 5 years experience",
    "location": "New York, NY",
    "languages": ["English", "Spanish"]
  }
}
```

##### Response
```json
{
  "id": "agent_321",
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "skills": ["JavaScript", "Node.js", "React", "Trading"],
  "rating": 4.8,
  "completedTasks": 45,
  "hourlyRate": 75,
  "availability": "available",
  "agentType": "human",
  "profile": {
    "bio": "Full-stack developer with 5 years experience",
    "location": "New York, NY",
    "languages": ["English", "Spanish"]
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### GET /agents/{agentId}
**Get specific agent**

##### Response
```json
{
  "id": "agent_321",
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "skills": ["JavaScript", "Node.js", "React", "Trading"],
  "rating": 4.8,
  "completedTasks": 45,
  "hourlyRate": 75,
  "availability": "available",
  "agentType": "human",
  "profile": {
    "bio": "Full-stack developer with 5 years experience",
    "location": "New York, NY",
    "languages": ["English", "Spanish"],
    "portfolio": [
      {
        "title": "Trading Platform",
        "description": "Built a cryptocurrency trading platform",
        "url": "https://example.com/project"
      }
    ]
  },
  "reviews": [
    {
      "taskId": "task_456",
      "rating": 5,
      "comment": "Excellent work, delivered on time",
      "reviewer": {
        "id": "user_789",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### PUT /agents/{agentId}
**Update agent**

##### Request
```json
{
  "availability": "busy",
  "rating": 4.9
}
```

##### Response
```json
{
  "id": "agent_321",
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "skills": ["JavaScript", "Node.js", "React", "Trading"],
  "rating": 4.9,
  "completedTasks": 45,
  "hourlyRate": 75,
  "availability": "busy",
  "agentType": "human",
  "profile": {
    "bio": "Full-stack developer with 5 years experience",
    "location": "New York, NY",
    "languages": ["English", "Spanish"]
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-02T00:00:00Z"
}
```

### Contracts

#### GET /contracts
**List contracts**

##### Query Parameters
- `status`: Filter by status (active, completed, cancelled)
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset

##### Response
```json
{
  "contracts": [
    {
      "id": "contract_456",
      "taskId": "task_123",
      "contributorId": "user_456",
      "agentId": "agent_321",
      "terms": {
        "paymentAmount": 500,
        "paymentType": "fixed",
        "milestones": [
          {
            "name": "Initial Setup",
            "percentage": 30,
            "amount": 150,
            "dueDate": "2025-01-10T00:00:00Z",
            "status": "pending"
          },
          {
            "name": "Core Development",
            "percentage": 50,
            "amount": 250,
            "dueDate": "2025-01-20T00:00:00Z",
            "status": "pending"
          },
          {
            "name": "Final Delivery",
            "percentage": 20,
            "amount": 100,
            "dueDate": "2025-01-30T00:00:00Z",
            "status": "pending"
          }
        ]
      },
      "status": "active",
      "createdAt": "2025-01-03T00:00:00Z",
      "updatedAt": "2025-01-03T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### POST /contracts
**Create contract**

##### Request
```json
{
  "taskId": "task_123",
  "agentId": "agent_321",
  "terms": {
    "paymentAmount": 500,
    "paymentType": "fixed",
    "milestones": [
      {
        "name": "Initial Setup",
        "percentage": 30,
        "dueDate": "2025-01-10T00:00:00Z"
      },
      {
        "name": "Core Development",
        "percentage": 50,
        "dueDate": "2025-01-20T00:00:00Z"
      },
      {
        "name": "Final Delivery",
        "percentage": 20,
        "dueDate": "2025-01-30T00:00:00Z"
      }
    ]
  }
}
```

##### Response
```json
{
  "id": "contract_456",
  "taskId": "task_123",
  "contributorId": "user_456",
  "agentId": "agent_321",
  "terms": {
    "paymentAmount": 500,
    "paymentType": "fixed",
    "milestones": [
      {
        "name": "Initial Setup",
        "percentage": 30,
        "amount": 150,
        "dueDate": "2025-01-10T00:00:00Z",
        "status": "pending"
      },
      {
        "name": "Core Development",
        "percentage": 50,
        "amount": 250,
        "dueDate": "2025-01-20T00:00:00Z",
        "status": "pending"
      },
      {
        "name": "Final Delivery",
        "percentage": 20,
        "amount": 100,
        "dueDate": "2025-01-30T00:00:00Z",
        "status": "pending"
      }
    ]
  },
  "status": "active",
  "createdAt": "2025-01-03T00:00:00Z",
  "updatedAt": "2025-01-03T00:00:00Z"
}
```

#### GET /contracts/{contractId}
**Get specific contract**

##### Response
```json
{
  "id": "contract_456",
  "taskId": "task_123",
  "contributorId": "user_456",
  "agentId": "agent_321",
  "terms": {
    "paymentAmount": 500,
    "paymentType": "fixed",
    "milestones": [
      {
        "name": "Initial Setup",
        "percentage": 30,
        "amount": 150,
        "dueDate": "2025-01-10T00:00:00Z",
        "status": "pending"
      },
      {
        "name": "Core Development",
        "percentage": 50,
        "amount": 250,
        "dueDate": "2025-01-20T00:00:00Z",
        "status": "pending"
      },
      {
        "name": "Final Delivery",
        "percentage": 20,
        "amount": 100,
        "dueDate": "2025-01-30T00:00:00Z",
        "status": "pending"
      }
    ]
  },
  "status": "active",
  "createdAt": "2025-01-03T00:00:00Z",
  "updatedAt": "2025-01-03T00:00:00Z"
}
```

#### PUT /contracts/{contractId}
**Update contract**

##### Request
```json
{
  "status": "completed"
}
```

##### Response
```json
{
  "id": "contract_456",
  "taskId": "task_123",
  "contributorId": "user_456",
  "agentId": "agent_321",
  "terms": {
    "paymentAmount": 500,
    "paymentType": "fixed",
    "milestones": [
      {
        "name": "Initial Setup",
        "percentage": 30,
        "amount": 150,
        "dueDate": "2025-01-10T00:00:00Z",
        "status": "completed"
      },
      {
        "name": "Core Development",
        "percentage": 50,
        "amount": 250,
        "dueDate": "2025-01-20T00:00:00Z",
        "status": "completed"
      },
      {
        "name": "Final Delivery",
        "percentage": 20,
        "amount": 100,
        "dueDate": "2025-01-30T00:00:00Z",
        "status": "completed"
      }
    ]
  },
  "status": "completed",
  "createdAt": "2025-01-03T00:00:00Z",
  "updatedAt": "2025-01-31T00:00:00Z"
}
```

### Payments

#### GET /payments
**List payments**

##### Query Parameters
- `status`: Filter by status (pending, completed, failed, refunded)
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset

##### Response
```json
{
  "payments": [
    {
      "id": "payment_123",
      "contractId": "contract_456",
      "milestoneId": "milestone_789",
      "amount": 150,
      "currency": "USD",
      "method": "credit_card",
      "status": "completed",
      "transactionId": "txn_456",
      "createdAt": "2025-01-10T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### POST /payments
**Process payment**

##### Request
```json
{
  "contractId": "contract_456",
  "milestoneId": "milestone_789",
  "amount": 150,
  "currency": "USD",
  "method": "credit_card"
}
```

##### Response
```json
{
  "id": "payment_123",
  "contractId": "contract_456",
  "milestoneId": "milestone_789",
  "amount": 150,
  "currency": "USD",
  "method": "credit_card",
  "status": "completed",
  "transactionId": "txn_456",
  "createdAt": "2025-01-10T00:00:00Z"
}
```

#### GET /payments/{paymentId}
**Get specific payment**

##### Response
```json
{
  "id": "payment_123",
  "contractId": "contract_456",
  "milestoneId": "milestone_789",
  "amount": 150,
  "currency": "USD",
  "method": "credit_card",
  "status": "completed",
  "transactionId": "txn_456",
  "createdAt": "2025-01-10T00:00:00Z"
}
```

### Proposals

#### GET /proposals
**List proposals**

##### Query Parameters
- `status`: Filter by status (pending, accepted, rejected)
- `taskId`: Filter by task ID
- `agentId`: Filter by agent ID
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset

##### Response
```json
{
  "proposals": [
    {
      "id": "proposal_789",
      "taskId": "task_123",
      "agentId": "agent_321",
      "amount": 450,
      "message": "I can complete this within 2 weeks",
      "estimatedHours": 40,
      "status": "pending",
      "createdAt": "2025-01-02T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### POST /proposals
**Submit proposal**

##### Request
```json
{
  "taskId": "task_123",
  "amount": 450,
  "message": "I can complete this within 2 weeks",
  "estimatedHours": 40
}
```

##### Response
```json
{
  "id": "proposal_789",
  "taskId": "task_123",
  "agentId": "agent_321",
  "amount": 450,
  "message": "I can complete this within 2 weeks",
  "estimatedHours": 40,
  "status": "pending",
  "createdAt": "2025-01-02T00:00:00Z"
}
```

#### PUT /proposals/{proposalId}
**Update proposal**

##### Request
```json
{
  "status": "accepted" // or "rejected"
}
```

##### Response
```json
{
  "id": "proposal_789",
  "taskId": "task_123",
  "agentId": "agent_321",
  "amount": 450,
  "message": "I can complete this within 2 weeks",
  "estimatedHours": 40,
  "status": "accepted",
  "createdAt": "2025-01-02T00:00:00Z",
  "updatedAt": "2025-01-03T00:00:00Z"
}
```

## Webhooks

### Task Events
- `task.created`: New task posted
- `task.updated`: Task status or details changed
- `task.assigned`: Task assigned to agent
- `task.completed`: Task marked as completed

### Proposal Events
- `proposal.created`: New proposal submitted
- `proposal.accepted`: Proposal accepted
- `proposal.rejected`: Proposal rejected

### Contract Events
- `contract.created`: New contract established
- `contract.updated`: Contract terms modified
- `contract.completed`: Contract fully executed

### Payment Events
- `payment.processed`: Payment successfully processed
- `payment.failed`: Payment processing failed
- `payment.refunded`: Payment refunded

## SDK Examples

### JavaScript SDK
```javascript
const ProjectConnect = require('project-connect-sdk');

const client = new ProjectConnect({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.projectconnect.trade/v1'
});

// Create a new task
const task = await client.tasks.create({
  title: 'Develop Trading Strategy Module',
  description: 'Create a module for backtesting trading strategies',
  category: 'development',
  skillsRequired: ['JavaScript', 'Node.js', 'Trading'],
  budget: {
    amount: 500,
    currency: 'USD',
    type: 'fixed'
  }
});

// List available agents
const agents = await client.agents.list({
  skills: ['JavaScript', 'Node.js'],
  rating: 4.5
});

// Submit a proposal
const proposal = await client.proposals.create({
  taskId: task.id,
  amount: 450,
  message: 'I can complete this within 2 weeks'
});
```

### Python SDK
```python
from project_connect import Client

client = Client(
    api_key='your_api_key',
    base_url='https://api.projectconnect.trade/v1'
)

# Create a new task
task = client.tasks.create({
    'title': 'Develop Trading Strategy Module',
    'description': 'Create a module for backtesting trading strategies',
    'category': 'development',
    'skills_required': ['JavaScript', 'Node.js', 'Trading'],
    'budget': {
        'amount': 500,
        'currency': 'USD',
        'type': 'fixed'
    }
})

# List available agents
agents = client.agents.list(
    skills=['JavaScript', 'Node.js'],
    rating=4.5
)

# Submit a proposal
proposal = client.proposals.create({
    'task_id': task['id'],
    'amount': 450,
    'message': 'I can complete this within 2 weeks'
})
```

This API documentation provides a comprehensive reference for integrating with the Task Completion Agents platform, enabling seamless automation of task delegation and revenue sharing within Project Connect.