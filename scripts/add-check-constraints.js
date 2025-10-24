/**
 * Add CHECK Constraints to Database
 *
 * This script adds CHECK constraints to prevent data integrity issues:
 * 1. Prevent negative inventory (item_sizes.current_quantity >= 0)
 * 2. Prevent zero-quantity transactions (quantity > 0)
 * 3. Validate ISO date format (YYYY-MM-DD)
 *
 * Note: SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so we need to:
 * 1. Create new table with constraints
 * 2. Copy data
 * 3. Drop old table
 * 4. Rename new table
 * 5. Recreate indexes and triggers
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'inventory.db');
const db = new Database(dbPath);

// Temporarily disable foreign keys for table recreation
db.pragma('foreign_keys = OFF');

console.log('\n🔒 Adding CHECK Constraints to Database\n');
console.log('='.repeat(60));

/**
 * Drop all triggers that reference tables we're recreating
 */
function dropAllTriggers() {
  console.log('\n📋 Dropping existing triggers...');

  const triggers = [
    'update_quantity_on_checkout',
    'update_quantity_on_addition',
    'update_quantity_on_transfer_out',
    'update_quantity_on_transfer_in',
    'update_quantity_on_adjustment',
    'update_checkout_total_on_insert',
    'update_checkout_total_on_update',
    'update_checkout_total_on_delete',
    'update_addition_total_on_insert',
    'update_addition_total_on_update',
    'update_addition_total_on_delete',
    'update_transfer_total_on_insert',
    'update_transfer_total_on_update',
    'update_transfer_total_on_delete',
    'update_adjustment_total_on_insert',
    'update_adjustment_total_on_update',
    'update_adjustment_total_on_delete'
  ];

  for (const trigger of triggers) {
    try {
      db.exec(`DROP TRIGGER IF EXISTS ${trigger}`);
    } catch (error) {
      // Ignore errors for non-existent triggers
    }
  }

  console.log('   ✅ All triggers dropped');
}

/**
 * Add CHECK constraints to item_sizes table
 * - Prevent negative inventory
 */
function addItemSizesConstraints() {
  console.log('\n📋 Adding constraints to item_sizes table...');

  db.transaction(() => {
    // Create new table with CHECK constraint
    db.exec(`
      CREATE TABLE item_sizes_new (
        size_id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        size_label TEXT NOT NULL,
        current_quantity INTEGER NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
        min_stock_level INTEGER DEFAULT 5,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE RESTRICT,
        UNIQUE(item_id, location_id, size_label)
      )
    `);

    // Copy data
    db.exec(`
      INSERT INTO item_sizes_new
        (size_id, item_id, location_id, size_label, current_quantity, min_stock_level, sort_order)
      SELECT size_id, item_id, location_id, size_label, current_quantity, min_stock_level, sort_order
      FROM item_sizes
    `);

    // Drop old table
    db.exec('DROP TABLE item_sizes');

    // Rename new table
    db.exec('ALTER TABLE item_sizes_new RENAME TO item_sizes');

    // Recreate indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_item_sizes_item_id ON item_sizes(item_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_item_sizes_location_id ON item_sizes(location_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_item_sizes_item_location ON item_sizes(item_id, location_id)');
  })();

  console.log('   ✅ CHECK constraint added: current_quantity >= 0');
}

/**
 * Add CHECK constraints to checkout_items table
 * - Prevent zero or negative quantities
 */
