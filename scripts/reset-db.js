#!/usr/bin/env node

import { unlinkSync, existsSync } from 'fs';

const DB_PATH = 'data/inventory.db';

console.log('🗑️  Resetting Rainbow Room Inventory Database...');

try {
    if (existsSync(DB_PATH)) {
        unlinkSync(DB_PATH);
        console.log('✅ Removed existing database file');
    } else {
        console.log('ℹ️  No existing database file found');
    }
    
    console.log('🔄 Database reset complete!');
    console.log('');
    console.log('To recreate the database, run:');
    console.log('  npm run setup-db');
    
} catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
}