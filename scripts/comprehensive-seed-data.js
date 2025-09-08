#!/usr/bin/env node

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

// Database configuration
const DB_PATH = 'data/inventory.db';

console.log('🌈 Seeding Comprehensive Rainbow Room Inventory Database...');

// All sizes that should be in the system
const allSizes = [
  // Baby/Infant sizes
  "Preemie", "Newborn", "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", 
  "12-18 Months", "18-24 Months", "24 Months",
  
  // Toddler sizes
  "2T", "3T", "4T", "5T",
  
  // Youth sizes
  "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
  
  // Adult clothing sizes
  "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL",
  
  // Underwear sizes
  "2-4", "5-6", "6-8", "7-8", "10-12", "14-16", "18",
  
  // Sock sizes
  "Infant", "6-18", "18-36", "3T-5T", "Adult",
  
  // Shoe sizes
  "Toddler 4", "Toddler 5", "Toddler 6", "Toddler 7", "Toddler 8", "Toddler 9", "Toddler 10",
  "Little Kid 11", "Little Kid 12", "Little Kid 13",
  "Big Kid 1", "Big Kid 2", "Big Kid 3", "Big Kid 4", "Big Kid 5", "Big Kid 6",
  "Women 4", "Women 5", "Women 6", "Women 7", "Women 8", "Women 9", "Women 10", "Women 11",
  "Men 7", "Men 8", "Men 9", "Men 10", "Men 11", "Men 12", "Men 13",
  
  // Diaper sizes
  "Size 1", "Size 2", "Size 3", "Size 4", "Size 5", "Size 6", "Size 7",
  
  // Pull-up sizes
  "2T-3T", "3T-4T", "4T-5T", "5T-6T",
  
  // Bedding sizes
  "Crib", "Twin", "Full", "Queen", "King",
  
  // General sizes
  "Small", "Medium", "Large", "One Size"
];

