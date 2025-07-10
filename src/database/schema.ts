export const SCHEMA = `
-- ItemCategory Table
CREATE TABLE IF NOT EXISTS ItemCategory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  lowStockThreshold INTEGER DEFAULT 5,
  qrCodeValue TEXT UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Size Table
CREATE TABLE IF NOT EXISTS Size (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- ItemSize Association Table
CREATE TABLE IF NOT EXISTS ItemSize (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemCategoryId INTEGER NOT NULL,
  sizeId INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (itemCategoryId) REFERENCES ItemCategory(id) ON DELETE CASCADE,
  FOREIGN KEY (sizeId) REFERENCES Size(id) ON DELETE CASCADE,
  UNIQUE(itemCategoryId, sizeId)
);

-- ItemDetail Table
CREATE TABLE IF NOT EXISTS ItemDetail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemCategoryId INTEGER NOT NULL,
  sizeId INTEGER,
  condition TEXT CHECK( condition IN ('New', 'Gently Used', 'Heavily Used') ) NOT NULL DEFAULT 'New',
  location TEXT CHECK( location IN ('McKinney', 'Plano') ) NOT NULL,
  receivedDate TEXT NOT NULL,
  donorInfo TEXT,
  approxPrice REAL,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (itemCategoryId) REFERENCES ItemCategory(id) ON DELETE RESTRICT,
  FOREIGN KEY (sizeId) REFERENCES Size(id) ON DELETE SET NULL
);

-- ItemPhoto Table
CREATE TABLE IF NOT EXISTS ItemPhoto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemDetailId INTEGER NOT NULL,
  filePath TEXT NOT NULL,
  description TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (itemDetailId) REFERENCES ItemDetail(id) ON DELETE CASCADE
);
`;