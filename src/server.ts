import express from 'express';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { initializeDatabase } from './database/setup.js';
import { errorHandler } from './middleware/index.js';
import sizeRoutes from './routes/sizeRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import detailRoutes from './routes/detailRoutes.js';
import photoRoutes from './routes/photoRoutes.js';
import importExportRoutes from './routes/importExportRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;
console.log(`Setting up Express server on port ${PORT}`);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure temp directory for imports exists
const tempUploadsDir = path.join(process.cwd(), 'uploads/temp');
if (!fs.existsSync(tempUploadsDir)) {
  fs.mkdirSync(tempUploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(morgan('dev')); // Logging middleware

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.get('/', (req, res) => {
  res.json({ message: 'Rainbow Room API Operational' });
});

// Mount routes
app.use('/api/sizes', sizeRoutes);
app.use('/api/item-categories', categoryRoutes);
app.use('/api/item-details', detailRoutes);
app.use('/api', photoRoutes);
app.use('/api', importExportRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('Starting server initialization...');
    console.log('Uploads directory:', uploadsDir);
    console.log('Temp uploads directory:', tempUploadsDir);
    
    // Initialize the database
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialization complete');
    
    // Log all API routes
    console.log('\n===== Registered API Routes =====');
    app._router.stack.forEach((r: any) => {
      if (r.route && r.route.path) {
        console.log(`${Object.keys(r.route.methods)[0].toUpperCase()}\t${r.route.path}`);
      } else if (r.name === 'router') {
        r.handle.stack.forEach((sr: any) => {
          if (sr.route) {
            const method = Object.keys(sr.route.methods)[0].toUpperCase();
            console.log(`${method}\t${r.regexp} -> ${sr.route.path}`);
          }
        });
      }
    });
    console.log('================================\n');
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API base URL: http://localhost:${PORT}/api`);
      console.log('Press Ctrl+C to shut down');
    });
    
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please close the other application or change the port.`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error details:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
};

startServer();

export default app;