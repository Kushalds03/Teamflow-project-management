import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { SystemRole } from '@prisma/client';
import { env } from '../config/env';

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: SystemRole;
}

/**
 * Signs a JWT containing essential user identity and role.
 */
export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any
  });
}

/**
 * Verifies and decodes a JWT token. Returns null if invalid or expired.
 */
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    if (decoded && decoded.id && decoded.email) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sets HttpOnly authentication cookie.
 */
export function setAuthCookie(res: Response, token: string): void {
  const isProduction = env.NODE_ENV === 'production';
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    // Cross-site cookie between Vercel (*.vercel.app) and Render (*.onrender.com) requires sameSite='none' with secure=true
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/'
  });
}

/**
 * Clears HttpOnly authentication cookie on logout.
 */
export function clearAuthCookie(res: Response): void {
  const isProduction = env.NODE_ENV === 'production';

  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
}
