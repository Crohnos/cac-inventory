import { Router } from 'express';
import { LocationController } from '../controllers/locationController.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { 
  createLocationSchema, 
  updateLocationSchema, 
  locationParamsSchema 
} from '../schemas/locationSchemas.js';

const router = Router();

// GET /api/locations - Get all active locations
router.get('/', LocationController.getAllLocations);

// GET /api/locations/:id - Get location by ID
router.get('/:id', 
  validateParams(locationParamsSchema), 
  LocationController.getLocationById
);

// POST /api/locations - Create new location
router.post('/', 
  validateBody(createLocationSchema), 
  LocationController.createLocation
);

// PUT /api/locations/:id - Update location
router.put('/:id', 
  validateParams(locationParamsSchema),
  validateBody(updateLocationSchema), 
  LocationController.updateLocation
);

// PATCH /api/locations/:id/toggle - Toggle location active status
router.patch('/:id/toggle', 
  validateParams(locationParamsSchema), 
  LocationController.toggleLocationActive
);

export { router as locationRoutes };