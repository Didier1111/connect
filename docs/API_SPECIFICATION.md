# Project Connect API Specification

## Overview

The Project Connect Task Completion Agents API is a comprehensive backend system that enables task management, agent matching, contract handling, and payment processing in a collaborative platform environment.

## Base URL
```
http://localhost:3000
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format

All API responses follow this standard format:
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2023-09-25T10:30:00Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {}
  },
  "timestamp": "2023-09-25T10:30:00Z"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limiting

- General endpoints: 100 requests per minute
- Authentication endpoints: 10 requests per minute
- File upload endpoints: 20 requests per minute

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1632567600
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password123",
  "role": "contributor"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "contributor",
      "createdAt": "2023-09-25T10:30:00Z"
    }
  }
}
```

#### POST /auth/login
Authenticate existing user.

#### POST /auth/refresh
Refresh JWT token.

#### POST /auth/logout
Logout and invalidate token.

#### POST /auth/forgot-password
Request password reset.

#### POST /auth/reset-password
Reset password with token.

### User Management

#### GET /users/profile
Get current user profile.

#### PUT /users/profile
Update user profile.

#### POST /users/avatar
Upload user avatar image.

#### GET /users/dashboard
Get user dashboard data including statistics.

#### GET /users/earnings
Get user earnings summary and history.

#### GET /users/notifications
Get user notifications.

#### PUT /users/notifications/:id/read
Mark notification as read.

### Task Management

#### GET /tasks
List tasks with filtering and search.

**Query Parameters:**
- `search` - Text search in title/description
- `category` - Filter by category
- `status` - Filter by status
- `skills` - Comma-separated skills
- `budget_min` - Minimum budget
- `budget_max` - Maximum budget
- `location` - Location filter
- `sort` - Sort order (created_at, budget, deadline)
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset

#### POST /tasks
Create new task.

#### GET /tasks/:id
Get task details.

#### PUT /tasks/:id
Update task.

#### DELETE /tasks/:id
Delete task.

#### GET /tasks/:id/matches
Get matched agents for task.

#### POST /tasks/:id/assign
Assign task to agent.

### Agent Management

#### GET /agents
List agents with filtering.

#### POST /agents
Register as agent.

#### GET /agents/:id
Get agent profile.

#### PUT /agents/:id
Update agent profile.

#### POST /agents/:id/portfolio
Upload portfolio files.

#### GET /agents/recommendations/:taskId
Get recommended agents for task.

### Contract Management

#### GET /contracts
List contracts.

#### POST /contracts
Create contract.

#### GET /contracts/:id
Get contract details.

#### PUT /contracts/:id
Update contract.

#### POST /contracts/:id/milestones
Add milestone to contract.

#### PUT /contracts/:id/milestones/:milestoneId
Update milestone status.

### Payment Management

#### GET /payments
List payments.

#### POST /payments
Process payment.

#### GET /payments/:id
Get payment details.

#### PUT /payments/:id
Update payment status.

#### POST /payments/webhooks/stripe
Stripe webhook handler.

### Analytics & Reporting

#### GET /analytics/dashboard
Get analytics dashboard data.

#### GET /analytics/tasks
Get task analytics.

#### GET /analytics/agents
Get agent performance analytics.

#### GET /analytics/revenue
Get revenue analytics.

#### GET /reports/tasks
Generate task report.

#### GET /reports/payments
Generate payment report.

### Search & Discovery

#### GET /search/tasks
Advanced task search.

#### GET /search/agents
Advanced agent search.

#### GET /search/suggestions
Get search suggestions.

### Real-time Features

#### WebSocket /ws
WebSocket connection for real-time updates.

**Events:**
- `task_created` - New task posted
- `task_assigned` - Task assigned to agent
- `milestone_completed` - Milestone completed
- `payment_processed` - Payment processed
- `notification_received` - New notification

### File Management

#### POST /files/upload
Upload file (avatar, portfolio, attachments).

#### GET /files/:id
Download file.

#### DELETE /files/:id
Delete file.

### Health & Monitoring

#### GET /health
Health check endpoint.

#### GET /metrics
System metrics (admin only).

## Data Models

