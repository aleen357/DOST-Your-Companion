// Tiny static server for dev pages: node dev/serve.js, then open http://localhost:5178/dev/slime-gallery.html
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

http.createServer((request, response) => {
  const file = path.join(root, decodeURIComponent(request.url.split('?')[0]));
  if (!file.startsWith(root)) return response.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return response.writeHead(404).end();
    response.writeHead(200, { 'content-type': types[path.extname(file)] || 'text/plain' });
    response.end(data);
  });
}).listen(5178, '127.0.0.1');
