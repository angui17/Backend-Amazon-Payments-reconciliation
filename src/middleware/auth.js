/**
 * Authentication middleware
 * Validates the Token header (optional but recommended)
 */

export function validateToken(req, res, next) {
  const token = req.headers.token || req.headers.Token || req.headers.TOKEN;
  const expectedToken = process.env.API_TOKEN || 'Gv54n6Et644L4GZ9VLluKX4GTOLfNiWuIST';

  // If token validation is enabled in env
  if (process.env.ENABLE_TOKEN_VALIDATION === 'true') {
    if (!token) {
      return res.status(401).json({
        id: -401,
        Message: 'Token header is required'
      });
    }

    if (token !== expectedToken) {
      return res.status(403).json({
        id: -403,
        Message: 'Invalid token'
      });
    }
  }

  // Log token for debugging (remove in production)
  if (token) {
    console.log('Token received:', token.substring(0, 10) + '...');
  }

  next();
}

