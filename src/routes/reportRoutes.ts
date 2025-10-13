import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';

const router = Router();

// Report data endpoints
router.get('/current-inventory', ReportController.getCurrentInventory);
router.get('/low-stock', ReportController.getLowStock);
router.get('/checkouts', ReportController.getCheckouts);
router.get('/popular-items', ReportController.getPopularItems);
router.get('/volunteer-hours', ReportController.getVolunteerHours);
router.get('/daily-volunteers', ReportController.getDailyVolunteers);
router.get('/item-master', ReportController.getItemMaster);
router.get('/monthly-summary', ReportController.getMonthlySummary);
router.get('/monthly-movements', ReportController.getMonthlyInventoryMovements);
router.get('/transaction-history/:itemId', ReportController.getTransactionHistory);

// Export endpoints
router.get('/export/:reportType', ReportController.exportReport);

export { router as reportRoutes };