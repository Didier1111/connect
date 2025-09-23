#!/bin/bash

# initialize-spec-kit.sh
# Initialize GitHub Spec Kit for Project Connect Task Completion Agents

echo "Initializing GitHub Spec Kit for Project Connect..."

# Check if uv is installed
if ! command -v uv &> /dev/null
then
    echo "uv could not be found. Installing uv..."
    pip install uv
fi

# Install Specify CLI
echo "Installing Specify CLI from GitHub Spec Kit..."
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# Create project structure
echo "Creating project structure..."

# Create directories
mkdir -p specifications
mkdir -p constitution
mkdir -p plans
mkdir -p src
mkdir -p tests
mkdir -p docs
mkdir -p configs

echo "Project directories created."

# Create initial files
echo "# Task Completion Agents API Specification" > specifications/API_SPEC.md
echo "# Project Connect Constitution" > constitution/CONSTITUTION.md
echo "# Implementation Plan" > plans/IMPLEMENTATION_PLAN.md

# Create package.json
cat > package.json << EOF
{
  "name": "project-connect-task-agents",
  "version": "1.0.0",
  "description": "Task Completion Agents Platform for Project Connect",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "spec": "echo 'Run specifications'"
  },
  "keywords": ["project-connect", "task-agents", "api"],
  "author": "Project Connect Team",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "jsonwebtoken": "^9.0.1",
    "bcrypt": "^5.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2"
  }
}
EOF

# Create basic server.js
cat > src/server.js << EOF
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Project Connect Task Completion Agents API',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;
EOF

# Create README
cat > README.md << EOF
# Project Connect Task Completion Agents

This repository contains the Task Completion Agents platform for Project Connect, implementing the specifications defined in the Spec Kit approach.

## Specifications

- [API Specification](specifications/API_SPEC.md)
- [Constitution](constitution/CONSTITUTION.md)
- [Implementation Plan](plans/IMPLEMENTATION_PLAN.md)

## Getting Started

1. Clone the repository
2. Run \`npm install\`
3. Run \`npm start\` to start the server

## Project Structure

- \`specifications/\` - API and feature specifications
- \`constitution/\` - Project principles and values
- \`plans/\` - Implementation plans and roadmaps
- \`src/\` - Source code
- \`tests/\` - Test files
- \`docs/\` - Documentation
- \`configs/\` - Configuration files

## Contributing

Please read our [Constitution](constitution/CONSTITUTION.md) before contributing.
EOF

echo "Initial files created."

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    git init
    echo ".env" >> .gitignore
    echo "node_modules/" >> .gitignore
    echo "*.log" >> .gitignore
fi

echo "Initialization complete!"
echo ""
echo "Next steps:"
echo "1. Review and update specifications in the specifications/ directory"
echo "2. Implement the constitution in constitution/CONSTITUTION.md"
echo "3. Create detailed implementation plans in plans/"
echo "4. Begin development in src/"
echo "5. Write tests in tests/"
echo "6. Document in docs/"
echo ""
echo "To start the server:"
echo "npm install"
echo "npm start"