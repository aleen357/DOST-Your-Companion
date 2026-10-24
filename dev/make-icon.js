// Renders DOST's app icon to assets/icon.png (256x256, transparent).
// Run with: npx electron dev/make-icon.js
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const SIZE = 256;
// Same body and face as src/renderer/slime.js (chill palette), cropped to a square around the body.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="6 14 100 100" width="${SIZE}" height="${SIZE}">
  <path d="M56 24C80 24 97 42 99 66C101 88 84 99 56 99S11 88 13 66C15 42 32 24 56 24Z" fill="#70d4a5" stroke="#23594f" stroke-width="2.5"/>
  <ellipse cx="36" cy="40" rx="10" ry="6" transform="rotate(-35 36 40)" fill="#eafff4" opacity=".8"/>
  <circle cx="50" cy="32" r="2.6" fill="#eafff4" opacity=".8"/>
  <circle cx="30" cy="73" r="5.5" fill="#f4979d" opacity=".6"/><circle cx="82" cy="73" r="5.5" fill="#f4979d" opacity=".6"/>
  <ellipse cx="42" cy="64" rx="4.6" ry="6" fill="#23594f"/><ellipse cx="70" cy="64" rx="4.6" ry="6" fill="#23594f"/>
  <path d="M48 74q8 8 16 0" fill="none" stroke="#23594f" stroke-width="3.6" stroke-linecap="round"/>
</svg>`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: SIZE, height: SIZE, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: true }
  });
  const html = `<html><body style="margin:0;background:transparent">${svg}</body></html>`;
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await new Promise((resolve) => setTimeout(resolve, 300));
  const image = await win.webContents.capturePage({ x: 0, y: 0, width: SIZE, height: SIZE });
  const out = path.join(__dirname, '../assets/icon.png');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, image.resize({ width: SIZE, height: SIZE }).toPNG());
  console.log('wrote', out);
  app.quit();
});
