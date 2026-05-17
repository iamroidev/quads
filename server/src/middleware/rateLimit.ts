import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter — 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 2000, // Adjusted for development and campus NAT environments
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  // Trust proxy if behind a load balancer
  skip: (req) => {
    // Skip rate limiting for health checks or local development environment
    return req.path === '/health' || process.env.NODE_ENV === 'development';
  },
});

/**
 * Strict rate limiter for auth routes — 5 attempts per 15 minutes
 * Prevents brute-force attacks on login/register
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  // Add delay after each failed attempt
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Payment rate limiter — 10 attempts per hour
 * Prevents abuse of payment endpoints
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many payment attempts. Please try again later.',
  },
});

/**
 * Upload rate limiter — 20 uploads per hour
 * Prevents storage abuse
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many uploads. Please try again later.',
  },
});

/**
 * Socket connection rate limiter
 * Note: Socket.io doesn't use express-rate-limit directly.
 * This is applied at the middleware level.
 */
export const socketLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 connections per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many connection attempts.',
  },
});
