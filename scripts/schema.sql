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

-- Items table - main inventory categories with QR codes
CREATE TABLE IF NOT EXISTS items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    storage_location TEXT, -- bin/shelf location within Rainbow Room (e.g., "Bin A-3")
    qr_code TEXT NOT NULL UNIQUE,
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_qr_code ON items(qr_code);
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