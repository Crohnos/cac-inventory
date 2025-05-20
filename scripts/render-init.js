import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use directories within the project directory for Render's free tier
const dataDir = path.join(process.cwd(), 'data');
const uploadsDir = path.join(process.cwd(), 'uploads');
const tempUploadsDir = path.join(uploadsDir, 'temp');

async function initializeRender() {
  try {
    console.log('==== RENDER INITIALIZATION SCRIPT ====');
    console.log(`Running in: ${process.cwd()}`);
    console.log(`Data directory: ${dataDir}`);
    console.log(`Uploads directory: ${uploadsDir}`);
    
    // Initialize directories if they don't exist
    console.log('Checking directories...');
    
    try {
      if (!fs.existsSync(dataDir)) {
        console.log(`Creating data directory: ${dataDir}`);
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      if (!fs.existsSync(uploadsDir)) {
        console.log(`Creating uploads directory: ${uploadsDir}`);
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      if (!fs.existsSync(tempUploadsDir)) {
        console.log(`Creating temp uploads directory: ${tempUploadsDir}`);
        fs.mkdirSync(tempUploadsDir, { recursive: true });
      }
      
      console.log('All directories created or verified successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`Warning: Could not create one or more directories: ${errorMessage}`);
      console.warn('Will attempt to continue with existing directories...');
    }
    
    // Check if a database already exists
    const dbPath = path.join(dataDir, 'database.db');
    const dbExists = fs.existsSync(dbPath);
    console.log(`Database ${dbPath} exists: ${dbExists}`);
    
    // Run the database setup directly from the compiled file
    console.log('Running database setup...');
    try {
      // Import and run the setup function directly to avoid environment variable issues
      const { initializeDatabase } = await import('../dist/database/setup.js');
      await initializeDatabase();
      console.log('Database setup complete');
    } catch (err) {
      console.error('Error during database setup:', err);
      throw err;
    }
    
    // For Render deployment, always refresh data to have proper stock levels
    // since the free tier doesn't have persistent storage
    console.log('Setting up data for Render deployment with varied stock levels...');
    await execAsync('node scripts/render-setup-data.js');
    console.log('Render data setup complete');
    
    console.log('==== RENDER INITIALIZATION COMPLETE ====');
  } catch (error) {
    console.error('Error during Render initialization:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeRender().catch(err => {
  console.error('Failed to initialize Render environment:', err);
  process.exit(1);
});