import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Determine database directory path - use project directory for simplicity
const dataDir = path.join(process.cwd(), 'data');

// Log the data directory path
console.log(`Using database directory: ${dataDir}`);

// Create the directory if it doesn't exist
try {
  if (!fs.existsSync(dataDir)) {
    console.log('Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (err: any) {
  console.warn(`Warning: Could not create data directory: ${err.message}`);
  console.warn('Will attempt to continue with existing directory...');
}

// Database file path
const dbPath = path.join(dataDir, 'database.db');
console.log(`Using database at path: ${dbPath}`);

// Database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database');
  }
});

// Helper function for promise-based database operations
export const dbAsync = {
  run: (sql: string, params: any = []): Promise<sqlite3.RunResult> => {
    console.log(`DB RUN: ${sql}`);
    if (params.length > 0) {
      console.log('Parameters:', JSON.stringify(params));
    }
    
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          console.error(`DB ERROR in run: ${err.message}`);
          if (err.stack) console.error(err.stack);
          reject(err);
        } else {
          console.log(`DB RUN success. lastID: ${this.lastID}, changes: ${this.changes}`);
          resolve(this);
        }
      });
    });
  },
  
  get: (sql: string, params: any = []): Promise<any> => {
    console.log(`DB GET: ${sql}`);
    if (params.length > 0) {
      console.log('Parameters:', JSON.stringify(params));
    }
    
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, result) => {
        if (err) {
          console.error(`DB ERROR in get: ${err.message}`);
          if (err.stack) console.error(err.stack);
          reject(err);
        } else {
          console.log(`DB GET success. Found result: ${result ? 'yes' : 'no'}`);
          resolve(result);
        }
      });
    });
  },
  
  all: (sql: string, params: any = []): Promise<any[]> => {
    console.log(`DB ALL: ${sql}`);
    if (params.length > 0) {
      console.log('Parameters:', JSON.stringify(params));
    }
    
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error(`DB ERROR in all: ${err.message}`);
          if (err.stack) console.error(err.stack);
          reject(err);
        } else {
          console.log(`DB ALL success. Row count: ${rows ? rows.length : 0}`);
          resolve(rows);
        }
      });
    });
  }
};

export default db;