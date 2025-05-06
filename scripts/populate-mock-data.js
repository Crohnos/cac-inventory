import db, { dbAsync } from '../dist/database/connection.js';
import { initializeDatabase, getCurrentTimestamp } from '../dist/database/setup.js';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

// Ensure necessary directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Define mock data
const itemCategories = [
  { name: 'Clothing', description: 'All types of clothing items', lowStockThreshold: 10 },
  { name: 'Toys', description: 'Children\'s toys and games', lowStockThreshold: 5 },
  { name: 'Books', description: 'Children\'s books and educational materials', lowStockThreshold: 8 },
  { name: 'Baby Supplies', description: 'Diapers, formula, and other baby necessities', lowStockThreshold: 15 },
  { name: 'Hygiene Products', description: 'Toothbrushes, soap, shampoo, etc.', lowStockThreshold: 12 },
  { name: 'School Supplies', description: 'Notebooks, pencils, backpacks, etc.', lowStockThreshold: 10 },
  { name: 'Shoes', description: 'All types of footwear', lowStockThreshold: 8 },
  { name: 'Bedding', description: 'Sheets, blankets, pillows, etc.', lowStockThreshold: 5 },
  { name: 'Kitchen Items', description: 'Cookware, utensils, and kitchen supplies', lowStockThreshold: 6 },
  { name: 'Furniture', description: 'Beds, tables, chairs, etc.', lowStockThreshold: 3 }
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
  { name: 'Youth XS' },
  { name: 'Youth S' },
  { name: 'Youth M' },
  { name: 'Youth L' },
  { name: 'Youth XL' },
  { name: 'Adult XS' },
  { name: 'Adult S' },
  { name: 'Adult M' },
  { name: 'Adult L' },
  { name: 'Adult XL' },
  { name: 'Adult 2XL' },
  { name: 'Adult 3XL' },
  
  // Shoe sizes - Children
  { name: 'Toddler 4' },
  { name: 'Toddler 5' },
  { name: 'Toddler 6' },
  { name: 'Toddler 7' },
  { name: 'Toddler 8' },
  { name: 'Toddler 9' },
  { name: 'Toddler 10' },
  { name: 'Little Kid 11' },
  { name: 'Little Kid 12' },
  { name: 'Little Kid 13' },
  { name: 'Big Kid 1' },
  { name: 'Big Kid 2' },
  { name: 'Big Kid 3' },
  { name: 'Big Kid 4' },
  { name: 'Big Kid 5' },
  { name: 'Big Kid 6' },
  
  // Shoe sizes - Adults
  { name: 'Women 5' },
  { name: 'Women 6' },
  { name: 'Women 7' },
  { name: 'Women 8' },
  { name: 'Women 9' },
  { name: 'Women 10' },
  { name: 'Women 11' },
  { name: 'Men 7' },
  { name: 'Men 8' },
  { name: 'Men 9' },
  { name: 'Men 10' },
  { name: 'Men 11' },
  { name: 'Men 12' },
  { name: 'Men 13' },
  
  // Book categories
  { name: 'Baby Board Books' },
  { name: 'Picture Books' },
  { name: 'Early Reader' },
  { name: 'Chapter Books' },
  { name: 'Young Adult' },
  
  // Bedding sizes
  { name: 'Crib' },
  { name: 'Twin' },
  { name: 'Full' },
  { name: 'Queen' },
  { name: 'King' },
  
  // Furniture sizes
  { name: 'Small' },
  { name: 'Medium' },
  { name: 'Large' }
];

// Category-Size mappings (which sizes apply to which categories)
const categorySizeMappings = {
  'Clothing': [
    'Newborn', '0-3 Months', '3-6 Months', '6-9 Months', '9-12 Months', 
    '12-18 Months', '18-24 Months', '2T', '3T', '4T', '5T',
    'Youth XS', 'Youth S', 'Youth M', 'Youth L', 'Youth XL',
    'Adult XS', 'Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult 2XL', 'Adult 3XL'
  ],
  'Shoes': [
    'Toddler 4', 'Toddler 5', 'Toddler 6', 'Toddler 7', 'Toddler 8', 'Toddler 9', 'Toddler 10',
    'Little Kid 11', 'Little Kid 12', 'Little Kid 13', 'Big Kid 1', 'Big Kid 2', 'Big Kid 3', 
    'Big Kid 4', 'Big Kid 5', 'Big Kid 6', 'Women 5', 'Women 6', 'Women 7', 'Women 8', 
    'Women 9', 'Women 10', 'Women 11', 'Men 7', 'Men 8', 'Men 9', 'Men 10', 'Men 11', 'Men 12', 'Men 13'
  ],
  'Books': [
    'Baby Board Books', 'Picture Books', 'Early Reader', 'Chapter Books', 'Young Adult'
  ],
  'Bedding': [
    'Crib', 'Twin', 'Full', 'Queen', 'King'
  ],
  'Furniture': [
    'Small', 'Medium', 'Large'
  ]
};

