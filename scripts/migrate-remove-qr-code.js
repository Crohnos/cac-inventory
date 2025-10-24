#!/usr/bin/env node

import Database from 'better-sqlite3';

// Database configuration
const DB_PATH = 'data/inventory.db';

console.log('🔄 Migrating database: Removing qr_code field from items table...');

try {
  // Connect to database
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = OFF'); // Disable FK constraints for migration

  // Check if qr_code column exists
  const tableInfo = db.prepare("PRAGMA table_info(items)").all();
  const hasQrCode = tableInfo.some(col => col.name === 'qr_code');

  if (!hasQrCode) {
    console.log('✅ qr_code column does not exist. Nothing to migrate.');
    db.close();
    process.exit(0);
  }

  console.log('📋 Found qr_code column. Starting migration...');

  // SQLite doesn't support DROP COLUMN directly
  // We need to: create new table, copy data, drop old table, rename new table

  const transaction = db.transaction(() => {
    // 1. Create new items table without qr_code
    db.exec(`
      CREATE TABLE items_new (
        item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        storage_location TEXT,
        has_sizes BOOLEAN NOT NULL DEFAULT 0,
        min_stock_level INTEGER DEFAULT 5,
        unit_type TEXT DEFAULT 'each',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Copy data from old table to new table
    db.exec(`
      INSERT INTO items_new (item_id, name, description, storage_location, has_sizes, min_stock_level, unit_type, created_at, updated_at)
      SELECT item_id, name, description, storage_location, has_sizes, min_stock_level, unit_type, created_at, updated_at
      FROM items
    `);

    // 3. Drop old table
    db.exec('DROP TABLE items');

    // 4. Rename new table to items
    db.exec('ALTER TABLE items_new RENAME TO items');

    // 5. Drop old index
    try {
      db.exec('DROP INDEX IF EXISTS idx_items_qr_code');
    } catch (e) {
      // Index might not exist, ignore
    }

    // 6. Recreate triggers
    db.exec(`
      DROP TRIGGER IF EXISTS update_items_timestamp;

      CREATE TRIGGER update_items_timestamp
        AFTER UPDATE ON items
        BEGIN
          UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE item_id = NEW.item_id;
        END;
    `);
  });

  transaction();

  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');

  // Verify migration
  const newTableInfo = db.prepare("PRAGMA table_info(items)").all();
  const stillHasQrCode = newTableInfo.some(col => col.name === 'qr_code');

  if (stillHasQrCode) {
    throw new Error('Migration failed: qr_code column still exists');
  }

  const itemCount = db.prepare("SELECT COUNT(*) as count FROM items").get();
  console.log(`✅ Successfully migrated ${itemCount.count} items`);

  db.close();

  console.log('🎉 Migration complete!');
  console.log('');
  console.log('Changes:');
  console.log('  • Removed qr_code column from items table');
  console.log('  • Removed idx_items_qr_code index');
  console.log('  • QR codes now use item_id in URLs (e.g., /items/123?qr=true)');
  console.log('');
  console.log('Note: Existing QR code labels will still work - they just navigate to the item by ID');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error(error);
  process.exit(1);
}
