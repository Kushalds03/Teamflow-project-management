import { Request, Response } from 'express';
import { SystemRole } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token';
import { sanitizeUser } from '../utils/userSerializer';
import { sendSuccess, sendError } from '../utils/response';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

/**
 * POST /api/auth/register
 * Registers a new user account with secure password hashing.
 */
export const register = async (req: Request<unknown, unknown, RegisterInput>, res: Response) => {
  const { name, email, password, role, jobTitle, department, avatarUrl, bio } = req.body;

  try {
    // Check if email already registered (case-insensitive normalized)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return sendError(
        res,
        'An account with this email address already exists.',
        409,
        'EMAIL_ALREADY_EXISTS'
      );
    }

    // Securely hash the password using bcrypt with work factor 10
    const passwordHash = await hashPassword(password);

    // Never trust a role provided during public self-registration to grant administrative access.
    // An elevated role (e.g. ADMIN) can only be assigned if the requester is an authenticated ADMIN.
    const finalRole =
      req.user && req.user.role === SystemRole.ADMIN && role
        ? role
        : SystemRole.USER;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: finalRole,
        jobTitle: jobTitle || null,
        department: department || null,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
        status: 'active'
      }
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Set HttpOnly, SameSite, Secure cookie
    setAuthCookie(res, token);

    return sendSuccess(
      res,
      {
        user: sanitizeUser(user),
        token
      },
      201,
      { message: 'Registration successful' }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return sendError(
      res,
      'Failed to register account. Please try again.',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
};

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues session token and HttpOnly cookie.
 */
export const login = async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Mitigate account enumeration: Use identical error message for missing user and bad password
    if (!user || !user.passwordHash) {
      return sendError(
        res,
        'Invalid email or password.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return sendError(
        res,
        'Invalid email or password.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    if (user.status === 'suspended') {
      return sendError(
        res,
        'Your account has been suspended. Please contact support.',
        403,
        'ACCOUNT_SUSPENDED'
      );
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Set HttpOnly cookie
    setAuthCookie(res, token);

    return sendSuccess(
      res,
      {
        user: sanitizeUser(user),
        token
      },
      200,
      { message: 'Login successful' }
    );
  } catch (error) {
    console.error('Login error:', error);
    return sendError(
      res,
      'Authentication failed. Please try again.',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
};

/**
 * GET /api/auth/me
 * Returns current authenticated user context, roles, and memberships.
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(
        res,
        'Authentication required.',
        401,
        'UNAUTHORIZED'
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                category: true,
                status: true
              }
            }
          }
        },
        ledProjects: {
          select: {
            id: true,
            name: true,
            category: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      return sendError(res, 'User profile not found.', 404, 'USER_NOT_FOUND');
    }

    return sendSuccess(res, {
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('getMe error:', error);
    return sendError(
      res,
      'Failed to load user profile.',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
};

/**
 * POST /api/auth/logout
 * Clears authentication session cookie.
 */
export const logout = async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return sendSuccess(
    res,
    { message: 'Logged out successfully.' },
    200
  );
};