// Locations (only McKinney and Plano)
const locations = ['McKinney', 'Plano'];

// Conditions
const conditions = ['New', 'Gently Used', 'Heavily Used'];

// Function to generate a unique QR code value
const generateUniqueQrValue = () => `item-${uuidv4()}`;

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

// Helper function to generate random donor info
const generateDonorInfo = () => {
  const donors = [
    'Community Drive', 
    'Local Church', 
    'Anonymous', 
    'School Donation', 
    'Corporate Giving', 
    'Individual Donor',
    null
  ];
  return getRandomItem(donors);
};

// Main function to populate the database
async function populateDatabase() {
  try {
    console.log('Starting database population...');
    
    // Initialize database
    await initializeDatabase();
    
    // Insert categories
    console.log('Inserting item categories...');
    const categoryIds = {};
    for (const category of itemCategories) {
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
    
    // Insert item details
    console.log('Inserting item details...');
    const itemDetails = [];
    
    // Generate 100 random items
    for (let i = 0; i < 100; i++) {
      // Choose a random category
      const categoryName = getRandomItem(Object.keys(categorySizeMappings));
      const categoryId = categoryIds[categoryName];
      if (!categoryId) continue;
      
      // Choose a random size appropriate for the category (or null for items without sizes)
      let sizeId = null;
      if (categorySizeMappings[categoryName] && categorySizeMappings[categoryName].length > 0) {
        const sizeName = getRandomItem(categorySizeMappings[categoryName]);
        sizeId = sizeIds[sizeName];
      }
      
      // Generate a unique QR code
      const qrCodeValue = generateUniqueQrValue();
      
      // Create the item
      const timestamp = getCurrentTimestamp();
      const receivedDate = getRandomDate();
      const condition = getRandomItem(conditions);
      const location = getRandomItem(locations);
      const donorInfo = generateDonorInfo();
      const approxPrice = Math.random() > 0.3 ? getRandomPrice(1, 100) : null;
      const isActive = Math.random() > 0.2 ? 1 : 0; // 80% of items are active
      
      try {
        const result = await dbAsync.run(
          `INSERT INTO ItemDetail (
            itemCategoryId, sizeId, condition, location, qrCodeValue, 
            receivedDate, donorInfo, approxPrice, isActive, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            categoryId,
            sizeId,
            condition,
            location,
            qrCodeValue,
            receivedDate,
            donorInfo,
            approxPrice,
            isActive,
            timestamp,
            timestamp
          ]
        );
        
        const itemId = result.lastID;
        itemDetails.push({
          id: itemId,
          categoryName,
          qrCodeValue
        });
        
        console.log(`Added item detail #${itemId}: ${categoryName} (QR: ${qrCodeValue})`);
        
        // Generate and save QR code image for some items (30%)
        if (Math.random() > 0.7) {
          const qrCodeImagePath = path.join(uploadDir, `qr-${qrCodeValue}.png`);
          await QRCode.toFile(qrCodeImagePath, qrCodeValue);
          
          // Add a photo record for this QR code
          const photoTimestamp = getCurrentTimestamp();
          await dbAsync.run(
            'INSERT INTO ItemPhoto (itemDetailId, filePath, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
            [
              itemId,
              `uploads/qr-${qrCodeValue}.png`,
              'QR Code',
              photoTimestamp,
              photoTimestamp
            ]
          );
          console.log(`Generated QR code image for item #${itemId}`);
        }
        
        // Add 1-3 random photos for some items (20%)
        if (Math.random() > 0.8) {
          const numPhotos = Math.floor(Math.random() * 3) + 1;
          for (let j = 0; j < numPhotos; j++) {
            const photoTimestamp = getCurrentTimestamp();
            const photoFileName = `item-${itemId}-photo-${j+1}.png`;
            
            // Create a simple colored square as a placeholder image
            const photoPath = path.join(uploadDir, photoFileName);
            
            // We'll create a simple 1x1 pixel PNG file as a placeholder
            // In a real application, you'd have actual photos
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
                itemId,
                `uploads/${photoFileName}`,
                `Photo ${j+1} of ${categoryName}`,
                photoTimestamp,
                photoTimestamp
              ]
            );
            console.log(`Added photo for item #${itemId}`);
          }
        }
        
      } catch (err) {
        console.error(`Error inserting item detail:`, err.message);
      }
    }
    
    console.log('Database population completed successfully.');
    console.log(`Added ${Object.keys(categoryIds).length} categories`);
    console.log(`Added ${Object.keys(sizeIds).length} sizes`);
    console.log(`Added ${itemDetails.length} items`);
    
    // Close the database connection
    db.close();
    
  } catch (err) {
    console.error('Error populating database:', err);
  }
}

// Run the population script
populateDatabase().catch(console.error);