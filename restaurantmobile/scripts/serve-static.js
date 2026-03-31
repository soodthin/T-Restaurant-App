const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 19006);
const host = process.argv[4] || '0.0.0.0';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
};

const safePath = (requestPath) => {
  const normalized = requestPath.split('?')[0];
  const relativePath = normalized === '/' ? '/index.html' : normalized;
  const resolvedPath = path.normalize(path.join(rootDir, relativePath));
  if (!resolvedPath.startsWith(rootDir)) {
    return path.join(rootDir, 'index.html');
  }
  return resolvedPath;
};

http.createServer((req, res) => {
  const resolvedPath = safePath(req.url || '/');
  const fallbackPath = path.join(rootDir, 'index.html');
  const targetPath = fs.existsSync(resolvedPath) ? resolvedPath : fallbackPath;
  const ext = path.extname(targetPath).toLowerCase();
  const contentType = contentTypes[ext] || 'application/octet-stream';

  fs.readFile(targetPath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}).listen(port, host, () => {
  console.log(`Static server running at http://${host}:${port}`);
});
