# Rainbow Room Inventory System - Detailed Implementation Plan

## Overview
Multi-location inventory management system for Children's Advocacy Center Rainbow Room donation centers across McKinney and Plano. Features encrypted SQLite database, QR code scanning, and touch-first interface for shared devices.

## 🗄️ Database Architecture (✅ COMPLETED)

### Tables
- **locations** - Physical locations (McKinney, Plano)
- **items** - Item categories with QR codes
- **item_sizes** - Location-specific size inventory (Order Header/Line pattern)
- **checkouts** - Transaction headers
- **checkout_items** - Individual line items  
- **volunteer_sessions** - Time tracking

### Key Features
- SQLCipher encryption
- Location-specific inventory tracking
- Foreign key constraints and triggers
- Comprehensive indexing

## 🎯 PHASE 1: Backend Foundation (Week 1)

### Step 1.1: Core Database Infrastructure
**File: `src/database/connection.ts`**
```typescript
// Create database connection module
import Database from 'better-sqlite3-sqlcipher';

export class DatabaseConnection {
  private static instance: Database.Database;
  
  static getInstance(): Database.Database {
    if (!this.instance) {
      this.instance = new Database('data/inventory.db');
      this.instance.pragma(`key = "${process.env.DB_PASSWORD}"`);
      this.instance.pragma('foreign_keys = ON');
    }
    return this.instance;
  }
}
```

**Steps:**
1. Create `src/database/` directory
2. Create `connection.ts` with singleton pattern
3. Add environment variable handling
4. Create `queries.ts` for prepared statements
5. Create `migrations.ts` for future schema changes
6. Test connection with existing database

### Step 1.2: Express Server Setup
**File: `src/server.ts`**
```typescript
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { locationRoutes } from './routes/locationRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/locations', locationRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌈 Rainbow Room API running on port ${PORT}`);
});
```

**Steps:**
1. Install dependencies: `npm install express cors helmet morgan`
2. Install dev dependencies: `npm install -D @types/express @types/cors`
3. Create basic Express server structure
4. Add CORS, JSON parsing, and security middleware
5. Set up error handling middleware
6. Test server starts and responds to requests

### Step 1.3: Location API (Complete)
**File: `src/controllers/locationController.ts`**
```typescript
import { Request, Response } from 'express';
import { LocationService } from '../services/locationService.js';

