import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin-only protected endpoint
router.get('/admin/overview', requireAuth, requireRole(['ADMIN']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Administrator portal data.',
    user: req.user
  });
});

// Organizer protected endpoint
router.get('/organizer/overview', requireAuth, requireRole(['ADMIN', 'ORGANIZER']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Organizer portal data.',
    user: req.user
  });
});

// Vendor protected endpoint
router.get('/vendor/overview', requireAuth, requireRole(['ADMIN', 'VENDOR']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Vendor portal data.',
    user: req.user
  });
});

// Attendee protected endpoint
router.get('/attendee/overview', requireAuth, requireRole(['ADMIN', 'ATTENDEE']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Attendee portal data.',
    user: req.user
  });
});

export default router;
