#!/bin/bash

# initialize-spec-kit.sh
# Script to initialize Spec Kit project structure for Project Connect

echo "Initializing Spec Kit project for Project Connect Task Completion Agents..."

# Create project directory structure
mkdir -p specifications
mkdir -p constitution
mkdir -p plans
mkdir -p src
mkdir -p tests
mkdir -p docs
mkdir -p configs

echo "Created project directory structure"

# Create initial specification files
echo "# Task Completion Agents API Specification" > specifications/API_SPEC.md
echo "# Project Connect Constitution" > constitution/CONSTITUTION.md
echo "# Implementation Plan" > plans/IMPLEMENTATION_PLAN.md

echo "Created initial specification files"

# Initialize git repository
git init
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore
echo "*.log" >> .gitignore

echo "Initialized git repository"

# Create basic package.json
cat > package.json << EOF
{
  "name": "project-connect-task-agents",
  "version": "1.0.0",
  "description": "Task Completion Agents Platform for Project Connect",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "spec": "echo 'Run specifications'"
  },
  "keywords": ["project-connect", "task-agents", "api"],
  "author": "Project Connect Team",
  "license": "MIT"
}
EOF

echo "Created package.json"

# Create basic README
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

echo "Created README.md"

echo "Spec Kit project initialization complete!"
echo "Next steps:"
echo "1. Review and update specifications in the specifications/ directory"
echo "2. Implement the constitution in constitution/CONSTITUTION.md"
echo "3. Create detailed implementation plans in plans/"
echo "4. Begin development in src/"
echo "5. Write tests in tests/"
echo "6. Document in docs/"