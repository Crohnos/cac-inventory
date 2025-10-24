# Implementation Guide for CAC Inventory System

> **For Coding Agents:** This document contains executable implementation tasks.
> Each task is self-contained with clear steps, file paths, and success criteria.

**Status Legend:**
- 🔴 CRITICAL - Must fix before production
- 🟠 HIGH - Should implement soon
- 🟡 MEDIUM - Nice to have
- 🟢 LOW - Optional optimization

---

## TASK 1: Enable Foreign Keys in Database

**STATUS:** 🔴 CRITICAL
**PRIORITY:** Do this FIRST
**EFFORT:** 5 minutes
**RISK:** Low (purely additive)

### WHAT TO DO

1. Open `src/database/connection.ts`
2. Add `pragma('foreign_keys = ON')` after database instantiation
3. Add verification code to ensure it worked
4. Test with sample queries

### FILES TO MODIFY

- `src/database/connection.ts`

### EXACT CODE CHANGES

**File:** `src/database/connection.ts`

**FIND:**
```typescript
static getInstance(): Database.Database {
  if (!this.instance) {
    this.instance = new Database('data/inventory.db');
    // Missing foreign key enablement
  }
  return this.instance;
}
```

**REPLACE WITH:**
```typescript
static getInstance(): Database.Database {
  if (!this.instance) {
    this.instance = new Database('data/inventory.db');

    // CRITICAL: Enable foreign keys (SQLite has them OFF by default)
    this.instance.pragma('foreign_keys = ON');

    // Verify foreign keys are enabled
    const fkEnabled = this.instance.pragma('foreign_keys', { simple: true });
    if (fkEnabled !== 1) {
      throw new Error('CRITICAL: Failed to enable foreign keys!');
    }

    console.log('✅ Foreign keys enabled');
  }
  return this.instance;
}
```

### SUCCESS CRITERIA

- [ ] Server starts without errors
- [ ] Run `PRAGMA foreign_keys;` in SQLite - returns 1
- [ ] Try to insert invalid foreign key - should fail with constraint error:
  ```sql
  INSERT INTO checkout_items (checkout_id, item_id, quantity, item_name)
  VALUES (99999, 1, 1, 'Test');
  -- Should fail: FOREIGN KEY constraint failed
  ```

### WHY

SQLite has foreign keys DISABLED by default. All `FOREIGN KEY` declarations in the schema are currently ignored, meaning:
- Can insert orphaned records
- Can delete parent records without cleaning up children
- Database can become corrupted

---

## TASK 2: Remove Unused TanStack Query Dependency

**STATUS:** 🟢 LOW
**PRIORITY:** Quick win
**EFFORT:** 5 minutes
**RISK:** None (unused package)

### WHAT TO DO

1. Navigate to `frontend/` directory
2. Uninstall `@tanstack/react-query` package
3. Verify no imports remain in codebase

### BASH COMMANDS

```bash
cd frontend
npm uninstall @tanstack/react-query
grep -r "react-query" src/
# Should return: no matches
```

### SUCCESS CRITERIA

- [ ] Package removed from `frontend/package.json`
- [ ] `npm list @tanstack/react-query` returns "empty"
- [ ] No grep matches for "react-query" in `frontend/src/`
- [ ] Frontend builds successfully: `npm run build`

---

## TASK 3: Standardize Date Formats to ISO 8601

**STATUS:** 🟠 HIGH
**PRIORITY:** Do after Task 1
**EFFORT:** 2-3 hours
**RISK:** Medium (requires data migration)

### WHAT TO DO

1. Create migration script to convert existing dates to ISO format
2. Run migration script
3. Update application code to always use ISO format for dates
4. Verify all dates are ISO format

### FILES TO CREATE

- `scripts/migrate-dates.js`

### FILES TO MODIFY

- Any files that create checkout dates (need to generate ISO format)

### EXACT CODE

**File:** `scripts/migrate-dates.js` (CREATE NEW)

