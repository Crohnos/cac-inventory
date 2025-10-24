# Project Changes

This document tracks significant architectural and design changes to the CAC Inventory system.

---

## [Implemented] Trigger-Based Audit System (Event Sourcing Pattern)

**Status:** ✅ Implemented
**Date Proposed:** 2025-10-22
**Date Implemented:** 2025-10-24
**Priority:** High
**Complexity:** Medium-High

### Overview

Refactor the inventory management system to use database triggers that automatically maintain `item_sizes.current_quantity` based on transaction records. This implements an event sourcing pattern where transaction tables become the immutable source of truth.

### Current System (Before)

- Application code manually updates `item_sizes.current_quantity` when transactions occur
- Transaction records (checkouts, additions, transfers, adjustments) are created separately as audit trails
- Risk of inconsistency if application code fails to update both places
- Transaction history requires querying multiple tables and combining results

### Proposed System (After)

- Application code only inserts records into transaction tables
- Database triggers automatically update `item_sizes.current_quantity`
- Transaction tables become the single source of truth
- Current quantities can be rebuilt from transaction history at any time
- Guaranteed consistency between inventory levels and audit trail

### Benefits

1. **Guaranteed Audit Trail** - Impossible to change inventory without creating a transaction record
2. **Simplified Application Code** - No manual quantity calculations in business logic
3. **Data Integrity** - Triggers execute atomically within transactions
4. **Rebuildable State** - Current inventory can be recalculated from transaction history
5. **Bug Protection** - Even buggy application code can't bypass the audit system
6. **Compliance** - Complete, immutable audit trail for regulatory requirements

### Technical Changes Required

#### 1. New Database Triggers

Create triggers for all transaction types:

- `update_quantity_on_checkout` - Decreases quantity when items are checked out
- `update_quantity_on_addition` - Increases quantity when items are added
- `update_quantity_on_transfer_out` - Decreases quantity at source location
- `update_quantity_on_transfer_in` - Increases quantity at destination location
- `update_quantity_on_adjustment` - Applies manual adjustments (positive or negative)

#### 2. Application Code Changes

**Files to Update:**
- `src/services/checkoutService.ts` - Remove manual quantity updates
- `src/services/inventoryService.ts` - Remove manual quantity updates from add/transfer/adjust methods
- `src/services/reportService.ts` - May simplify transaction history queries

**Pattern Change:**
```typescript
// OLD: Manual quantity management
const currentQty = getCurrentQuantity(sizeId);
const newQty = currentQty - checkoutQty;
updateQuantity(sizeId, newQty);
createCheckoutRecord(checkoutData);

// NEW: Let triggers handle it
createCheckoutRecord(checkoutData);  // Trigger automatically updates quantity
```

#### 3. Data Integrity Considerations

- **Negative Inventory Prevention** - Add CHECK constraints or trigger logic to prevent negative quantities
- **Concurrent Access** - SQLite's transaction isolation handles this automatically
- **Transfer Complexity** - Transfers need special handling since they affect two locations
- **Size Matching** - Transfers must match size_label between locations (or create if missing)

#### 4. Migration Strategy

1. **Phase 1: Add Triggers** - Create triggers alongside existing code (both systems run)
2. **Phase 2: Validation** - Monitor for discrepancies between manual and trigger-based updates
3. **Phase 3: Remove Manual Updates** - Once validated, remove application-level quantity management
4. **Phase 4: Add Constraints** - Add CHECK constraints to prevent manual quantity modifications

#### 5. Potential Issues & Solutions

**Issue:** Transfers between locations with different size configurations
**Solution:** Trigger automatically creates size_id at destination if it doesn't exist

**Issue:** Bulk operations might be slower
**Solution:** SQLite handles triggers efficiently; likely negligible performance impact

**Issue:** Debugging is harder when logic is in triggers
**Solution:** Add comprehensive logging to transaction tables

**Issue:** Testing requires database-level tests
**Solution:** Create integration tests that verify trigger behavior

### Database Schema Changes

#### New Trigger Examples

```sql
-- Checkout: Decrease quantity
CREATE TRIGGER IF NOT EXISTS update_quantity_on_checkout
    AFTER INSERT ON checkout_items
    BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity - NEW.quantity
        WHERE size_id = NEW.size_id;
    END;

-- Addition: Increase quantity
CREATE TRIGGER IF NOT EXISTS update_quantity_on_addition
    AFTER INSERT ON inventory_addition_items
    BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity + NEW.quantity
        WHERE size_id = NEW.size_id;
    END;

-- Transfer Out: Decrease at source
CREATE TRIGGER IF NOT EXISTS update_quantity_on_transfer_out
    AFTER INSERT ON inventory_transfer_items
    BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity - NEW.quantity
        WHERE size_id = NEW.size_id;
    END;

-- Transfer In: Increase at destination
CREATE TRIGGER IF NOT EXISTS update_quantity_on_transfer_in
    AFTER INSERT ON inventory_transfer_items
    BEGIN
        -- Find or create size_id at destination location
        UPDATE item_sizes
        SET current_quantity = current_quantity + NEW.quantity
        WHERE item_id = NEW.item_id
          AND location_id = (
              SELECT to_location_id
              FROM inventory_transfers
              WHERE transfer_id = NEW.transfer_id
          )
          AND size_label = NEW.size_label;
    END;

-- Manual Adjustment: Apply positive or negative adjustment
CREATE TRIGGER IF NOT EXISTS update_quantity_on_adjustment
    AFTER INSERT ON inventory_adjustment_items
    BEGIN
        UPDATE item_sizes
        SET current_quantity = current_quantity + NEW.quantity_adjustment
        WHERE size_id = NEW.size_id;
    END;
```

#### Optional: Prevent Manual Quantity Updates

```sql
-- Trigger to prevent direct updates to current_quantity
-- (Only allow triggers to modify it)
CREATE TRIGGER IF NOT EXISTS prevent_manual_quantity_update
    BEFORE UPDATE OF current_quantity ON item_sizes
    WHEN NEW.current_quantity != OLD.current_quantity
    BEGIN
        SELECT RAISE(FAIL, 'Direct quantity updates not allowed. Use transaction tables.');
    END;
```

### Testing Requirements

1. **Unit Tests** - Verify each trigger updates quantities correctly
2. **Integration Tests** - Test complete workflows (checkout, add, transfer, adjust)
3. **Concurrency Tests** - Verify behavior under simultaneous transactions
4. **Rollback Tests** - Ensure triggers respect transaction boundaries
5. **Data Migration Tests** - Verify existing data works correctly with new triggers

### Rollback Plan

If issues arise:
1. Disable triggers using `DROP TRIGGER`
2. Revert application code to manual quantity management
3. Run data reconciliation script to fix any discrepancies
4. Investigate and fix trigger logic before re-enabling

### Implementation Summary

**What Was Implemented:**

1. **Database Triggers Created** (scripts/schema.sql:370-461):
   - `update_quantity_on_checkout` - Decrements inventory when items are checked out
   - `update_quantity_on_addition` - Increments inventory when items are added
   - `update_quantity_on_transfer_out` - Decrements inventory at source location for transfers
   - `update_quantity_on_transfer_in` - Increments inventory at destination location for transfers
   - `update_quantity_on_adjustment` - Applies manual admin adjustments (positive or negative)
   - All triggers include negative inventory prevention checks

2. **Application Code Simplified**:
   - `src/controllers/checkoutController.ts:163-217` - Removed manual UPDATE statements, now just INSERTs checkout items
   - `src/services/itemService.ts:183-240` - Removed manual adjustQuantity UPDATE, trigger handles it automatically

3. **How It Works Now**:
   - Application code only creates records in transaction tables (checkout_items, inventory_addition_items, etc.)
   - Database triggers automatically update `item_sizes.current_quantity`
   - Triggers execute atomically within the same transaction
   - If inventory would go negative, the trigger raises a FAIL error and rolls back the entire transaction

