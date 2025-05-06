import { Router } from 'express';
import { 
  uploadPhoto, 
  getPhotosForItem, 
  deletePhoto 
} from '../controllers/photoController.js';
import { upload } from '../utils/fileUpload.js';
import { validate } from '../middleware/validationMiddleware.js';
import { PhotoDescriptionSchema } from '../models/photoSchema.js';

const router = Router();

// POST upload a photo for an item
router.post('/item-details/:itemDetailId/photos', 
  upload.single('photo'), 
  validate(PhotoDescriptionSchema),
  uploadPhoto
);

// GET all photos for an item
router.get('/item-details/:itemDetailId/photos', getPhotosForItem);

// DELETE a photo
router.delete('/photos/:photoId', deletePhoto);

export default router;