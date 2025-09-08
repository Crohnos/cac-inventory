import { Request, Response } from 'express';
import { ReportService } from '../services/reportService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export class ReportController {

  // GET /api/reports/current-inventory
  static getCurrentInventory = asyncHandler(async (req: Request, res: Response) => {
    const locationId = req.query.location_id ? parseInt(req.query.location_id as string) : undefined;
    
    const data = ReportService.getCurrentInventory(locationId);
    
    res.json({
      success: true,
      data,
      count: data.length,
      filters: { locationId }
    });
  });

  // GET /api/reports/low-stock
  static getLowStock = asyncHandler(async (req: Request, res: Response) => {
    const locationId = req.query.location_id ? parseInt(req.query.location_id as string) : undefined;
    
    const data = ReportService.getLowStockItems(locationId);
    
    res.json({
      success: true,
      data,
      count: data.length,
      filters: { locationId }
    });
  });

  // GET /api/reports/checkouts
  static getCheckouts = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      startDate: req.query.start_date as string,
      endDate: req.query.end_date as string,
      locationId: req.query.location_id ? parseInt(req.query.location_id as string) : undefined
    };
    
    const data = ReportService.getCheckoutReport(filters);
    
    res.json({
      success: true,
      data,
      count: data.length,
      filters
    });
  });

  // GET /api/reports/popular-items
  static getPopularItems = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      startDate: req.query.start_date as string,
      endDate: req.query.end_date as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };
    
    const data = ReportService.getPopularItems(filters);
    
    res.json({
      success: true,
      data,
      count: data.length,
      filters
    });
  });

  // GET /api/reports/volunteer-hours
  static getVolunteerHours = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      startDate: req.query.start_date as string,
      endDate: req.query.end_date as string,
      locationId: req.query.location_id ? parseInt(req.query.location_id as string) : undefined
    };
    
    const data = ReportService.getVolunteerHoursSummary(filters);
    
    res.json({
      success: true,
      data,
      count: data.length,
      filters
    });
  });

  // GET /api/reports/daily-volunteers
  static getDailyVolunteers = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      startDate: req.query.start_date as string,
      endDate: req.query.end_date as string,
      locationId: req.query.location_id ? parseInt(req.query.location_id as string) : undefined
    };
    
    const data = ReportService.getDailyVolunteerReport(filters);
    
    res.json({
      success: true,
      data,
      count: data.length,
      filters
    });
  });

  // GET /api/reports/item-master
  static getItemMaster = asyncHandler(async (req: Request, res: Response) => {
    const data = ReportService.getItemMasterList();
    
    res.json({
      success: true,
      data,
      count: data.length
    });
  });

  // GET /api/reports/monthly-summary
  static getMonthlySummary = asyncHandler(async (req: Request, res: Response) => {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    
    const data = ReportService.getMonthlySummary(month, year);
    
    res.json({
      success: true,
      data,
      filters: { month, year }
    });
  });

  // GET /api/reports/export/:reportType
  static exportReport = asyncHandler(async (req: Request, res: Response) => {
    const { reportType } = req.params;
    const { format = 'csv' } = req.query;
    
    let data: any[] = [];
    let filename = '';
    
    // Get the appropriate report data
    switch (reportType) {
      case 'current-inventory':
        const locationId1 = req.query.location_id ? parseInt(req.query.location_id as string) : undefined;
        data = ReportService.getCurrentInventory(locationId1);
        filename = `current-inventory-${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'low-stock':
        const locationId2 = req.query.location_id ? parseInt(req.query.location_id as string) : undefined;
        data = ReportService.getLowStockItems(locationId2);
        filename = `low-stock-${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'checkouts':
        const checkoutFilters = {
          startDate: req.query.start_date as string,
          endDate: req.query.end_date as string,
          locationId: req.query.location_id ? parseInt(req.query.location_id as string) : undefined
        };
        data = ReportService.getCheckoutReport(checkoutFilters);
        filename = `checkouts-${checkoutFilters.startDate || 'all'}-to-${checkoutFilters.endDate || 'all'}`;
        break;
        
      case 'popular-items':
        const popularFilters = {
          startDate: req.query.start_date as string,
          endDate: req.query.end_date as string,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
        };
        data = ReportService.getPopularItems(popularFilters);
        filename = `popular-items-${popularFilters.startDate || 'all'}-to-${popularFilters.endDate || 'all'}`;
        break;
        
      case 'volunteer-hours':
        const volunteerFilters = {
          startDate: req.query.start_date as string,
          endDate: req.query.end_date as string,
          locationId: req.query.location_id ? parseInt(req.query.location_id as string) : undefined
        };
        data = ReportService.getVolunteerHoursSummary(volunteerFilters);
        filename = `volunteer-hours-${volunteerFilters.startDate || 'all'}-to-${volunteerFilters.endDate || 'all'}`;
        break;
        
      case 'daily-volunteers':
        const dailyFilters = {
          startDate: req.query.start_date as string,
          endDate: req.query.end_date as string,
          locationId: req.query.location_id ? parseInt(req.query.location_id as string) : undefined
        };
        data = ReportService.getDailyVolunteerReport(dailyFilters);
        filename = `daily-volunteers-${dailyFilters.startDate || 'all'}-to-${dailyFilters.endDate || 'all'}`;
        break;
        
      case 'item-master':
        data = ReportService.getItemMasterList();
        filename = `item-master-${new Date().toISOString().split('T')[0]}`;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid report type'
        });
    }
    
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found for the specified criteria'
      });
    }
    
    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      // Return JSON for other formats
      res.json({
        success: true,
        data,
        count: data.length,
        filename
      });
    }
  });
}