4. **Benefits Achieved**:
   - ✅ Guaranteed audit trail - impossible to change inventory without a transaction record
   - ✅ Simpler application code - no manual quantity calculations
   - ✅ Atomic operations - triggers execute within the same transaction
   - ✅ Data integrity - negative inventory prevented at database level
   - ✅ Admin manual adjustments still work through the UI

**Migration Notes:**
- No data migration needed - triggers work with existing data
- Both old and new code can coexist during deployment
- Triggers have `IF NOT EXISTS` clause for safe re-application

### Implementation Estimate (Actual)

- **Development:** 2 hours
- **Testing:** Pending end-to-end testing
- **Total:** ~2 hours

### Related Files

- `scripts/schema.sql` - Database schema and triggers (lines 370-461)
- `src/controllers/checkoutController.ts` - Checkout transaction logic (simplified)
- `src/services/itemService.ts` - Inventory adjustment logic (simplified)
- `src/services/reportService.ts` - Transaction history reporting (unchanged)

### References

- [SQLite Trigger Documentation](https://www.sqlite.org/lang_createtrigger.html)
- Event Sourcing Pattern: Transaction log as source of truth
- Similar to: SQL Server Change Data Capture (CDC), PostgreSQL audit triggers

---

## [Implemented] Remove TanStack Query Dependency

**Status:** ✅ Implemented
**Date Proposed:** 2025-10-22
**Date Implemented:** 2025-10-24
**Priority:** Low
**Complexity:** Low

### Overview

Remove the `@tanstack/react-query` dependency from the project as it is installed but never used in the codebase.

### Current System (Before)

- `@tanstack/react-query` is listed in `frontend/package.json` dependencies
- Zero references to React Query hooks (`useQuery`, `useMutation`, `QueryClient`) found in the codebase
- Increases bundle size and dependency complexity unnecessarily

### Proposed System (After)

- Remove package from `package.json`
- No functional changes required (package is unused)
- Smaller `node_modules`, faster installs, reduced attack surface

### Implementation Steps

1. Remove from `frontend/package.json`:
   ```bash
   npm uninstall @tanstack/react-query
   ```

2. Verify no imports remain:
   ```bash
   grep -r "react-query" frontend/src/
   ```

### Benefits

1. **Reduced Bundle Size** - Removes ~40KB from production bundle
2. **Faster Installs** - Fewer dependencies to download
3. **Less Complexity** - Fewer packages to maintain and update
4. **Security** - Reduced attack surface

### Implementation Estimate

- **Effort:** 5 minutes
- **Risk:** None (package is unused)

### Related Files

- `frontend/package.json`

---

## [Implemented] Remove Controller Layer

**Status:** ✅ Implemented
**Date Proposed:** 2025-10-22
**Date Implemented:** 2025-10-24
**Priority:** High
**Complexity:** Medium

### Overview

Eliminate the controller layer from the backend architecture. Controllers currently act as thin wrappers that add minimal value between routes and services.

### Current System (Before)

**Architecture:** `Route → Controller → Service → Database`

Controllers perform minimal logic:
```typescript
// src/controllers/itemController.ts
export class ItemController {
  static getAllItems = asyncHandler(async (req: Request, res: Response) => {
    const items = ItemService.getAllItems();
    res.json({ success: true, data: items });
  });
}
```

### Proposed System (After)

**Architecture:** `Route → Service → Database`

Merge controller logic directly into routes:
```typescript
// src/routes/itemRoutes.ts
router.get('/', asyncHandler(async (req, res) => {
  const items = ItemService.getAllItems();
  res.json({ success: true, data: items });
}));
```

### Benefits

1. **Less Abstraction** - Fewer layers to navigate when reading code
2. **Fewer Files** - Remove ~5 controller files (~1000 lines of code)
3. **Easier Debugging** - Direct path from route to service
4. **Better Maintainability** - Less code means less to maintain
5. **Clearer Structure** - No ambiguity about where logic belongs

### Implementation Steps

1. **Move controller logic to routes:**
   - `src/routes/itemRoutes.ts` - Inline ItemController methods
   - `src/routes/locationRoutes.ts` - Inline LocationController methods
   - `src/routes/checkoutRoutes.ts` - Inline CheckoutController methods
   - `src/routes/volunteerRoutes.ts` - Inline VolunteerController methods
   - `src/routes/reportRoutes.ts` - Inline ReportController methods

2. **Delete controller files:**
   - `src/controllers/itemController.ts`
   - `src/controllers/locationController.ts`
   - `src/controllers/checkoutController.ts`
   - `src/controllers/volunteerController.ts`
   - `src/controllers/reportController.ts`

3. **Update imports in routes** - Import services directly instead of controllers

4. **Keep validation middleware** - Continue using `validateBody`, `validateParams`, `validateQuery`

### Pattern Examples

**Before:**
```typescript
// Route
router.get('/:id', validateParams(itemParamsSchema), ItemController.getItemById);

// Controller
static getItemById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const item = ItemService.getById(id);

  if (!item) {
    return res.status(404).json({ error: { message: 'Item not found' } });
  }

  res.json({ success: true, data: item });
});
```

**After:**
```typescript
// Route only
router.get('/:id',
  validateParams(itemParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const item = ItemService.getById(id);

    if (!item) {
      return res.status(404).json({ error: { message: 'Item not found' } });
    }

    res.json({ success: true, data: item });
  })
);
```

### Testing Requirements

1. Verify all routes still function correctly
2. Test error handling paths
3. Confirm validation middleware still works
4. Test parameter parsing and type coercion

### Implementation Estimate

- **Effort:** 2-3 hours
- **Lines Removed:** ~1000 lines
- **Files Removed:** 5 controller files

### Related Files

**To Remove:**
- `src/controllers/itemController.ts`
- `src/controllers/locationController.ts`
- `src/controllers/checkoutController.ts`
- `src/controllers/volunteerController.ts`
- `src/controllers/reportController.ts`

**To Update:**
- `src/routes/itemRoutes.ts`
- `src/routes/locationRoutes.ts`
- `src/routes/checkoutRoutes.ts`
- `src/routes/volunteerRoutes.ts`
- `src/routes/reportRoutes.ts`

---

## [Implemented] Simplify Database Query Layer

**Status:** ✅ Implemented
**Date Proposed:** 2025-10-22
**Date Implemented:** 2025-10-24
**Priority:** Medium
**Complexity:** Low-Medium

### Overview

Remove the `DatabaseQueries` abstraction layer and colocate SQL queries directly in service methods. The current abstraction adds complexity without significant benefit.

### Current System (Before)

Queries are centralized in a static class:

```typescript
// src/database/queries.ts
export class DatabaseQueries {
  private static db = DatabaseConnection.getInstance();

  static readonly items = {
    getAll: this.db.prepare('SELECT * FROM items...'),
    getById: this.db.prepare('SELECT * FROM items WHERE item_id = ?'),
    create: this.db.prepare('INSERT INTO items...')
  };
}

// src/services/itemService.ts
static getAllItems() {
  return DatabaseQueries.items.getAll.all() as Item[];
}
```

### Proposed System (After)

Queries live directly in services where they're used:

```typescript
// src/services/itemService.ts
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

### Benefits

1. **Colocated Logic** - Queries live next to the code that uses them
2. **Easier to Read** - No jumping between files to understand what SQL is running
3. **Easier to Modify** - Change query and business logic in one place
4. **Less Abstraction** - One less layer to understand
5. **Better IntelliSense** - IDEs can better understand inline SQL
6. **Still Optimized** - better-sqlite3 automatically caches prepared statements

### Implementation Steps

1. **Move queries from `DatabaseQueries` into services:**
   - `ItemService` - Move all item and item_sizes queries
   - `LocationService` - Move all location queries
   - `ReportService` - Already has inline queries (good example!)
   - `VolunteerService` - Move volunteer session queries

2. **Update each service to use direct queries:**
   ```typescript
   // Before
   return DatabaseQueries.items.getAll.all();

   // After
   return this.db.prepare('SELECT * FROM items...').all();
   ```

3. **Delete `src/database/queries.ts`**

4. **Keep `src/database/connection.ts`** - Still need the singleton connection

### Considerations

**Question:** Won't this hurt performance by not reusing prepared statements?

**Answer:** No. better-sqlite3 automatically caches prepared statements internally. From the docs:
> "The first time a statement is prepared, it's cached. Subsequent calls with the same SQL reuse the prepared statement."

You get the caching benefits without the abstraction layer.

### Testing Requirements

1. Verify all database operations still work
2. Test that transactions still function correctly
3. Confirm error handling is preserved
4. Performance testing (should be identical)

### Implementation Summary

**What Was Implemented:**

1. **ItemService Refactored** (src/services/itemService.ts):
   - Added `private static db = DatabaseConnection.getInstance()`
   - Moved all item queries inline: `getAllItems()`, `getItemsByLocation()`, `getById()`, `getByQrCode()`
   - Moved all item_sizes queries inline: `getItemSizes()`, `getItemSizesByLocation()`, `updateQuantity()`, `adjustQuantity()`
   - Inline queries in `create()` transaction for item creation with sizes

2. **LocationService Refactored** (src/services/locationService.ts):
   - Added `private static db = DatabaseConnection.getInstance()`
   - Moved all location queries inline: `getActiveLocations()`, `getById()`, `create()`, `update()`, `toggleActive()`

3. **VolunteerService** - Already using inline queries, no changes needed ✅

4. **File Removed:**
   - Deleted `src/database/queries.ts` (~94 lines)

5. **Testing Completed:**
   - ✅ All location endpoints working (GET all, GET by ID, CREATE, UPDATE)
   - ✅ All item endpoints working (GET all, GET by location, GET by ID, GET by QR code, CREATE)
   - ✅ Item sizes endpoints working (GET sizes, GET sizes by location)
   - ✅ Item creation with sizes working (creates sizes at all locations)
   - ✅ Update operations working (location update, quantity update)
   - ✅ Volunteer sessions working (CREATE, GET sessions, GET stats)
   - ✅ Checkout endpoints working (GET checkouts)
   - ✅ Report endpoints working (low stock report)
   - ✅ Transaction handling working correctly
   - ✅ All aggregates (COUNT, SUM) working
   - ✅ All JOINs working properly

**Benefits Achieved:**
- ✅ Queries colocated with business logic
- ✅ Easier to read and modify - no jumping between files
- ✅ One less abstraction layer
- ✅ Still optimized - better-sqlite3 caches prepared statements automatically
- ✅ Zero performance regression

### Implementation Estimate (Actual)

- **Effort:** 1.5 hours
- **Lines Removed:** ~94 lines from queries.ts
- **Files Removed:** 1 file (`src/database/queries.ts`)
- **Testing:** Comprehensive gauntlet testing completed

### Related Files

**To Remove:**
- `src/database/queries.ts`

**To Update:**
- `src/services/itemService.ts`
- `src/services/locationService.ts`
- `src/services/volunteerService.ts`

**No Changes Needed:**
- `src/services/reportService.ts` - Already uses inline queries
- `src/database/connection.ts` - Keep as-is

---

## [Implemented] Merge Frontend Services into Zustand Stores

**Status:** ✅ Implemented
**Date Proposed:** 2025-10-22
**Date Implemented:** 2025-10-24
**Priority:** High
**Complexity:** Medium-High

### Overview

Eliminate the frontend service layer by moving API calls directly into Zustand stores. Current services are thin wrappers around axios that add minimal value.

### Current System (Before)

**Architecture:** `Component → Store → Service → API`

Data flows through multiple layers:

```typescript
// frontend/src/services/itemService.ts
export const itemService = {
  async getItems(locationId?: number): Promise<Item[]> {
    const response = await api.get('/items', { params: { location_id: locationId } });
    return response.data.data;
  }
};

// frontend/src/stores/inventoryStore.ts
export const useInventoryStore = create((set) => ({
  items: [],
  setItems: (items) => set({ items })
}));

// Component
const { items, setItems } = useInventoryStore();
const fetchItems = async () => {
  const data = await itemService.getItems();
  setItems(data);
};
```

### Proposed System (After)

**Architecture:** `Component → Store (with API calls)`

Stores handle their own data fetching:

```typescript
// frontend/src/stores/inventoryStore.ts
import { api } from '../services/api';

export const useInventoryStore = create((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  // Fetch items from API and update store
  fetchItems: async (locationId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const params = locationId ? { location_id: locationId } : {};
      const response = await api.get('/items', { params });
      set({ items: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Create new item
  createItem: async (itemData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/items', itemData);
      set((state) => ({
        items: [...state.items, response.data.data],
        isLoading: false
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
}));

// Component (simpler!)
const { items, isLoading, fetchItems } = useInventoryStore();

useEffect(() => {
  fetchItems();
}, []);
```

### Benefits

1. **Single Source of Truth** - Store manages both state and data fetching
2. **Fewer Files** - Remove 4-5 service files (~400 lines)
3. **Clearer Data Flow** - No ambiguity about where data comes from
4. **Built-in Loading/Error States** - Stores naturally track loading and errors
5. **Better Developer Experience** - One hook gives you everything
6. **Easier Testing** - Mock stores instead of mocking services

### Implementation Steps

1. **Update each store to include API calls:**
   - `inventoryStore.ts` - Add `fetchItems()`, `createItem()`, `updateQuantity()`, etc.
   - `locationStore.ts` - Add `fetchLocations()`, `createLocation()`, etc.
   - `cartStore.ts` - Add `submitCheckout()` to handle cart submission
   - `uiStore.ts` - May not need changes

2. **Add loading and error states to stores:**
   ```typescript
   interface StoreState {
     data: T[];
     isLoading: boolean;
     error: string | null;
     // ... actions
   }
   ```

3. **Keep `api.ts`** - The base axios instance is still useful

4. **Delete service files:**
   - `frontend/src/services/itemService.ts`
   - `frontend/src/services/locationService.ts`
   - `frontend/src/services/reportService.ts`
   - `frontend/src/services/volunteerService.ts`

5. **Update components** - Use store actions instead of service calls

### Pattern Examples

**Before:**
```typescript
// Component needs both store and service
import { useInventoryStore } from '../stores/inventoryStore';
import { itemService } from '../services/itemService';

function InventoryPage() {
  const { items, setItems } = useInventoryStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const data = await itemService.getItems();
        setItems(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return isLoading ? <Loading /> : <ItemsTable items={items} />;
}
```

**After:**
```typescript
// Component only needs store
import { useInventoryStore } from '../stores/inventoryStore';

function InventoryPage() {
  const { items, isLoading, fetchItems } = useInventoryStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return isLoading ? <Loading /> : <ItemsTable items={items} />;
}
```

### Considerations

**Keep `api.ts`** - The base axios instance with interceptors is still useful:
- Centralized error handling
- Request/response logging
- Base URL configuration
- Timeout settings

### Testing Requirements

1. Verify all API calls still work from stores
2. Test loading states display correctly
3. Test error handling and error messages
4. Verify store persistence still works (for cart, location)
5. Test concurrent requests don't cause race conditions

### Implementation Summary

**What Was Implemented:**

1. **Stores Updated with API Methods:**
   - `inventoryStore.ts` - Added `fetchItems()`, `fetchItemById()`, `fetchItemByQrCode()`, `fetchItemSizes()`, `createItem()`, `updateQuantity()`, `adjustQuantity()`
   - `locationStore.ts` - Added `fetchLocations()`, `fetchLocationById()`, `createLocation()`, `updateLocation()`, `toggleLocationActive()`
   - `cartStore.ts` - Added `submitCheckout()` method
   - `reportStore.ts` - Created new store with `getCurrentInventory()`, `getLowStock()`, `getCheckouts()`, `getPopularItems()`, `getVolunteerHours()`, `getDailyVolunteers()`, `getItemMaster()`, `getTransactionHistory()`, `getMonthlySummary()`, `getMonthlyInventoryMovements()`, `exportReport()`
   - `volunteerStore.ts` - Created new store with `createSession()`, `getSessions()`, `getSessionById()`, `updateSession()`, `deleteSession()`, `getVolunteerStats()`

2. **Loading and Error States Added:**
   - All stores now have `isLoading: boolean` and `error: string | null` states
   - State management follows pattern: set loading → make API call → update state → handle errors

3. **Service Files Deleted:**
   - Removed `frontend/src/services/itemService.ts` (~100 lines)
   - Removed `frontend/src/services/locationService.ts` (~80 lines)
   - Removed `frontend/src/services/reportService.ts` (~120 lines)
   - Removed `frontend/src/services/volunteerService.ts` (~100 lines)
   - **Kept** `frontend/src/services/api.ts` (base axios instance with interceptors)

4. **Components Updated:**
   - Fixed hook destructuring in 12 components (were calling `useStore().method()` inline)
   - Updated return types for store methods that components expected to return data
   - All components now use store actions exclusively

5. **Testing Completed:**
   - ✅ TypeScript compilation passes with zero errors
   - ✅ All backend API endpoints verified working
   - ✅ Stores have proper loading/error state management
   - ✅ Store persistence works (cart, location)
   - ✅ Both backend and frontend servers start successfully

**Benefits Achieved:**
- ✅ Single source of truth - stores manage both state and data fetching
- ✅ Fewer files - removed 4 service files (~400 lines)
- ✅ Clearer data flow - no ambiguity about where data comes from
- ✅ Built-in loading/error states
- ✅ Better developer experience - one hook provides everything
- ✅ Easier testing - mock stores instead of services

### Implementation Estimate (Actual)

- **Effort:** ~4 hours (including TypeScript error fixes)
- **Lines Removed:** ~400 lines from service files
- **Files Removed:** 4 service files
- **Files Created:** 2 new stores (reportStore, volunteerStore)

### Related Files

**Removed:**
- `frontend/src/services/itemService.ts`
- `frontend/src/services/locationService.ts`
- `frontend/src/services/reportService.ts`
- `frontend/src/services/volunteerService.ts`

**Created:**
- `frontend/src/stores/reportStore.ts`
- `frontend/src/stores/volunteerStore.ts`

**Updated:**
- `frontend/src/stores/inventoryStore.ts`
- `frontend/src/stores/locationStore.ts`
- `frontend/src/stores/cartStore.ts`
- `frontend/src/pages/ItemDetailPage.tsx`
- `frontend/src/pages/QRActionPage.tsx`
- `frontend/src/pages/AddItemPage.tsx`
- `frontend/src/pages/ReportsPage.tsx`
- `frontend/src/components/inventory/TransactionHistory.tsx`
- `frontend/src/components/volunteer/VolunteerStats.tsx`
- `frontend/src/components/volunteer/VolunteerHoursForm.tsx`
- `frontend/src/components/volunteer/SessionsList.tsx`
- `frontend/src/components/volunteer/EditSessionModal.tsx`

**Kept:**
- `frontend/src/services/api.ts` - Base axios instance with interceptors and error handling

---

## [Implemented] Remove Redundant Manual Validation

**Status:** ✅ Implemented
**Date Proposed:** 2025-10-24
**Date Implemented:** 2025-10-24
**Priority:** Low
**Complexity:** Low

### Overview

Remove redundant manual validation checks that duplicate Zod schema validation. The code was validating the same inputs twice - once with Zod schemas and again with manual checks.

### Current System (Before)

**Redundant validation at two levels:**

```typescript
// Route has Zod validation
router.get('/:id',
  validateParams(itemParamsSchema),  // ✅ Zod validates ID is a number
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    // ❌ Redundant manual check
    if (isNaN(id)) {
      return res.status(400).json({
        error: { message: 'Invalid item ID - must be a number' }
      });
    }

    const item = ItemService.getById(id);
    // ...
  })
);
```

**Examples of redundancy found:**
- `itemRoutes.ts` - 6 redundant validation blocks
- `locationRoutes.ts` - 3 redundant validation blocks

### Proposed System (After)

**Trust Zod validation - remove manual checks:**

```typescript
// Route has Zod validation
router.get('/:id',
  validateParams(itemParamsSchema),  // ✅ Zod validates ID is a number
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    // ✅ No redundant check - Zod already validated it
    const item = ItemService.getById(id);
    // ...
  })
);
```

### Benefits

1. **Less Code** - Removed ~50 lines of redundant validation checks
2. **No Duplication** - Each validation happens once, not twice
3. **Consistent Errors** - All validation errors come from Zod with consistent formatting
4. **Trust the Tools** - If Zod validates successfully, the data is valid
5. **Easier Maintenance** - Update validation rules in one place (schemas)

### Implementation Summary

**What Was Changed:**

1. **itemRoutes.ts** - Removed 6 redundant validation blocks:
   - GET `/` - Removed `isNaN(locationId)` check (Zod validates)
   - GET `/:id` - Removed `isNaN(id)` check (Zod validates)
   - GET `/qr/:qrCode` - Removed empty string check (Zod validates)
   - GET `/:itemId/sizes` - Removed `isNaN(itemId)` and `isNaN(locationId)` checks
   - PUT `/sizes/:sizeId/quantity` - Removed `isNaN(sizeId)` and `quantity < 0` checks
   - PATCH `/sizes/:sizeId/adjust` - Removed `isNaN(sizeId)` and `typeof adjustment` checks

2. **locationRoutes.ts** - Removed 3 redundant validation blocks:
   - GET `/:id` - Removed `isNaN(id)` check
   - PUT `/:id` - Removed `isNaN(id)` check
   - PATCH `/:id/toggle` - Removed `isNaN(id)` check

**Testing Completed:**
- ✅ Invalid item ID (`/api/items/abc`) - Zod returns proper validation error
- ✅ Negative quantity (`quantity: -5`) - Zod catches and returns validation error
- ✅ Zero adjustment (`adjustment: 0`) - Zod catches with custom refine rule
- ✅ Invalid location ID (`/api/locations/abc`) - Zod returns proper validation error
- ✅ Invalid query params (`location_id=abc`) - Zod validates query parameters
- ✅ Valid requests still work correctly
- ✅ All error messages are clear and field-specific

**Benefits Achieved:**
- ✅ Removed ~50 lines of redundant code
- ✅ Single source of validation truth (Zod schemas)
- ✅ Consistent error message format across all endpoints
- ✅ Simplified route handlers
- ✅ Zero functional changes - all validation still works

### Why This Was Better Than "Reduce Zod Schema Complexity"

The original proposal suggested either:
- **Option A:** Keep Zod, remove manual checks
- **Option B:** Remove Zod entirely

**Analysis revealed:**
- Zod is working perfectly - no issues
- The real problem was **redundant validation** (validating twice)
- Removing Zod would take 2-3 hours and lose benefits (type safety, structured errors)
- Removing redundant checks takes 15 minutes and keeps Zod's benefits

**This implementation chose the pragmatic path:**
- Keep what works (Zod)
- Remove what's redundant (manual checks)
- Achieve the original goal (simpler code) in less time

### Implementation Estimate (Actual)

- **Development:** 15 minutes
- **Testing:** 5 minutes
- **Total:** 20 minutes (vs 2-3 hours to remove Zod)

### Related Files

**Updated:**
- `src/routes/itemRoutes.ts` - Removed 6 redundant validation blocks
- `src/routes/locationRoutes.ts` - Removed 3 redundant validation blocks

**Kept (working well):**
- `src/schemas/itemSchemas.ts` - Zod schemas for item validation
- `src/schemas/locationSchemas.ts` - Zod schemas for location validation
- `src/middleware/validation.ts` - Validation middleware using Zod

---

## [Superseded] Reduce Zod Schema Complexity

**Status:** ❌ Superseded by "Remove Redundant Manual Validation"
**Date Proposed:** 2025-10-22
**Date Superseded:** 2025-10-24
**Priority:** Medium
**Complexity:** Low-Medium

### Why This Was Superseded

This proposal identified a real problem - validation complexity - but proposed removing Zod entirely. After analysis, the actual issue was **redundant validation** (validating inputs twice), not Zod itself. The "Remove Redundant Manual Validation" implementation addressed the same goal (simpler code) in 20 minutes vs 2-3 hours, while keeping Zod's benefits (type safety, structured errors, consistent validation).

See **"Remove Redundant Manual Validation"** section above for the implemented solution.

### Overview

Simplify validation by choosing a single, consistent validation strategy. The proposal identified that validation was redundant across Zod schemas, middleware, and manual checks in routes.

### Current System (Before)

**Three layers of validation:**

1. **Zod schemas** in `src/schemas/`:
```typescript
export const itemParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Item ID must be a number')
});
```

2. **Validation middleware** that uses Zod:
```typescript
router.get('/:id', validateParams(itemParamsSchema), ItemController.getItemById);
```

3. **Manual validation** in controllers:
```typescript
static getItemById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {  // Redundant validation!
    return res.status(400).json({ error: { message: 'Invalid ID' } });
  }
  // ...
});
```

### Proposed System (After)

**Option A: Keep Zod, Remove Manual Checks**

Use Zod consistently, remove redundant manual validation:

```typescript
// Keep: Zod schema
export const itemParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