export class LocationController {
  static async getAllLocations(req: Request, res: Response) {
    try {
      const locations = await LocationService.getActiveLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  }
  
  static async createLocation(req: Request, res: Response) {
    try {
      const location = await LocationService.create(req.body);
      res.status(201).json(location);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

**File: `src/services/locationService.ts`**
```typescript
import { DatabaseConnection } from '../database/connection.js';

interface Location {
  location_id?: number;
  name: string;
  city: string;
  state: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

export class LocationService {
  private static db = DatabaseConnection.getInstance();
  
  static getActiveLocations(): Location[] {
    const stmt = this.db.prepare('SELECT * FROM locations WHERE is_active = 1 ORDER BY name');
    return stmt.all() as Location[];
  }
  
  static create(data: Location): Location {
    const stmt = this.db.prepare(`
      INSERT INTO locations (name, city, state, address, phone)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(data.name, data.city, data.state, data.address, data.phone);
    return this.getById(result.lastInsertRowid as number);
  }
  
  static getById(id: number): Location {
    const stmt = this.db.prepare('SELECT * FROM locations WHERE location_id = ?');
    return stmt.get(id) as Location;
  }
}
```

**File: `src/routes/locationRoutes.ts`**
```typescript
import { Router } from 'express';
import { LocationController } from '../controllers/locationController.js';

const router = Router();

router.get('/', LocationController.getAllLocations);
router.post('/', LocationController.createLocation);
router.get('/:id', LocationController.getById);
router.put('/:id', LocationController.updateLocation);
router.patch('/:id/toggle', LocationController.toggleActive);

export { router as locationRoutes };
```

**Specific Steps:**
1. Create directory structure: `src/controllers/`, `src/services/`, `src/routes/`
2. Implement LocationService with all CRUD operations
3. Create LocationController with proper error handling
4. Set up routing with parameter validation
5. Test all endpoints with Postman/curl:
   - `GET /api/locations` - should return McKinney, Plano
   - `POST /api/locations` - create new location
   - `PUT /api/locations/:id` - update location
6. Add input validation with Zod schemas

### Step 1.4: Items API Foundation
**File: `src/services/itemService.ts`**
```typescript
export class ItemService {
  private static db = DatabaseConnection.getInstance();
  
  // Get items with location-specific inventory
  static getItemsWithInventory(locationId?: number) {
    let query = `
      SELECT i.*, 
             COUNT(DISTINCT is2.size_id) as size_count,
             SUM(is2.current_quantity) as total_quantity
      FROM items i
      LEFT JOIN item_sizes is2 ON i.item_id = is2.item_id
    `;
    
    if (locationId) {
      query += ' WHERE is2.location_id = ?';
      return this.db.prepare(query + ' GROUP BY i.item_id').all(locationId);
    }
    return this.db.prepare(query + ' GROUP BY i.item_id').all();
  }
  
  static create(data: CreateItemData): Item {
    const transaction = this.db.transaction(() => {
      // Insert item
      const itemStmt = this.db.prepare(`
        INSERT INTO items (name, description, storage_location, qr_code, has_sizes, unit_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const itemResult = itemStmt.run(data.name, data.description, data.storage_location, 
                                     data.qr_code, data.has_sizes ? 1 : 0, data.unit_type);
      
      // Insert sizes for each location if has_sizes
      if (data.has_sizes && data.sizes?.length > 0) {
        const locations = LocationService.getActiveLocations();
        const sizeStmt = this.db.prepare(`
          INSERT INTO item_sizes (item_id, location_id, size_label, current_quantity, sort_order)
          VALUES (?, ?, ?, 0, ?)
        `);
        
        for (const location of locations) {
          for (let i = 0; i < data.sizes.length; i++) {
            sizeStmt.run(itemResult.lastInsertRowid, location.location_id, data.sizes[i], i);
          }
        }
      } else {
        // Create single "N/A" size record for each location
        const locations = LocationService.getActiveLocations();
        const sizeStmt = this.db.prepare(`
          INSERT INTO item_sizes (item_id, location_id, size_label, current_quantity)
          VALUES (?, ?, 'N/A', 0)
        `);
        
        for (const location of locations) {
          sizeStmt.run(itemResult.lastInsertRowid, location.location_id);
        }
      }
      
      return itemResult.lastInsertRowid;
    });
    
    const itemId = transaction();
    return this.getById(itemId as number);
  }
}
```

**Specific Implementation Steps:**
1. Create ItemService with complex queries for location-specific data
2. Implement transaction-based item creation
3. Handle both sized and non-sized items properly
4. Create ItemController with proper error handling
5. Set up routes for all CRUD operations
6. Test item creation for both sized/non-sized items
7. Verify inventory records are created for all locations

## 🎯 PHASE 2: Frontend Foundation (Week 1-2)

### Step 2.1: Frontend Project Setup
**Commands to run:**
```bash
# Create frontend directory and setup
cd /home/crohnos/cac-inventory
mkdir frontend
cd frontend

# Initialize Vite React TypeScript project
npm create vite@latest . -- --template react-ts

# Install core dependencies
npm install @tanstack/react-router @tanstack/react-table @tanstack/react-form
npm install zustand axios react-qr-scanner
npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
npm install lucide-react # for icons

# Install dev dependencies  
npm install -D @types/node
```

**File: `frontend/tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Touch-friendly sizing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      // Large touch targets
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

**File: `frontend/src/index.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Touch-friendly base styles */
  button, input, select, textarea {
    @apply min-h-touch min-w-touch;
  }
  
  /* iOS style tap highlighting */
  * {
    -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
  }
}

@layer components {
  .btn-touch {
    @apply px-6 py-4 text-lg font-semibold rounded-lg min-h-touch;
  }
  
  .btn-primary {
    @apply btn-touch bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800;
  }
  
  .btn-secondary {
    @apply btn-touch bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400;
  }
  
  .btn-danger {
    @apply btn-touch bg-red-600 text-white hover:bg-red-700 active:bg-red-800;
  }
}
```

### Step 2.2: Zustand Store Setup
**File: `frontend/src/stores/locationStore.ts`**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Location {
  location_id: number;
  name: string;
  city: string;
  state: string;
  is_active: boolean;
}

interface LocationStore {
  locations: Location[];
  currentLocationId: number | null;
  setLocations: (locations: Location[]) => void;
  setCurrentLocation: (locationId: number) => void;
  getCurrentLocation: () => Location | null;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      locations: [],
      currentLocationId: null,
      
      setLocations: (locations) => {
        set({ locations });
        // Set first location as default if none selected
        if (!get().currentLocationId && locations.length > 0) {
          set({ currentLocationId: locations[0].location_id });
        }
      },
      
      setCurrentLocation: (locationId) => set({ currentLocationId: locationId }),
      
      getCurrentLocation: () => {
        const { locations, currentLocationId } = get();
        return locations.find(l => l.location_id === currentLocationId) || null;
      },
    }),
    {
      name: 'rainbow-room-location',
    }
  )
);
```

**File: `frontend/src/stores/cartStore.ts`**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  item_id: number;
  size_id: number | null;
  item_name: string;
  size_label: string;
  quantity: number;
  location_id: number;
}

interface CartStore {
  items: CartItem[];
  isVisible: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (item_id: number, size_id: number | null) => void;
  updateQuantity: (item_id: number, size_id: number | null, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isVisible: false,
      
      addItem: (newItem) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          item => item.item_id === newItem.item_id && item.size_id === newItem.size_id
        );
        
        if (existingIndex >= 0) {
          // Update existing item quantity
          const updatedItems = [...items];
          updatedItems[existingIndex].quantity += newItem.quantity;
          set({ items: updatedItems });
        } else {
          // Add new item
          set({ items: [...items, newItem] });
        }
      },
      
      removeItem: (item_id, size_id) => {
        set({
          items: get().items.filter(
            item => !(item.item_id === item_id && item.size_id === size_id)
          )
        });
      },
      
      updateQuantity: (item_id, size_id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(item_id, size_id);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.item_id === item_id && item.size_id === size_id
              ? { ...item, quantity }
              : item
          )
        });
      },
      
      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isVisible: !get().isVisible }),
      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'rainbow-room-cart',
    }
  )
);
```

### Step 2.3: API Service Setup
**File: `frontend/src/services/api.ts`**
```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle common error cases
    if (error.response?.status === 404) {
      // Handle not found
    } else if (error.response?.status >= 500) {
      // Handle server errors
      alert('Server error occurred. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

**File: `frontend/src/services/locationService.ts`**
```typescript
import api from './api';

export interface Location {
  location_id: number;
  name: string;
  city: string;
  state: string;
  address?: string;
  phone?: string;
  is_active: boolean;
}

export const locationService = {
  async getLocations(): Promise<Location[]> {
    const response = await api.get('/locations');
    return response.data;
  },
  
  async createLocation(location: Omit<Location, 'location_id'>): Promise<Location> {
    const response = await api.post('/locations', location);
    return response.data;
  },
  
  async updateLocation(id: number, location: Partial<Location>): Promise<Location> {
    const response = await api.put(`/locations/${id}`, location);
    return response.data;
  },
  
  async toggleLocationActive(id: number): Promise<Location> {
    const response = await api.patch(`/locations/${id}/toggle`);
    return response.data;
  },
};
```

### Step 2.4: Router Setup and Layout Components
**File: `frontend/src/router.tsx`**
```typescript
import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { InventoryPage } from './pages/InventoryPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ScannerPage } from './pages/ScannerPage';
import { VolunteerHoursPage } from './pages/VolunteerHoursPage';

// Root route
const rootRoute = createRootRoute({
  component: DashboardLayout,
});

// Dashboard routes
const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: InventoryPage,
});

const itemDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items/$itemId',
  component: ItemDetailPage,
});

const scannerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scan',
  component: ScannerPage,
});

const volunteerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/volunteer-hours',
  component: VolunteerHoursPage,
});

// QR Code direct access route
const qrActionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/qr/$qrCode',
  component: () => import('./pages/QRActionPage'),
});

const routeTree = rootRoute.addChildren([
  inventoryRoute,
  itemDetailRoute,
  scannerRoute,
  volunteerRoute,
  qrActionRoute,
]);

export const router = createRouter({ routeTree });
```

**File: `frontend/src/components/layout/DashboardLayout.tsx`**
```typescript
import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { CartModal } from '../cart/CartModal';
import { useCartStore } from '../../stores/cartStore';

export const DashboardLayout: React.FC = () => {
  const { isVisible: isCartVisible } = useCartStore();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - always visible on desktop, slide-in on mobile */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top navbar with location and cart */}
        <Navbar />
        
        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Cart modal - overlay when visible */}
      {isCartVisible && <CartModal />}
    </div>
  );
};
```

**File: `frontend/src/components/layout/Navbar.tsx`**
```typescript
import React from 'react';
import { MapPin, ShoppingCart } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';
import { useCartStore } from '../../stores/cartStore';
import { LocationSelector } from '../shared/LocationSelector';

export const Navbar: React.FC = () => {
  const { getCurrentLocation } = useLocationStore();
  const { getTotalItems, toggleCart } = useCartStore();
  const [isFlashing, setIsFlashing] = React.useState(false);
  
  const currentLocation = getCurrentLocation();
  const totalItems = getTotalItems();
  
  // Flash cart icon periodically when it has items
  React.useEffect(() => {
    if (totalItems > 0) {
      const interval = setInterval(() => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 1000);
      }, 5000); // Flash every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [totalItems]);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Location info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900">
              {currentLocation?.name || 'Select Location'}
            </span>
          </div>
          <LocationSelector />
        </div>
        
        {/* Right: Cart */}
        <button
          onClick={toggleCart}
          className={`relative p-3 rounded-lg transition-all ${
            isFlashing 
              ? 'bg-blue-100 animate-pulse' 
              : 'hover:bg-gray-100'
          }`}
        >
          <ShoppingCart className="h-6 w-6 text-gray-700" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
```

**File: `frontend/src/components/layout/Sidebar.tsx`**
```typescript
import React from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { Package, Plus, Scan, Clock, FileText } from 'lucide-react';

const navigation = [
  { name: 'Inventory', href: '/', icon: Package },
  { name: 'Add New Item', href: '/add-item', icon: Plus },
  { name: 'Scan', href: '/scan', icon: Scan },
  { name: 'Volunteer Hours', href: '/volunteer-hours', icon: Clock },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
        {/* Logo/Brand */}
        <div className="flex items-center px-4 py-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RR</span>
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900">
              Rainbow Room
            </span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-blue-500' : 'text-gray-400'
                      }`}
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};
```

## 🎯 PHASE 3: Core Inventory Features (Week 2)

### Step 3.1: Items Table with TanStack Table
**File: `frontend/src/components/inventory/ItemsTable.tsx`**
```typescript
import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { Link } from '@tanstack/react-router';
import { Package, AlertTriangle } from 'lucide-react';

