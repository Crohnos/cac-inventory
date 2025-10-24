/**
 * Remove Duplicate Transaction System
 *
 * This script removes the redundant inventory_transactions table and its indexes.
 * The specialized transaction tables (checkouts, inventory_additions, inventory_transfers,
 * inventory_adjustments) are the single source of truth.
 *
 * The reportService.getTransactionHistory() method provides a unified view without duplication.
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'inventory.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('\n🗑️  Removing Duplicate Transaction System\n');
console.log('='.repeat(60));

try {
  // Check if table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='inventory_transactions'
  `).get();

  if (!tableExists) {
    console.log('\n⚠️  Table inventory_transactions does not exist. Already removed?\n');
    process.exit(0);
  }

  // Count records before deletion
  const recordCount = db.prepare('SELECT COUNT(*) as count FROM inventory_transactions').get();
  console.log(`\n📊 Found ${recordCount.count} records in inventory_transactions table`);

  // Get list of indexes for this table
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='index'
      AND tbl_name='inventory_transactions'
      AND name NOT LIKE 'sqlite_%'
  `).all();

  console.log(`📊 Found ${indexes.length} indexes to drop`);

  // Drop all indexes first
  if (indexes.length > 0) {
    console.log('\n📋 Dropping indexes...');
    for (const index of indexes) {
      db.exec(`DROP INDEX IF EXISTS ${index.name}`);
      console.log(`   ✓ Dropped index: ${index.name}`);
    }
  }

  // Drop the table
  console.log('\n📋 Dropping inventory_transactions table...');
  db.exec('DROP TABLE inventory_transactions');
  console.log('   ✓ Table dropped successfully');

  // Verify it's gone
  const stillExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='inventory_transactions'
  `).get();

  if (stillExists) {
    console.log('\n❌ ERROR: Table still exists after drop!');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Duplicate Transaction System Removed Successfully!\n');

  console.log('📋 Summary:');
  console.log(`   • Removed inventory_transactions table (${recordCount.count} records)`);
  console.log(`   • Dropped ${indexes.length} indexes`);
  console.log('   • Transaction history still available via specialized tables');
  console.log('   • Use reportService.getTransactionHistory() for unified view\n');

} catch (error) {
  console.error(`\n❌ Failed to remove duplicate transaction system: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
}