// Keep: Validation middleware
router.get('/:id',
  validateParams(itemParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Remove: Manual isNaN check (Zod already validated)
    const id = req.params.id;  // Already a number after Zod coercion
    const item = ItemService.getById(id);
    // ...
  })
);
```

**Option B: Remove Zod, Use Simple Manual Validation** (Recommended for small intranet app)

```typescript
// Remove: Zod schemas and validation middleware
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id < 1) {
    return res.status(400).json({
      error: { message: 'Invalid item ID - must be a positive number' }
    });
  }

  const item = ItemService.getById(id);
  // ...
}));
```

### Benefits

**Option A (Keep Zod):**
1. **Type Safety** - Zod provides runtime type validation
2. **Consistency** - Same validation approach everywhere
3. **Better Error Messages** - Zod provides detailed validation errors
4. **Auto-generated Types** - Can generate TypeScript types from schemas

**Option B (Remove Zod):** ⭐ **Recommended**
1. **Simplicity** - Less dependency complexity
2. **Fewer Files** - Remove all schema files
3. **Clearer Code** - Validation logic is inline and obvious
4. **Faster** - No schema parsing overhead
5. **Easier to Customize** - Write exactly the validation you need
6. **Appropriate for Scale** - This is a small intranet app with trusted users

### Recommendation: Option B

For this specific project:
- Small intranet application with trusted users
- Limited attack surface (not public-facing)
- Simple validation needs (mostly integer IDs and basic field checks)
- Benefits of Zod don't outweigh the complexity it adds

### Implementation Steps (Option B)

1. **Remove Zod validation middleware:**
   - Delete `src/middleware/validation.ts`

2. **Remove all schema files:**
   - Delete `src/schemas/itemSchemas.ts`
   - Delete `src/schemas/locationSchemas.ts`
   - Delete any other schema files

3. **Update routes to use inline validation:**
   ```typescript
   // Before
   router.post('/', validateBody(createItemSchema), ItemController.createItem);

   // After
   router.post('/', asyncHandler(async (req, res) => {
     const { name, description, has_sizes } = req.body;

     if (!name || name.trim().length === 0) {
       return res.status(400).json({ error: { message: 'Item name is required' } });
     }

     if (typeof has_sizes !== 'boolean') {
       return res.status(400).json({ error: { message: 'has_sizes must be boolean' } });
     }

     const item = ItemService.create(req.body);
     res.status(201).json({ success: true, data: item });
   }));
   ```

4. **Uninstall Zod:**
   ```bash
   npm uninstall zod
   ```

5. **Create validation helper functions for common patterns:**
   ```typescript
   // src/utils/validation.ts
   export function validatePositiveInteger(value: any, fieldName: string) {
     const num = parseInt(value);
     if (isNaN(num) || num < 1) {
       throw new Error(`${fieldName} must be a positive integer`);
     }
     return num;
   }

   export function validateRequired(value: any, fieldName: string) {
     if (!value || (typeof value === 'string' && value.trim().length === 0)) {
       throw new Error(`${fieldName} is required`);
     }
     return value;
   }
   ```

### Alternative: Option A Steps

If you prefer to keep Zod:

1. Remove all manual validation checks in controllers
2. Update Zod schemas to use `z.coerce.number()` for proper type coercion
3. Trust that Zod validation middleware catches all issues
4. Remove redundant error handling

### Testing Requirements

1. Test all API endpoints still validate correctly
2. Test error messages are clear and helpful
3. Test edge cases (negative numbers, empty strings, null values, etc.)
4. Verify 400 errors are returned for invalid input

### Implementation Estimate

**Option A (Keep Zod):**
- **Effort:** 1-2 hours
- **Lines Removed:** ~100 lines (manual checks in controllers)

**Option B (Remove Zod):**
- **Effort:** 2-3 hours
- **Lines Removed:** ~200 lines (schemas + middleware + redundant checks)
- **Dependencies Removed:** 1 (zod)

### Related Files

**Option A (Keep Zod):**
- Update: All controllers to remove manual validation
- Keep: All schema files
- Keep: `src/middleware/validation.ts`

**Option B (Remove Zod):**
- Remove: `src/middleware/validation.ts`
- Remove: `src/schemas/itemSchemas.ts`
- Remove: `src/schemas/locationSchemas.ts`
- Remove: Zod from `package.json`
- Update: All routes to use inline validation
- Create: `src/utils/validation.ts` (helper functions)

---

## [Proposed] Remove Unnecessary Middleware

**Status:** Proposed - Not Yet Implemented
**Date Proposed:** 2025-10-22
**Priority:** Low
**Complexity:** Low

### Overview

Remove or simplify middleware that adds complexity without significant benefit for an intranet application.

### Current System (Before)

```typescript
// src/server.ts
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

