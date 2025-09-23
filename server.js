// server.js
// Simple Express server for local development of Project Connect

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static('.'));

// Routes for each page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs.html'));
});

app.get('/docs.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs.html'));
});

app.get('/contribute', (req, res) => {
    res.sendFile(path.join(__dirname, 'contribute.html'));
});

app.get('/contribute.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'contribute.html'));
});

app.get('/404', (req, res) => {
    res.sendFile(path.join(__dirname, '404.html'));
});

app.get('/404.html', (req, res) => {
    res.sendFile(path.join(__dirname, '404.html'));
});

// Catch-all route for 404
app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Project Connect server running at http://localhost:${PORT}`);
    console.log(`Website files served from: ${__dirname}`);
});

module.exports = app;