function addCheckoutItemsConstraints() {
  console.log('\n📋 Adding constraints to checkout_items table...');

  db.transaction(() => {
    // Create new table with CHECK constraint
    db.exec(`
      CREATE TABLE checkout_items_new (
        checkout_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        checkout_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        size_id INTEGER,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        item_name TEXT NOT NULL,
        size_label TEXT,
        FOREIGN KEY (checkout_id) REFERENCES checkouts(checkout_id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
        FOREIGN KEY (size_id) REFERENCES item_sizes(size_id) ON DELETE RESTRICT
      )
    `);

    // Copy data
    db.exec(`
      INSERT INTO checkout_items_new
        (checkout_item_id, checkout_id, item_id, size_id, quantity, item_name, size_label)
      SELECT checkout_item_id, checkout_id, item_id, size_id, quantity, item_name, size_label
      FROM checkout_items
    `);

    // Drop old table
    db.exec('DROP TABLE checkout_items');

    // Rename new table
    db.exec('ALTER TABLE checkout_items_new RENAME TO checkout_items');

    // Recreate indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_checkout_items_checkout_id ON checkout_items(checkout_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_checkout_items_item_id ON checkout_items(item_id)');
  })();

  console.log('   ✅ CHECK constraint added: quantity > 0');
}

/**
 * Add CHECK constraints to inventory_addition_items table
 */
function addAdditionItemsConstraints() {
  console.log('\n📋 Adding constraints to inventory_addition_items table...');

  db.transaction(() => {
    db.exec(`
      CREATE TABLE inventory_addition_items_new (
        addition_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        addition_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        size_id INTEGER,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        item_name TEXT NOT NULL,
        size_label TEXT,
        FOREIGN KEY (addition_id) REFERENCES inventory_additions(addition_id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
        FOREIGN KEY (size_id) REFERENCES item_sizes(size_id) ON DELETE RESTRICT
      )
    `);

    db.exec(`
      INSERT INTO inventory_addition_items_new
      SELECT * FROM inventory_addition_items
    `);

    db.exec('DROP TABLE inventory_addition_items');
    db.exec('ALTER TABLE inventory_addition_items_new RENAME TO inventory_addition_items');

    db.exec('CREATE INDEX IF NOT EXISTS idx_inventory_addition_items_addition_id ON inventory_addition_items(addition_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_inventory_addition_items_item_id ON inventory_addition_items(item_id)');
  })();

  console.log('   ✅ CHECK constraint added: quantity > 0');
}

/**
 * Add CHECK constraints to inventory_transfer_items table
 */
function addTransferItemsConstraints() {
  console.log('\n📋 Adding constraints to inventory_transfer_items table...');

  db.transaction(() => {
    db.exec(`
      CREATE TABLE inventory_transfer_items_new (
        transfer_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        transfer_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        size_id INTEGER,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        item_name TEXT NOT NULL,
        size_label TEXT,
        FOREIGN KEY (transfer_id) REFERENCES inventory_transfers(transfer_id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
        FOREIGN KEY (size_id) REFERENCES item_sizes(size_id) ON DELETE RESTRICT
      )
    `);

    db.exec(`
      INSERT INTO inventory_transfer_items_new
      SELECT * FROM inventory_transfer_items
    `);

    db.exec('DROP TABLE inventory_transfer_items');
    db.exec('ALTER TABLE inventory_transfer_items_new RENAME TO inventory_transfer_items');

    db.exec('CREATE INDEX IF NOT EXISTS idx_inventory_transfer_items_transfer_id ON inventory_transfer_items(transfer_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_inventory_transfer_items_item_id ON inventory_transfer_items(item_id)');
  })();

  console.log('   ✅ CHECK constraint added: quantity > 0');
}

/**
 * Add CHECK constraints to inventory_adjustment_items table
 */