```javascript
#!/usr/bin/env node
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'inventory.db');
const db = new Database(dbPath);

console.log('🔄 Starting date format migration...');

// Function to convert various formats to ISO (YYYY-MM-DD)
function toISO(dateStr) {
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // M-D-YYYY or M/D/YYYY
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2];

    // Validate the date
    const isoDate = `${year}-${month}-${day}`;
    const testDate = new Date(isoDate);
    if (isNaN(testDate.getTime())) {
      throw new Error(`Invalid date: ${dateStr} -> ${isoDate}`);
    }

    return isoDate;
  }

  throw new Error(`Unknown date format: ${dateStr}`);
}

// Migrate checkouts table
try {
  const checkouts = db.prepare('SELECT checkout_id, checkout_date FROM checkouts').all();
  console.log(`Found ${checkouts.length} checkout records to migrate`);

  const update = db.prepare('UPDATE checkouts SET checkout_date = ? WHERE checkout_id = ?');

  const migration = db.transaction(() => {
    let migrated = 0;
    let skipped = 0;

    for (const row of checkouts) {
      try {
        const isoDate = toISO(row.checkout_date);
        if (isoDate !== row.checkout_date) {
          update.run(isoDate, row.checkout_id);
          migrated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Failed to migrate checkout_id=${row.checkout_id}, date="${row.checkout_date}":`, error.message);
        throw error;
      }
    }

    return { migrated, skipped };
  });

  const result = migration();
  console.log(`✅ Migrated ${result.migrated} dates, skipped ${result.skipped} (already ISO format)`);

  // Verify all dates are now ISO format
  const nonISO = db.prepare(`
    SELECT checkout_id, checkout_date
    FROM checkouts
    WHERE checkout_date NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  `).all();

  if (nonISO.length > 0) {
    console.error('❌ Some dates are still not ISO format:');
    nonISO.forEach(row => console.error(`  - checkout_id=${row.checkout_id}: "${row.checkout_date}"`));
    process.exit(1);
  } else {
    console.log('✅ All dates are now in ISO format (YYYY-MM-DD)');
  }

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  db.close();
  process.exit(1);
}

db.close();
console.log('✅ Migration complete');
```

### BASH COMMANDS

```bash
# Make script executable
chmod +x scripts/migrate-dates.js

# Run migration
node scripts/migrate-dates.js

# Verify results
sqlite3 data/inventory.db "SELECT DISTINCT checkout_date FROM checkouts ORDER BY checkout_date;"
```

### APPLICATION CODE CHANGES

Wherever dates are created, use this pattern:

```typescript
// ✅ GOOD: Always use ISO format
const isoDate = new Date().toISOString().split('T')[0]; // '2025-10-22'

// ❌ BAD: Don't use locale-specific formats
const badDate = new Date().toLocaleDateString(); // '10/22/2025'
```

**For display to users, format after retrieval:**

```typescript
// Store as ISO
const storedDate = '2025-10-22';

// Display as user-friendly
const displayDate = new Date(storedDate).toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
}); // 'October 22, 2025'
```

### SUCCESS CRITERIA

- [ ] Migration script runs without errors
- [ ] All dates in `checkouts` table match pattern `YYYY-MM-DD`
- [ ] Query succeeds: `SELECT date(checkout_date, '-7 days') FROM checkouts LIMIT 1;`
- [ ] No dates fail this check:
  ```sql
  SELECT COUNT(*) FROM checkouts
  WHERE checkout_date NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]';
  -- Should return 0
  ```

---

## TASK 4: Remove Controller Layer

**STATUS:** 🟠 HIGH
**PRIORITY:** After database fixes
**EFFORT:** 2-3 hours
**RISK:** Medium (requires careful refactoring)

### WHAT TO DO

1. Move controller logic directly into route files
2. Delete all controller files
3. Update imports in route files to import services directly
4. Test all API endpoints still work

### FILES TO DELETE

- `src/controllers/itemController.ts`
- `src/controllers/locationController.ts`
- `src/controllers/checkoutController.ts`
- `src/controllers/volunteerController.ts`
- `src/controllers/reportController.ts`

### FILES TO MODIFY

- `src/routes/itemRoutes.ts`
- `src/routes/locationRoutes.ts`
- `src/routes/checkoutRoutes.ts`
- `src/routes/volunteerRoutes.ts`
- `src/routes/reportRoutes.ts`

### EXAMPLE REFACTOR

**File:** `src/routes/itemRoutes.ts`

**BEFORE:**
```typescript
import { ItemController } from '../controllers/itemController.js';

