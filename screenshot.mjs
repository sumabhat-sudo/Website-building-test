import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const CHROME =
  process.env.CHROME_PATH ||
  ['C:/Program Files/Google/Chrome/Application/chrome.exe',
   'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
    .find((p) => existsSync(p));

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const outDir = './temporary screenshots';

await mkdir(outDir, { recursive: true });
const existing = (await readdir(outDir)).filter((f) => /^screenshot-\d+/.test(f));
const next = existing.reduce((m, f) => Math.max(m, +f.match(/^screenshot-(\d+)/)[1]), 0) + 1;
const out = `${outDir}/screenshot-${next}${label}.png`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
// Trigger scroll-reveal content and finalize counters so full-page capture shows everything
await page.evaluate(async () => {
  const h = document.body.scrollHeight;
  for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
  window.scrollTo(0, 0);
  document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'));
  document.querySelectorAll('[data-count]').forEach((el) => {
    const t = +el.dataset.count, plain = el.dataset.plain === '1';
    el.textContent = (plain ? String(t) : t.toLocaleString()) + (el.dataset.suffix || '');
  });
});
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`Saved ${out}`);
