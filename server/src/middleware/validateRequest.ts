import { Request, Response, NextFunction } from 'express';

/**
 * Universal input sanitization middleware.
 * Strips common XSS/injection patterns from all string inputs.
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const sanitize = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/<[^>]*>/g, '')        // Strip HTML tags entirely
        .replace(/javascript:/gi, '')   // Strip javascript: protocol
        .replace(/on\w+=/gi, '')        // Strip event handlers (onclick=, etc)
        .trim();
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = Array.isArray(value) ? [] : {};
      for (const key of Object.keys(value)) {
        sanitized[key] = sanitize(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

/**
 * Validates that request body does not exceed max size.
 * Default: 10MB (matching express.json limit)
 */
export const validateBodySize = (maxBytes: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > maxBytes) {
      res.status(413).json({
        success: false,
        message: `Request body too large. Max allowed: ${maxBytes / 1024 / 1024}MB`,
      });
      return;
    }
    next();
  };
};

/**
 * Validates MongoDB ObjectId format to prevent injection.
 * Use on routes with :id params.
 */
export const validateObjectId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const idPattern = /^[0-9a-fA-F]{24}$/;
  const id = req.params.id || req.params.productId || req.params.orderId;

  if (id && !idPattern.test(id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
    return;
  }
  next();
};

/**
 * Common validation rules for auth routes
 */
export const validateAuthInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password, name } = req.body;
  const errors: string[] = [];

  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
    if (email.length > 254) {
      errors.push('Email too long');
    }
  }

  if (password !== undefined) {
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    if (password.length > 128) {
      errors.push('Password too long');
    }
  }

  if (name !== undefined) {
    if (name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    if (name.length > 100) {
      errors.push('Name too long');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  next();
};