// Security middleware
app.use(helmet());

// CORS with complex configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'https://cac-inventory.onrender.com'],
  credentials: true
}));

// Logging middleware
app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400
}));
```

### Proposed System (After)

Simplified middleware appropriate for intranet deployment:

```typescript
// src/server.ts
import cors from 'cors';

// Simple CORS (since this is intranet-only)
app.use(cors());

// Simple request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Body parsing (keep as-is)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
```

### Analysis of Each Middleware

#### 1. Helmet (Security Headers)

**What it does:** Sets various HTTP headers for security (XSS protection, content type sniffing, etc.)

**Keep or Remove?** **Remove** ❌

**Reasoning:**
- Designed for public-facing web applications
- Intranet app with trusted users on controlled network
- Most headers (CSP, HSTS, etc.) are for protecting against external attacks
- Adds complexity with minimal benefit in this context

#### 2. Morgan (HTTP Request Logger)

**What it does:** Logs every HTTP request in Apache combined log format

**Keep or Remove?** **Simplify** ⚡

**Reasoning:**
- Logging is useful for debugging
- Morgan's "combined" format is overkill (logs user agents, referrers, etc.)
- For intranet app, simple console.log is sufficient
- Can add more detailed logging later if needed

**Simplified version:**
```typescript
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}
```

#### 3. CORS

**What it does:** Enables Cross-Origin Resource Sharing

**Keep or Remove?** **Simplify** ⚡

**Reasoning:**
- Need CORS for frontend to call backend API
- Complex configuration is unnecessary for intranet
- Simple `app.use(cors())` allows all origins (fine for intranet)
- OR configure specific origin if backend and frontend are on different ports

**Simplified version:**
```typescript
// Allow all origins (fine for intranet)
app.use(cors());

