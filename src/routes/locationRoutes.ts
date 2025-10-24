import { Router, Request, Response } from 'express';
import { LocationService, CreateLocationData, UpdateLocationData } from '../services/locationService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import {
  createLocationSchema,
  updateLocationSchema,
  locationParamsSchema
} from '../schemas/locationSchemas.js';

const router = Router();

// GET /api/locations - Get all active locations
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const locations = LocationService.getActiveLocations();
  res.json({
    success: true,
    data: locations,
    count: locations.length
  });
}));

// GET /api/locations/:id - Get location by ID
router.get('/:id',
  validateParams(locationParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const location = LocationService.getById(id);

    if (!location) {
      return res.status(404).json({
        error: {
          message: `Location with ID ${id} not found`
        }
      });
    }

    res.json({
      success: true,
      data: location
    });
  })
);

// POST /api/locations - Create new location
router.post('/',
  validateBody(createLocationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data: CreateLocationData = req.body;

    const location = LocationService.create(data);

    res.status(201).json({
      success: true,
      data: location,
      message: 'Location created successfully'
    });
  })
);

// PUT /api/locations/:id - Update location
router.put('/:id',
  validateParams(locationParamsSchema),
  validateBody(updateLocationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const data: UpdateLocationData = req.body;
    const location = LocationService.update(id, data);

    res.json({
      success: true,
      data: location,
      message: 'Location updated successfully'
    });
  })
);

// PATCH /api/locations/:id/toggle - Toggle location active status
router.patch('/:id/toggle',
  validateParams(locationParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const location = LocationService.toggleActive(id);

    res.json({
      success: true,
      data: location,
      message: `Location ${location.is_active ? 'activated' : 'deactivated'} successfully`
    });
  })
);

export { router as locationRoutes };
