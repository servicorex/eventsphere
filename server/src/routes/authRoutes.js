import express from 'express';
import { login, getMe, logout } from '../controllers/authController.js';
import { requireAuth, verifyCsrf } from '../middleware/authMiddleware.js';
import { validateLoginInput } from '../middleware/validateMiddleware.js';

const router = express.Router();

// Public login endpoint
router.post('/login', verifyCsrf, validateLoginInput, login);

// Authenticated session check
router.get('/me', requireAuth, getMe);

// Session termination
router.post('/logout', verifyCsrf, logout);

export default router;