router.get('/:id',
  validateParams(itemParamsSchema),
  ItemController.getItemById
);
```

**AFTER:**
```typescript
import { ItemService } from '../services/itemService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

router.get('/:id',
  validateParams(itemParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const item = ItemService.getById(id);

    if (!item) {
      return res.status(404).json({
        error: { message: `Item with ID ${id} not found` }
      });
    }

    res.json({ success: true, data: item });
  })
);
```

### SUCCESS CRITERIA

- [ ] All 5 controller files deleted
- [ ] No imports of `../controllers/` remain in codebase
- [ ] Server starts without errors
- [ ] All API endpoints respond correctly:
  ```bash
  curl http://localhost:3001/api/items
  curl http://localhost:3001/api/locations
  curl http://localhost:3001/api/checkouts
  curl http://localhost:3001/api/volunteer/sessions
  curl http://localhost:3001/api/reports/current-inventory
  ```
- [ ] Error handling still works (test 404, 400, etc.)

---

## TASK 5: Simplify Database Query Layer

**STATUS:** 🟡 MEDIUM
**PRIORITY:** After Task 4
**EFFORT:** 1-2 hours
**RISK:** Low (straightforward refactor)

### WHAT TO DO

1. Move SQL queries from `DatabaseQueries` class into service methods
2. Delete `src/database/queries.ts`
3. Update services to use inline `db.prepare()` calls
4. Verify all database operations still work

### FILES TO DELETE

- `src/database/queries.ts`

### FILES TO MODIFY

- `src/services/itemService.ts`
- `src/services/locationService.ts`
- `src/services/volunteerService.ts`

### EXAMPLE REFACTOR

**File:** `src/services/itemService.ts`

**BEFORE:**
```typescript
import { DatabaseQueries } from '../database/queries.js';

export class ItemService {
  static getAllItems(): Item[] {
    return DatabaseQueries.items.getAll.all() as Item[];
  }
}
```

**AFTER:**
```typescript
import { DatabaseConnection } from '../database/connection.js';

export class ItemService {
  private static db = DatabaseConnection.getInstance();

  static getAllItems(): Item[] {
    return this.db.prepare(`
      SELECT i.*,
             COUNT(DISTINCT is2.size_id) as size_count,
             SUM(is2.current_quantity) as total_quantity
      FROM items i
      LEFT JOIN item_sizes is2 ON i.item_id = is2.item_id
      GROUP BY i.item_id
      ORDER BY i.name
    `).all() as Item[];
  }

  static getById(id: number): Item | null {
    const result = this.db.prepare('SELECT * FROM items WHERE item_id = ?').get(id);
    return result as Item | null;
  }
}
```

### SUCCESS CRITERIA

- [ ] `src/database/queries.ts` deleted
- [ ] No imports of `DatabaseQueries` remain
- [ ] All services have `private static db = DatabaseConnection.getInstance()`
- [ ] All database operations still work
- [ ] Performance is identical (better-sqlite3 caches prepared statements automatically)

---

## TASK 6: Merge Frontend Services into Zustand Stores

**STATUS:** 🟠 HIGH
**PRIORITY:** After backend simplifications
**EFFORT:** 3-4 hours
**RISK:** Medium (affects many components)

### WHAT TO DO

1. Add API calls directly to Zustand stores
2. Add loading/error state to stores
3. Delete frontend service files
4. Update components to use store actions instead of services
5. Keep `api.ts` (base axios instance)

### FILES TO DELETE

- `frontend/src/services/itemService.ts`
- `frontend/src/services/locationService.ts`
- `frontend/src/services/reportService.ts`
- `frontend/src/services/volunteerService.ts`

### FILES TO MODIFY

- `frontend/src/stores/inventoryStore.ts`
- `frontend/src/stores/locationStore.ts`
- `frontend/src/stores/cartStore.ts`
- All components that import deleted service files

### FILES TO KEEP

- `frontend/src/services/api.ts` (base axios configuration)

### EXAMPLE REFACTOR

**File:** `frontend/src/stores/inventoryStore.ts`

**BEFORE:**
```typescript
import { create } from 'zustand';

