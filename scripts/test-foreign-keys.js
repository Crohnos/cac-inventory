/**
 * Test Foreign Key Enforcement
 * This script verifies that foreign key constraints are properly enforced
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), 'data', 'inventory.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Verify foreign keys are enabled
const fkEnabled = db.pragma('foreign_keys', { simple: true });
console.log(`\n🔍 Foreign Keys Status: ${fkEnabled === 1 ? '✅ ENABLED' : '❌ DISABLED'}`);

if (fkEnabled !== 1) {
  console.error('❌ Foreign keys are not enabled!');
  process.exit(1);
}

console.log('\n📝 Testing Foreign Key Constraints...\n');

// Test 1: Try to insert checkout_item with invalid checkout_id (should fail)
console.log('Test 1: Insert checkout_item with invalid checkout_id');
try {
  db.prepare(`
    INSERT INTO checkout_items (checkout_id, size_id, quantity)
    VALUES (99999, 1, 1)
  `).run();
  console.log('❌ FAILED: Should have thrown foreign key error');
} catch (error) {
  if (error.message.includes('FOREIGN KEY constraint failed')) {
    console.log('✅ PASSED: Foreign key constraint blocked invalid checkout_id');
  } else {
    console.log(`❌ FAILED: Wrong error: ${error.message}`);
  }
}

// Test 2: Try to insert checkout_item with invalid size_id (should fail)
console.log('\nTest 2: Insert checkout_item with invalid size_id');
try {
  // Get a valid checkout_id first
  const validCheckout = db.prepare('SELECT checkout_id FROM checkouts LIMIT 1').get();
  if (validCheckout) {
    db.prepare(`
      INSERT INTO checkout_items (checkout_id, size_id, quantity)
      VALUES (?, 99999, 1)
    `).run(validCheckout.checkout_id);
    console.log('❌ FAILED: Should have thrown foreign key error');
  } else {
    console.log('⚠️  SKIPPED: No checkouts in database');
  }
} catch (error) {
  if (error.message.includes('FOREIGN KEY constraint failed')) {
    console.log('✅ PASSED: Foreign key constraint blocked invalid size_id');
  } else {
    console.log(`❌ FAILED: Wrong error: ${error.message}`);
  }
}

// Test 3: Try to delete an item that has checkouts (should fail with RESTRICT)
console.log('\nTest 3: Delete item that has associated checkout_items');
try {
  // Find an item that has checkout_items
  const itemWithCheckouts = db.prepare(`
    SELECT DISTINCT i.item_id, i.name
    FROM items i
    JOIN item_sizes isize ON i.item_id = isize.item_id
    JOIN checkout_items ci ON isize.size_id = ci.size_id
    LIMIT 1
  `).get();

  if (itemWithCheckouts) {
    db.prepare('DELETE FROM items WHERE item_id = ?').run(itemWithCheckouts.item_id);
    console.log('❌ FAILED: Should have thrown foreign key error');
  } else {
    console.log('⚠️  SKIPPED: No items with checkouts found');
  }
} catch (error) {
  if (error.message.includes('FOREIGN KEY constraint failed')) {
    console.log('✅ PASSED: Foreign key constraint prevented deletion of referenced item');
  } else {
    console.log(`❌ FAILED: Wrong error: ${error.message}`);
  }
}

// Test 4: Test CASCADE delete (deleting checkout should delete checkout_items)
console.log('\nTest 4: Test CASCADE delete on checkout');
try {
  // Create a test checkout and items
  const testCheckout = db.prepare(`
    INSERT INTO checkouts (
      worker_first_name, worker_last_name, parent_guardian_first_name,
      parent_guardian_last_name, child_first_name, child_last_name,
      child_age, allegations, checkout_date, checkout_items_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Test', 'Worker', 'Test', 'Parent', 'Test', 'Child',
    5, '[]', '2025-10-24', '[]'
  );

  const checkoutId = testCheckout.lastInsertRowid;

  // Add a checkout_item
  const sizeId = db.prepare('SELECT size_id FROM item_sizes LIMIT 1').get()?.size_id;
  if (sizeId) {
    db.prepare(`
      INSERT INTO checkout_items (checkout_id, size_id, quantity)
      VALUES (?, ?, ?)
    `).run(checkoutId, sizeId, 1);

    // Verify the item was created
    const itemsBefore = db.prepare(
      'SELECT COUNT(*) as count FROM checkout_items WHERE checkout_id = ?'
    ).get(checkoutId);

    // Delete the checkout (should cascade to checkout_items)
    db.prepare('DELETE FROM checkouts WHERE checkout_id = ?').run(checkoutId);

    // Verify checkout_items were deleted
    const itemsAfter = db.prepare(
      'SELECT COUNT(*) as count FROM checkout_items WHERE checkout_id = ?'
    ).get(checkoutId);

    if (itemsBefore.count > 0 && itemsAfter.count === 0) {
      console.log('✅ PASSED: CASCADE delete removed checkout_items');
    } else {
      console.log('❌ FAILED: CASCADE delete did not work properly');
    }
  } else {
    console.log('⚠️  SKIPPED: No item_sizes in database');
  }
} catch (error) {
  console.log(`❌ FAILED: ${error.message}`);
}

console.log('\n✅ Foreign Key Tests Complete!\n');

db.close();
