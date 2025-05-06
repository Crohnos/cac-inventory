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

#### Frontend
- React 
- Vite
- TypeScript
- TanStack libraries (Router, Query, Table)
- PicoCSS for styling

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

### Database Setup

Initialize the database:
```bash
npm run setup-db
```

### Running the Application

Start the backend server:
```bash
npm run start
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

## Important Considerations

1. When modifying the backend code, make sure to rebuild (`npm run build`) before starting the server.

2. The frontend and backend must be running simultaneously for the application to work properly.

3. During development, use `npm run dev:all` to run both the frontend and backend concurrently.

4. Always maintain proper error handling, especially for the database operations and file uploads.

5. The QR code generation needs to create unique values. The current implementation uses UUID.

6. When adding new API endpoints, update both the backend routes and the corresponding frontend services.