interface InventoryStore {
  items: Item[];
  setItems: (items: Item[]) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));
```

**AFTER:**
```typescript
import { create } from 'zustand';
import { api } from '../services/api';

interface InventoryStore {
  items: Item[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchItems: (locationId?: number) => Promise<void>;
  createItem: (itemData: CreateItemData) => Promise<Item>;
  updateQuantity: (sizeId: number, quantity: number) => Promise<void>;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async (locationId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const params = locationId ? { location_id: locationId } : {};
      const response = await api.get('/items', { params });
      set({ items: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createItem: async (itemData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/items', itemData);
      const newItem = response.data.data;
      set((state) => ({
        items: [...state.items, newItem],
        isLoading: false,
      }));
      return newItem;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateQuantity: async (sizeId, quantity) => {
    try {
      await api.put(`/items/sizes/${sizeId}/quantity`, { quantity });
      // Re-fetch items to get updated state
      await get().fetchItems();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));
```

**Component Usage - BEFORE:**
```typescript
import { useInventoryStore } from '../stores/inventoryStore';
import { itemService } from '../services/itemService';

function InventoryPage() {
  const { items, setItems } = useInventoryStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const data = await itemService.getItems();
      setItems(data);
      setIsLoading(false);
    };
    fetch();
  }, []);

  return isLoading ? <Loading /> : <ItemsTable items={items} />;
}
```

**Component Usage - AFTER:**
```typescript
import { useInventoryStore } from '../stores/inventoryStore';

function InventoryPage() {
  const { items, isLoading, fetchItems } = useInventoryStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return isLoading ? <Loading /> : <ItemsTable items={items} />;
}
```

### SUCCESS CRITERIA

- [ ] All 4 service files deleted (except `api.ts`)
- [ ] No imports of deleted service files remain
- [ ] All API calls work from stores
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Store persistence still works (cart, location)
- [ ] Frontend builds without errors: `npm run build`

---

## TASK 7: Remove Duplicate Transaction Tracking System

**STATUS:** 🟡 MEDIUM
**PRIORITY:** During database cleanup
**EFFORT:** 1 hour
**RISK:** Low (table appears to be unused)

### WHAT TO DO

1. Verify `inventory_transactions` table is not used in application code
2. Drop the table and its indexes
3. Verify reporting still works via `reportService.getTransactionHistory()`

### BASH COMMANDS

```bash
# Check if table is referenced in application code
grep -r "inventory_transactions" src/
# Should find minimal/no references

# Drop table and indexes
sqlite3 data/inventory.db << 'EOF'
DROP TABLE IF EXISTS inventory_transactions;
DROP INDEX IF EXISTS idx_inventory_transactions_item_id;
DROP INDEX IF EXISTS idx_inventory_transactions_size_id;
DROP INDEX IF EXISTS idx_inventory_transactions_location_id;
DROP INDEX IF EXISTS idx_inventory_transactions_item;
DROP INDEX IF EXISTS idx_inventory_transactions_size;
DROP INDEX IF EXISTS idx_inventory_transactions_location;
DROP INDEX IF EXISTS idx_inventory_transactions_date;
DROP INDEX IF EXISTS idx_inventory_transactions_created_at;
DROP INDEX IF EXISTS idx_inventory_transactions_type;
EOF

echo "✅ Dropped inventory_transactions table and all its indexes"
```

### SUCCESS CRITERIA

- [ ] Table `inventory_transactions` no longer exists
- [ ] All indexes on that table are gone
- [ ] `reportService.getTransactionHistory()` still works
- [ ] Transaction history displays correctly in frontend
- [ ] No references to `inventory_transactions` in application code

---

## TASK 8: Remove Unnecessary Middleware (Optional)

**STATUS:** 🟢 LOW
**PRIORITY:** Optional cleanup
**EFFORT:** 1 hour
**RISK:** Very low

### WHAT TO DO

1. Uninstall helmet and morgan packages
2. Replace with simple logging middleware
3. Simplify CORS configuration

### BASH COMMANDS

```bash
npm uninstall helmet morgan @types/morgan
```

### FILES TO MODIFY

- `src/server.ts`
- `package.json` (automatic via npm uninstall)

### EXACT CODE CHANGES

**File:** `src/server.ts`

**REMOVE:**
```typescript
import helmet from 'helmet';
import morgan from 'morgan';

app.use(helmet());
app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400
}));
```

**ADD:**
```typescript
// Simple CORS (intranet-only)
app.use(cors());

