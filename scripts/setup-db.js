#!/usr/bin/env node

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const DB_PATH = 'data/inventory.db';
const DB_PASSWORD = process.env.DB_PASSWORD || 'rainbow-room-secure-2024';

console.log('🌈 Setting up Rainbow Room Inventory Database...');

try {
    // Create data directory if it doesn't exist
    const { mkdirSync } = await import('fs');
    try {
        mkdirSync('data', { recursive: true });
    } catch (err) {
        // Directory might already exist, that's okay
    }

    // Connect to database
    const db = new Database(DB_PATH);
    
    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    console.log('✅ Database connection established');

    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema at once instead of splitting
    console.log('📝 Executing database schema...');
    
    try {
        db.exec(schema);
        console.log('✅ Schema executed successfully');
    } catch (err) {
        console.error('❌ Failed to execute schema:', err.message);
        process.exit(1);
    }
    
    // Verify tables were created
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    console.log('✅ Created tables:', tables.map(t => t.name).join(', '));
    
    // Insert initial locations
    console.log('📍 Setting up initial locations...');
    const insertLocation = db.prepare(`
        INSERT OR IGNORE INTO locations (name, city, state) 
        VALUES (?, ?, ?)
    `);
    
    const locations = [
        ['McKinney', 'McKinney', 'TX'],
        ['Plano', 'Plano', 'TX']
    ];
    
    for (const [name, city, state] of locations) {
        insertLocation.run(name, city, state);
        console.log(`  ➕ Added location: ${name}, ${city}`);
    }
    
    // Verify locations were added
    const locationCount = db.prepare("SELECT COUNT(*) as count FROM locations").get();
    console.log(`✅ Total locations: ${locationCount.count}`);
    
    db.close();
    
    console.log('🎉 Database setup complete!');
    console.log(`📍 Database location: ${DB_PATH}`);
    console.log('');
    console.log('Next steps:');
    console.log('  npm install              # Install dependencies');
    console.log('  npm run seed-data        # Add sample inventory data (optional)');
    console.log('  npm run dev              # Start development server');
    
} catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
}