import { dbAsync } from '../dist/database/connection.js';
import { getCurrentTimestamp } from '../dist/database/setup.js';

// New category structure based on Rainbow Room inventory
const newCategories = [
  // Boys Clothing Categories
  { name: "Boys Pants", description: "Pants for boys from preemie to adult sizes", lowStockThreshold: 15 },
  { name: "Boys Shorts", description: "Shorts for boys from preemie to adult sizes", lowStockThreshold: 10 },
  { name: "Boys Long Sleeve Shirts", description: "Long sleeve shirts for boys", lowStockThreshold: 15 },
  { name: "Boys Short Sleeve Shirts", description: "Short sleeve shirts for boys", lowStockThreshold: 15 },
  { name: "Boys Summer/Winter Outfits", description: "Complete outfits for boys", lowStockThreshold: 10 },
  { name: "Boys Pajamas", description: "Pajamas and sleepwear for boys", lowStockThreshold: 10 },
  { name: "Boys Light Jackets", description: "Light jackets and sweaters for boys", lowStockThreshold: 8 },
  { name: "Boys Winter Jackets", description: "Heavy winter coats for boys", lowStockThreshold: 5 },
  { name: "Boys Underwear", description: "Underwear for boys", lowStockThreshold: 20 },
  { name: "Boys Socks", description: "Socks for boys", lowStockThreshold: 25 },
  { name: "Boys Undershirts", description: "Undershirts for boys", lowStockThreshold: 15 },
  { name: "Boys Shoes", description: "Footwear for boys", lowStockThreshold: 10 },
  { name: "Boys Hats", description: "Hats and caps for boys", lowStockThreshold: 8 },
  { name: "Boys Gloves", description: "Gloves and mittens for boys", lowStockThreshold: 8 },
  { name: "Boys Onesies", description: "Onesies for baby boys", lowStockThreshold: 15 },

  // Girls Clothing Categories
  { name: "Girls Pants", description: "Pants for girls from preemie to adult sizes", lowStockThreshold: 15 },
  { name: "Girls Shorts", description: "Shorts for girls from preemie to adult sizes", lowStockThreshold: 10 },
  { name: "Girls Long Sleeve Shirts", description: "Long sleeve shirts for girls", lowStockThreshold: 15 },
  { name: "Girls Short Sleeve Shirts", description: "Short sleeve shirts for girls", lowStockThreshold: 15 },
  { name: "Girls Summer/Winter Outfits", description: "Complete outfits for girls", lowStockThreshold: 10 },
  { name: "Girls Pajamas", description: "Pajamas and sleepwear for girls", lowStockThreshold: 10 },
  { name: "Girls Light Jackets", description: "Light jackets and sweaters for girls", lowStockThreshold: 8 },
  { name: "Girls Winter Jackets", description: "Heavy winter coats for girls", lowStockThreshold: 5 },
  { name: "Girls Underwear", description: "Underwear for girls", lowStockThreshold: 20 },
  { name: "Girls Socks", description: "Socks for girls", lowStockThreshold: 25 },
  { name: "Girls Bras", description: "Training bras and sports bras for girls", lowStockThreshold: 10 },
  { name: "Girls Shoes", description: "Footwear for girls", lowStockThreshold: 10 },
  { name: "Girls Hats", description: "Hats and accessories for girls", lowStockThreshold: 8 },
  { name: "Girls Gloves", description: "Gloves and mittens for girls", lowStockThreshold: 8 },
  { name: "Girls Onesies", description: "Onesies for baby girls", lowStockThreshold: 15 },

  // Diapers and Pull-ups
  { name: "Diapers", description: "Disposable diapers all sizes (Preemie to Size 7)", lowStockThreshold: 30 },
  { name: "Pull-ups", description: "Training pants and pull-ups (2T-6T)", lowStockThreshold: 20 },

  // Toiletries and Hygiene
  { name: "Shampoo", description: "Shampoo for all ages", lowStockThreshold: 15 },
  { name: "Conditioner", description: "Hair conditioner", lowStockThreshold: 10 },
  { name: "Body Wash", description: "Body wash for men, women, and children", lowStockThreshold: 15 },
  { name: "Deodorant", description: "Deodorant for men and women", lowStockThreshold: 20 },
  { name: "Razors", description: "Disposable razors for men and women", lowStockThreshold: 15 },
  { name: "Soap Bars", description: "Bar soap", lowStockThreshold: 20 },
  { name: "Shaving Cream", description: "Shaving cream and gel", lowStockThreshold: 10 },
  { name: "Cosmetics", description: "Makeup and beauty products", lowStockThreshold: 10 },
  { name: "Pads", description: "Feminine hygiene pads all sizes", lowStockThreshold: 25 },
  { name: "Tampons", description: "Tampons regular and super", lowStockThreshold: 25 },
  { name: "Feminine Hygiene Wipes", description: "Feminine hygiene wipes", lowStockThreshold: 15 },
  { name: "Toothbrushes", description: "Toothbrushes for all ages", lowStockThreshold: 30 },
  { name: "Toothpaste", description: "Toothpaste", lowStockThreshold: 20 },
  { name: "Hair Brushes", description: "Hair brushes and combs", lowStockThreshold: 15 },
  { name: "Lice Treatment", description: "Lice shampoo, spray, and kits", lowStockThreshold: 8 },
  { name: "Lotion", description: "Body lotion and moisturizers", lowStockThreshold: 15 },
  { name: "Cotton Swabs", description: "Q-tips and cotton swabs", lowStockThreshold: 15 },
  { name: "Hair Tools", description: "Hair styling tools and accessories", lowStockThreshold: 10 },
  { name: "African American Hair Products", description: "Specialized hair products including curl cream and hair masks", lowStockThreshold: 12 },
  { name: "Face Wash", description: "Facial cleansers", lowStockThreshold: 10 },
  { name: "Nail Care", description: "Nail clippers, files, and care items", lowStockThreshold: 10 },
  { name: "First Aid", description: "Basic first aid supplies", lowStockThreshold: 10 },

  // Infant Supplies
  { name: "Baby Shampoo & Wash", description: "Baby shampoo, wash, and 2-in-1 products", lowStockThreshold: 15 },
  { name: "Baby Care Products", description: "Baby oil, powder, lotion, and diaper rash cream", lowStockThreshold: 20 },
  { name: "Baby Feeding Supplies", description: "Sippy cups, bottles, nipples, and formula", lowStockThreshold: 20 },
  { name: "Baby Comfort Items", description: "Pacifiers, teethers, swaddles, and baby blankets", lowStockThreshold: 15 },
  { name: "Baby Wipes", description: "Baby wipes and diaper changing supplies", lowStockThreshold: 25 },

  // School Supplies
  { name: "School Backpacks", description: "Backpacks for school", lowStockThreshold: 10 },
  { name: "School Health Supplies", description: "Hand sanitizer and tissues", lowStockThreshold: 20 },
  { name: "School Paper Supplies", description: "Notebooks, paper, and writing materials", lowStockThreshold: 25 },
  { name: "School Writing Tools", description: "Pencils, pens, markers, and art supplies", lowStockThreshold: 30 },
  { name: "Personal Accessories", description: "Purses, wallets, and personal items", lowStockThreshold: 8 },

  // Household Supplies
  { name: "Cleaning Supplies", description: "Brooms, mops, brushes, and cleaning agents", lowStockThreshold: 10 },
  { name: "Bedding", description: "Comforters, sheets, and pillows", lowStockThreshold: 8 },
  { name: "Towels & Washcloths", description: "Bath towels and washcloths", lowStockThreshold: 15 },
  { name: "Paper Products", description: "Paper towels and toilet paper", lowStockThreshold: 20 },

  // Emergency Needs
  { name: "Car Seats", description: "Baby car seats, convertible seats, and booster seats", lowStockThreshold: 3 },
  { name: "Pack and Play", description: "Portable cribs and play yards", lowStockThreshold: 2 },

  // Toys and Activities
  { name: "Toys", description: "General toys for all ages", lowStockThreshold: 15 },
  { name: "Puzzles & Board Games", description: "Educational and entertainment games", lowStockThreshold: 10 },
  { name: "Electronics", description: "Electronic toys and devices", lowStockThreshold: 5 },
  { name: "Arts & Crafts", description: "Art supplies and craft materials", lowStockThreshold: 15 },
  { name: "Sports Equipment", description: "Sports toys and equipment", lowStockThreshold: 8 }
];

