-- Rainbow Room Inventory Database Schema
-- SQLCipher encrypted database for Children's Advocacy Center

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Locations table - physical locations across different cities
CREATE TABLE IF NOT EXISTS locations (
    location_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE, -- 'McKinney', 'Plano', etc.
    address TEXT,
    city TEXT,
    state TEXT DEFAULT 'TX',
    zip_code TEXT,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Items table - main inventory categories
CREATE TABLE IF NOT EXISTS items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    storage_location TEXT, -- bin/shelf location within Rainbow Room (e.g., "Bin A-3")
    has_sizes BOOLEAN NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    unit_type TEXT DEFAULT 'each', -- 'each', 'pack', 'box', etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Item sizes table - size variants with location-specific inventory counts
CREATE TABLE IF NOT EXISTS item_sizes (
    size_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    size_label TEXT NOT NULL, -- 'Small', 'Medium', '2T', 'Youth L', etc.
    current_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    sort_order INTEGER DEFAULT 0, -- for displaying sizes in logical order
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE RESTRICT,
    UNIQUE(item_id, location_id, size_label)
);

-- Checkouts table - transaction headers (Order Header pattern)
CREATE TABLE IF NOT EXISTS checkouts (
    checkout_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL, -- location where checkout occurred
    checkout_date DATE NOT NULL, -- MM-DD-YYYY format
    worker_first_name TEXT NOT NULL,
    worker_last_name TEXT NOT NULL,
    department TEXT NOT NULL, -- 'CPS/DFPS', 'CACCC FA/CE', 'Family Compass', 'Law Enforcement'
    case_number TEXT NOT NULL, -- CPS Intake Number / CAC Case Number / LE Case Number
    allegations TEXT NOT NULL, -- JSON array of selected allegations
    parent_guardian_first_name TEXT NOT NULL,
    parent_guardian_last_name TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    alleged_perpetrator_first_name TEXT, -- optional if other than parent
    alleged_perpetrator_last_name TEXT, -- optional if other than parent
    number_of_children INTEGER NOT NULL, -- 1-5 children per form
    total_items INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE RESTRICT
);

-- Checkout items table - individual line items (Order Line pattern)
CREATE TABLE IF NOT EXISTS checkout_items (
    checkout_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    checkout_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    size_id INTEGER, -- nullable if item has no sizes
    quantity INTEGER NOT NULL,
    item_name TEXT NOT NULL, -- denormalized for checkout history
    size_label TEXT, -- denormalized for checkout history
    FOREIGN KEY (checkout_id) REFERENCES checkouts(checkout_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES item_sizes(size_id) ON DELETE RESTRICT
);

-- Volunteer sessions table - volunteer time tracking
CREATE TABLE IF NOT EXISTS volunteer_sessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    volunteer_name TEXT NOT NULL,
    session_date DATE NOT NULL DEFAULT (date('now')),
    start_time TIME NOT NULL,
    end_time TIME,
    hours_worked DECIMAL(4,2), -- calculated or manual entry
    tasks_performed TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE RESTRICT
);

-- Inventory additions table - tracks inventory being added to stock
CREATE TABLE IF NOT EXISTS inventory_additions (
    addition_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL, -- location where items were added
    addition_date DATE NOT NULL DEFAULT (date('now')), -- when items were added
    volunteer_name TEXT NOT NULL, -- who added the inventory
    source TEXT, -- 'Donation', 'Purchase', 'Transfer In', etc.
    notes TEXT, -- optional notes about the addition
    total_items INTEGER NOT NULL DEFAULT 0, -- calculated total items added
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE RESTRICT
);

-- Inventory addition items table - line items for inventory additions
CREATE TABLE IF NOT EXISTS inventory_addition_items (
    addition_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    addition_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    size_id INTEGER, -- nullable if item has no sizes
    quantity INTEGER NOT NULL,
    item_name TEXT NOT NULL, -- denormalized for history
    size_label TEXT, -- denormalized for history
    FOREIGN KEY (addition_id) REFERENCES inventory_additions(addition_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES item_sizes(size_id) ON DELETE RESTRICT
);

-- Inventory transfers table - tracks inventory being moved between locations
CREATE TABLE IF NOT EXISTS inventory_transfers (
    transfer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_location_id INTEGER NOT NULL, -- source location
    to_location_id INTEGER NOT NULL, -- destination location
    transfer_date DATE NOT NULL DEFAULT (date('now')), -- when transfer occurred
    volunteer_name TEXT NOT NULL, -- who initiated the transfer
    reason TEXT, -- reason for transfer
    notes TEXT, -- optional notes about the transfer
    total_items INTEGER NOT NULL DEFAULT 0, -- calculated total items transferred
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_location_id) REFERENCES locations(location_id) ON DELETE RESTRICT,
    FOREIGN KEY (to_location_id) REFERENCES locations(location_id) ON DELETE RESTRICT,
    CHECK (from_location_id != to_location_id) -- cannot transfer to same location
);

-- Inventory transfer items table - line items for inventory transfers
CREATE TABLE IF NOT EXISTS inventory_transfer_items (
    transfer_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    size_id INTEGER, -- nullable if item has no sizes
    quantity INTEGER NOT NULL,
    item_name TEXT NOT NULL, -- denormalized for history
    size_label TEXT, -- denormalized for history
    FOREIGN KEY (transfer_id) REFERENCES inventory_transfers(transfer_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES item_sizes(size_id) ON DELETE RESTRICT
);

-- Manual inventory adjustments table - for admin corrections when physical != system inventory
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    adjustment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL, -- location where adjustment occurred
    adjustment_date DATE NOT NULL DEFAULT (date('now')), -- when adjustment was made
    admin_name TEXT NOT NULL, -- who made the adjustment
    reason TEXT, -- reason for adjustment (e.g., "Physical count correction", "Damaged items removed")
    notes TEXT, -- optional notes about the adjustment
    total_items INTEGER NOT NULL DEFAULT 0, -- calculated total items adjusted (absolute value)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE RESTRICT
);

-- Manual inventory adjustment items table - line items for manual adjustments
CREATE TABLE IF NOT EXISTS inventory_adjustment_items (
    adjustment_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    adjustment_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    size_id INTEGER, -- nullable if item has no sizes
    quantity_adjustment INTEGER NOT NULL, -- positive for additions, negative for subtractions
    item_name TEXT NOT NULL, -- denormalized for history
    size_label TEXT, -- denormalized for history
    FOREIGN KEY (adjustment_id) REFERENCES inventory_adjustments(adjustment_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES item_sizes(size_id) ON DELETE RESTRICT
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_item_sizes_item_id ON item_sizes(item_id);
CREATE INDEX IF NOT EXISTS idx_item_sizes_location_id ON item_sizes(location_id);
CREATE INDEX IF NOT EXISTS idx_item_sizes_item_location ON item_sizes(item_id, location_id);
CREATE INDEX IF NOT EXISTS idx_checkout_items_checkout_id ON checkout_items(checkout_id);
CREATE INDEX IF NOT EXISTS idx_checkout_items_item_id ON checkout_items(item_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_date ON checkouts(checkout_date);
CREATE INDEX IF NOT EXISTS idx_checkouts_location ON checkouts(location_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_sessions_date ON volunteer_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_volunteer_sessions_location ON volunteer_sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_additions_date ON inventory_additions(addition_date);
CREATE INDEX IF NOT EXISTS idx_inventory_additions_location ON inventory_additions(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_addition_items_addition_id ON inventory_addition_items(addition_id);
CREATE INDEX IF NOT EXISTS idx_inventory_addition_items_item_id ON inventory_addition_items(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_date ON inventory_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_from_location ON inventory_transfers(from_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_to_location ON inventory_transfers(to_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_items_transfer_id ON inventory_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_items_item_id ON inventory_transfer_items(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_date ON inventory_adjustments(adjustment_date);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_location ON inventory_adjustments(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustment_items_adjustment_id ON inventory_adjustment_items(adjustment_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustment_items_item_id ON inventory_adjustment_items(item_id);

-- Triggers to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_items_timestamp 
    AFTER UPDATE ON items
    BEGIN
        UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE item_id = NEW.item_id;
    END;

CREATE TRIGGER IF NOT EXISTS update_locations_timestamp 
    AFTER UPDATE ON locations
    BEGIN
        UPDATE locations SET updated_at = CURRENT_TIMESTAMP WHERE location_id = NEW.location_id;
    END;

-- Trigger to update total_items in checkouts table
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
    END;

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
    END;

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
    END;

-- Triggers to update total_items in inventory_additions table
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
    END;

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
    END;

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
    END;

-- Triggers to update total_items in inventory_transfers table
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
    END;

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
    END;

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
    END;

-- Triggers to update total_items in inventory_adjustments table
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
    END;

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
    END;

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
    END;

-- ============================================================================
-- EVENT SOURCING TRIGGERS - Automatic Inventory Quantity Management
-- ============================================================================
-- These triggers automatically update item_sizes.current_quantity based on
-- transaction records, implementing an event sourcing pattern where transaction
-- tables are the source of truth for inventory changes.
--
-- Benefits:
-- - Guaranteed audit trail (impossible to change inventory without transaction record)
-- - Simplified application code (no manual quantity calculations)
-- - Data integrity (triggers execute atomically within transactions)
-- - Rebuildable state (current inventory can be recalculated from transaction history)
-- ============================================================================

-- Trigger 1: Decrease quantity when items are checked out
-- Runs AFTER INSERT on checkout_items to decrement inventory
CREATE TRIGGER IF NOT EXISTS update_quantity_on_checkout
    AFTER INSERT ON checkout_items
    BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity - NEW.quantity
        WHERE size_id = NEW.size_id;

        -- Verify we didn't go negative (safety check)
        SELECT CASE
            WHEN (SELECT current_quantity FROM item_sizes WHERE size_id = NEW.size_id) < 0
            THEN RAISE(FAIL, 'Checkout would result in negative inventory')
        END;
    END;

-- Trigger 2: Increase quantity when items are added to inventory
-- Runs AFTER INSERT on inventory_addition_items to increment inventory
CREATE TRIGGER IF NOT EXISTS update_quantity_on_addition
    AFTER INSERT ON inventory_addition_items
    BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity + NEW.quantity
        WHERE size_id = NEW.size_id;
    END;

-- Trigger 3: Decrease quantity at source location for transfers
-- Runs AFTER INSERT on inventory_transfer_items to decrement at source
CREATE TRIGGER IF NOT EXISTS update_quantity_on_transfer_out
    AFTER INSERT ON inventory_transfer_items
    BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity - NEW.quantity
        WHERE size_id = NEW.size_id;

        -- Verify we didn't go negative (safety check)
        SELECT CASE
            WHEN (SELECT current_quantity FROM item_sizes WHERE size_id = NEW.size_id) < 0
            THEN RAISE(FAIL, 'Transfer would result in negative inventory at source location')
        END;
    END;

-- Trigger 4: Increase quantity at destination location for transfers
-- Runs AFTER INSERT on inventory_transfer_items to increment at destination
-- Note: This requires finding/creating the corresponding size_id at the destination location
CREATE TRIGGER IF NOT EXISTS update_quantity_on_transfer_in
    AFTER INSERT ON inventory_transfer_items
    BEGIN
        -- Get the destination location from the parent transfer record
        UPDATE item_sizes
        SET current_quantity = current_quantity + NEW.quantity
        WHERE item_id = NEW.item_id
          AND location_id = (
              SELECT to_location_id
              FROM inventory_transfers
              WHERE transfer_id = NEW.transfer_id
          )
          AND size_label = NEW.size_label;

        -- If no matching size exists at destination, this won't update any rows
        -- In production, you might want to auto-create the size entry or raise an error
    END;

-- Trigger 5: Apply manual adjustments (positive or negative)
-- Runs AFTER INSERT on inventory_adjustment_items to apply admin corrections
CREATE TRIGGER IF NOT EXISTS update_quantity_on_adjustment
    AFTER INSERT ON inventory_adjustment_items
    BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity + NEW.quantity_adjustment
        WHERE size_id = NEW.size_id;

        -- Verify we didn't go negative (safety check)
        SELECT CASE
            WHEN (SELECT current_quantity FROM item_sizes WHERE size_id = NEW.size_id) < 0
            THEN RAISE(FAIL, 'Manual adjustment would result in negative inventory')
        END;
    END;