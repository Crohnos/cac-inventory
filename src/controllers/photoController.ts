import { Request, Response, NextFunction } from 'express';
import { dbAsync } from '../database/connection.js';
import { getCurrentTimestamp } from '../database/setup.js';
import { NotFoundError } from '../utils/errors.js';
import { removeFile } from '../utils/fileUpload.js';
import { PhotoDescriptionInput } from '../models/photoSchema.js';
import path from 'path';

/**
 * Upload a photo for an item
 */
export const uploadPhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemDetailId } = req.params;
    const { description }: PhotoDescriptionInput = req.body;
    
    // Check if the file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        details: 'Please provide an image file'
      });
    }
    
    // Check if the item exists
    const item = await dbAsync.get('SELECT * FROM ItemDetail WHERE id = ?', [itemDetailId]);
    if (!item) {
      // Remove the uploaded file
      await removeFile(req.file.path);
      
      throw new NotFoundError(`Item detail with ID ${itemDetailId} not found`);
    }
    
    // Get relative path for storage
    const filePath = path.relative(process.cwd(), req.file.path);
    const timestamp = getCurrentTimestamp();
    
    // Save photo information to database
    const result = await dbAsync.run(
      'INSERT INTO ItemPhoto (itemDetailId, filePath, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [itemDetailId, filePath, description || null, timestamp, timestamp]
    );
    
    // Get the created photo
    const photo = await dbAsync.get('SELECT * FROM ItemPhoto WHERE id = ?', [result.lastID]);
    
    res.status(201).json({
      ...photo,
      url: `/uploads/${path.basename(filePath)}`
    });
  } catch (error) {
    // If there was an uploaded file and an error occurred, clean up
    if (req.file) {
      try {
        await removeFile(req.file.path);
      } catch (cleanupError) {
        console.error('Error removing file during error handling:', cleanupError);
      }
    }
    next(error);
  }
};

/**
 * Get all photos for an item
 */
export const getPhotosForItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemDetailId } = req.params;
    
    // Check if the item exists
    const item = await dbAsync.get('SELECT * FROM ItemDetail WHERE id = ?', [itemDetailId]);
    if (!item) {
      throw new NotFoundError(`Item detail with ID ${itemDetailId} not found`);
    }
    
    // Get all photos for the item
    const photos = await dbAsync.all('SELECT * FROM ItemPhoto WHERE itemDetailId = ? ORDER BY createdAt DESC', [itemDetailId]);
    
    // Add full URL to each photo
    const photosWithUrls = photos.map(photo => ({
      ...photo,
      url: `/uploads/${path.basename(photo.filePath)}`
    }));
    
    res.json(photosWithUrls);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a photo
 */
export const deletePhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { photoId } = req.params;
    
    // Get the photo to find its file path
    const photo = await dbAsync.get('SELECT * FROM ItemPhoto WHERE id = ?', [photoId]);
    if (!photo) {
      throw new NotFoundError(`Photo with ID ${photoId} not found`);
    }
    
    // Delete the photo from the database
    await dbAsync.run('DELETE FROM ItemPhoto WHERE id = ?', [photoId]);
    
    // Remove the file from the filesystem
    await removeFile(photo.filePath);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};