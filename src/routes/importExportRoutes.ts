import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { exportData } from '../controllers/exportController.js';
import { importData } from '../controllers/importController.js';

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const filetypes = /csv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const router = Router();

// Export data
router.get('/export', exportData);

// Import data
router.post('/import', upload.single('file'), importData);

export default router;