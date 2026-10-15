/**
 * Validation helper for login request body.
 */
export function validateLoginInput(req, res, next) {
  const { email, password } = req.body || {};
  const errors = {};

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.email = 'Email address is required.';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
  }

  if (!password || typeof password !== 'string' || password === '') {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please correct the highlighted errors.',
      errors
    });
  }

  next();
}
