@echo off
REM initialize-spec-kit.bat
REM Batch script to initialize Spec Kit project structure for Project Connect

echo Initializing Spec Kit project for Project Connect Task Completion Agents...

REM Create project directory structure
mkdir specifications 2>nul
mkdir constitution 2>nul
mkdir plans 2>nul
mkdir src 2>nul
mkdir tests 2>nul
mkdir docs 2>nul
mkdir configs 2>nul

echo Created project directory structure

REM Create initial specification files
echo # Task Completion Agents API Specification > specifications\API_SPEC.md
echo # Project Connect Constitution > constitution\CONSTITUTION.md
echo # Implementation Plan > plans\IMPLEMENTATION_PLAN.md

echo Created initial specification files

REM Initialize git repository
git init
echo .env >> .gitignore
echo node_modules/ >> .gitignore
echo *.log >> .gitignore

echo Initialized git repository

REM Create basic package.json
(
echo {
echo   "name": "project-connect-task-agents",
echo   "version": "1.0.0",
echo   "description": "Task Completion Agents Platform for Project Connect",
echo   "main": "src/index.js",
echo   "scripts": {
echo     "start": "node src/index.js",
echo     "dev": "nodemon src/index.js",
echo     "test": "jest",
echo     "spec": "echo 'Run specifications'"
echo   },
echo   "keywords": ["project-connect", "task-agents", "api"],
echo   "author": "Project Connect Team",
echo   "license": "MIT"
echo }
) > package.json

echo Created package.json

REM Create basic README
(
echo # Project Connect Task Completion Agents
echo.
echo This repository contains the Task Completion Agents platform for Project Connect, implementing the specifications defined in the Spec Kit approach.
echo.
echo ## Specifications
echo.
echo - [API Specification](specifications/API_SPEC.md)
echo - [Constitution](constitution/CONSTITUTION.md)
echo - [Implementation Plan](plans/IMPLEMENTATION_PLAN.md)
echo.
echo ## Getting Started
echo.
echo 1. Clone the repository
echo 2. Run `npm install`
echo 3. Run `npm start` to start the server
echo.
echo ## Project Structure
echo.
echo - `specifications/` - API and feature specifications
echo - `constitution/` - Project principles and values
echo - `plans/` - Implementation plans and roadmaps
echo - `src/` - Source code
echo - `tests/` - Test files
echo - `docs/` - Documentation
echo - `configs/` - Configuration files
echo.
echo ## Contributing
echo.
echo Please read our [Constitution](constitution/CONSTITUTION.md) before contributing.
) > README.md

echo Created README.md

echo Spec Kit project initialization complete!
echo Next steps:
echo 1. Review and update specifications in the specifications/ directory
echo 2. Implement the constitution in constitution/CONSTITUTION.md
echo 3. Create detailed implementation plans in plans/
echo 4. Begin development in src/
echo 5. Write tests in tests/
echo 6. Document in docs/