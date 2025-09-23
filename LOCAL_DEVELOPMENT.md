# Local Development Setup Guide

This guide helps you set up and run Project Connect locally for development.

## Prerequisites

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Didier1111/connect.git
cd connect
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Express.js (web framework)
- Nodemon (development server)
- Concurrently (run multiple commands)

### 3. Run the Development Server

```bash
npm run dev
```

This will start the server on http://localhost:3000

### 4. View the Website

Open your browser and navigate to:
- Homepage: http://localhost:3000
- Documentation: http://localhost:3000/docs.html
- Contribute: http://localhost:3000/contribute.html
- Blog: http://localhost:3000/blog.html

## Development Workflow

### File Structure
```
connect/
├── index.html          # Main homepage
├── docs.html           # Documentation page
├── contribute.html     # Contribution page
├── blog.html           # Blog index
├── blog-post-1.html    # Sample blog post
├── 404.html            # Error page
├── main.css            # Main stylesheet
├── server.js           # Development server
└── package.json        # Project configuration
```

### Making Changes
1. Edit HTML/CSS files directly
2. Changes will automatically refresh in your browser
3. Server restarts automatically when you change server.js

### Testing Production Build
To test how the site will work on GitHub Pages:
```bash
npx serve .
```

This serves files exactly as GitHub Pages would.

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Solution: Change PORT in server.js or kill existing process

2. **Missing dependencies**
   - Solution: Run `npm install` again

3. **Permission errors**
   - Solution: Run command prompt as administrator (Windows) or use sudo (Mac/Linux)

4. **Files not updating**
   - Solution: Clear browser cache or hard refresh (Ctrl+F5)

### Useful Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Install new dependencies
npm install [package-name]

# Update dependencies
npm update

# Check for outdated dependencies
npm outdated
```

## Next Steps

1. **Explore the Codebase**
   - Review HTML structure
   - Examine CSS styling
   - Understand JavaScript functionality

2. **Make Improvements**
   - Add new pages
   - Enhance styling
   - Improve user experience

3. **Contribute Changes**
   - Fork the repository
   - Create feature branches
   - Submit pull requests

This local development setup allows you to work on Project Connect website improvements efficiently while seeing changes in real-time.