### User
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "contributor|agent|admin",
  "avatar": "string",
  "location": {
    "country": "string",
    "city": "string",
    "timezone": "string"
  },
  "profile": {
    "bio": "string",
    "skills": ["string"],
    "experience": "string",
    "languages": ["string"]
  },
  "statistics": {
    "tasksCompleted": "number",
    "totalEarnings": "number",
    "averageRating": "number",
    "successRate": "number"
  },
  "settings": {
    "emailNotifications": "boolean",
    "pushNotifications": "boolean",
    "privacy": "string"
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Task
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "development|content|analysis|community|strategic",
  "skillsRequired": ["string"],
  "budget": {
    "amount": "number",
    "currency": "string",
    "type": "fixed|hourly|milestone"
  },
  "timeline": {
    "startDate": "date",
    "endDate": "date",
    "estimatedHours": "number"
  },
  "requirements": {
    "experience": "string",
    "location": "string",
    "languages": ["string"]
  },
  "status": "pending|in_progress|completed|cancelled",
  "priority": "low|medium|high|urgent",
  "attachments": ["string"],
  "createdBy": "User",
  "assignedTo": "User",
  "applicants": ["User"],
  "tags": ["string"],
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Agent
```json
{
  "id": "string",
  "userId": "string",
  "specializations": ["string"],
  "skills": [{
    "name": "string",
    "level": "beginner|intermediate|advanced|expert",
    "verified": "boolean"
  }],
  "experience": {
    "years": "number",
    "previousWork": ["string"],
    "education": ["string"]
  },
  "availability": {
    "status": "available|busy|offline",
    "hoursPerWeek": "number",
    "timezone": "string"
  },
  "pricing": {
    "hourlyRate": "number",
    "currency": "string",
    "minimumBudget": "number"
  },
  "portfolio": [{
    "title": "string",
    "description": "string",
    "url": "string",
    "tags": ["string"]
  }],
  "statistics": {
    "rating": "number",
    "completedTasks": "number",
    "totalEarnings": "number",
    "responseTime": "number",
    "successRate": "number"
  },
  "verification": {
    "identity": "boolean",
    "skills": "boolean",
    "background": "boolean"
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Contract
```json
{
  "id": "string",
  "taskId": "string",
  "contributorId": "string",
  "agentId": "string",
  "terms": {
    "paymentAmount": "number",
    "paymentType": "fixed|hourly|milestone",
    "currency": "string",
    "deliverables": ["string"],
    "timeline": {
      "startDate": "date",
      "endDate": "date"
    }
  },
  "milestones": [{
    "id": "string",
    "description": "string",
    "amount": "number",
    "dueDate": "date",
    "status": "pending|in_progress|completed|overdue",
    "deliverables": ["string"]
  }],
  "status": "draft|active|completed|cancelled|disputed",
  "signatures": {
    "contributor": "date",
    "agent": "date"
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Payment
```json
{
  "id": "string",
  "contractId": "string",
  "milestoneId": "string",
  "amount": "number",
  "currency": "string",
  "method": "credit_card|paypal|bank_transfer|cryptocurrency",
  "status": "pending|processing|completed|failed|refunded",
  "transactionId": "string",
  "fees": {
    "platform": "number",
    "processing": "number",
    "total": "number"
  },
  "processedAt": "date",
  "createdAt": "date"
}
```

### Notification
```json
{
  "id": "string",
  "userId": "string",
  "type": "task|contract|payment|system",
  "title": "string",
  "message": "string",
  "data": "object",
  "read": "boolean",
  "readAt": "date",
  "createdAt": "date"
}
```

## Security Features

1. **JWT Authentication** with refresh tokens
2. **Rate Limiting** per endpoint and user
3. **Input Validation** with comprehensive schemas
4. **SQL Injection Protection** via parameterized queries
5. **XSS Prevention** with content sanitization
6. **CORS Configuration** for web clients
7. **Helmet.js** for security headers
8. **File Upload Validation** with size and type limits
9. **API Key Management** for third-party integrations
10. **Audit Logging** for sensitive operations

## Validation Rules

### User Registration
- Name: 2-50 characters
- Email: Valid email format
- Password: 8+ characters, mixed case, numbers, symbols

### Task Creation
- Title: 10-200 characters
- Description: 50-5000 characters
- Budget: Positive number
- Timeline: Future dates only

### File Uploads
- Avatar: JPG/PNG, max 5MB
- Portfolio: PDF/DOC/JPG/PNG, max 25MB
- Attachments: Various formats, max 50MB

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Token expired |
| AUTH_003 | Insufficient permissions |
| VALID_001 | Required field missing |
| VALID_002 | Invalid format |
| VALID_003 | Value out of range |
| RATE_001 | Rate limit exceeded |
| FILE_001 | File too large |
| FILE_002 | Invalid file type |
| DB_001 | Database connection error |
| PAYMENT_001 | Payment processing failed |

## Testing

### Test Environment
```
Base URL: http://localhost:3000
Database: MongoDB Test Instance
Auth: Test JWT tokens provided
```

### Sample Test Data
- Test users with different roles
- Sample tasks across categories
- Mock payment transactions
- Test file uploads

### Postman Collection
Available at: `/docs/postman_collection.json`

## Changelog

### Version 1.0.0 (2023-09-25)
- Initial API specification
- Basic CRUD operations
- JWT authentication
- File upload support
- WebSocket integration
- Analytics endpoints
- Comprehensive documentation

---

*This specification is subject to updates. Check the changelog for the latest changes.*