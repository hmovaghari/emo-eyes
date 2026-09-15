// Local-only server for the browser's camera/model security requirements.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400).end('Invalid URL'); return; }
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || (!['/index.html', '/styles.css', '/i18n.js', '/app.js'].includes(pathname) && !pathname.startsWith('/vendor/mediapipe/'))) {
    response.writeHead(404).end('Not found'); return;
  }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404).end('Not found'); return; }
    const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm' };
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(request.method === 'HEAD' ? undefined : data);
  });
});
// An available port avoids conflicts with other local development servers.
server.listen(0, '127.0.0.1', () => {
  const url = 'http://127.0.0.1:' + server.address().port;
  console.log('EMO Eyes: ' + url);
  console.log('Keep this window open. Press Ctrl+C to stop.');
  if (process.argv.includes('--open') && process.platform === 'win32') {
    const browser = spawn('explorer.exe', [url], { detached: true, stdio: 'ignore', windowsHide: true });
    browser.on('error', () => console.log('Open the URL above in your browser.'));
    browser.unref();
  }
});
server.on('error', error => { console.error('Unable to start EMO Eyes:', error.message); process.exitCode = 1; });
