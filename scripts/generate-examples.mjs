#!/usr/bin/env node
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXAMPLES = ['aws-architecture', 'microservices', 'data-pipeline', 'simple-flow', 'flowchart-basic', 'event-driven'];

const MIME = { '.mjs': 'application/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.mmd': 'text/plain', '.html': 'text/html' };

const server = createServer((req, res) => {
  const urlPath = (req.url === '/' ? '/render.html' : req.url).split('?')[0];
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
const baseUrl = `http://127.0.0.1:${port}`;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();

for (const name of EXAMPLES) {
  const outDir = join(ROOT, 'examples', name);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  for (const mode of ['2d', '3d']) {
    await page.goto(`${baseUrl}/render.html?example=${name}&mode=${mode}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#out svg, #out pre', { timeout: 20000 });
    const hasError = await page.$('#out pre');
    if (hasError) {
      const err = await page.$eval('#out pre', (e) => e.textContent);
      console.error(`${name} ${mode}: ${err}`);
      continue;
    }
    await page.evaluate(() => {
      const svg = document.querySelector('#out svg');
      if (!svg?.querySelector('.flowchart-link')) return;
      const style = svg.querySelector('style');
      if (!style) return;
      const id = svg.id || 'svg';
      style.textContent += `#${id} .flowchart-link{stroke:#333!important}#${id} .arrowMarkerPath{stroke:#333!important;fill:#333!important}`;
    });
    const svgContent = await page.$eval('#out svg', (el) => el.outerHTML);
    writeFileSync(join(outDir, `${mode}.svg`), svgContent, 'utf8');
    console.log(`Wrote examples/${name}/${mode}.svg`);
  }
}

await browser.close();
server.close();
