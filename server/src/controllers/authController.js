import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

/**
 * Handle user login
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password, rememberMe } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Query user by normalized email
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      // Use generic invalid-credentials response to prevent account enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = result.rows[0];

    // Check account active status
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Prevent session fixation by regenerating session on login
    req.session.regenerate((err) => {
      if (err) {
        console.error('[Session Regenerate Error]:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to establish secure session.'
        });
      }

      req.session.userId = user.id;
      req.session.role = user.role;

      // Adjust session expiration based on rememberMe preference
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      }

      // Return sanitized user object - NEVER return password_hash or secret tokens
      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    });
  } catch (error) {
    console.error('[Login Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login. Please try again later.'
    });
  }
}

/**
 * Retrieve currently authenticated user session
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  try {
    // req.user was securely populated by requireAuth middleware
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('[getMe Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.'
    });
  }
}

/**
 * Terminate user session and clear cookies
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  try {
    if (!req.session) {
      res.clearCookie('eventsphere.sid');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('[Logout Session Destroy Error]:', err);
        return res.status(500).json({
          success: false,
          message: 'Could not log out. Please try again.'
        });
      }

      res.clearCookie('eventsphere.sid');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    });
  } catch (error) {
    console.error('[Logout Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error during logout.'
    });
  }
}