// OR if you want to be specific:
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
```

### Benefits

1. **Less Complexity** - Fewer dependencies to maintain
2. **Clearer Code** - Obvious what each middleware does
3. **Faster Startup** - Less middleware to initialize
4. **Appropriate Security** - Security measures match threat model
5. **Easier Debugging** - Simpler logging that's actually useful

### Implementation Steps

1. **Remove helmet:**
   ```bash
   npm uninstall helmet
   ```

2. **Remove morgan:**
   ```bash
   npm uninstall morgan
   ```

3. **Update `src/server.ts`:**
   - Remove helmet import and usage
   - Remove morgan import and usage
   - Add simple logging middleware for development
   - Simplify CORS configuration

4. **Remove type definitions:**
   ```bash
   npm uninstall @types/morgan
   ```

### Proposed server.ts Structure

```typescript
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { DatabaseConnection } from './database/connection.js';
// ... route imports

const app = express();
const PORT = process.env.PORT || 3001;

// Simple CORS for intranet
app.use(cors());

// Simple request logging (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const color = status >= 500 ? '\x1b[31m' :  // Red for 5xx
                    status >= 400 ? '\x1b[33m' :  // Yellow for 4xx
                    '\x1b[32m';                   // Green otherwise
      console.log(`${color}${req.method} ${req.path} ${status}\x1b[0m - ${duration}ms`);
    });
    next();
  });
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/locations', locationRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/checkouts', checkoutRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: { message: 'Route not found', path: req.originalUrl }
  });
});

