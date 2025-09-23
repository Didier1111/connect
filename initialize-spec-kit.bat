@echo off
REM initialize-spec-kit.bat
REM Initialize GitHub Spec Kit for Project Connect Task Completion Agents

echo Initializing GitHub Spec Kit for Project Connect...

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo npm could not be found. Please install Node.js first.
    exit /b 1
)

REM Create project structure
echo Creating project structure...

REM Create directories
mkdir specifications 2>nul
mkdir constitution 2>nul
mkdir plans 2>nul
mkdir src 2>nul
mkdir tests 2>nul
mkdir docs 2>nul
mkdir configs 2>nul

echo Project directories created.

REM Create initial files
echo # Task Completion Agents API Specification > specifications\API_SPEC.md
echo # Project Connect Constitution > constitution\CONSTITUTION.md
echo # Implementation Plan > plans\IMPLEMENTATION_PLAN.md

REM Create package.json
(
echo {
echo   "name": "project-connect-task-agents",
echo   "version": "1.0.0",
echo   "description": "Task Completion Agents Platform for Project Connect",
echo   "main": "src/server.js",
echo   "scripts": {
echo     "start": "node src/server.js",
echo     "dev": "nodemon src/server.js",
echo     "test": "jest",
echo     "spec": "echo 'Run specifications'"
echo   },
echo   "keywords": ["project-connect", "task-agents", "api"],
echo   "author": "Project Connect Team",
echo   "license": "MIT",
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "mongoose": "^7.5.0",
echo     "jsonwebtoken": "^9.0.1",
echo     "bcrypt": "^5.1.0"
echo   },
echo   "devDependencies": {
echo     "nodemon": "^3.0.1",
echo     "jest": "^29.6.2"
echo   }
echo }
) > package.json

REM Create basic server.js
(
echo const express = require('express');
echo const app = express();
echo const PORT = process.env.PORT ^|^| 3000;
echo.
echo app.use(express.json());
echo.
echo app.get('/', (req, res) =^> {
echo   res.json({ 
echo     message: 'Project Connect Task Completion Agents API',
echo     version: '1.0.0'
echo   });
echo });
echo.
echo app.get('/health', (req, res) =^> {
echo   res.json({ status: 'OK', timestamp: new Date().toISOString() });
echo });
echo.
echo app.listen(PORT, () =^> {
echo   console.log(`Server running on port ${PORT}`);
echo });
echo.
echo module.exports = app;
) > src\server.js

REM Create README
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

echo Initial files created.

REM Initialize git repository if not already initialized
if not exist ".git" (
    git init
    echo .env >> .gitignore
    echo node_modules/ >> .gitignore
    echo *.log >> .gitignore
)

echo Initialization complete!
echo.
echo Next steps:
echo 1. Review and update specifications in the specifications/ directory
echo 2. Implement the constitution in constitution/CONSTITUTION.md
echo 3. Create detailed implementation plans in plans/
echo 4. Begin development in src/
echo 5. Write tests in tests/
echo 6. Document in docs/
echo.
echo To start the server:
echo npm install
echo npm start