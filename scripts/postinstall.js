/* eslint-disable @typescript-eslint/no-require-imports */
// scripts/postinstall.js
const fs = require('fs');
const path = require('path');

// Check if we are in Netlify build environment
if (process.env.NETLIFY) {
  // Create the directory if it doesn't exist
  const dir = path.join(__dirname, '../node_modules/sharp/vendor/');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}