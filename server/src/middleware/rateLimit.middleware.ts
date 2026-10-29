import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

const isTest = process.env.NODE_ENV === 'test';

/**
 * Rate limiter for user login attempts.
 * Mitigates brute-force credential stuffing.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 20, // 20 attempts per 15 min window in dev/prod
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many login attempts from this IP, please try again in 15 minutes.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

/**
 * Rate limiter for registration.
 * Prevents automated account creation spam.
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isTest ? 10000 : 10, // 10 registrations per hour in dev/prod
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many accounts created from this IP, please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});
