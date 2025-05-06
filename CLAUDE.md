# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rainbow Room Inventory Tracking System

This is a full-stack inventory tracking web application for a Children's Advocacy Center's "Rainbow Room" (donation center). The application helps track donated items, their details, and manage inventory.

## Project Architecture

### Technology Stack

#### Backend
- Node.js with Express (TypeScript)
- SQLite database
- ES Modules
- Zod for validation
- Multer for file uploads
- QR code generation
- PapaParse for CSV parsing
- XLSX for Excel generation

#### Frontend
- React 
- Vite
- TypeScript
- TanStack libraries (Router, Query, Table)
- PicoCSS for styling
- QR code generation and scanning

### Key Files and Directories

#### Backend
- `/src/server.ts` - Main entry point
- `/src/database/` - Database connection, schema, and setup
- `/src/controllers/` - API route handlers
- `/src/routes/` - Express route definitions
- `/src/models/` - Zod schemas for data validation
- `/src/middleware/` - Express middleware (error handling, validation)
- `/src/utils/` - Utility functions (file uploads, QR code generation, etc.)

#### Frontend
- `/frontend/src/main.tsx` - Entry point
- `/frontend/src/App.tsx` - Root component
- `/frontend/src/routes/router.tsx` - TanStack router configuration
- `/frontend/src/services/` - API service modules
- `/frontend/src/hooks/` - Custom React hooks
- `/frontend/src/components/` - UI components
- `/frontend/src/pages/` - Page components
- `/frontend/src/context/` - React context providers

## Essential Commands

### Installation

Install backend dependencies:
```bash
npm install
```

Install frontend dependencies:
```bash
cd frontend
npm install
```

### Database Setup and Management

Initialize the database:
```bash
npm run setup-db
```

Reset the database (caution: this will delete all data):
```bash
npm run reset-db
```

Populate the database with mock data:
```bash
npm run populate-db
```

Rebuild, reset, and populate the database (useful during development):
```bash
npm run refresh-db
```

### Running the Application

Start the backend server:
```bash
npm run start
```

Start the backend in development mode with auto-reloading:
```bash
npm run dev
```

Start the frontend in development mode:
```bash
cd frontend
npm run dev
```

Run both backend and frontend concurrently:
```bash
npm run dev:all
```

### Building

Build the backend:
```bash
npm run build
```

Build the frontend:
```bash
cd frontend
npm run build
```

Build both backend and frontend:
```bash
npm run build:all
```

### Linting

Lint the frontend code:
```bash
cd frontend
npm run lint
```

## Key Architecture Notes

1. **ES Modules Configuration**: The project uses ES Modules (`"type": "module"` in package.json). Import statements must include `.js` extensions even for TypeScript files.

2. **API Structure**: 
   - The backend follows a controller-route pattern
   - Routes are mounted at `/api` paths (e.g., `/api/item-categories`)
   - API services in the frontend use axios to communicate with the backend

3. **Database Structure**:
   - Uses SQLite with a promise-based wrapper
   - Main tables: ItemCategory, Size, ItemDetail, ItemPhoto, ItemSize (association)
   - Direct SQL queries are used instead of an ORM
   - Database file is stored in the `/data` directory

4. **Frontend State Management**:
   - Uses React Query for server state
   - Custom hooks for data fetching and mutations
   - Context API for toast notifications

5. **QR Code Functionality**:
   - Items can be created with QR codes
   - QR codes can be scanned to look up items

6. **File Upload**:
   - Photos are stored in the `/uploads` directory
   - Multer is used for handling file uploads
   - Express static middleware serves files from the uploads directory

7. **Proxy Configuration**:
   - Vite development server proxies API requests to the backend
   - Frontend runs on port 3000, backend on port 3001
   - Proxy paths: `/api` and `/uploads`

## Data Model

The application uses the following primary database tables:

1. **ItemCategory** - Categories for organizing inventory items
   - Fields: id, name, description, lowStockThreshold, createdAt, updatedAt

2. **Size** - Size options that can be associated with categories
   - Fields: id, name, createdAt, updatedAt

3. **ItemSize** - Association table linking categories to applicable sizes
   - Fields: id, itemCategoryId, sizeId, createdAt, updatedAt

4. **ItemDetail** - Individual donated items
   - Fields: id, itemCategoryId, sizeId, condition, location, qrCodeValue, receivedDate, donorInfo, approxPrice, isActive, createdAt, updatedAt

5. **ItemPhoto** - Photos associated with items
   - Fields: id, itemDetailId, filePath, description, createdAt, updatedAt

## API Endpoints

### Sizes
- `GET /api/sizes` - Get all sizes
- `POST /api/sizes` - Create a new size
- `GET /api/sizes/:id` - Get a size by ID
- `PUT /api/sizes/:id` - Update a size
- `DELETE /api/sizes/:id` - Delete a size

### Categories
- `GET /api/item-categories` - Get all categories
- `POST /api/item-categories` - Create a new category
- `GET /api/item-categories/:id` - Get a category by ID
- `PUT /api/item-categories/:id` - Update a category
- `DELETE /api/item-categories/:id` - Delete a category
- `GET /api/item-categories/:id/sizes` - Get sizes for a category
- `POST /api/item-categories/:id/sizes` - Add size to category
- `DELETE /api/item-categories/:categoryId/sizes/:sizeId` - Remove size from category

### Item Details
- `GET /api/item-details` - Get all items (with optional filters)
- `POST /api/item-details` - Create a new item
- `GET /api/item-details/:id` - Get an item by ID
- `GET /api/item-details/qr/:qrCodeValue` - Get an item by QR code
- `PUT /api/item-details/:id` - Update an item
- `PATCH /api/item-details/:id/deactivate` - Deactivate an item
- `PATCH /api/item-details/:id/transfer` - Transfer an item to a new location

### Photos
- `POST /api/item-details/:itemDetailId/photos` - Upload a photo
- `GET /api/item-details/:itemDetailId/photos` - Get all photos for an item
- `DELETE /api/photos/:photoId` - Delete a photo

### Import/Export
- `GET /api/export` - Export data (format specified via query param)
- `POST /api/import` - Import data from CSV

## Important Considerations

1. When modifying the backend code, make sure to rebuild (`npm run build`) before starting the server.

2. The frontend and backend must be running simultaneously for the application to work properly.

3. During development, use `npm run dev:all` to run both the frontend and backend concurrently.

4. Always maintain proper error handling, especially for the database operations and file uploads.

5. The QR code generation needs to create unique values. The current implementation uses UUID.

6. When adding new API endpoints, update both the backend routes and the corresponding frontend services.

7. The database file is stored in the `/data` directory and the application creates it if it doesn't exist.

8. Photo uploads are stored in the `/uploads` directory, which is served as a static directory by Express.

## Troubleshooting

1. If you encounter port conflicts, check that no other services are running on ports 3000 (frontend) or 3001 (backend).

2. If database operations fail, verify that the `/data` directory exists and is writable.

3. If file uploads fail, verify that the `/uploads` directory exists and is writable.

4. If you encounter CORS issues during development, verify that the proxy settings in `/frontend/vite.config.ts` are correctly configured.