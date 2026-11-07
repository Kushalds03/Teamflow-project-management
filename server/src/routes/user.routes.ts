import { Router } from 'express';
import { listUsers, getProfile, updateProfile } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateProfileSchema } from '../validators/user.validator';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

/**
 * GET /api/users
 * Directory of active users
 */
router.get('/', listUsers);

/**
 * GET /api/users/profile
 * Current user profile details
 */
router.get('/profile', getProfile);

/**
 * PUT /api/users/profile
 * Update current user profile
 */
router.put('/profile', validateBody(updateProfileSchema), updateProfile);

export default router;