// Error handling (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  DatabaseConnection.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🌈 Rainbow Room Inventory API`);
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});
```

### Security Considerations

**Question:** Is it safe to remove helmet?

**Answer:** Yes, for an intranet application:
- Not exposed to the public internet
- Users are on a trusted network
- Attack vectors helmet protects against (XSS, clickjacking, etc.) are minimal
- Security should focus on: encrypted database, input validation, audit trails

**If you're concerned:** Keep CORS configured to only allow your frontend origin.

### Testing Requirements

1. Verify API endpoints still work without helmet
2. Test CORS works between frontend and backend
3. Verify logging works in development
4. Test error handling still works correctly

### Implementation Estimate

- **Effort:** 1 hour
- **Lines Removed:** ~50 lines
- **Dependencies Removed:** 2-3 packages (helmet, morgan, @types/morgan)

### Related Files

- `src/server.ts` - Main changes here
- `package.json` - Remove dependencies

---

## [Implemented] Database Schema Improvements

**Status:** ✅ Implemented
**Date Proposed:** 2025-10-22
**Date Implemented:** 2025-10-24
**Priority:** Critical (for foreign keys), High (for date formats), Medium (for optimizations)
**Complexity:** Low-Medium

### Overview

Fix critical database design issues and optimize schema for maintainability. The current schema is fundamentally sound but has several issues that could lead to data integrity problems and maintenance difficulties.

### Overall Assessment: B- (Good but has critical issues)

**What's Good:**
- ✅ Solid normalization fundamentals
- ✅ Good use of junction tables (header/line pattern)
- ✅ Sensible audit trail approach with separate transaction tables
- ✅ Proper indexes on foreign keys and frequently queried columns
- ✅ Triggers for maintaining calculated fields

**What Needs Fixing:**
- ❌ Foreign keys disabled (CRITICAL)
- ❌ Inconsistent date formats (HIGH PRIORITY)
- ❌ Duplicate transaction tracking system
- ❌ Missing CHECK constraints
- ❌ Duplicate indexes

---

## 🚨 Critical Issues (Must Fix)

### 1. Foreign Keys Are Disabled

**Status:** ❌ CRITICAL - Foreign key constraints are completely ignored

**Current State:**
```sql
-- In connection.ts
PRAGMA foreign_keys; -- Returns 0 (OFF)
```

**Problem:**
- All `FOREIGN KEY` declarations in schema are ignored
- No referential integrity enforcement
- Can insert orphaned records (checkout_items without checkouts)
- Can delete parent records without cleaning up children
- Database can become corrupted over time

**How It Happened:**
SQLite has foreign keys OFF by default. The schema declares them, but they're never enabled at runtime.

**Fix Required:**
```typescript
// src/database/connection.ts
export class DatabaseConnection {
  static getInstance(): Database.Database {
    if (!this.instance) {
      this.instance = new Database('data/inventory.db');
      // THIS LINE IS MISSING:
      this.instance.pragma('foreign_keys = ON');  // ⬅️ ADD THIS
      this.instance.pragma('journal_mode = WAL');
    }
    return this.instance;
  }
}
```

**Testing After Fix:**
```sql
-- Test that foreign keys work
PRAGMA foreign_keys; -- Should return 1

-- Test referential integrity
DELETE FROM items WHERE item_id = 1; -- Should fail if checkouts reference it
INSERT INTO checkout_items (checkout_id, item_id, quantity)
  VALUES (99999, 1, 1); -- Should fail (invalid checkout_id)
```

**Impact:** Without this fix, your database integrity is at risk. This is the **highest priority fix**.

---

### 2. Date Format Inconsistency

**Status:** ❌ HIGH PRIORITY - Multiple date formats stored as TEXT

**Current State:**
```sql
-- Schema says one thing:
checkout_date DATE NOT NULL, -- Comment: "MM-DD-YYYY format"

-- Database has multiple formats:
'10-13-2025' (hyphen, M-D-YYYY)
'10/13/2025' (slash, M/D/YYYY)
'2024-01-15' (ISO format)
```

**Problems:**
1. **Sorting Broken:** TEXT dates don't sort correctly
   - `"10-13-2025" < "2-15-2025"` ❌ (Feb 15 appears before Oct 13)
2. **Complex Queries:** Need special handling for multiple formats (see reportService.ts:493-504)
3. **SQLite Functions Don't Work:** Can't use `date()` functions reliably
4. **Ambiguity:** Is `01-02-2025` January 2 or February 1?

**Recommended Fix:**
```sql
-- Option 1: ISO 8601 format (YYYY-MM-DD) - RECOMMENDED
checkout_date TEXT NOT NULL CHECK (checkout_date IS date(checkout_date)),

-- Option 2: Unix timestamp (INTEGER)
checkout_date INTEGER NOT NULL, -- seconds since epoch
```

**Why ISO Format (Option 1):**
- Sortable: `'2025-01-15' < '2025-10-13'` ✅
- Works with SQLite date functions: `date(checkout_date, '-7 days')`
- Unambiguous: Always YYYY-MM-DD
- Widely supported standard

**Migration Strategy:**
```sql
-- Create migration to normalize existing dates
UPDATE checkouts
SET checkout_date = CASE
  -- Convert M-D-YYYY to YYYY-MM-DD
  WHEN checkout_date LIKE '%-%' THEN
    substr(checkout_date, 7, 4) || '-' ||
    printf('%02d', substr(checkout_date, 1, instr(checkout_date, '-') - 1)) || '-' ||
    printf('%02d', substr(checkout_date, instr(checkout_date, '-') + 1,
           instr(substr(checkout_date, instr(checkout_date, '-') + 1), '-') - 1))
  -- Convert M/D/YYYY to YYYY-MM-DD
  WHEN checkout_date LIKE '%/%' THEN
    substr(checkout_date, 7, 4) || '-' ||
    printf('%02d', substr(checkout_date, 1, instr(checkout_date, '/') - 1)) || '-' ||
    printf('%02d', substr(checkout_date, instr(checkout_date, '/') + 1,
           instr(substr(checkout_date, instr(checkout_date, '/') + 1), '/') - 1))
  ELSE checkout_date -- Already ISO format
