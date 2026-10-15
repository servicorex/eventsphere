import express from 'express';
import {
  getRegistrations,
  registerForEvent,
  checkInTicket,
  getVendorContracts,
  createVendorContract,
  updateContractStatus
} from '../controllers/advancedController.js';
import { requireAuth, verifyCsrf } from '../middleware/authMiddleware.js';

const router = express.Router();

// Registration & Ticket Endpoints
router.get('/registrations', requireAuth, getRegistrations);
router.post('/register', requireAuth, verifyCsrf, registerForEvent);
router.post('/checkin', requireAuth, verifyCsrf, checkInTicket);

// Vendor Contract Endpoints
router.get('/contracts', requireAuth, getVendorContracts);
router.post('/contracts', requireAuth, verifyCsrf, createVendorContract);
router.put('/contracts/:id', requireAuth, verifyCsrf, updateContractStatus);

export default router;
