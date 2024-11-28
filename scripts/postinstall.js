// scripts/postinstall.js
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Check if we are in Netlify build environment
if (process.env.NETLIFY) {
  // Create the directory if it doesn't exist
  const dir = join(__dirname, '../node_modules/sharp/vendor/');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}