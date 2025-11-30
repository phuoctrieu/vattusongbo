const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Bearer token format
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Token error' });
    }

    const token = parts[1];

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Attach user info to request
      req.userId = decoded.id;
      req.username = decoded.username;
      next();
    });
  } catch (error) {
    return res.status(401).json({ error: 'Token validation failed' });
  }
};

module.exports = authMiddleware;