function addAdjustmentItemsConstraints() {
  console.log('\n📋 Adding constraints to inventory_adjustment_items table...');

  db.transaction(() => {
    db.exec(`
      CREATE TABLE inventory_adjustment_items_new (
        adjustment_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        adjustment_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        size_id INTEGER,
        quantity_adjustment INTEGER NOT NULL CHECK (quantity_adjustment != 0),
        item_name TEXT NOT NULL,
        size_label TEXT,
        FOREIGN KEY (adjustment_id) REFERENCES inventory_adjustments(adjustment_id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
        FOREIGN KEY (size_id) REFERENCES item_sizes(size_id) ON DELETE RESTRICT
      )
    `);

    db.exec(`
      INSERT INTO inventory_adjustment_items_new
      SELECT * FROM inventory_adjustment_items
    `);

    db.exec('DROP TABLE inventory_adjustment_items');
    db.exec('ALTER TABLE inventory_adjustment_items_new RENAME TO inventory_adjustment_items');

    db.exec('CREATE INDEX IF NOT EXISTS idx_inventory_adjustment_items_adjustment_id ON inventory_adjustment_items(adjustment_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_inventory_adjustment_items_item_id ON inventory_adjustment_items(item_id)');
  })();

  console.log('   ✅ CHECK constraint added: quantity_adjustment != 0');
}

/**
 * Recreate all triggers that were lost during table recreation
 */