// Simple request logging (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const color = status >= 500 ? '\x1b[31m' :  // Red
                    status >= 400 ? '\x1b[33m' :  // Yellow
                    '\x1b[32m';                   // Green
      console.log(`${color}${req.method} ${req.path} ${status}\x1b[0m - ${duration}ms`);
    });
    next();
  });
}
```

### SUCCESS CRITERIA

- [ ] Packages removed from `package.json`
- [ ] Server starts without errors
- [ ] API endpoints still work
- [ ] CORS still works (frontend can call backend)
- [ ] Request logging appears in development console

---

## Implementation Priority

### Phase 1: Critical Database Fixes
**Do these FIRST in order:**

1. ✅ Task 1: Enable Foreign Keys (5 min, CRITICAL)
2. ✅ Task 3: Standardize Date Formats (2-3 hours, HIGH)

**Total:** 2-4 hours
**Must complete before production deployment**

### Phase 2: Code Simplification
**Do these after Phase 1:**

3. ✅ Task 4: Remove Controller Layer (2-3 hours)
4. ✅ Task 5: Simplify Database Queries (1-2 hours)
5. ✅ Task 6: Merge Frontend Services into Stores (3-4 hours)

**Total:** 6-9 hours
**Makes codebase easier to maintain**

### Phase 3: Cleanup
**Optional, do when convenient:**

6. ✅ Task 2: Remove TanStack Query (5 min)
7. ✅ Task 7: Remove Duplicate Transaction System (1 hour)
8. ✅ Task 8: Remove Unnecessary Middleware (1 hour)

**Total:** 2-3 hours
**Nice to have, not critical**

---

## Testing Checklist

After completing each task, verify:

- [ ] Server starts: `npm run dev`
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] All API endpoints respond: Use curl or Postman
- [ ] Database operations work: Test CRUD operations
- [ ] No TypeScript errors: `npm run build`
- [ ] No console errors in browser
- [ ] Core workflows still function:
  - [ ] Create new item
  - [ ] Add inventory
  - [ ] Checkout items
  - [ ] View reports
  - [ ] Log volunteer hours

---

## Rollback Plan

If anything breaks:

1. **Git is your friend:**
   ```bash
   git status
   git diff
   git checkout -- <file>  # Undo changes to specific file
   git reset --hard HEAD    # Undo all uncommitted changes (CAREFUL!)
   ```

2. **Task-specific rollbacks:**
   - Task 1: Comment out foreign key pragma
   - Task 3: Restore date migration backup
   - Task 4-6: Restore deleted files from git
   - Task 7-8: Reinstall packages

3. **Database backup:**
   ```bash
   # Before any database changes:
   cp data/inventory.db data/inventory.db.backup

   # To restore:
   cp data/inventory.db.backup data/inventory.db
   ```

---

**End of Implementation Guide**