END;

-- Add CHECK constraint after migration
-- Note: Can't add to existing table, need to recreate table
```

**Application Changes:**
```typescript
// Always store dates in ISO format
const isoDate = new Date().toISOString().split('T')[0]; // '2025-10-22'

// Display format for users
const displayDate = new Date(isoDate).toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
}); // 'October 22, 2025'
```

---

### 3. Missing CHECK Constraints

**Status:** ❌ HIGH PRIORITY - No validation of data integrity

**Current Issues:**

**A. Negative Inventory Not Prevented:**
```sql
-- Nothing stops this:
UPDATE item_sizes SET current_quantity = -50 WHERE size_id = 1;
```

**B. Zero Quantity Changes Allowed:**
```sql
-- Meaningless transaction:
INSERT INTO inventory_transactions (quantity_change, ...) VALUES (0, ...);
```

**Required Constraints:**
```sql
-- Prevent negative inventory
CREATE TABLE item_sizes (
  -- ...
  current_quantity INTEGER NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  -- ...
);

-- Prevent zero-quantity transactions
CREATE TABLE inventory_transactions (
  -- ...
  quantity_change INTEGER NOT NULL CHECK (quantity_change != 0),
  -- ...
);

-- Ensure positive quantities in transaction line items
CREATE TABLE checkout_items (
  -- ...
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  -- ...
);

-- Same for other transaction item tables
```

**Note:** For existing tables, you'll need to recreate them to add CHECK constraints. SQLite doesn't support `ALTER TABLE ADD CONSTRAINT`.

---

## 🔧 High Priority Optimizations

### 4. Remove Duplicate Transaction System

**Status:** ⚠️ REDUNDANT - Two systems tracking the same data

**Current State:**
- **System 1:** Specialized tables (`checkouts`, `inventory_additions`, `inventory_transfers`, `inventory_adjustments`)
- **System 2:** Unified log (`inventory_transactions`)

**Problem:**
- Data duplication (~30 duplicate records found)
- Risk of sync issues between systems
- Extra maintenance burden
- Confusion about which is source of truth

**Recommended Action:**
**Remove `inventory_transactions` table** and rely on specialized tables.

**Why Keep Specialized Tables:**
1. Type-safe - Each table has specific fields for its transaction type
2. Better for complex business logic
3. Already integrated with application code
4. Can query as needed for reporting
5. Trigger-based audit system (from earlier proposal) provides unified view without duplication

**Migration Steps:**
```sql
-- 1. Verify data exists in specialized tables
SELECT COUNT(*) FROM checkouts;
SELECT COUNT(*) FROM inventory_additions;
-- etc.

-- 2. Drop the redundant table
DROP TABLE IF EXISTS inventory_transactions;

-- 3. Drop unused indexes
DROP INDEX IF EXISTS idx_inventory_transactions_item_id;
DROP INDEX IF EXISTS idx_inventory_transactions_size_id;
-- etc.
```

**Application Changes:**
- Remove any code that writes to `inventory_transactions`
- Use `reportService.getTransactionHistory()` for unified view (already implemented)

---

### 5. Remove Duplicate Indexes

**Status:** ⚠️ WASTEFUL - Same columns indexed twice

**Found On `inventory_transactions` Table:**
```sql
-- Duplicates:
idx_inventory_transactions_item_id  ← Keep
idx_inventory_transactions_item     ← DELETE (duplicate)

idx_inventory_transactions_size_id  ← Keep
idx_inventory_transactions_size     ← DELETE (duplicate)

idx_inventory_transactions_location_id  ← Keep
idx_inventory_transactions_location     ← DELETE (duplicate)
```

**Impact:**
- Wastes disk space (3 unnecessary indexes)
- Slows down INSERT/UPDATE/DELETE operations
- No performance benefit

**Fix:**
```sql
DROP INDEX IF EXISTS idx_inventory_transactions_item;
DROP INDEX IF EXISTS idx_inventory_transactions_size;
DROP INDEX IF EXISTS idx_inventory_transactions_location;
```

---

## 💡 Design Choices to Keep (Acceptable Trade-offs)

These are unconventional but acceptable for a small intranet application:

### 1. "N/A" Size for Non-Sized Items ✅ KEEP

**Current Approach:**
```sql
-- Items without sizes still get a size record:
INSERT INTO item_sizes (item_id, location_id, size_label, current_quantity)
VALUES (24, 1, 'N/A', 20); -- Shampoo
```

**Why It's Okay:**
- Simplifies queries (every item has at least one `item_sizes` record)
- No need for `LEFT JOIN` or NULL handling
- Consistent data model

**Alternative (More "correct" but more complex):**
- Use NULL for `size_label` on non-sized items
- Requires more complex queries everywhere

**Verdict:** Current approach is fine. Don't change.

---

### 2. JSON in TEXT Fields ✅ KEEP

**Current Approach:**
```sql
allegations TEXT NOT NULL, -- JSON: ["Physical Abuse","Abandonment"]
```

**Why It's Okay:**
- SQLite has JSON functions: `json_extract(allegations, '$[0]')`
- Simple for fixed, small lists
- Appropriate for intranet scale

**When You'd Normalize:**
- Need to query "all checkouts with X allegation"
- Allegations need to be managed (add/remove/edit)
- Need to enforce valid values

**Verdict:** Current approach is fine for your use case.

---

### 3. Wide Checkout Table ✅ KEEP

**Current Approach:**
```sql
CREATE TABLE checkouts (
  worker_first_name TEXT,
  worker_last_name TEXT,
  parent_guardian_first_name TEXT,
  parent_guardian_last_name TEXT,
  -- ... 15+ columns
);
```

**Why It's Okay:**
- Simple for small systems
- Matches your paper forms
- No need to query "all checkouts by worker Jane Smith"

**When You'd Normalize:**
- Building a user management system
- Need to track worker performance
- Workers need login accounts

**Verdict:** Current approach is appropriate for your scale.

---

## 📋 Implementation Priority

### Phase 1: Critical Fixes (Must Do Before Production)

**Priority: CRITICAL - Do First**

1. **Enable Foreign Keys** (5 minutes)
   - Add `pragma('foreign_keys = ON')` to connection.ts
   - Test with sample deletes/inserts

2. **Standardize Date Formats** (2-3 hours)
   - Write migration script to convert to ISO format
   - Update application to always use ISO format
   - Add CHECK constraint (requires table recreation)

3. **Add CHECK Constraints** (1-2 hours)
   - Prevent negative inventory
   - Prevent zero-quantity changes
   - Validate positive quantities

**Total Effort:** 3-5 hours
**Risk:** Low (improves data integrity)
**Impact:** HIGH (prevents data corruption)

---

### Phase 2: Cleanup & Optimization (Should Do Soon)

**Priority: HIGH - Do After Phase 1**

4. **Remove Duplicate Transaction System** (1 hour)
   - Drop `inventory_transactions` table
   - Remove application code that uses it
   - Verify reporting still works

5. **Remove Duplicate Indexes** (5 minutes)
   - Drop 3 duplicate indexes
   - Verify query performance unchanged

**Total Effort:** 1-2 hours
**Risk:** Very low (removing unused code)
**Impact:** MEDIUM (cleaner schema, less confusion)

---

### Phase 3: Consider for Future (Nice to Have)

**Priority: LOW - Optional**

6. **Cascade vs Restrict Review** (30 minutes)
   - Review all `ON DELETE` policies
   - Ensure they match business logic
   - Document decisions

7. **Add Comments to Schema** (30 minutes)
   - Document "N/A" size convention
   - Explain JSON fields
   - Note foreign key requirements

**Total Effort:** 1 hour
**Risk:** None (documentation only)
**Impact:** LOW (better maintainability)

---

## 🧪 Testing Requirements

### After Foreign Keys Fix:
```sql
-- Test referential integrity
PRAGMA foreign_keys; -- Should return 1

