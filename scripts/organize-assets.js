#!/usr/bin/env node
/**
 * Organizes mobile assets into subfolders: icons, illustrations, splash
 * Run: node scripts/organize-assets.js
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'mobile', 'assets');

const folders = {
  icons: ['icon.png', 'adaptive-icon.png'],
  illustrations: ['marketillustration1.jpg', 'marketillustration2.jpg'],
  splash: ['splash.png'],
};

Object.entries(folders).forEach(([folder, files]) => {
  const folderPath = path.join(assetsDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  files.forEach((file) => {
    const src = path.join(assetsDir, file);
    if (fs.existsSync(src)) {
      const dest = path.join(folderPath, file);
      fs.copyFileSync(src, dest);
      console.log(`Moved ${file} to ${folder}/`);
    }
  });
});

console.log('Asset organization complete.');
