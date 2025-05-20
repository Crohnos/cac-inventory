import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure necessary directories exist
const dataDir = path.join(__dirname, '..', 'data');
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(uploadDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dataDir, 'database.db');
console.log(`Using database at path: ${dbPath}`);

// Database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to the SQLite database');
  }
});

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

// Helper function to get the current timestamp
const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

// Helper function to generate a unique ID
const generateUniqueId = () => {
  return `item-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

// Create database schema
async function createSchema() {
  console.log('Creating database schema...');
  
  // SQL statements to create tables
  const createTables = [
    `CREATE TABLE IF NOT EXISTS ItemCategory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      lowStockThreshold INTEGER DEFAULT 10,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS Size (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS ItemSize (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemCategoryId INTEGER NOT NULL,
      sizeId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (itemCategoryId) REFERENCES ItemCategory (id),
      FOREIGN KEY (sizeId) REFERENCES Size (id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS ItemDetail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemCategoryId INTEGER NOT NULL,
      sizeId INTEGER,
      condition TEXT,
      location TEXT,
      qrCodeValue TEXT UNIQUE,
      receivedDate TEXT,
      donorInfo TEXT,
      approxPrice REAL,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (itemCategoryId) REFERENCES ItemCategory (id),
      FOREIGN KEY (sizeId) REFERENCES Size (id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS ItemPhoto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemDetailId INTEGER NOT NULL,
      filePath TEXT NOT NULL,
      description TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (itemDetailId) REFERENCES ItemDetail (id)
    )`
  ];
  
  // Execute each SQL statement
  for (const sql of createTables) {
    await dbAsync.run(sql);
  }
  
  console.log('Database schema created successfully.');
}

// Data for testing
const categories = [
  { name: 'Clothing', description: 'All types of clothing items', lowStockThreshold: 15 },
  { name: 'Toys', description: 'Children\'s toys and games', lowStockThreshold: 15 },
  { name: 'Books', description: 'Children\'s books and educational materials', lowStockThreshold: 15 },
  { name: 'Baby Supplies', description: 'Diapers, formula, and other baby necessities', lowStockThreshold: 15 },
  { name: 'Hygiene Products', description: 'Toothbrushes, soap, shampoo, etc.', lowStockThreshold: 15 },
  { name: 'School Supplies', description: 'Notebooks, pencils, backpacks, etc.', lowStockThreshold: 15 },
  { name: 'Shoes', description: 'All types of footwear', lowStockThreshold: 15 },
  { name: 'Bedding', description: 'Sheets, blankets, pillows, etc.', lowStockThreshold: 15 }
];

const sizes = [
  // Clothing sizes
  { name: 'Newborn' },
  { name: '0-3 Months' },
  { name: '3-6 Months' },
  { name: '6-9 Months' },
  { name: '9-12 Months' },
  { name: '12-18 Months' },
  { name: '18-24 Months' },
  { name: '2T' },
  { name: '3T' },
  { name: '4T' },
  { name: '5T' },
  { name: 'Youth S' },
  { name: 'Youth M' },
  { name: 'Youth L' },
  { name: 'Adult S' },
  { name: 'Adult M' },
  { name: 'Adult L' },
  { name: 'Adult XL' },
  
  // Shoe sizes
  { name: 'Toddler 5' },
  { name: 'Toddler 7' },
  { name: 'Kids 10' },
  { name: 'Kids 12' },
  { name: 'Women 6' },
  { name: 'Women 8' },
  { name: 'Men 9' },
  { name: 'Men 11' },
  
  // Generic sizes
  { name: 'Small' },
  { name: 'Medium' },
  { name: 'Large' },
  { name: 'One Size' }
];

const categorySizeMappings = {
  'Clothing': [
    'Newborn', '0-3 Months', '3-6 Months', '6-9 Months', '9-12 Months', 
    '12-18 Months', '18-24 Months', '2T', '3T', '4T', '5T',
    'Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'
  ],
  'Shoes': [
    'Toddler 5', 'Toddler 7', 'Kids 10', 'Kids 12', 'Women 6', 'Women 8', 'Men 9', 'Men 11'
  ],
  'Toys': ['Small', 'Medium', 'Large'],
  'Books': ['One Size'],
  'Baby Supplies': ['One Size', 'Small', 'Medium', 'Large'],
  'Hygiene Products': ['One Size'],
  'School Supplies': ['One Size'],
  'Bedding': ['Small', 'Medium', 'Large']
};

// Locations
const locations = ['McKinney', 'Plano'];

// Conditions
const conditions = ['New', 'Gently Used', 'Heavily Used'];

// Sample donors
const donors = [
  'Community Drive', 
  'Local Church', 
  'Anonymous', 
  'School Donation', 
  'Corporate Giving',
  'Individual Donor'
];

// Helper function to get a random item from an array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get a random date within the last year
const getRandomDate = () => {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const randomTimestamp = oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime());
  const date = new Date(randomTimestamp);
  return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

// Helper function to generate a random price
const getRandomPrice = (min, max) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

// Main function to populate the database
async function populateDatabase() {
  try {
    console.log('Starting database setup for Render deployment...');
    
    // Create schema
    await createSchema();
    
    // Insert categories
    console.log('Inserting item categories...');
    const categoryIds = {};
    for (const category of categories) {
      const timestamp = getCurrentTimestamp();
      try {
        const result = await dbAsync.run(
          'INSERT INTO ItemCategory (name, description, lowStockThreshold, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
          [category.name, category.description, category.lowStockThreshold, timestamp, timestamp]
        );
        categoryIds[category.name] = result.lastID;
        console.log(`Added category: ${category.name} (ID: ${result.lastID})`);
      } catch (err) {
        console.error(`Error inserting category ${category.name}:`, err.message);
      }
    }
    
    // Insert sizes
    console.log('Inserting sizes...');
    const sizeIds = {};
    for (const size of sizes) {
      const timestamp = getCurrentTimestamp();
      try {
        const result = await dbAsync.run(
          'INSERT INTO Size (name, createdAt, updatedAt) VALUES (?, ?, ?)',
          [size.name, timestamp, timestamp]
        );
        sizeIds[size.name] = result.lastID;
        console.log(`Added size: ${size.name} (ID: ${result.lastID})`);
      } catch (err) {
        console.error(`Error inserting size ${size.name}:`, err.message);
      }
    }
    
    // Create category-size associations
    console.log('Creating category-size associations...');
    for (const categoryName in categorySizeMappings) {
      const categoryId = categoryIds[categoryName];
      if (!categoryId) continue;
      
      for (const sizeName of categorySizeMappings[categoryName]) {
        const sizeId = sizeIds[sizeName];
        if (!sizeId) continue;
        
        const timestamp = getCurrentTimestamp();
        try {
          await dbAsync.run(
            'INSERT INTO ItemSize (itemCategoryId, sizeId, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
            [categoryId, sizeId, timestamp, timestamp]
          );
          console.log(`Associated category "${categoryName}" with size "${sizeName}"`);
        } catch (err) {
          console.error(`Error associating category ${categoryName} with size ${sizeName}:`, err.message);
        }
      }
    }
    
    // Create stock levels with different variations
    console.log('Creating items with varied stock levels...');
    
    for (const categoryName in categoryIds) {
      const categoryId = categoryIds[categoryName];
      // Use category index to determine stock scenario
      const scenario = categories.findIndex(c => c.name === categoryName) % 4;
      const threshold = 15; // Standard threshold for all
      
      let totalItems;
      
      switch (scenario) {
        case 0: // Out of stock
          totalItems = 0;
          break;
        case 1: // Critical (below 50% of threshold)
          totalItems = Math.max(1, Math.floor(threshold * 0.25)); // About 3-4 items
          break;
        case 2: // Low (between 50% and 100% of threshold)
          totalItems = Math.floor(threshold * 0.75); // About 11 items
          break;
        case 3: // Good (above threshold)
          totalItems = threshold + 5; // 20 items
          break;
      }
      
      console.log(`Creating ${totalItems} items for category "${categoryName}" (scenario: ${scenario})`);
      
      // Get applicable sizes for this category
      const applicableSizes = categorySizeMappings[categoryName] || [];
      
      // Add items
      for (let i = 0; i < totalItems; i++) {
        const timestamp = getCurrentTimestamp();
        const qrCodeValue = generateUniqueId();
        const receivedDate = getRandomDate();
        const condition = getRandomItem(conditions);
        const location = getRandomItem(locations);
        const donorInfo = getRandomItem(donors);
        const approxPrice = Math.random() > 0.3 ? getRandomPrice(5, 50) : null;
        
        // Choose a random size if applicable
        let sizeId = null;
        if (applicableSizes.length > 0) {
          const sizeName = getRandomItem(applicableSizes);
          sizeId = sizeIds[sizeName];
        }
        
        try {
          const result = await dbAsync.run(
            `INSERT INTO ItemDetail (
              itemCategoryId, sizeId, condition, location, qrCodeValue, 
              receivedDate, donorInfo, approxPrice, isActive, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
            [
              categoryId,
              sizeId,
              condition,
              location,
              qrCodeValue,
              receivedDate,
              donorInfo,
              approxPrice,
              timestamp,
              timestamp
            ]
          );
          
          console.log(`Added item for category "${categoryName}"`);
          
          // Add a simple placeholder photo for a few items
          if (i % 3 === 0) {
            const photoTimestamp = getCurrentTimestamp();
            const photoFileName = `item-${result.lastID}-photo.png`;
            const photoPath = path.join(uploadDir, photoFileName);
            
            // Create a simple colored placeholder (1x1 pixel PNG)
            const buffer = Buffer.from([
              0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 
              0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 
              0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00, 
              0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 
              0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00, 
              0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
            ]);
            fs.writeFileSync(photoPath, buffer);
            
            await dbAsync.run(
              'INSERT INTO ItemPhoto (itemDetailId, filePath, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
              [
                result.lastID,
                `uploads/${photoFileName}`,
                `Photo for ${categoryName}`,
                photoTimestamp,
                photoTimestamp
              ]
            );
          }
        } catch (err) {
          console.error(`Error creating item:`, err.message);
        }
      }
    }
    
    console.log('Database setup completed successfully!');
    console.log(`Added ${Object.keys(categoryIds).length} categories`);
    console.log(`Added ${Object.keys(sizeIds).length} sizes`);
    
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await dbAsync.close();
    console.log('Database connection closed');
  }
}

// Run the setup script
populateDatabase().catch(console.error);