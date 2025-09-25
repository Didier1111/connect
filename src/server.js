// src/server.js
// Server startup file for Task Completion Agents API

const app = require('./app');

const PORT = process.env.PORT || 3000;

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Task Completion Agents API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;