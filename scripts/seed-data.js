#!/usr/bin/env node

import Database from 'better-sqlite3';

// Database configuration
const DB_PATH = 'data/inventory.db';

console.log('🌱 Seeding Rainbow Room Inventory Database...');

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
    
    // Sample items data
    const sampleItems = [
        {
            name: 'Baby Shoes',
            description: 'Various styles of baby shoes',
            storage_location: 'Bin A-1',
            has_sizes: true,
            sizes: ['0-3 months', '3-6 months', '6-12 months', '12-18 months']
        },
        {
            name: 'T-Shirts (Child)',
            description: 'Basic t-shirts for children',
            storage_location: 'Bin B-2',
            has_sizes: true,
            sizes: ['2T', '3T', '4T', 'XS', 'S', 'M', 'L']
        },
        {
            name: 'Toothbrushes',
            description: 'Individual toothbrushes',
            storage_location: 'Bin C-1',
            has_sizes: false,
            sizes: []
        },
        {
            name: 'Teddy Bears',
            description: 'Plush teddy bears for comfort',
            storage_location: 'Bin D-3',
            has_sizes: false,
            sizes: []
        },
        {
            name: 'Soap Bars',
            description: 'Individual soap bars',
            storage_location: 'Bin C-2',
            has_sizes: false,
            sizes: []
        }
    ];
    
    const insertItem = db.prepare(`
        INSERT INTO items (name, description, storage_location, has_sizes, min_stock_level, unit_type)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertItemSize = db.prepare(`
        INSERT INTO item_sizes (item_id, location_id, size_label, current_quantity, min_stock_level, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    console.log('📦 Creating sample items...');

    // Begin transaction
    const transaction = db.transaction(() => {
        for (const itemData of sampleItems) {
            // Insert item
            const result = insertItem.run(
                itemData.name,
                itemData.description,
                itemData.storage_location,
                itemData.has_sizes ? 1 : 0,
                5, // min_stock_level
                'each'
            );
            
            const itemId = result.lastInsertRowid;
            console.log(`  ➕ Created item: ${itemData.name} (ID: ${itemId})`);
            
            // Insert sizes for each location
            if (itemData.has_sizes && itemData.sizes.length > 0) {
                for (const location of locations) {
                    for (let i = 0; i < itemData.sizes.length; i++) {
                        const sizeLabel = itemData.sizes[i];
                        // Random quantity between 5-50 for demo purposes
                        const quantity = Math.floor(Math.random() * 46) + 5;
                        
                        insertItemSize.run(
                            itemId,
                            location.location_id,
                            sizeLabel,
                            quantity,
                            3, // min_stock_level for sizes
                            i // sort_order
                        );
                        
                        console.log(`    📏 ${location.name}: ${sizeLabel} (${quantity} units)`);
                    }
                }
            } else {
                // Items without sizes - create one record per location
                for (const location of locations) {
                    const quantity = Math.floor(Math.random() * 46) + 5;
                    
                    insertItemSize.run(
                        itemId,
                        location.location_id,
                        'N/A', // size_label for non-sized items
                        quantity,
                        5, // min_stock_level
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
    
    db.close();
    
    console.log('🎉 Database seeding complete!');
    console.log('');
    console.log('Sample data includes:');
    sampleItems.forEach(item => {
        console.log(`  • ${item.name}: ${item.has_sizes ? item.sizes.join(', ') : 'No sizes'}`);
    });
    console.log('');
    console.log('Each item is available at all active locations with random quantities.');
    
} catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    console.error(error);
    process.exit(1);
}