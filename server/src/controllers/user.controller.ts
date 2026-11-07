import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { sanitizeUser } from '../utils/userSerializer';
import { UpdateProfileInput } from '../validators/user.validator';

/**
 * GET /api/users
 * Lists active users in the directory for project membership and task assignments.
 */
export const listUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        department: true,
        avatarUrl: true,
        status: true,
        bio: true,
        _count: {
          select: {
            memberships: true,
            ledProjects: true,
            assignedTasks: {
              where: { status: 'DONE' }
            }
          }
        }
      }
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.jobTitle || (u.role === 'ADMIN' ? 'Administrator' : 'Team Member'),
      systemRole: u.role,
      department: u.department || 'Engineering',
      avatar:
        u.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: (u.status as 'active' | 'away' | 'offline') || 'active',
      bio: u.bio || '',
      projectsCount: u._count.memberships + u._count.ledProjects,
      completedTasks: u._count.assignedTasks
    }));

    return sendSuccess(res, formatted, 200);
  } catch (error) {
    console.error('Error listing users:', error);
    return sendError(res, 'Failed to fetch team members.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * GET /api/users/profile
 * Returns the current authenticated user's profile.
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return sendError(res, 'User not found.', 404, 'USER_NOT_FOUND');
    }

    return sendSuccess(res, sanitizeUser(user), 200);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return sendError(res, 'Failed to fetch user profile.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * PUT /api/users/profile
 * Updates the current authenticated user's profile attributes.
 */
export const updateProfile = async (
  req: Request<unknown, unknown, UpdateProfileInput>,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const { name, jobTitle, department, bio, avatarUrl, status } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(department !== undefined && { department }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl === '' ? null : avatarUrl }),
        ...(status !== undefined && { status })
      }
    });

    return sendSuccess(
      res,
      sanitizeUser(updated),
      200,
      { message: 'Profile updated successfully' }
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    return sendError(res, 'Failed to update profile.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