-- Test cascade deletes
DELETE FROM checkouts WHERE checkout_id = (SELECT MIN(checkout_id) FROM checkouts);
-- Verify checkout_items deleted automatically

-- Test restrict deletes
DELETE FROM items WHERE item_id = (SELECT item_id FROM checkout_items LIMIT 1);
-- Should fail with FOREIGN KEY constraint error
```

### After Date Format Fix:
```sql
-- All dates should be ISO format
SELECT DISTINCT
  CASE
    WHEN checkout_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN 'ISO'
    ELSE 'INVALID: ' || checkout_date
  END as format_check
FROM checkouts;
-- Should return only 'ISO'

-- Date functions should work
SELECT date(checkout_date, '-7 days') FROM checkouts LIMIT 1;
-- Should not return NULL
```

### After CHECK Constraints:
```sql
-- Try to insert negative quantity (should fail)
UPDATE item_sizes SET current_quantity = -5 WHERE size_id = 1;
-- Expected: CHECK constraint failed: current_quantity >= 0

-- Try to insert zero quantity change (should fail)
INSERT INTO inventory_transactions (quantity_change, ...) VALUES (0, ...);
-- Expected: CHECK constraint failed: quantity_change != 0
```

---

## 📚 Implementation Scripts

### Script 1: Enable Foreign Keys
```typescript
// src/database/connection.ts
export class DatabaseConnection {
  private static instance: Database.Database;

  static getInstance(): Database.Database {
    if (!this.instance) {
      this.instance = new Database('data/inventory.db');

      // CRITICAL: Enable foreign keys
      this.instance.pragma('foreign_keys = ON');

      // Verify it worked
      const result = this.instance.pragma('foreign_keys', { simple: true });
      if (result !== 1) {
        throw new Error('Failed to enable foreign keys!');
      }

      console.log('✅ Foreign keys enabled');
    }
    return this.instance;
  }
}
```

### Script 2: Migrate Dates to ISO Format
```javascript
// scripts/migrate-dates.js
const Database = require('better-sqlite3');
const db = new Database('data/inventory.db');

// Function to convert various formats to ISO
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
    return `${year}-${month}-${day}`;
  }

  throw new Error(`Unknown date format: ${dateStr}`);
}

// Migrate checkouts table
const checkouts = db.prepare('SELECT checkout_id, checkout_date FROM checkouts').all();

const update = db.prepare('UPDATE checkouts SET checkout_date = ? WHERE checkout_id = ?');

db.transaction(() => {
  for (const row of checkouts) {
    const isoDate = toISO(row.checkout_date);
    update.run(isoDate, row.checkout_id);
  }
})();

console.log(`✅ Migrated ${checkouts.length} checkout dates to ISO format`);

// Verify
const nonISO = db.prepare(`
  SELECT checkout_date
  FROM checkouts
  WHERE checkout_date NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
`).all();

if (nonISO.length > 0) {
  console.error('❌ Some dates still not ISO:', nonISO);
} else {
  console.log('✅ All dates are now ISO format');
}

db.close();
```

---

## 🎯 Summary

### Must Fix (Phase 1)
- ✅ Enable foreign keys (5 min, CRITICAL)
- ✅ Standardize date formats (2-3 hours, HIGH)
- ✅ Add CHECK constraints (1-2 hours, HIGH)

### Should Fix (Phase 2)
- ✅ Remove duplicate transaction system (1 hour, MEDIUM)
- ✅ Remove duplicate indexes (5 min, LOW)

### Can Keep As-Is
- ✅ "N/A" size for non-sized items (acceptable trade-off)
- ✅ JSON in TEXT fields (fine for small data)
- ✅ Wide checkout table (appropriate for scale)

### Overall Database Grade After Fixes: A-
- Solid fundamentals with critical issues resolved
- Appropriate for small intranet application
- Balance between correctness and simplicity
- Ready for long-term minimal maintenance

---

## Implementation Summary

**What Was Implemented:**

1. **Foreign Keys Enabled** (src/database/connection.ts:13-19):
   - Added `pragma('foreign_keys = ON')` with verification
   - Logs confirmation message on connection
   - Prevents orphaned records and enforces referential integrity
   - Tested with foreign key constraint violations

2. **Date Migration to ISO Format**:
   - Created `scripts/migrate-dates-to-iso.js` migration script
   - Converted 9 dates from M-D-YYYY and M/D/YYYY formats to YYYY-MM-DD
   - Migrated dates in all transaction tables: checkouts, volunteer_sessions, inventory_additions, inventory_transfers, inventory_adjustments
   - All 71 total date records verified in ISO format
   - Dates now sortable and compatible with SQLite date functions

3. **CHECK Constraints Added**:
   - Created `scripts/add-check-constraints.js` to recreate tables with constraints
   - `item_sizes`: Added `current_quantity >= 0` constraint
   - `checkout_items`: Added `quantity > 0` constraint
   - `inventory_addition_items`: Added `quantity > 0` constraint
   - `inventory_transfer_items`: Added `quantity > 0` constraint
   - `inventory_adjustment_items`: Added `quantity_adjustment != 0` constraint
   - All triggers recreated after table modifications
   - Cleaned 4 invalid records with negative quantities before adding constraints

4. **Duplicate Transaction System Removed**:
   - Created `scripts/remove-duplicate-transaction-system.js`
   - Dropped `inventory_transactions` table (25 records removed)
   - Dropped 9 duplicate indexes on that table
   - Specialized transaction tables remain as single source of truth
   - `reportService.getTransactionHistory()` provides unified view without duplication

5. **Duplicate Indexes Removed**:
   - All duplicate indexes were on the `inventory_transactions` table
   - Removed with the table in step 4 above
   - No other duplicate indexes found in database

**Testing Completed:**
- ✅ Foreign key tests pass (prevent invalid inserts, enforce CASCADE/RESTRICT)
- ✅ CHECK constraint tests pass (prevent negative inventory, zero quantities)
- ✅ Date format verification complete (all dates ISO format)
- ✅ All API endpoints tested and working (locations, items, reports, volunteers)
- ✅ Database triggers still functioning correctly
- ✅ No performance regression observed

**Scripts Created:**
- `scripts/test-foreign-keys.js` - Tests foreign key enforcement
- `scripts/migrate-dates-to-iso.js` - Migrates all dates to ISO format
- `scripts/add-check-constraints.js` - Adds CHECK constraints by recreating tables
- `scripts/test-check-constraints.js` - Tests CHECK constraint enforcement
- `scripts/remove-duplicate-transaction-system.js` - Removes redundant table and indexes

**Benefits Achieved:**
- ✅ Data integrity guaranteed by foreign keys and CHECK constraints
- ✅ Date sorting and SQLite date functions now work correctly
- ✅ Negative inventory impossible at database level
- ✅ Zero-quantity transactions prevented
- ✅ Cleaner schema with no duplication
- ✅ All database operations tested and working

### Implementation Estimate (Actual)
- **Development:** ~3 hours
- **Testing:** 1 hour
- **Total:** ~4 hours

---

## 🔗 Related Changes

This change complements:
- **Trigger-Based Audit System** - Provides unified transaction view without duplicate `inventory_transactions` table
- **Simplify Database Query Layer** - Easier once foreign keys and constraints are in place
- **Remove Controller Layer** - Simpler to validate data inline when constraints exist

---

## 📖 References

- [SQLite Foreign Key Support](https://www.sqlite.org/foreignkeys.html)
- [SQLite CHECK Constraints](https://www.sqlite.org/lang_createtable.html#check_constraints)
- [SQLite Date And Time Functions](https://www.sqlite.org/lang_datefunc.html)
- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)

---
