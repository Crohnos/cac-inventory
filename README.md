# Rainbow Room Inventory Management System

A full-stack inventory tracking web application for the Children's Advocacy Center's "Rainbow Room". This application allows staff to track donated items by managing categories, individual items, associating sizes with categories, generating and scanning QR codes, managing inventory levels, transferring items between locations, handling photos, and importing/exporting data.

## Features

- **Inventory Categorization**: Organize items into categories with associated sizes
- **Item Tracking**: Record detailed information about each donated item
- **QR Code Generation**: Generate unique QR codes for each item
- **QR Code Scanning**: Scan QR codes to quickly find and update items
- **Photo Management**: Upload and manage photos for each item
- **Location Transfers**: Transfer items between locations
- **Import/Export**: Import and export inventory data in CSV, Excel, and TXT formats
- **Low Stock Alerts**: Highlight categories with low stock levels
- **Responsive Design**: Optimized for both desktop and mobile devices

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- SQLite database
- Zod for schema validation
- QR code generation
- Multer for file uploads
- PapaParse for CSV parsing
- XLSX for Excel generation

### Frontend
- React 18+
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- TanStack Table
- PicoCSS for styling
- QR code generation and scanning

## Prerequisites

- Node.js (LTS version, 18+ recommended)
- npm or yarn

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd cac-inventory
   ```

2. Install dependencies for both backend and frontend:
   ```
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. Set up the database:
   ```
   npm run setup-db
   ```

## Running the Application

### Development Mode

#### Option 1: Run Backend and Frontend Separately

1. Start the backend server:
   ```
   npm run dev
   ```

2. In a separate terminal, start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

#### Option 2: Run Both Together

1. Start both backend and frontend with a single command:
   ```
   npm run dev:all
   ```

3. Access the application:
   - Backend API: http://localhost:3001
   - Frontend: http://localhost:5173

### Production Mode

#### Option 1: Build and Run Separately

1. Build the frontend:
   ```
   cd frontend
   npm run build
   cd ..
   ```

2. Build the backend:
   ```
   npm run build
   ```

3. Start the production server:
   ```
   npm start
   ```

#### Option 2: Build Everything at Once

1. Build both frontend and backend:
   ```
   npm run build:all
   ```

2. Start the production server:
   ```
   npm start
   ```

3. Access the application at: http://localhost:3001

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

## Project Structure

```
cac-inventory/
├── data/                  # SQLite database files
├── frontend/              # React frontend application
├── scripts/               # Utility scripts
├── src/                   # Backend source code
│   ├── controllers/       # API controllers
│   ├── database/          # Database connection and schema
│   ├── middleware/        # Express middleware
│   ├── models/            # Data models and schemas
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── server.ts          # Express application setup
├── uploads/               # Uploaded files
└── package.json           # Project configuration
```

## License

This project is proprietary and for the exclusive use of the Children's Advocacy Center.