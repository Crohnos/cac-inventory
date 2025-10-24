/**
 * Test CHECK Constraints
 * Verify that CHECK constraints prevent invalid data
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'inventory.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('\n🔒 Testing CHECK Constraints\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

// Test 1: Try to set negative inventory
console.log('\nTest 1: Attempt to set negative inventory');
try {
  db.prepare('UPDATE item_sizes SET current_quantity = -10 WHERE size_id = 1').run();
  console.log('❌ FAILED: Should have blocked negative inventory');
  failed++;
} catch (error) {
  if (error.message.includes('CHECK constraint failed')) {
    console.log('✅ PASSED: CHECK constraint prevented negative inventory');
    passed++;
  } else {
    console.log(`❌ FAILED: Wrong error: ${error.message}`);
    failed++;
  }
}

// Test 2: Try to insert checkout_item with zero quantity
console.log('\nTest 2: Attempt to insert checkout_item with zero quantity');
try {
  const checkout = db.prepare('SELECT checkout_id FROM checkouts LIMIT 1').get();
  const size = db.prepare('SELECT size_id FROM item_sizes LIMIT 1').get();

  if (checkout && size) {
    db.prepare(`
      INSERT INTO checkout_items (checkout_id, item_id, size_id, quantity, item_name)
      VALUES (?, 1, ?, 0, 'Test Item')
    `).run(checkout.checkout_id, size.size_id);

    console.log('❌ FAILED: Should have blocked zero quantity');
    failed++;
  } else {
    console.log('⚠️  SKIPPED: No data to test with');
  }
} catch (error) {
  if (error.message.includes('CHECK constraint failed')) {
    console.log('✅ PASSED: CHECK constraint prevented zero quantity');
    passed++;
  } else {
    console.log(`❌ FAILED: Wrong error: ${error.message}`);
    failed++;
  }
}

// Test 3: Try to insert checkout_item with negative quantity
console.log('\nTest 3: Attempt to insert checkout_item with negative quantity');
try {
  const checkout = db.prepare('SELECT checkout_id FROM checkouts LIMIT 1').get();
  const size = db.prepare('SELECT size_id FROM item_sizes LIMIT 1').get();

  if (checkout && size) {
    db.prepare(`
      INSERT INTO checkout_items (checkout_id, item_id, size_id, quantity, item_name)
      VALUES (?, 1, ?, -5, 'Test Item')
    `).run(checkout.checkout_id, size.size_id);

    console.log('❌ FAILED: Should have blocked negative quantity');
    failed++;
  } else {
    console.log('⚠️  SKIPPED: No data to test with');
  }
} catch (error) {
  if (error.message.includes('CHECK constraint failed')) {
    console.log('✅ PASSED: CHECK constraint prevented negative quantity');
    passed++;
  } else {
    console.log(`❌ FAILED: Wrong error: ${error.message}`);
    failed++;
  }
}

// Test 4: Try to insert inventory_adjustment_item with zero adjustment
console.log('\nTest 4: Attempt to insert adjustment with zero quantity_adjustment');
try {
  const adjustment = db.prepare('SELECT adjustment_id FROM inventory_adjustments LIMIT 1').get();
  const size = db.prepare('SELECT size_id FROM item_sizes LIMIT 1').get();

  if (adjustment && size) {
    db.prepare(`
      INSERT INTO inventory_adjustment_items
        (adjustment_id, item_id, size_id, quantity_adjustment, item_name)
      VALUES (?, 1, ?, 0, 'Test Item')
    `).run(adjustment.adjustment_id, size.size_id);

    console.log('❌ FAILED: Should have blocked zero adjustment');
    failed++;
  } else {
    console.log('⚠️  SKIPPED: No data to test with');
  }
} catch (error) {
  if (error.message.includes('CHECK constraint failed')) {
    console.log('✅ PASSED: CHECK constraint prevented zero adjustment');
    passed++;
  } else {
    console.log(`❌ FAILED: Wrong error: ${error.message}`);
    failed++;
  }
}

// Test 5: Valid operations should still work
console.log('\nTest 5: Verify valid operations still work');
try {
  // Get current inventory level
  const size = db.prepare('SELECT size_id, current_quantity FROM item_sizes LIMIT 1').get();

  if (size && size.current_quantity > 0) {
    const before = size.current_quantity;

    // Try setting to a valid positive number
    db.prepare('UPDATE item_sizes SET current_quantity = ? WHERE size_id = ?')
      .run(before, size.size_id);

    const after = db.prepare('SELECT current_quantity FROM item_sizes WHERE size_id = ?')
      .get(size.size_id);

    if (after.current_quantity === before) {
      console.log('✅ PASSED: Valid operations work correctly');
      passed++;
    } else {
      console.log('❌ FAILED: Valid operation produced unexpected result');
      failed++;
    }
  } else {
    console.log('⚠️  SKIPPED: No data to test with');
  }
} catch (error) {
  console.log(`❌ FAILED: Valid operation failed: ${error.message}`);
  failed++;
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All CHECK constraint tests passed!\n');
} else {
  console.log('⚠️  Some tests failed. Review errors above.\n');
  process.exit(1);
}

db.close();
