#!/usr/bin/env node
import { writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUTPUT_PATH = join(ROOT, `output-${ts}.svg`);
const mode3d = process.argv.includes('--mode') && process.argv[process.argv.indexOf('--mode') + 1] === '3d';

const MIME = { '.mjs': 'application/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.html': 'text/html' };

const server = createServer((req, res) => {
  const urlPath = req.url === '/' ? '/render.html' : req.url.split('?')[0];
  const file = join(ROOT, urlPath.replace(/^\//, ''));
  const ext = urlPath.slice(urlPath.lastIndexOf('.'));
  try {
    const data = readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'text/plain' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
server.listen(0);
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}/render.html`;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.goto(`${baseUrl}?mode=${mode3d ? '3d' : '2d'}`, { waitUntil: 'networkidle0' });
await page.waitForSelector('#out svg, #out pre', { timeout: 20000 });
const hasError = await page.$('#out pre');
if (hasError) {
  const err = await page.$eval('#out pre', (e) => e.textContent);
  await browser.close();
  throw new Error('Mermaid render failed: ' + err);
}
await page.evaluate(() => {
  const svg = document.querySelector('#out svg');
  if (!svg?.querySelector('.flowchart-link')) return;
  const style = svg.querySelector('style');
  if (!style) return;
  const id = svg.id || 'svg';
  style.textContent += `#${id} .flowchart-link{stroke:#333!important}#${id} .arrowMarkerPath{stroke:#333!important;fill:#333!important}`;
});
const svg = await page.$eval('#out svg', (el) => el.outerHTML);
await browser.close();
server.close();

writeFileSync(OUTPUT_PATH, svg, 'utf8');
console.log(`Wrote ${OUTPUT_PATH}`);
