# Task Completion Agents API Specification

This document defines the API endpoints and specifications for the Task Completion Agents platform.

## API Overview

### Base URL
```
https://api.projectconnect.trade/v1
```

### Authentication
All API requests require authentication using JWT tokens obtained through the authentication endpoint.

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Rate Limiting
- 1,000 requests per hour per user
- 10,000 requests per hour per organization
- Exceeding limits returns 429 status code

## Core API Endpoints

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
  "expires_in": 3600,
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
  "role": "contributor" // or "agent"
}
```

##### Response
```json
{
  "id": "user_123",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "contributor",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Tasks

#### GET /tasks
**List tasks**

##### Query Parameters
- `status`: pending, in_progress, completed, cancelled
- `category`: development, content, analysis, community, strategic
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
      "skills_required": ["JavaScript", "Node.js", "Trading"],
      "budget": {
        "amount": 500,
        "currency": "USD",
        "type": "fixed"
      },
      "timeline": {
        "start_date": "2025-01-15T00:00:00Z",
        "end_date": "2025-02-15T00:00:00Z"
      },
      "status": "pending",
      "created_by": "user_456",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
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
  "skills_required": ["JavaScript", "Node.js", "Trading"],
  "budget": {
    "amount": 500,
    "currency": "USD",
    "type": "fixed"
  },
  "timeline": {
    "start_date": "2025-01-15T00:00:00Z",
    "end_date": "2025-02-15T00:00:00Z"
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
  "skills_required": ["JavaScript", "Node.js", "Trading"],
  "budget": {
    "amount": 500,
    "currency": "USD",
    "type": "fixed"
  },
  "timeline": {
    "start_date": "2025-01-15T00:00:00Z",
    "end_date": "2025-02-15T00:00:00Z"
  },
  "status": "pending",
  "created_by": "user_456",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

#### GET /tasks/{task_id}
**Get specific task**

##### Response
```json
{
  "id": "task_123",
  "title": "Develop Trading Strategy Module",
  "description": "Create a module for backtesting trading strategies",
  "category": "development",
  "skills_required": ["JavaScript", "Node.js", "Trading"],
  "budget": {
    "amount": 500,
    "currency": "USD",
    "type": "fixed"
  },
  "timeline": {
    "start_date": "2025-01-15T00:00:00Z",
    "end_date": "2025-02-15T00:00:00Z"
  },
  "status": "pending",
  "created_by": {
    "id": "user_456",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "proposals": [
    {
      "id": "proposal_789",
      "agent_id": "agent_321",
      "amount": 450,
      "message": "I can complete this within 2 weeks",
      "status": "pending",
      "created_at": "2025-01-02T00:00:00Z"
    }
  ],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-02T00:00:00Z"
}
```

#### PUT /tasks/{task_id}
**Update task**

##### Request
```json
{
  "status": "in_progress",
  "assigned_to": "agent_321"
}
```

##### Response
```json
{
  "id": "task_123",
  "title": "Develop Trading Strategy Module",
  "description": "Create a module for backtesting trading strategies",
  "category": "development",
  "skills_required": ["JavaScript", "Node.js", "Trading"],
  "budget": {
    "amount": 500,
    "currency": "USD",
    "type": "fixed"
  },
  "timeline": {
    "start_date": "2025-01-15T00:00:00Z",
    "end_date": "2025-02-15T00:00:00Z"
  },
  "status": "in_progress",
  "assigned_to": "agent_321",
  "created_by": "user_456",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-03T00:00:00Z"
}
```

### Agents

#### GET /agents
**List agents**

##### Query Parameters
- `skills`: Comma-separated list of skills
- `rating`: Minimum rating (1-5)
- `availability`: available, busy, offline
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset

##### Response
```json
{
  "agents": [
    {
      "id": "agent_321",
      "name": "Alex Johnson",
      "skills": ["JavaScript", "Node.js", "React", "Trading"],
      "rating": 4.8,
      "completed_tasks": 45,
      "hourly_rate": 75,
      "availability": "available",
      "profile": {
        "bio": "Full-stack developer with 5 years experience",
        "location": "New York, NY",
        "languages": ["English", "Spanish"]
      }
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### GET /agents/{agent_id}
**Get specific agent**

##### Response
```json
{
  "id": "agent_321",
  "name": "Alex Johnson",
  "skills": ["JavaScript", "Node.js", "React", "Trading"],
  "rating": 4.8,
  "completed_tasks": 45,
  "hourly_rate": 75,
  "availability": "available",
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
      "task_id": "task_456",
      "rating": 5,
      "comment": "Excellent work, delivered on time",
      "reviewer": "user_789",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Proposals

#### POST /proposals
**Submit proposal for task**

##### Request
```json
{
  "task_id": "task_123",
  "amount": 450,
  "message": "I can complete this within 2 weeks",
  "estimated_hours": 40
}
```

##### Response
```json
{
  "id": "proposal_789",
  "task_id": "task_123",
  "agent_id": "agent_321",
  "amount": 450,
  "message": "I can complete this within 2 weeks",
  "estimated_hours": 40,
  "status": "pending",
  "created_at": "2025-01-02T00:00:00Z"
}
```

#### PUT /proposals/{proposal_id}
**Update proposal status**

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
  "task_id": "task_123",
  "agent_id": "agent_321",
  "amount": 450,
  "message": "I can complete this within 2 weeks",
  "estimated_hours": 40,
  "status": "accepted",
  "created_at": "2025-01-02T00:00:00Z",
  "updated_at": "2025-01-03T00:00:00Z"
}
```

### Contracts

#### POST /contracts
**Create contract**

##### Request
```json
{
  "task_id": "task_123",
  "agent_id": "agent_321",
  "terms": {
    "payment_amount": 450,
    "payment_type": "fixed",
    "milestones": [
      {
        "name": "Initial Setup",
        "percentage": 30,
        "due_date": "2025-01-10T00:00:00Z"
      },
      {
        "name": "Core Development",
        "percentage": 50,
        "due_date": "2025-01-20T00:00:00Z"
      },
      {
        "name": "Final Delivery",
        "percentage": 20,
        "due_date": "2025-01-30T00:00:00Z"
      }
    ]
  }
}
```

##### Response
```json
{
  "id": "contract_456",
  "task_id": "task_123",
  "contributor_id": "user_456",
  "agent_id": "agent_321",
  "terms": {
    "payment_amount": 450,
    "payment_type": "fixed",
    "milestones": [
      {
        "name": "Initial Setup",
        "percentage": 30,
        "amount": 135,
        "due_date": "2025-01-10T00:00:00Z",
        "status": "pending"
      },
      {
        "name": "Core Development",
        "percentage": 50,
        "amount": 225,
        "due_date": "2025-01-20T00:00:00Z",
        "status": "pending"
      },
      {
        "name": "Final Delivery",
        "percentage": 20,
        "amount": 90,
        "due_date": "2025-01-30T00:00:00Z",
        "status": "pending"
      }
    ]
  },
  "status": "active",
  "created_at": "2025-01-03T00:00:00Z"
}
```

### Payments

#### POST /payments
**Process payment**

##### Request
```json
{
  "contract_id": "contract_456",
  "milestone_id": "milestone_789",
  "amount": 135,
  "method": "credit_card" // or "paypal", "bank_transfer"
}
```

##### Response
```json
{
  "id": "payment_123",
  "contract_id": "contract_456",
  "milestone_id": "milestone_789",
  "amount": 135,
  "currency": "USD",
  "method": "credit_card",
  "status": "completed",
  "transaction_id": "txn_456",
  "created_at": "2025-01-10T00:00:00Z"
}
```

#### GET /payments
**List payments**

##### Query Parameters
- `user_id`: Filter by user
- `status`: pending, completed, failed, refunded
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset

##### Response
```json
{
  "payments": [
    {
      "id": "payment_123",
      "contract_id": "contract_456",
      "milestone_id": "milestone_789",
      "amount": 135,
      "currency": "USD",
      "method": "credit_card",
      "status": "completed",
      "transaction_id": "txn_456",
      "created_at": "2025-01-10T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

## Webhook Events

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

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

#### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied"
  }
}
```

#### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

#### 429 Too Many Requests
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded"
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  }
}
```

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
  skills_required: ['JavaScript', 'Node.js', 'Trading'],
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

This API specification provides a comprehensive interface for the Task Completion Agents platform, enabling seamless integration with external systems and applications.