// Comprehensive Rainbow Room inventory items
const rainbowRoomItems = [
  // Boys Clothing
  {
    name: "Boys Pants",
    description: "Pants for boys from preemie to adult sizes",
    storage_location: "Boys Clothing - Section A",
    has_sizes: true,
    sizes: ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL", "Adult S", "Adult M", "Adult L", "Adult XL"],
    min_stock_level: 15
  },
  {
    name: "Boys Shorts",
    description: "Shorts for boys from preemie to adult sizes",
    storage_location: "Boys Clothing - Section A",
    has_sizes: true,
    sizes: ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL", "Adult S", "Adult M", "Adult L", "Adult XL"],
    min_stock_level: 10
  },
  {
    name: "Boys Long Sleeve Shirts",
    description: "Long sleeve shirts for boys",
    storage_location: "Boys Clothing - Section B",
    has_sizes: true,
    sizes: ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL", "Adult S", "Adult M", "Adult L", "Adult XL"],
    min_stock_level: 15
  },
  {
    name: "Boys Short Sleeve Shirts",
    description: "Short sleeve shirts for boys",
    storage_location: "Boys Clothing - Section B",
    has_sizes: true,
    sizes: ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL", "Adult S", "Adult M", "Adult L", "Adult XL"],
    min_stock_level: 15
  },
  {
    name: "Boys Pajamas",
    description: "Pajamas and sleepwear for boys",
    storage_location: "Boys Clothing - Section C",
    has_sizes: true,
    sizes: ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"],
    min_stock_level: 10
  },
  {
    name: "Boys Winter Jackets",
    description: "Heavy winter coats for boys",
    storage_location: "Boys Clothing - Section D",
    has_sizes: true,
    sizes: ["3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"],
    min_stock_level: 5
  },
  {
    name: "Boys Underwear",
    description: "Underwear for boys",
    storage_location: "Boys Clothing - Section E",
    has_sizes: true,
    sizes: ["2-4", "5-6", "7-8", "10-12", "14-16", "18", "Adult S", "Adult M", "Adult L", "Adult XL"],
    min_stock_level: 20
  },
  {
    name: "Boys Socks",
    description: "Socks for boys",
    storage_location: "Boys Clothing - Section E",
    has_sizes: true,
    sizes: ["Infant", "6-18", "18-36", "3T-5T", "Youth S", "Youth M", "Youth L", "Adult"],
    min_stock_level: 25
  },
  {
    name: "Boys Shoes",
    description: "Footwear for boys",
    storage_location: "Boys Clothing - Section F",
    has_sizes: true,
    sizes: ["Toddler 4", "Toddler 5", "Toddler 6", "Toddler 7", "Toddler 8", "Toddler 9", "Toddler 10", "Little Kid 11", "Little Kid 12", "Little Kid 13", "Big Kid 1", "Big Kid 2", "Big Kid 3", "Big Kid 4", "Big Kid 5", "Big Kid 6"],
    min_stock_level: 10
  },
  {
    name: "Boys Onesies",
    description: "Onesies for baby boys",
    storage_location: "Boys Clothing - Section G",
    has_sizes: true,
    sizes: ["Preemie", "Newborn", "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months"],
    min_stock_level: 15
  },

  // Girls Clothing
  {
    name: "Girls Pants",
    description: "Pants for girls from preemie to adult sizes",
    storage_location: "Girls Clothing - Section A",
    has_sizes: true,
    sizes: ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL", "Adult S", "Adult M", "Adult L", "Adult XL"],
    min_stock_level: 15
  },
  {
    name: "Girls Shorts",
    description: "Shorts for girls from preemie to adult sizes",
    storage_location: "Girls Clothing - Section A",
    has_sizes: true,
    sizes: ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL", "Adult S", "Adult M", "Adult L", "Adult XL"],
    min_stock_level: 10
  },
  {
    name: "Girls Long Sleeve Shirts",
    description: "Long sleeve shirts for girls",
    storage_location: "Girls Clothing - Section B",
    has_sizes: true,
    sizes: ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL", "Adult S", "Adult M", "Adult L", "Adult XL"],
    min_stock_level: 15
  },
  {
    name: "Girls Short Sleeve Shirts",
    description: "Short sleeve shirts for girls",
    storage_location: "Girls Clothing - Section B",
    has_sizes: true,
    sizes: ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL", "Adult S", "Adult M", "Adult L", "Adult XL"],
    min_stock_level: 15
  },
  {
    name: "Girls Pajamas",
    description: "Pajamas and sleepwear for girls",
    storage_location: "Girls Clothing - Section C",
    has_sizes: true,
    sizes: ["0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"],
    min_stock_level: 10
  },
  {
    name: "Girls Winter Jackets",
    description: "Heavy winter coats for girls",
    storage_location: "Girls Clothing - Section D",
    has_sizes: true,
    sizes: ["3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months", "2T", "3T", "4T", "5T", "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"],
    min_stock_level: 5
  },
  {
    name: "Girls Underwear",
    description: "Underwear for girls",
    storage_location: "Girls Clothing - Section E",
    has_sizes: true,
    sizes: ["2-4", "5-6", "7-8", "10-12", "14-16", "18", "Adult S", "Adult M", "Adult L", "Adult XL"],
    min_stock_level: 20
  },
  {
    name: "Girls Socks",
    description: "Socks for girls",
    storage_location: "Girls Clothing - Section E",
    has_sizes: true,
    sizes: ["Infant", "6-18", "18-36", "3T-5T", "Youth S", "Youth M", "Youth L", "Adult"],
    min_stock_level: 25
  },
  {
    name: "Girls Bras",
    description: "Training bras and sports bras for girls",
    storage_location: "Girls Clothing - Section E",
    has_sizes: true,
    sizes: ["Youth XS", "Youth S", "Youth M", "Youth L", "Adult S", "Adult M", "Adult L"],
    min_stock_level: 10
  },
  {
    name: "Girls Shoes",
    description: "Footwear for girls",
    storage_location: "Girls Clothing - Section F",
    has_sizes: true,
    sizes: ["Toddler 4", "Toddler 5", "Toddler 6", "Toddler 7", "Toddler 8", "Toddler 9", "Toddler 10", "Little Kid 11", "Little Kid 12", "Little Kid 13", "Big Kid 1", "Big Kid 2", "Big Kid 3", "Big Kid 4", "Big Kid 5", "Big Kid 6", "Women 4", "Women 5", "Women 6", "Women 7", "Women 8", "Women 9", "Women 10"],
    min_stock_level: 10
  },
  {
    name: "Girls Onesies",
    description: "Onesies for baby girls",
    storage_location: "Girls Clothing - Section G",
    has_sizes: true,
    sizes: ["Preemie", "Newborn", "0-3 Months", "3-6 Months", "6-9 Months", "9-12 Months", "12-18 Months", "18-24 Months"],
    min_stock_level: 15
  },

  // Diapers and Pull-ups
  {
    name: "Diapers",
    description: "Disposable diapers all sizes (Preemie to Size 7)",
    storage_location: "Baby Care - Section A",
    has_sizes: true,
    sizes: ["Preemie", "Newborn", "Size 1", "Size 2", "Size 3", "Size 4", "Size 5", "Size 6", "Size 7"],
    min_stock_level: 30
  },
  {
    name: "Pull-ups",
    description: "Training pants and pull-ups (2T-6T)",
    storage_location: "Baby Care - Section A",
    has_sizes: true,
    sizes: ["2T-3T", "3T-4T", "4T-5T", "5T-6T"],
    min_stock_level: 20
  },

  // Toiletries and Hygiene
  {
    name: "Shampoo",
    description: "Shampoo for all ages",
    storage_location: "Toiletries - Section A",
    has_sizes: false,
    sizes: [],
    min_stock_level: 15
  },
  {
    name: "Body Wash",
    description: "Body wash for men, women, and children",
    storage_location: "Toiletries - Section A",
    has_sizes: false,
    sizes: [],
    min_stock_level: 15
  },
  {
    name: "Deodorant",
    description: "Deodorant for men and women",
    storage_location: "Toiletries - Section B",
    has_sizes: false,
    sizes: [],
    min_stock_level: 20
  },
  {
    name: "Soap Bars",
    description: "Bar soap",
    storage_location: "Toiletries - Section C",
    has_sizes: false,
    sizes: [],
    min_stock_level: 20
  },
  {
    name: "Feminine Hygiene Pads",
    description: "Feminine hygiene pads all sizes",
    storage_location: "Toiletries - Section D",
    has_sizes: true,
    sizes: ["Regular", "Super", "Overnight"],
    min_stock_level: 25
  },
  {
    name: "Tampons",
    description: "Tampons regular and super",
    storage_location: "Toiletries - Section D",
    has_sizes: true,
    sizes: ["Regular", "Super"],
    min_stock_level: 25
  },
  {
    name: "Toothbrushes",
    description: "Toothbrushes for all ages",
    storage_location: "Toiletries - Section E",
    has_sizes: true,
    sizes: ["Baby", "Child", "Adult"],
    min_stock_level: 30
  },
  {
    name: "Toothpaste",
    description: "Toothpaste",
    storage_location: "Toiletries - Section E",
    has_sizes: false,
    sizes: [],
    min_stock_level: 20
  },
  {
    name: "Hair Brushes",
    description: "Hair brushes and combs",
    storage_location: "Toiletries - Section F",
    has_sizes: false,
    sizes: [],
    min_stock_level: 15
  },
  {
    name: "Lotion",
    description: "Body lotion and moisturizers",
    storage_location: "Toiletries - Section G",
    has_sizes: false,
    sizes: [],
    min_stock_level: 15
  },

  // Baby Care
  {
    name: "Baby Shampoo & Wash",
    description: "Baby shampoo, wash, and 2-in-1 products",
    storage_location: "Baby Care - Section B",
    has_sizes: false,
    sizes: [],
    min_stock_level: 15
  },
  {
    name: "Baby Care Products",
    description: "Baby oil, powder, lotion, and diaper rash cream",
    storage_location: "Baby Care - Section B",
    has_sizes: false,
    sizes: [],
    min_stock_level: 20
  },
  {
    name: "Baby Feeding Supplies",
    description: "Sippy cups, bottles, nipples, and formula",
    storage_location: "Baby Care - Section C",
    has_sizes: false,
    sizes: [],
    min_stock_level: 20
  },
  {
    name: "Baby Wipes",
    description: "Baby wipes and diaper changing supplies",
    storage_location: "Baby Care - Section D",
    has_sizes: false,
    sizes: [],
    min_stock_level: 25
  },

  // School Supplies
  {
    name: "School Backpacks",
    description: "Backpacks for school",
    storage_location: "School Supplies - Section A",
    has_sizes: true,
    sizes: ["Small", "Medium", "Large"],
    min_stock_level: 10
  },
  {
    name: "School Paper Supplies",
    description: "Notebooks, paper, and writing materials",
    storage_location: "School Supplies - Section B",
    has_sizes: false,
    sizes: [],
    min_stock_level: 25
  },
  {
    name: "School Writing Tools",
    description: "Pencils, pens, markers, and art supplies",
    storage_location: "School Supplies - Section B",
    has_sizes: false,
    sizes: [],
    min_stock_level: 30
  },

  // Household Supplies
  {
    name: "Cleaning Supplies",
    description: "Brooms, mops, brushes, and cleaning agents",
    storage_location: "Household - Section A",
    has_sizes: false,
    sizes: [],
    min_stock_level: 10
  },
  {
    name: "Bedding",
    description: "Comforters, sheets, and pillows",
    storage_location: "Household - Section B",
    has_sizes: true,
    sizes: ["Crib", "Twin", "Full", "Queen", "King"],
    min_stock_level: 8
  },
  {
    name: "Towels & Washcloths",
    description: "Bath towels and washcloths",
    storage_location: "Household - Section B",
    has_sizes: true,
    sizes: ["Washcloth", "Hand Towel", "Bath Towel"],
    min_stock_level: 15
  },
  {
    name: "Paper Products",
    description: "Paper towels and toilet paper",
    storage_location: "Household - Section C",
    has_sizes: false,
    sizes: [],
    min_stock_level: 20
  },

  // Emergency Needs
  {
    name: "Car Seats",
    description: "Baby car seats, convertible seats, and booster seats",
    storage_location: "Emergency - Section A",
    has_sizes: true,
    sizes: ["Infant", "Convertible", "Booster"],
    min_stock_level: 3
  },

  // Toys and Activities
  {
    name: "Toys",
    description: "General toys for all ages",
    storage_location: "Activities - Section A",
    has_sizes: true,
    sizes: ["0-2 years", "3-5 years", "6-8 years", "9-12 years", "Teen"],
    min_stock_level: 15
  },
  {
    name: "Puzzles & Board Games",
    description: "Educational and entertainment games",
    storage_location: "Activities - Section B",
    has_sizes: true,
    sizes: ["Ages 3-5", "Ages 6-8", "Ages 9-12", "Teen/Adult"],
    min_stock_level: 10
  },
  {
    name: "Arts & Crafts",
    description: "Art supplies and craft materials",
    storage_location: "Activities - Section C",
    has_sizes: true,
    sizes: ["Ages 3-5", "Ages 6-8", "Ages 9-12", "Teen"],
    min_stock_level: 15
  },
  {
    name: "Sports Equipment",
    description: "Sports toys and equipment",
    storage_location: "Activities - Section D",
    has_sizes: true,
    sizes: ["Toddler", "Youth", "Adult"],
    min_stock_level: 8
  }
];

