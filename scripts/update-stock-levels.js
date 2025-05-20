import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database directory path
const dataDir = path.join(__dirname, '..', 'data');

// Create the directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path - get actual database name from the project
const dbPath = path.join(dataDir, 'database.db');
console.log(`Using database at path: ${dbPath}`);

// Create a database wrapper with promises
const dbAsync = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  close: () => {
    return new Promise((resolve, reject) => {
      db.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to the SQLite database');
  }
});

async function updateStockLevels() {
  console.log('Starting to update stock levels...');
  
  try {
    // Get all categories
    const categories = await dbAsync.all('SELECT id, name, lowStockThreshold FROM ItemCategory');
    console.log(`Found ${categories.length} categories`);
    
    // Create varied stock levels
    for (const category of categories) {
      // Set threshold between 5-15
      const threshold = Math.floor(Math.random() * 11) + 5;
      
      // Generate a random stock level scenario
      // 0 = Out of stock
      // 1 = Critical (below 50% of threshold)
      // 2 = Low (between 50% and 100% of threshold)
      // 3 = Good (above threshold)
      const scenario = Math.floor(Math.random() * 4);
      
      let totalItems;
      
      switch (scenario) {
        case 0: // Out of stock
          totalItems = 0;
          break;
        case 1: // Critical
          totalItems = Math.floor(Math.random() * (threshold * 0.5));
          break;
        case 2: // Low
          totalItems = Math.floor(threshold * 0.5) + Math.floor(Math.random() * (threshold * 0.5));
          break;
        case 3: // Good
          totalItems = threshold + Math.floor(Math.random() * 10);
          break;
      }
      
      // Update category with new threshold and get existing items
      await dbAsync.run('UPDATE ItemCategory SET lowStockThreshold = ? WHERE id = ?', [threshold, category.id]);
      
      // Get current item count
      const itemCount = await dbAsync.get('SELECT COUNT(*) as count FROM ItemDetail WHERE itemCategoryId = ? AND isActive = 1', [category.id]);
      
      // If we need more items, add them
      if (itemCount.count < totalItems) {
        const itemsToAdd = totalItems - itemCount.count;
        for (let i = 0; i < itemsToAdd; i++) {
          await dbAsync.run(`
            INSERT INTO ItemDetail (
              itemCategoryId, condition, location, qrCodeValue, 
              receivedDate, donorInfo, approxPrice, isActive,
              createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
          `, [
            category.id,
            ['New', 'Gently Used', 'Heavily Used'][Math.floor(Math.random() * 3)],
            ['McKinney', 'Plano'][Math.floor(Math.random() * 2)],
            `qr-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            new Date().toISOString(),
            'Stock Update Script',
            (Math.random() * 50).toFixed(2),
          ]);
        }
      } 
      // If we need fewer items, deactivate some
      else if (itemCount.count > totalItems) {
        const itemsToRemove = itemCount.count - totalItems;
        const items = await dbAsync.all('SELECT id FROM ItemDetail WHERE itemCategoryId = ? AND isActive = 1 LIMIT ?', 
          [category.id, itemsToRemove]);
        
        for (const item of items) {
          await dbAsync.run('UPDATE ItemDetail SET isActive = 0 WHERE id = ?', [item.id]);
        }
      }
      
      console.log(`Updated category '${category.name}': threshold=${threshold}, totalItems=${totalItems}, scenario=${scenario}`);
    }
    
    console.log('Stock levels updated successfully');
  } catch (error) {
    console.error('Error updating stock levels:', error);
  } finally {
    await dbAsync.close();
    console.log('Database connection closed');
  }
}

// Run the function
updateStockLevels();