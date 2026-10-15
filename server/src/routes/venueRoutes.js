import express from 'express';
import {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue
} from '../controllers/venueController.js';
import { requireAuth, requireRole, verifyCsrf } from '../middleware/authMiddleware.js';

const router = express.Router();

// Read operations are accessible to all authenticated users
router.get('/', requireAuth, getVenues);
router.get('/:id', requireAuth, getVenueById);

// Write operations permitted for ADMIN and ORGANIZER
router.post('/', requireAuth, requireRole(['ADMIN', 'ORGANIZER']), verifyCsrf, createVenue);
router.put('/:id', requireAuth, requireRole(['ADMIN', 'ORGANIZER']), verifyCsrf, updateVenue);
router.delete('/:id', requireAuth, requireRole(['ADMIN', 'ORGANIZER']), verifyCsrf, deleteVenue);

export default router;
