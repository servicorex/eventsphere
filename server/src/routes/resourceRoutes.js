import express from 'express';
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
} from '../controllers/resourceController.js';
import { requireAuth, requireRole, verifyCsrf } from '../middleware/authMiddleware.js';

const router = express.Router();

// Read operations accessible to all authenticated users
router.get('/', requireAuth, getResources);
router.get('/:id', requireAuth, getResourceById);

// Write operations permitted for ADMIN, ORGANIZER, and VENDOR
router.post('/', requireAuth, requireRole(['ADMIN', 'ORGANIZER', 'VENDOR']), verifyCsrf, createResource);
router.put('/:id', requireAuth, requireRole(['ADMIN', 'ORGANIZER', 'VENDOR']), verifyCsrf, updateResource);
router.delete('/:id', requireAuth, requireRole(['ADMIN', 'ORGANIZER']), verifyCsrf, deleteResource);

export default router;
