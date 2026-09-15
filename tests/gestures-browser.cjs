// Requires Playwright and Edge: node tests/gestures-browser.cjs
// PLAYWRIGHT_MODULE can point to an existing Playwright installation.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');

(async function () {
  const server = http.createServer((req, res) => {
    const target = path.resolve(root, '.' + (req.url === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(target, (error, data) => {
      if (error) { res.writeHead(404).end(); return; }
      const extension = path.extname(target);
      res.setHeader('Content-Type', { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.jpg': 'image/jpeg' }[extension] || 'application/octet-stream');
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    for (const delay of [0, 750]) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(delay => {
        // Feed a real image through getUserMedia -> video -> bitmap -> actual models.
        navigator.mediaDevices.getUserMedia = async () => {
          const image = new Image(); image.src = '/tests/fixtures/hand_thumb_up.jpg';
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width; canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          const timer = setInterval(() => ctx.drawImage(image, 0, 0), 100);
          const stream = canvas.captureStream(10);
          const track = stream.getVideoTracks()[0], stop = track.stop.bind(track);
          track.stop = () => { clearInterval(timer); stop(); };
          return stream;
        };
        if (delay) {
          const NativeWorker = Worker;
          window.Worker = class extends NativeWorker {
            set onmessage(callback) {
              super.onmessage = event => setTimeout(() => callback(event), event.data.type === 'result' ? delay : 0);
            }
          };
        }
      }, delay);
      await page.goto('http://127.0.0.1:' + server.address().port);
      await page.locator('#camera-toggle').click();
      try {
        await page.waitForFunction(() => document.querySelector('#stage').dataset.mood === 'happy', {}, { timeout: 20000 });
        assert((await page.locator('#gesture-status').textContent()).includes('لایک'));
        assert.deepEqual(errors, []);
        console.log('PASS: real thumbs-up image -> actual models -> happy; added latency:', delay, 'ms');
      } catch (error) {
        console.error('STATUS:', await page.locator('#gesture-status').textContent());
        throw error;
      } finally { await page.close(); }
    }
  } finally { await browser?.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
