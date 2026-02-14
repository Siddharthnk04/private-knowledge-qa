const express = require('express');
const app = express();

app.use(express.json());

app.get('/ping', (req, res) => {
    console.log('[test]: Received ping request');
    res.json({ message: 'pong' });
});

const port = 5000;
const server = app.listen(port, () => {
    console.log(`[test]: Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error('[test]: Server error:', err.message);
});

process.on('uncaughtException', (err) => {
    console.error('[test]: Uncaught exception:', err.message);
});

// Keep alive
setInterval(() => {
    console.log('[test]: Keep-alive - PID:', process.pid);
}, 5000);
