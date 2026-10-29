import { Request, Response, NextFunction } from 'express';
import { SystemRole } from '@prisma/client';
import { env } from '../config/env';
import { verifyToken } from '../utils/token';
import { prisma } from '../utils/prisma';
import { sanitizeUser, SafeUser } from '../utils/userSerializer';
import { sendError } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      token?: string;
    }
  }
}

/**
 * Middleware that extracts and verifies JWT from HttpOnly cookie or Authorization Bearer header.
 * Populates req.user if a valid token is present; does not block unauthenticated requests.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies[env.COOKIE_NAME]) {
      token = req.cookies[env.COOKIE_NAME];
    }

    // 2. Fall back to Authorization Bearer header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) {
      return next();
    }

    const payload = verifyToken(token);
    if (!payload || !payload.id) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id }
    });

    if (!user) {
      return next();
    }

    // Attach safe user and token to request object
    req.user = sanitizeUser(user);
    req.token = token;
    next();
  } catch (err) {
    // Fail closed on error without crashing request lifecycle
    next();
  }
};

/**
 * Enforces that a valid authenticated user session is present.
 * Returns 401 Unauthorized if not authenticated.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendError(
      res,
      'Authentication required. Please provide a valid session token.',
      401,
      'UNAUTHORIZED'
    );
  }
  next();
};

/**
 * Enforces system-level role access (e.g. SystemRole.ADMIN vs SystemRole.USER).
 * Returns 403 Forbidden if user lacks required system role.
 */
export const requireSystemRole = (...allowedRoles: SystemRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(
        res,
        'Authentication required.',
        401,
        'UNAUTHORIZED'
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        'Access denied. Insufficient system permissions.',
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
};