async function updateCategories() {
  try {
    console.log('Starting category update...');
    
    // First, let's clear existing categories (except those with items)
    console.log('Checking for categories with items...');
    const categoriesWithItems = await dbAsync.all(`
      SELECT DISTINCT c.id, c.name, COUNT(d.id) as itemCount
      FROM ItemCategory c
      LEFT JOIN ItemDetail d ON c.id = d.itemCategoryId AND d.isActive = 1
      GROUP BY c.id, c.name
      HAVING COUNT(d.id) > 0
    `);
    
    if (categoriesWithItems.length > 0) {
      console.log('Categories with items that will be preserved:');
      categoriesWithItems.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.itemCount} items)`);
      });
    }
    
    // Delete categories without items
    await dbAsync.run(`
      DELETE FROM ItemCategory 
      WHERE id NOT IN (
        SELECT DISTINCT itemCategoryId 
        FROM ItemDetail 
        WHERE isActive = 1 AND itemCategoryId IS NOT NULL
      )
    `);
    console.log('Removed empty categories');
    
    // Add new categories
    const timestamp = getCurrentTimestamp();
    let addedCount = 0;
    
    for (const category of newCategories) {
      // Check if category already exists
      const existing = await dbAsync.get(
        'SELECT id FROM ItemCategory WHERE name = ?', 
        [category.name]
      );
      
      if (!existing) {
        // Generate QR code value for new category
        const { generateUniqueQrValue } = await import('../dist/utils/qrCode.js');
        const qrCodeValue = await generateUniqueQrValue();
        
        await dbAsync.run(
          'INSERT INTO ItemCategory (name, description, lowStockThreshold, qrCodeValue, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
          [category.name, category.description, category.lowStockThreshold, qrCodeValue, timestamp, timestamp]
        );
        addedCount++;
        console.log(`Added: ${category.name}`);
      } else {
        console.log(`Skipped (exists): ${category.name}`);
      }
    }
    
    console.log(`\nCategory update complete:`);
    console.log(`- Added ${addedCount} new categories`);
    console.log(`- Preserved ${categoriesWithItems.length} categories with items`);
    
    // Show final count
    const totalCategories = await dbAsync.get('SELECT COUNT(*) as count FROM ItemCategory');
    console.log(`- Total categories: ${totalCategories.count}`);
    
  } catch (error) {
    console.error('Error updating categories:', error);
    throw error;
  }
}

// Run the update
updateCategories()
  .then(() => {
    console.log('Categories updated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update categories:', error);
    process.exit(1);
  });