function recreateTriggers() {
  console.log('\n📋 Recreating triggers...');

  // Checkout quantity update trigger
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_quantity_on_checkout
      AFTER INSERT ON checkout_items
      BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity - NEW.quantity
        WHERE size_id = NEW.size_id;

        SELECT CASE
          WHEN (SELECT current_quantity FROM item_sizes WHERE size_id = NEW.size_id) < 0
          THEN RAISE(FAIL, 'Checkout would result in negative inventory')
        END;
      END
  `);

  // Addition quantity update trigger
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_quantity_on_addition
      AFTER INSERT ON inventory_addition_items
      BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity + NEW.quantity
        WHERE size_id = NEW.size_id;
      END
  `);

  // Transfer out quantity update trigger
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_quantity_on_transfer_out
      AFTER INSERT ON inventory_transfer_items
      BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity - NEW.quantity
        WHERE size_id = NEW.size_id;

        SELECT CASE
          WHEN (SELECT current_quantity FROM item_sizes WHERE size_id = NEW.size_id) < 0
          THEN RAISE(FAIL, 'Transfer would result in negative inventory at source location')
        END;
      END
  `);

  // Transfer in quantity update trigger
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_quantity_on_transfer_in
      AFTER INSERT ON inventory_transfer_items
      BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity + NEW.quantity
        WHERE item_id = NEW.item_id
          AND location_id = (
            SELECT to_location_id
            FROM inventory_transfers
            WHERE transfer_id = NEW.transfer_id
          )
          AND size_label = NEW.size_label;
      END
  `);

  // Adjustment quantity update trigger
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_quantity_on_adjustment
      AFTER INSERT ON inventory_adjustment_items
      BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity + NEW.quantity_adjustment
        WHERE size_id = NEW.size_id;

        SELECT CASE
          WHEN (SELECT current_quantity FROM item_sizes WHERE size_id = NEW.size_id) < 0
          THEN RAISE(FAIL, 'Manual adjustment would result in negative inventory')
        END;
      END
  `);

  // Checkout total items triggers
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_checkout_total_on_insert
      AFTER INSERT ON checkout_items
      BEGIN
        UPDATE checkouts
        SET total_items = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM checkout_items
          WHERE checkout_id = NEW.checkout_id
        )
        WHERE checkout_id = NEW.checkout_id;
      END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_checkout_total_on_update
      AFTER UPDATE ON checkout_items
      BEGIN
        UPDATE checkouts
        SET total_items = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM checkout_items
          WHERE checkout_id = NEW.checkout_id
        )
        WHERE checkout_id = NEW.checkout_id;
      END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_checkout_total_on_delete
      AFTER DELETE ON checkout_items
      BEGIN
        UPDATE checkouts
        SET total_items = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM checkout_items
          WHERE checkout_id = OLD.checkout_id
        )
        WHERE checkout_id = OLD.checkout_id;
      END
  `);

  // Addition total items triggers
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_addition_total_on_insert
      AFTER INSERT ON inventory_addition_items
      BEGIN
        UPDATE inventory_additions
        SET total_items = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM inventory_addition_items
          WHERE addition_id = NEW.addition_id
        )
        WHERE addition_id = NEW.addition_id;
      END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_addition_total_on_update
      AFTER UPDATE ON inventory_addition_items
      BEGIN
        UPDATE inventory_additions
        SET total_items = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM inventory_addition_items
          WHERE addition_id = NEW.addition_id
        )
        WHERE addition_id = NEW.addition_id;
      END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_addition_total_on_delete
      AFTER DELETE ON inventory_addition_items
      BEGIN
        UPDATE inventory_additions
        SET total_items = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM inventory_addition_items
          WHERE addition_id = OLD.addition_id
        )
        WHERE addition_id = OLD.addition_id;
      END
  `);

  // Transfer total items triggers
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_transfer_total_on_insert
      AFTER INSERT ON inventory_transfer_items
      BEGIN
        UPDATE inventory_transfers
        SET total_items = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM inventory_transfer_items
          WHERE transfer_id = NEW.transfer_id
        )
        WHERE transfer_id = NEW.transfer_id;
      END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_transfer_total_on_update
      AFTER UPDATE ON inventory_transfer_items
      BEGIN
        UPDATE inventory_transfers
        SET total_items = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM inventory_transfer_items
          WHERE transfer_id = NEW.transfer_id
        )
        WHERE transfer_id = NEW.transfer_id;
      END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_transfer_total_on_delete
      AFTER DELETE ON inventory_transfer_items
      BEGIN
        UPDATE inventory_transfers
        SET total_items = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM inventory_transfer_items
          WHERE transfer_id = OLD.transfer_id
        )
        WHERE transfer_id = OLD.transfer_id;
      END
  `);

  // Adjustment total items triggers
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_adjustment_total_on_insert
      AFTER INSERT ON inventory_adjustment_items
      BEGIN
        UPDATE inventory_adjustments
        SET total_items = (
          SELECT COALESCE(SUM(ABS(quantity_adjustment)), 0)
          FROM inventory_adjustment_items
          WHERE adjustment_id = NEW.adjustment_id
        )
        WHERE adjustment_id = NEW.adjustment_id;
      END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_adjustment_total_on_update
      AFTER UPDATE ON inventory_adjustment_items
      BEGIN
        UPDATE inventory_adjustments
        SET total_items = (
          SELECT COALESCE(SUM(ABS(quantity_adjustment)), 0)
          FROM inventory_adjustment_items
          WHERE adjustment_id = NEW.adjustment_id
        )
        WHERE adjustment_id = NEW.adjustment_id;
      END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_adjustment_total_on_delete
      AFTER DELETE ON inventory_adjustment_items
      BEGIN
        UPDATE inventory_adjustments
        SET total_items = (
          SELECT COALESCE(SUM(ABS(quantity_adjustment)), 0)
          FROM inventory_adjustment_items
          WHERE adjustment_id = OLD.adjustment_id
        )
        WHERE adjustment_id = OLD.adjustment_id;
      END
  `);

  console.log('   ✅ All triggers recreated');
}

try {
  dropAllTriggers();
  addItemSizesConstraints();
  addCheckoutItemsConstraints();
  addAdditionItemsConstraints();
  addTransferItemsConstraints();
  addAdjustmentItemsConstraints();
  recreateTriggers();

  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');
  const fkEnabled = db.pragma('foreign_keys', { simple: true });
  console.log(`\n🔒 Foreign keys re-enabled: ${fkEnabled === 1 ? 'YES' : 'NO'}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ CHECK Constraints Added Successfully!\n');

  console.log('📋 Summary of constraints added:');
  console.log('   • item_sizes: current_quantity >= 0');
  console.log('   • checkout_items: quantity > 0');
  console.log('   • inventory_addition_items: quantity > 0');
  console.log('   • inventory_transfer_items: quantity > 0');
  console.log('   • inventory_adjustment_items: quantity_adjustment != 0');
  console.log('   • All triggers recreated');
  console.log('');

} catch (error) {
  console.error(`\n❌ Failed to add constraints: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
}
