# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Connect is developing a revolutionary framework for viral, monetized open-source teams with equitable remuneration. The repository contains both the conceptual framework documentation and a Node.js/Express Task Completion Agents API platform.

## Core Architecture

### Task Completion Agents Platform
- **Backend**: Node.js/Express API server (`src/server.js`)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Main Models**: User, Task, Agent (with future Contract and Payment models planned)
- **API Structure**: RESTful endpoints for task management, agent matching, and user authentication

### Key Data Models
- **Task**: Categorized tasks with skill requirements, budgets, timelines, and status tracking
- **Agent**: Human/AI/hybrid agents with skills, ratings, availability, and performance metrics
- **User**: Contributors with role-based access (contributor, agent, admin)
- **Contract**: Task-agent agreements with payment terms, milestones, and status tracking
- **Payment**: Payment processing for contract milestones with multiple payment methods

### Project Structure
- `src/`: Node.js server implementation
- `specifications/`: API specifications and technical requirements
- `constitution/`: Project governance and principles
- `plans/`: Implementation roadmaps and development plans
- `tests/`: Jest test suite
- `docs/`: Documentation hub and website files
- Root-level: Extensive markdown documentation covering framework, strategies, and guides

## Common Development Commands

### Core Application
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run Jest test suite
npm run spec       # Run specifications (placeholder)
```

### Development Environment Setup
```bash
npm install        # Install dependencies
cp .env.example .env  # Configure environment variables
# Note: MongoDB is required for full functionality
# Install MongoDB locally or use MongoDB Atlas cloud service
```

### Website Deployment
```bash
./deploy-website.sh    # Deploy to GitHub Pages (Unix)
deploy-website.bat     # Deploy to GitHub Pages (Windows)
```

### Project Initialization
```bash
./initialize-spec-kit.sh    # Initialize GitHub Spec Kit structure (Unix)
initialize-spec-kit.bat     # Initialize GitHub Spec Kit structure (Windows)
```

## Development Environment

### Required Dependencies
- Node.js runtime (v18+ recommended)
- MongoDB database (local installation or MongoDB Atlas)
- Environment variables for JWT_SECRET and MONGODB_URI (see `.env.example`)

### API Endpoints Overview
- **Authentication**: `/auth/login`, `/auth/register`
- **Tasks**: CRUD operations at `/tasks/*`
- **Agents**: CRUD operations at `/agents/*`
- **Contracts**: CRUD operations at `/contracts/*` (NEW)
- **Payments**: CRUD operations at `/payments/*` (NEW)
- **Health Check**: `/health` for monitoring

### Test Framework
- Jest for unit testing with supertest for API testing
- Tests located in `tests/server.test.js`

## Documentation Strategy

This project follows a comprehensive documentation-first approach with:
- **Framework Documentation**: Viral Teams Framework, Implementation Plans, Roadmaps
- **Community Management**: Contributor guides, community health metrics, governance models
- **Technical Specifications**: Updated API specs with contract/payment endpoints
- **Business Strategy**: Monetization models, business plans, trading strategies
- **Automation Tools**: Recruitment automation, GitHub/Twitter scanners, outreach systems
- **API Documentation**: Complete endpoint documentation in `/specifications/TASK_COMPLETION_AGENTS_API.md`

## Key Integration Points

### GitHub Spec Kit Integration
The project uses GitHub Spec Kit for specification-driven development with structured directories for specifications, constitution, and implementation plans.

### Website and Documentation Hub
Static HTML website deployed via GitHub Pages with comprehensive documentation, blog, and contribution pages.

### Revenue Sharing Architecture
Designed for equitable compensation with implemented Contract and Payment models supporting:
- Milestone-based payments
- Multiple payment methods (credit_card, paypal, bank_transfer, cryptocurrency)
- Automatic transaction ID generation
- Payment status tracking

## Recent Updates (Current Session)

### Completed Features
- ✅ Added Contract model with milestone support
- ✅ Added Payment model with transaction tracking
- ✅ Implemented full CRUD API endpoints for contracts and payments
- ✅ Enhanced test configuration with Jest setup
- ✅ Updated API documentation with new endpoints
- ✅ Improved MongoDB connection handling with graceful errors
- ✅ Created development environment configuration

### Development Notes
- Server runs on port 3000 by default
- MongoDB connection is optional for basic functionality
- API follows RESTful conventions with proper authentication
- All endpoints require JWT authentication except `/health` and auth routes