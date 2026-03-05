const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Find user (support both 'id' and 'userId' for compatibility)
    const userId = decoded.id || decoded.userId;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }
    
    if (!user.active) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is inactive'
      });
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Invalid token'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      // Support both 'id' and 'userId' for compatibility
      const userId = decoded.id || decoded.userId;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      });
      
      if (user && user.active) {
        req.user = user;
        req.userId = user.id;
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
    logger.debug('Optional auth failed:', error.message);
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
