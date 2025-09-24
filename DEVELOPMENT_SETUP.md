# Development Setup Guide

This guide will help you set up the Project Connect development environment.

## Prerequisites

- Node.js v18+ (https://nodejs.org/)
- Git (https://git-scm.com/)
- MongoDB (optional but recommended for full functionality)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Didier1111/connect.git
   cd connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   ```
   JWT_SECRET=your-secret-key-here
   MONGODB_URI=mongodb://localhost:27017/task-agents-dev
   PORT=3000
   NODE_ENV=development
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## MongoDB Setup

### Option 1: Local MongoDB Installation

1. Install MongoDB Community Edition: https://docs.mongodb.com/manual/installation/
2. Start MongoDB service
3. The application will connect automatically to `mongodb://localhost:27017/task-agents-dev`

### Option 2: MongoDB Atlas (Cloud)

1. Create free account at https://www.mongodb.com/atlas
2. Create a cluster and database
3. Update `MONGODB_URI` in your `.env` file with the connection string

### Option 3: Development Mode (No Database)

The application can run without MongoDB for basic testing:
- Health check endpoint will work
- Database operations will fail gracefully
- Use this for frontend development or API exploration

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-restart
- `npm test` - Run test suite
- `npm run spec` - Run specifications (placeholder)

## API Testing

Once the server is running, you can test the API endpoints:

### Health Check
```bash
curl http://localhost:3000/health
```

### Register User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"contributor"}'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Development Workflow

1. **Make changes** to the code
2. **Test locally** using `npm run dev`
3. **Run tests** with `npm test`
4. **Deploy website** with `./deploy-website.sh` (if working on website)
5. **Commit changes** and create pull request

## Directory Structure

```
connect/
├── src/                    # Node.js API server
│   └── server.js          # Main server file
├── tests/                 # Test files
│   ├── setup.js          # Test configuration
│   └── server.test.js    # API tests
├── specifications/        # API specifications
├── docs/                 # Documentation
├── website files...      # Static HTML files for GitHub Pages
└── *.md files            # Framework documentation
```

## Common Issues

### MongoDB Connection Failed
- Ensure MongoDB is running locally
- Check connection string in `.env` file
- Consider using MongoDB Atlas for cloud database

### Port Already in Use
- Change `PORT` in `.env` file
- Kill process using port 3000: `netstat -ano | findstr :3000`

### npm install fails
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then `npm install`

## Next Steps

1. Review the [API Documentation](specifications/TASK_COMPLETION_AGENTS_API.md)
2. Read the [Contributing Guide](CONTRIBUTING.md)
3. Join our [GitHub Discussions](https://github.com/Didier1111/connect/discussions)
4. Check out [Good First Issues](https://github.com/Didier1111/connect/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

## Support

- GitHub Issues: https://github.com/Didier1111/connect/issues
- Documentation: https://didier1111.github.io/connect/docs.html
- Website: https://didier1111.github.io/connect/

Happy coding! 🚀