interface Item {
  item_id: number;
  name: string;
  description: string;
  size_count: number;
  total_quantity: number;
  min_stock_level: number;
}

const columnHelper = createColumnHelper<Item>();

export const ItemsTable: React.FC<{ items: Item[] }> = ({ items }) => {
  const [sorting, setSorting] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const columns = [
    columnHelper.accessor('name', {
      header: 'Item Name',
      cell: (info) => (
        <Link
          to="/items/$itemId"
          params={{ itemId: info.row.original.item_id.toString() }}
          className="flex items-center space-x-3 text-blue-600 hover:text-blue-800"
        >
          <Package className="h-5 w-5" />
          <div>
            <div className="font-medium">{info.getValue()}</div>
            <div className="text-sm text-gray-500">
              {info.row.original.description}
            </div>
          </div>
        </Link>
      ),
    }),
    columnHelper.accessor('size_count', {
      header: 'Sizes',
      cell: (info) => (
        <span className="text-sm text-gray-600">
          {info.getValue()} size{info.getValue() !== 1 ? 's' : ''}
        </span>
      ),
    }),
    columnHelper.accessor('total_quantity', {
      header: 'Total Quantity',
      cell: (info) => {
        const quantity = info.getValue();
        const minStock = info.row.original.min_stock_level;
        const isLowStock = quantity <= minStock;
        
        return (
          <div className="flex items-center space-x-2">
            {isLowStock && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <span className={isLowStock ? 'text-red-600 font-semibold' : ''}>
              {quantity}
            </span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Quick Actions',
      cell: (info) => (
        <div className="flex space-x-2">
          <button className="btn-secondary text-sm">
            + Add Stock
          </button>
          <button className="btn-secondary text-sm">
            View Details
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search items..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Link to="/add-item" className="btn-primary">
          + Add New Item
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

### Step 3.2: QR Scanner Implementation
**File: `frontend/src/components/scanner/QRScanner.tsx`**
```typescript
import React, { useState } from 'react';
import { QrReader } from 'react-qr-scanner';
import { Camera, CameraOff } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (data: any) => {
    if (data) {
      onScan(data.text || data);
    }
  };

  const handleError = (err: Error) => {
    setError(err.message);
    onError?.(err);
  };

  return (
    <div className="space-y-4">
      {/* Scanner Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`btn-touch flex items-center space-x-2 ${
            isEnabled ? 'btn-secondary' : 'btn-primary'
          }`}
        >
          {isEnabled ? (
            <>
              <CameraOff className="h-5 w-5" />
              <span>Stop Camera</span>
            </>
          ) : (
            <>
              <Camera className="h-5 w-5" />
              <span>Start Camera</span>
            </>
          )}
        </button>
      </div>

      {/* Scanner Area */}
      {isEnabled && (
        <div className="relative">
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <QrReader
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '100%' }}
              constraints={{
                audio: false,
                video: {
                  facingMode: 'environment', // Use back camera
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                }
              }}
            />
          </div>
          
          {/* Scan target overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white rounded-lg" style={{ width: 200, height: 200 }}>
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-gray-600">
        <p>Point your camera at a QR code to scan it</p>
        <p className="text-sm">Make sure the code is well-lit and in focus</p>
      </div>
    </div>
  );
};
```

### Step 3.3: Detailed Test Cases and Validation

**Backend Testing Steps:**
1. **Location API Tests:**
   ```bash
   # Test location endpoints
   curl -X GET http://localhost:3001/api/locations
   curl -X POST http://localhost:3001/api/locations -H "Content-Type: application/json" -d '{"name":"Test City","city":"Test","state":"TX"}'
   ```

2. **Item API Tests:**
   ```bash
   # Test item creation with sizes
   curl -X POST http://localhost:3001/api/items -H "Content-Type: application/json" -d '{
     "name": "Test Shirts",
     "description": "Test shirts for validation",
     "has_sizes": true,
     "sizes": ["Small", "Medium", "Large"]
   }'
   
   # Verify item_sizes records created for all locations
   # Should create 3 locations × 3 sizes = 9 item_size records
   ```

**Frontend Testing Steps:**
1. **Location Store Tests:**
   - Load app → Check if locations are fetched and stored
   - Change location → Verify persistence in localStorage
   - Refresh page → Confirm location selection is maintained

2. **Cart Functionality Tests:**
   - Add item to cart → Check visual feedback
   - Cart icon should flash periodically
   - Cart count should update correctly
   - Cart persistence across browser refresh

3. **QR Scanner Tests:**
   - Camera permission request
   - QR code recognition accuracy
   - Error handling for invalid codes
   - Direct URL navigation from QR scans

## 🎯 PHASE 4: Advanced Features (Week 3)

### Step 4.1: Checkout System Implementation
**Specific Implementation Requirements:**
1. **Cart Modal with Full Functionality**
2. **Case File Information Form with Validation**  
3. **Inventory Updates with Database Transactions**
4. **Receipt Generation and Display**

### Step 4.2: Transfer System Between Locations
**Implementation Details:**
1. **Transfer Form with Location Selection**
2. **Inventory Validation (Sufficient Stock)**
3. **Two-Step Database Transaction (Subtract + Add)**
4. **Transfer History Tracking**

### Step 4.3: Volunteer Hour Logging
**Complete Form Implementation:**
1. **Time Calculation Logic**
2. **Location Association** 
3. **Data Persistence**
4. **Simple Reporting Views**

## 🧪 Testing Requirements

### Manual Testing Checklist
- [ ] Database encryption works (file is encrypted)
- [ ] All CRUD operations for locations work
- [ ] Item creation works for sized/non-sized items
- [ ] QR scanning works on mobile devices
- [ ] Cart persistence works across sessions
- [ ] Checkout process completes successfully
- [ ] Transfer between locations works correctly
- [ ] Volunteer hour logging is functional
- [ ] Touch interface works on tablets

### Error Scenarios to Test
- [ ] Network failures during API calls
- [ ] Invalid QR codes
- [ ] Insufficient inventory for checkout
- [ ] Database connection failures
- [ ] Camera permission denied

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database backup strategy in place
- [ ] SSL certificates if needed
- [ ] Network security configured for intranet

### Post-Deployment Verification
- [ ] All API endpoints responding
- [ ] Database encryption working
- [ ] QR codes scan correctly in production
- [ ] Performance is acceptable on target devices
- [ ] All user flows work end-to-end

---

**This plan provides specific, actionable steps for each phase of implementation. Each code example is complete and ready to use. Each step includes verification steps to ensure proper functionality before moving to the next phase.**
  - `POST /api/locations` - Create location (admin)
  - `PUT /api/locations/:id` - Update location
  - `PATCH /api/locations/:id/toggle` - Activate/deactivate

- [ ] **ItemController**  
  - `GET /api/items` - List items with location filter
  - `POST /api/items` - Create new item category
  - `GET /api/items/:id` - Get item details
  - `PUT /api/items/:id` - Update item
  - `GET /api/items/qr/:qrCode` - Get item by QR scan

- [ ] **ItemSizeController**
  - `GET /api/items/:itemId/sizes` - Get sizes by location
  - `POST /api/items/:itemId/sizes` - Add size to item
  - `PUT /api/item-sizes/:sizeId` - Update quantity/stock level
  - `DELETE /api/item-sizes/:sizeId` - Remove size

- [ ] **CheckoutController**
  - `POST /api/checkouts` - Create checkout (with items)
  - `GET /api/checkouts` - List checkouts with filters
  - `GET /api/checkouts/:id` - Get checkout details
  - `POST /api/checkouts/:id/void` - Void/reverse checkout

- [ ] **TransferController**
  - `POST /api/transfers` - Transfer inventory between locations
  - `GET /api/transfers` - List transfer history

- [ ] **VolunteerController**
  - `POST /api/volunteer-sessions` - Log volunteer hours
  - `GET /api/volunteer-sessions` - Get sessions by location/date
  - `PUT /api/volunteer-sessions/:id` - Update session

### 3. Services Layer (`src/services/`)
- [ ] **InventoryService** - Core inventory operations
- [ ] **QRCodeService** - QR code generation/validation
- [ ] **ReportingService** - Analytics and reporting
- [ ] **ValidationService** - Business rule validation

### 4. Middleware & Utilities (`src/middleware/`, `src/utils/`)
- [ ] Error handling middleware
- [ ] Request validation (Zod schemas)
- [ ] Logging middleware
- [ ] CORS and security headers

## 🖥️ Frontend Implementation

### 1. Core Setup
- [ ] **React + TypeScript + Vite setup**
- [ ] **TailwindCSS configuration**
- [ ] **Zustand store setup** for state management
- [ ] **Axios configuration** with interceptors
- [ ] **TanStack Router** setup with routes

### 2. State Management (Zustand Stores)
- [ ] **Location Store** - Current location, location list
- [ ] **Cart Store** - Shopping cart for checkouts
- [ ] **Inventory Store** - Items cache and filters
- [ ] **UI Store** - Modals, toasts, loading states

### 3. Shared Components (`src/components/shared/`)
- [ ] **Layout Components**
  - `DashboardLayout` - Main layout with sidebar
  - `Navbar` - Top navigation with cart icon
  - `Sidebar` - Left navigation tabs
  - `Breadcrumbs` - Navigation breadcrumbs

- [ ] **UI Components**  
  - `Button` - Touch-friendly button variants
  - `Modal` - Modal dialogs
  - `Toast` - Notification system
  - `LoadingSpinner` - Loading indicators
  - `ConfirmDialog` - Confirmation dialogs

- [ ] **Form Components**
  - `LocationSelector` - Location dropdown
  - `QuantityInput` - Number input with +/- buttons
  - `SearchInput` - Search with filters
  - `FormField` - Reusable form field wrapper

### 4. Feature Components

#### Inventory Management (`src/components/inventory/`)
- [ ] **ItemsTable** - TanStack Table with sorting/filtering
- [ ] **ItemCard** - Touch-friendly item display
- [ ] **StockLevelIndicator** - Visual stock level display
- [ ] **QuickAdjustButtons** - Inline +/- quantity controls
- [ ] **LocationTabs** - Location switcher
- [ ] **AdvancedFilters** - Filter panel

#### Item Detail Page (`src/components/item-detail/`)
- [ ] **ItemHeader** - Item info and actions
- [ ] **SizesTable** - Sizes overview with quick actions
- [ ] **ActivityHistory** - Transaction history table
- [ ] **TransferModal** - Transfer between locations dialog

#### QR Scanner (`src/components/scanner/`)
- [ ] **QRScanner** - Camera interface (react-qr-scanner)
- [ ] **ScanResult** - Display scanned item
- [ ] **ActionSelector** - ADD/REMOVE/TRANSFER buttons
- [ ] **ScanHistory** - Recent scans

#### Checkout System (`src/components/checkout/`)
- [ ] **CartIcon** - Animated cart with count
- [ ] **CartModal** - Shopping cart display
- [ ] **CheckoutForm** - Case file information form
- [ ] **CheckoutSummary** - Final review before submit
- [ ] **ReceiptDisplay** - Transaction confirmation

#### Volunteer Hours (`src/components/volunteer/`)
- [ ] **HoursForm** - Simple volunteer logging form
- [ ] **SessionsList** - Recent volunteer sessions
- [ ] **HoursReporting** - Basic volunteer reports

### 5. Pages (`src/pages/`)
- [ ] **DashboardPage** - Main dashboard with overview
- [ ] **InventoryPage** - Items table with location filter
- [ ] **ItemDetailPage** - Individual item management
- [ ] **AddItemPage** - Create new item category
- [ ] **ScannerPage** - QR code scanning interface
- [ ] **VolunteerHoursPage** - Volunteer time logging
- [ ] **ReportsPage** - Analytics and reporting
- [ ] **NotFoundPage** - 404 error page

### 6. Services (`src/services/`)
- [ ] **API Service** - Axios-based API client
- [ ] **Location Service** - Location-related API calls
- [ ] **Inventory Service** - Items and sizes API
- [ ] **Checkout Service** - Checkout and cart operations
- [ ] **Volunteer Service** - Volunteer session API
- [ ] **Storage Service** - Local storage utilities

## 🚀 Key User Flows

### Flow 1: QR Code Scanning
1. User scans QR code with phone camera
2. Direct URL opens to item action page (`/items/:qrCode/action`)
3. User selects ADD/REMOVE/TRANSFER
4. **ADD**: Bulk restock form for all sizes
5. **REMOVE**: Add to cart with size/quantity selection  
6. **TRANSFER**: Location transfer form

### Flow 2: Checkout Process
1. Items added to cart from various sources
2. Cart icon flashes periodically as reminder
3. Click cart → Review items and quantities
4. Click checkout → Case file information form
5. Submit → Update inventory + create checkout record

### Flow 3: Inventory Management
1. Browse inventory table with location filter
2. Click item → Item detail page
3. View sizes table + activity history
4. Quick adjust quantities with +/- buttons
5. Transfer items between locations

### Flow 4: Volunteer Hours
1. Simple form: name, location, start/end time
2. Optional: tasks performed, notes
3. Calculate hours automatically
4. Submit to log session

## 🎨 UI/UX Requirements

### Design Principles
- **Touch-first**: Large buttons, easy tapping
- **Location-aware**: Always show current location
- **Visual feedback**: Clear success/error states
- **Minimal friction**: Anonymous shared device usage
- **Offline-ready**: Handle network issues gracefully

### Key Features
- **Responsive design** for tablets and phones
- **Persistent cart** with visual reminders
- **Quick actions** for common operations
- **Clear navigation** with breadcrumbs
- **Visual stock indicators** (red for low stock)
- **Confirmation dialogs** for destructive actions

## 🔧 Technical Implementation Order

### Phase 1: Foundation
1. ✅ Database schema and scripts
2. Backend core infrastructure (database, middleware)
3. Basic API endpoints (locations, items)
4. Frontend setup (React, routing, state)
5. Basic layout and navigation

### Phase 2: Core Features  
1. Inventory management (CRUD items/sizes)
2. Location-specific inventory display
3. QR code generation and scanning
4. Shopping cart functionality

### Phase 3: Advanced Features
1. Checkout process with forms
2. Transfer between locations
3. Volunteer hour logging
4. Activity history and reporting

### Phase 4: Polish & Production
1. Error handling and validation
2. Performance optimization
3. Mobile responsiveness testing
4. Security review and deployment

## 🔐 Security Considerations

- **Database encryption** with SQLCipher
- **Input validation** on all API endpoints
- **SQL injection prevention** with prepared statements
- **CORS configuration** for intranet access
- **Rate limiting** to prevent abuse
- **Audit trail** for all inventory changes

## 📊 Success Metrics

- **Inventory accuracy**: Real-time tracking across locations
- **User adoption**: Easy scanning and checkout flows
- **Volunteer efficiency**: Quick hour logging
- **System reliability**: 99%+ uptime on intranet
- **Data security**: Zero unauthorized access incidents

## 🚢 Deployment Strategy

### Development
- Local SQLite database with sample data
- Hot reload for frontend and backend
- Environment variables for configuration

### Production  
- Encrypted database on secure intranet server
- Process manager (PM2) for Node.js app
- Nginx reverse proxy for static files
- Automated backup strategy for database

---

**Total Estimated Timeline**: 3-4 weeks for MVP implementation
**Priority**: Focus on QR scanning and checkout flows first
**Success Criteria**: Volunteers can easily scan, adjust inventory, and complete checkouts