import fs from 'fs';
import path from 'path';
import { initializeDatabase } from '../dist/database/setup.js';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'database.db');

async function resetDatabase() {
  console.log('Resetting database...');
  
  // Delete the database file if it exists
  if (fs.existsSync(dbPath)) {
    console.log(`Deleting existing database file: ${dbPath}`);
    fs.unlinkSync(dbPath);
  }
  
  // Reinitialize the database
  console.log('Reinitializing database...');
  await initializeDatabase();
  
  console.log('Database reset complete.');
}

resetDatabase().catch(console.error);