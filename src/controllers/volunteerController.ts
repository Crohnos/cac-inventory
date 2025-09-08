import { Request, Response } from 'express';
import { VolunteerService } from '../services/volunteerService.js';

export class VolunteerController {
  
  // Create a new volunteer session
  static async createSession(req: Request, res: Response) {
    try {
      const session = await VolunteerService.createSession(req.body);
      res.status(201).json({
        success: true,
        data: session,
        message: 'Volunteer session logged successfully'
      });
    } catch (error: any) {
      console.error('Create volunteer session error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create volunteer session'
      });
    }
  }

  // Get volunteer sessions with optional filters
  static async getSessions(req: Request, res: Response) {
    try {
      const { location_id, volunteer_name, date_from, date_to, limit } = req.query;
      
      const filters = {
        locationId: location_id ? parseInt(location_id as string) : undefined,
        volunteerName: volunteer_name as string,
        dateFrom: date_from as string,
        dateTo: date_to as string,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const sessions = await VolunteerService.getSessions(filters);
      
      res.json({
        success: true,
        data: sessions,
        count: sessions.length,
        filters
      });
    } catch (error: any) {
      console.error('Get volunteer sessions error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch volunteer sessions'
      });
    }
  }

  // Get a specific volunteer session by ID
  static async getSessionById(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await VolunteerService.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Volunteer session not found'
        });
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error: any) {
      console.error('Get volunteer session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch volunteer session'
      });
    }
  }

  // Update a volunteer session
  static async updateSession(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await VolunteerService.updateSession(sessionId, req.body);
      
      res.json({
        success: true,
        data: session,
        message: 'Volunteer session updated successfully'
      });
    } catch (error: any) {
      console.error('Update volunteer session error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update volunteer session'
      });
    }
  }

  // Delete a volunteer session
  static async deleteSession(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.id);
      await VolunteerService.deleteSession(sessionId);
      
      res.json({
        success: true,
        message: 'Volunteer session deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete volunteer session error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete volunteer session'
      });
    }
  }

  // Get volunteer statistics
  static async getVolunteerStats(req: Request, res: Response) {
    try {
      const { location_id, date_from, date_to } = req.query;
      
      const filters = {
        locationId: location_id ? parseInt(location_id as string) : undefined,
        dateFrom: date_from as string,
        dateTo: date_to as string
      };

      const stats = await VolunteerService.getVolunteerStats(filters);
      
      res.json({
        success: true,
        data: stats,
        filters
      });
    } catch (error: any) {
      console.error('Get volunteer stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch volunteer statistics'
      });
    }
  }
}