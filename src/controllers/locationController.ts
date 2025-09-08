import { Request, Response } from 'express';
import { LocationService, CreateLocationData, UpdateLocationData } from '../services/locationService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export class LocationController {
  static getAllLocations = asyncHandler(async (req: Request, res: Response) => {
    const locations = LocationService.getActiveLocations();
    res.json({
      success: true,
      data: locations,
      count: locations.length
    });
  });

  static getLocationById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        error: {
          message: 'Invalid location ID - must be a number'
        }
      });
    }

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
  });

  static createLocation = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateLocationData = req.body;
    
    const location = LocationService.create(data);
    
    res.status(201).json({
      success: true,
      data: location,
      message: 'Location created successfully'
    });
  });

  static updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        error: {
          message: 'Invalid location ID - must be a number'
        }
      });
    }

    const data: UpdateLocationData = req.body;
    const location = LocationService.update(id, data);
    
    res.json({
      success: true,
      data: location,
      message: 'Location updated successfully'
    });
  });

  static toggleLocationActive = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        error: {
          message: 'Invalid location ID - must be a number'
        }
      });
    }

    const location = LocationService.toggleActive(id);
    
    res.json({
      success: true,
      data: location,
      message: `Location ${location.is_active ? 'activated' : 'deactivated'} successfully`
    });
  });
}