try {
  // Connect to database
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  
  // Check if locations exist
  const locationCount = db.prepare("SELECT COUNT(*) as count FROM locations").get();
  if (locationCount.count === 0) {
    console.log('❌ No locations found. Please run setup-db first.');
    process.exit(1);
  }
  
  // Get all locations
  const locations = db.prepare("SELECT location_id, name FROM locations WHERE is_active = 1").all();
  console.log(`📍 Found ${locations.length} active locations`);
  
  const insertItem = db.prepare(`
    INSERT INTO items (name, description, storage_location, qr_code, has_sizes, min_stock_level, unit_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertItemSize = db.prepare(`
    INSERT INTO item_sizes (item_id, location_id, size_label, current_quantity, min_stock_level, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  console.log('📦 Creating comprehensive Rainbow Room inventory...');
  
  // Begin transaction
  const transaction = db.transaction(() => {
    for (let i = 0; i < rainbowRoomItems.length; i++) {
      const itemData = rainbowRoomItems[i];
      // Insert item
      const qrCode = uuidv4();
      const result = insertItem.run(
        itemData.name,
        itemData.description,
        itemData.storage_location,
        qrCode,
        itemData.has_sizes ? 1 : 0,
        itemData.min_stock_level,
        'each'
      );
      
      const itemId = result.lastInsertRowid;
      console.log(`  ➕ Created item: ${itemData.name} (ID: ${itemId})`);
      
      // Insert sizes for each location
      if (itemData.has_sizes && itemData.sizes.length > 0) {
        for (const location of locations) {
          for (let i = 0; i < itemData.sizes.length; i++) {
            const sizeLabel = itemData.sizes[i];
            // Variable quantities based on item type and size
            let quantity;
            if (itemData.name.includes('Diaper') || itemData.name.includes('Pull-up')) {
              quantity = Math.floor(Math.random() * 20) + 10; // 10-30 for diapers
            } else if (itemData.name.includes('Sock') || itemData.name.includes('Underwear')) {
              quantity = Math.floor(Math.random() * 15) + 5; // 5-20 for socks/underwear
            } else if (itemData.name.includes('Shoes') || itemData.name.includes('Jacket')) {
              quantity = Math.floor(Math.random() * 8) + 2; // 2-10 for shoes/jackets
            } else {
              quantity = Math.floor(Math.random() * 12) + 3; // 3-15 for general clothing
            }
            
            insertItemSize.run(
              itemId,
              location.location_id,
              sizeLabel,
              quantity,
              Math.max(1, Math.floor(itemData.min_stock_level / 3)), // Lower threshold for individual sizes
              i // sort_order
            );
            
            console.log(`    📏 ${location.name}: ${sizeLabel} (${quantity} units)`);
          }
        }
      } else {
        // Items without sizes - create one record per location
        for (const location of locations) {
          let quantity;
          if (itemData.name.includes('Cleaning') || itemData.name.includes('Paper')) {
            quantity = Math.floor(Math.random() * 25) + 10; // 10-35 for bulk items
          } else if (itemData.name.includes('Car Seat')) {
            quantity = Math.floor(Math.random() * 3) + 1; // 1-4 for expensive items
          } else {
            quantity = Math.floor(Math.random() * 20) + 5; // 5-25 for general items
          }
          
          insertItemSize.run(
            itemId,
            location.location_id,
            'N/A', // size_label for non-sized items
            quantity,
            itemData.min_stock_level,
            0 // sort_order
          );
          
          console.log(`    📍 ${location.name}: ${quantity} units`);
        }
      }
    }
  });
  
  transaction();
  
  // Verify data was inserted
  const itemCount = db.prepare("SELECT COUNT(*) as count FROM items").get();
  const sizeCount = db.prepare("SELECT COUNT(*) as count FROM item_sizes").get();
  
  console.log(`✅ Created ${itemCount.count} items`);
  console.log(`✅ Created ${sizeCount.count} item size records`);
  
  // Seed volunteer sessions
  console.log('👥 Creating volunteer sessions...');
  
  const volunteerNames = [
    'Sarah Johnson', 'Mike Davis', 'Emily Chen', 'David Rodriguez', 'Lisa Thompson',
    'James Wilson', 'Maria Garcia', 'Robert Kim', 'Jennifer Lee', 'Michael Brown',
    'Ashley Martinez', 'Christopher Taylor', 'Amanda White', 'Daniel Anderson', 'Jessica Moore'
  ];
  
  const tasks = [
    'Sorting donations', 'Organizing inventory', 'Restocking shelves', 'Quality checking items',
    'Data entry', 'Helping families', 'Cleaning and organizing', 'Inventory counting',
    'Donation intake', 'Client assistance', 'Administrative support', 'Special projects'
  ];
  
  const insertVolunteerSession = db.prepare(`
    INSERT INTO volunteer_sessions (location_id, volunteer_name, session_date, start_time, end_time, hours_worked, tasks_performed, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Create sessions for the past 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  let sessionCount = 0;
  
  // Generate completed sessions (past dates)
  for (let i = 0; i < 25; i++) {
    const randomDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (today.getTime() - thirtyDaysAgo.getTime()));
    const dateStr = randomDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const startHour = Math.floor(Math.random() * 8) + 9; // 9 AM to 4 PM start times
    const durationHours = Math.random() * 6 + 1; // 1 to 7 hours
    const endHour = startHour + durationHours;
    
    const startTime = `${startHour.toString().padStart(2, '0')}:${(Math.random() * 60).toFixed(0).padStart(2, '0')}`;
    const endTime = `${Math.floor(endHour).toString().padStart(2, '0')}:${((endHour % 1) * 60).toFixed(0).padStart(2, '0')}`;
    
    const volunteerName = volunteerNames[Math.floor(Math.random() * volunteerNames.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const taskList = [];
    
    // Add 1-3 random tasks
    const numTasks = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numTasks; j++) {
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      if (!taskList.includes(task)) {
        taskList.push(task);
      }
    }
    
    const notes = [
      'Great work today!',
      'Very helpful with families',
      'Excellent attention to detail',
      'Completed all assigned tasks',
      'Wonderful volunteer spirit',
      'Asked thoughtful questions',
      'Worked efficiently',
      'Positive attitude throughout shift',
      '',
      '' // Some sessions with no notes
    ][Math.floor(Math.random() * 10)];
    
    insertVolunteerSession.run(
      location.location_id,
      volunteerName,
      dateStr,
      startTime,
      endTime,
      durationHours.toFixed(2),
      taskList.join(', '),
      notes
    );
    
    sessionCount++;
  }
  
  // Generate in-progress sessions (today's date, no end time)
  const todayStr = today.toISOString().split('T')[0];
  
  for (let i = 0; i < 5; i++) {
    const startHour = Math.floor(Math.random() * 6) + 8; // 8 AM to 1 PM start times (currently in progress)
    const startTime = `${startHour.toString().padStart(2, '0')}:${(Math.random() * 60).toFixed(0).padStart(2, '0')}`;
    
    const volunteerName = volunteerNames[Math.floor(Math.random() * volunteerNames.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const currentTasks = [tasks[Math.floor(Math.random() * tasks.length)]];
    
    insertVolunteerSession.run(
      location.location_id,
      volunteerName,
      todayStr,
      startTime,
      null, // end_time is null for in-progress sessions
      null, // hours_worked is null for in-progress sessions
      currentTasks.join(', '),
      'Session in progress'
    );
    
    sessionCount++;
    console.log(`  🔄 In-progress session: ${volunteerName} at ${location.name} (started ${startTime})`);
  }
  
  console.log(`✅ Created ${sessionCount} volunteer sessions (${sessionCount - 5} completed, 5 in-progress)`);
  
  db.close();
  
  console.log('🎉 Comprehensive Rainbow Room database seeding complete!');
  console.log('');
  console.log('This includes the full Rainbow Room inventory system:');
  console.log('  • Complete boys and girls clothing categories with all sizes');
  console.log('  • Baby care items including diapers and feeding supplies');
  console.log('  • Personal hygiene and toiletry items');
  console.log('  • School supplies and educational materials');
  console.log('  • Household items and emergency supplies');
  console.log('  • Toys, games, and recreational activities');
  console.log('  • Volunteer session data (completed and in-progress)');
  console.log('');
  console.log('Each item is distributed across all active locations with realistic quantities.');
  console.log('Volunteer sessions span the past 30 days with realistic hours and tasks.');
  
} catch (error) {
  console.error('❌ Comprehensive database seeding failed:', error.message);
  console.error(error);
  process.exit(1);
}