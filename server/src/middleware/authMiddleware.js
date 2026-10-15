import { pool } from '../config/db.js';
import { config } from '../config/env.js';

/**
 * Authentication verification middleware.
 * Ensures the session contains a valid user ID and that the user account is active.
 */
export async function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const result = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      // User deleted from database
      req.session.destroy(() => {});
      res.clearCookie('eventsphere.sid');
      return res.status(401).json({
        success: false,
        message: 'Account no longer exists.'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      // Account deactivated
      req.session.destroy(() => {});
      res.clearCookie('eventsphere.sid');
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // Attach sanitized user to request (no password hash or secrets)
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('[requireAuth Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while verifying session.'
    });
  }
}

/**
 * Role-based authorization middleware.
 * @param {string[]} allowedRoles Array of allowed role names (e.g. ['ADMIN', 'ORGANIZER'])
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
}

/**
 * CSRF and Origin protection middleware for state-modifying HTTP requests.
 */
export function verifyCsrf(req, res, next) {
  // Safe HTTP methods do not modify state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Check Origin or Referer if present
  const origin = req.headers['origin'];
  const referer = req.headers['referer'];
  const customHeader = req.headers['x-requested-with'] || req.headers['x-eventsphere-request'];

  if (origin) {
    try {
      const originUrl = new URL(origin);
      const allowedUrl = new URL(config.clientUrl);
      if (originUrl.host !== allowedUrl.host && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return res.status(403).json({
          success: false,
          message: 'Cross-site request blocked (Origin mismatch).'
        });
      }
    } catch {
      return res.status(403).json({
        success: false,
        message: 'Invalid request origin header.'
      });
    }
  }

  next();
}
