import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { registerRateLimiter, loginRateLimiter } from '../middleware/rateLimit.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

/**
 * POST /api/auth/register
 * Rate limited, validated body, creates new user account and sets HttpOnly cookie.
 */
router.post(
  '/register',
  registerRateLimiter,
  validateBody(registerSchema),
  register
);

/**
 * POST /api/auth/login
 * Rate limited, validated body, authenticates user and sets HttpOnly cookie.
 */
router.post(
  '/login',
  loginRateLimiter,
  validateBody(loginSchema),
  login
);

/**
 * GET /api/auth/me
 * Protected by requireAuth, returns currently authenticated user profile & memberships.
 */
router.get(
  '/me',
  requireAuth,
  getMe
);

/**
 * POST /api/auth/logout
 * Clears HttpOnly session cookie.
 */
router.post(
  '/logout',
  logout
);

export default router;
