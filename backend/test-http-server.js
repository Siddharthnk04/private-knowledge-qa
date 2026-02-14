const http = require('http');
const os = require('os');

const server = http.createServer((req, res) => {
    console.log(`[http]: ${req.method} ${req.url}`);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: 'ok'}));
});

const port = 5000;
server.listen(port, () => {
    const addr = server.address();
    console.log('[http]: Server listening on', addr);
    console.log('[http]: Hostname:', os.hostname());
});

server.on('error', (err) => {
    console.error('[http]: Server error:', err);
});

setInterval(() => {
    console.log('[http]: Keep alive', new Date().toISOString());
}, 10000);
