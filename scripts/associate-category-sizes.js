import { dbAsync } from '../dist/database/connection.js';
import { getCurrentTimestamp } from '../dist/database/setup.js';

// Size associations based on the Rainbow Room inventory data
const categoryToSizes = {
  // Boys Clothing (all clothing items need clothing sizes)
  "Boys Pants": [
    "Preemie", "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Boys Shorts": [
    "Preemie", "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Boys Long Sleeve Shirts": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Boys Short Sleeve Shirts": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Boys Summer/Winter Outfits": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Boys Pajamas": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Boys Light Jackets": [
    "0-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Boys Winter Jackets": [
    "0-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Boys Underwear": [
    "2-4", "5-6", "7-8", "10-12", "14-16", "18", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL"
  ],
  "Boys Socks": [
    "Infant", "6-18", "18-36", "3T-5T", "Youth S", "Youth M", "Youth L", "Adult", "Adult XL"
  ],
  "Boys Undershirts": [
    "Youth", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Boys Shoes": [
    "Toddler 4", "Toddler 5", "Toddler 6", "Toddler 7", "Toddler 8", "Toddler 9", "Toddler 10",
    "Little Kid 11", "Little Kid 12", "Little Kid 13", "Big Kid 1", "Big Kid 2", "Big Kid 3", 
    "Big Kid 4", "Big Kid 5", "Big Kid 6", "Women 5", "Women 6", "Women 7", "Women 8", "Women 9", 
    "Women 10", "Women 11", "Men 7", "Men 8", "Men 9", "Men 10", "Men 11", "Men 12", "Men 13"
  ],
  "Boys Hats": ["Baby", "Youth", "Adult"],
  "Boys Gloves": ["Child", "Youth", "Adult"],
  "Boys Onesies": ["Preemie", "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "24 Months"],

  // Girls Clothing (same as boys mostly)
  "Girls Pants": [
    "Preemie", "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Girls Shorts": [
    "Preemie", "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Girls Long Sleeve Shirts": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Girls Short Sleeve Shirts": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
    "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"
  ],
  "Girls Summer/Winter Outfits": [
    "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Girls Pajamas": [
    "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Girls Light Jackets": [
    "0-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Girls Winter Jackets": [
    "0-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months",
    "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"
  ],
  "Girls Underwear": [
    "2-4", "6-8", "10-12", "14-16", "Women XS", "Women S", "Women M", "Women L", "Women XL"
  ],
  "Girls Socks": [
    "Infant", "6-18", "18-36", "3T-5T", "Youth S", "Youth M", "Youth L", "Adult"
  ],
  "Girls Bras": [
    "Training", "Sports", "Adult", "Camis"
  ],
  "Girls Shoes": [
    "Toddler 4", "Toddler 5", "Toddler 6", "Toddler 7", "Toddler 8", "Toddler 9", "Toddler 10",
    "Little Kid 11", "Little Kid 12", "Little Kid 13", "Big Kid 1", "Big Kid 2", "Big Kid 3", 
    "Big Kid 4", "Big Kid 5", "Big Kid 6", "Women 4", "Women 5", "Women 6", "Women 7", "Women 8", 
    "Women 9", "Women 10", "Women 11"
  ],
  "Girls Hats": ["Baby", "Youth", "Adult"],
  "Girls Gloves": ["Child", "Youth", "Adult"],
  "Girls Onesies": ["Preemie", "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "24 Months"],

  // Diapers and Pull-ups
  "Diapers": ["Preemie", "Newborn", "Size 1", "Size 2", "Size 3", "Size 4", "Size 5", "Size 6", "Size 7"],
  "Pull-ups": ["2T-3T", "3T-4T", "4T-5T", "5T-6T"],

  // Books by reading level/age
  "Arts & Crafts": ["Small", "Medium", "Large"],
  "Toys": ["Small", "Medium", "Large"],
  "Sports Equipment": ["Small", "Medium", "Large"],

  // Bedding sizes
  "Bedding": ["Crib", "Twin", "Full", "Queen", "King"],
  
  // Baby and infant supplies (mostly one size)
  "Baby Wipes": ["One Size"],
  "Baby Shampoo & Wash": ["One Size"],
  "Baby Care Products": ["One Size"],
  "Baby Feeding Supplies": ["One Size"],
  "Baby Comfort Items": ["One Size"],
  
  // Toiletries and hygiene (mostly one size)
  "Shampoo": ["One Size"],
  "Conditioner": ["One Size"],
  "Body Wash": ["One Size"],
  "Deodorant": ["One Size"],
  "Razors": ["One Size"],
  "Soap Bars": ["One Size"],
  "Shaving Cream": ["One Size"],
  "Cosmetics": ["One Size"],
  "Pads": ["One Size"],
  "Tampons": ["One Size"],
  "Feminine Hygiene Wipes": ["One Size"],
  "Toothbrushes": ["One Size"],
  "Toothpaste": ["One Size"],
  "Hair Brushes": ["One Size"],
  "Lice Treatment": ["One Size"],
  "Lotion": ["One Size"],
  "Cotton Swabs": ["One Size"],
  "Hair Tools": ["One Size"],
  "African American Hair Products": ["One Size"],
  "Face Wash": ["One Size"],
  "Nail Care": ["One Size"],
  "First Aid": ["One Size"],
  
  // School supplies
  "School Backpacks": ["One Size"],
  "School Health Supplies": ["One Size"],
  "School Paper Supplies": ["One Size"],
  "School Writing Tools": ["One Size"],
  "Personal Accessories": ["One Size"],
  
  // Household supplies
  "Cleaning Supplies": ["One Size"],
  "Towels & Washcloths": ["One Size"],
  "Paper Products": ["One Size"],
  
  // Emergency needs
  "Car Seats": ["One Size"],
  "Pack and Play": ["One Size"],
  
  // Entertainment
  "Puzzles & Board Games": ["One Size"],
  "Electronics": ["One Size"]
};

// Helper function to find size ID by name
async function getSizeIdByName(sizeName) {
  const size = await dbAsync.get('SELECT id FROM Size WHERE name = ?', [sizeName]);
  return size ? size.id : null;
}

// Helper function to find category ID by name
async function getCategoryIdByName(categoryName) {
  const category = await dbAsync.get('SELECT id FROM ItemCategory WHERE name = ?', [categoryName]);
  return category ? category.id : null;
}

async function associateCategorySizes() {
  try {
    console.log('Starting category-size associations...');
    
    const timestamp = getCurrentTimestamp();
    let totalAssociations = 0;
    
    for (const [categoryName, sizeNames] of Object.entries(categoryToSizes)) {
      console.log(`\nProcessing category: ${categoryName}`);
      
      const categoryId = await getCategoryIdByName(categoryName);
      if (!categoryId) {
        console.log(`  ⚠️  Category "${categoryName}" not found, skipping...`);
        continue;
      }
      
      let categoryAssociations = 0;
      
      for (const sizeName of sizeNames) {
        const sizeId = await getSizeIdByName(sizeName);
        
        if (!sizeId) {
          console.log(`    ⚠️  Size "${sizeName}" not found, skipping...`);
          continue;
        }
        
        // Check if association already exists
        const existing = await dbAsync.get(
          'SELECT id FROM ItemSize WHERE itemCategoryId = ? AND sizeId = ?',
          [categoryId, sizeId]
        );
        
        if (existing) {
          console.log(`    ✓ Association already exists: ${sizeName}`);
          continue;
        }
        
        // Create the association
        try {
          await dbAsync.run(
            'INSERT INTO ItemSize (itemCategoryId, sizeId, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
            [categoryId, sizeId, timestamp, timestamp]
          );
          console.log(`    ✅ Associated: ${sizeName}`);
          categoryAssociations++;
          totalAssociations++;
        } catch (error) {
          console.log(`    ❌ Failed to associate "${sizeName}": ${error.message}`);
        }
      }
      
      console.log(`  📊 Added ${categoryAssociations} size associations to "${categoryName}"`);
    }
    
    console.log(`\n🎉 Size association complete!`);
    console.log(`📈 Total associations created: ${totalAssociations}`);
    
    // Show some examples
    console.log('\n📋 Example associations:');
    const examples = await dbAsync.all(`
      SELECT 
        c.name as categoryName,
        s.name as sizeName
      FROM ItemSize iss
      JOIN ItemCategory c ON iss.itemCategoryId = c.id
      JOIN Size s ON iss.sizeId = s.id
      WHERE c.name IN ('Boys Pants', 'Girls Shoes', 'Diapers')
      ORDER BY c.name, s.name
      LIMIT 10
    `);
    
    examples.forEach(ex => {
      console.log(`  • ${ex.categoryName} → ${ex.sizeName}`);
    });
    
  } catch (error) {
    console.error('❌ Error associating category sizes:', error);
    throw error;
  }
}

// Run the association
associateCategorySizes()
  .then(() => {
    console.log('\n✅ Category-size associations completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to associate category sizes:', error);
    process.exit(1);
  });