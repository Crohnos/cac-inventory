import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { DatabaseConnection } from './database/connection.js';
import { locationRoutes } from './routes/locationRoutes.js';
import { itemRoutes } from './routes/itemRoutes.js';
import { volunteerRoutes } from './routes/volunteerRoutes.js';
import { checkoutRoutes } from './routes/checkoutRoutes.js';
import { reportRoutes } from './routes/reportRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Simple CORS for intranet application
app.use(cors());

// Simple request logging in development
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
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
    error: {
      message: 'Route not found',
      path: req.originalUrl,
      method: req.method
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  DatabaseConnection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  DatabaseConnection.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('🌈 Rainbow Room Inventory API Server');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API base: http://localhost:${PORT}/api`);
  
  // Test database connection
  try {
    const db = DatabaseConnection.getInstance();
    const result = db.prepare('SELECT COUNT(*) as count FROM locations').get() as any;
    console.log(`✅ Database connected (${result.count} locations)`);
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
  }
});

export default app;