import db from './connection.js';
import { SCHEMA } from './schema.js';

/**
 * Initialize the database by creating tables if they don't exist
 */
export const initializeDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Execute schema statements
    db.exec(SCHEMA, (err) => {
      if (err) {
        console.error('Error initializing database:', err.message);
        reject(err);
      } else {
        console.log('Database initialized successfully');
        resolve();
      }
    });
  });
};

/**
 * Helper function to get current timestamp in ISO format
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// This code is used when running this file directly for database setup
// We check if this file is being run as a script and not imported

// In ES modules, we need a different approach to check if this is the main module
const isRunDirectly = () => {
  // Get the current file's URL
  const currentURL = import.meta.url;
  
  // If we're running from the 'setup-db' script, we want this to run
  const isSetupScript = process.argv.some(arg => arg.includes('setup.js') || arg.includes('setup-db'));
  
  console.log('Current process args:', process.argv);
  console.log('Current URL:', currentURL);
  console.log('Is setup script:', isSetupScript);
  
  // Only return true if explicitly called as a script with setup-db
  return isSetupScript;
};

// Only run the standalone initialization if this file is executed directly
if (isRunDirectly()) {
  console.log('Running database setup as standalone script');
  initializeDatabase()
    .then(() => {
      console.log('Database setup complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database setup failed:', err);
      process.exit(1);
    });
} else {
  console.log('Database module loaded as import, not exiting');
}

export default { initializeDatabase, getCurrentTimestamp };