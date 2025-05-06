/**
 * Database setup script for Rainbow Room Inventory application
 * 
 * This script initializes the SQLite database and creates sample data for testing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Setting up the Rainbow Room Inventory database...');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure temporary uploads directory exists
const tempUploadsDir = path.join(__dirname, '..', 'uploads', 'temp');
if (!fs.existsSync(tempUploadsDir)) {
  console.log('Creating temp uploads directory...');
  fs.mkdirSync(tempUploadsDir, { recursive: true });
}

// Run the database initialization using ts-node with ESM flag
console.log('Initializing database schema...');
const result = spawnSync('npx', ['ts-node', '--esm', '../src/database/setup.ts'], {
  cwd: __dirname,
  stdio: 'inherit'
});

if (result.error) {
  console.error('Error initializing database:', result.error);
  process.exit(1);
}

console.log('Rainbow Room Inventory database setup complete!');
console.log('You can now start the application with:');
console.log('  - Development: npm run dev');
console.log('  - Production: npm start');