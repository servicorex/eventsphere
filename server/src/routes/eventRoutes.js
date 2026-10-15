import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  allocateResourceToEvent,
  releaseResourceFromEvent
} from '../controllers/eventController.js';
import { requireAuth, requireRole, verifyCsrf } from '../middleware/authMiddleware.js';

const router = express.Router();

// Read events accessible to authenticated users
router.get('/', requireAuth, getEvents);
router.get('/:id', requireAuth, getEventById);

// Event management permitted for ADMIN and ORGANIZER
router.post('/', requireAuth, requireRole(['ADMIN', 'ORGANIZER']), verifyCsrf, createEvent);
router.put('/:id', requireAuth, requireRole(['ADMIN', 'ORGANIZER']), verifyCsrf, updateEvent);
router.delete('/:id', requireAuth, requireRole(['ADMIN', 'ORGANIZER']), verifyCsrf, deleteEvent);

// Resource allocation and release
router.post('/:id/resources', requireAuth, requireRole(['ADMIN', 'ORGANIZER']), verifyCsrf, allocateResourceToEvent);
router.delete('/:id/resources/:resourceId', requireAuth, requireRole(['ADMIN', 'ORGANIZER']), verifyCsrf, releaseResourceFromEvent);

export default router;
