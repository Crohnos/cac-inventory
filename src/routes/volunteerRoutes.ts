import { Router } from 'express';
import { VolunteerController } from '../controllers/volunteerController';

const router = Router();

// Volunteer sessions routes
router.post('/sessions', VolunteerController.createSession);
router.get('/sessions', VolunteerController.getSessions);
router.get('/sessions/:id', VolunteerController.getSessionById);
router.put('/sessions/:id', VolunteerController.updateSession);
router.delete('/sessions/:id', VolunteerController.deleteSession);

// Statistics
router.get('/stats', VolunteerController.getVolunteerStats);

export { router as volunteerRoutes };