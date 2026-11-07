import { Request, Response } from 'express';
import { SystemRole } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';

/**
 * GET /api/workspaces
 * List all workspaces accessible to the authenticated user.
 * - System ADMIN sees all workspaces.
 * - Standard users see workspaces where they have project memberships or led projects.
 */
export const listWorkspaces = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === SystemRole.ADMIN;

    const where = isAdmin
      ? {}
      : {
          projects: {
            some: {
              OR: [
                { leadId: user.id },
                { members: { some: { userId: user.id } } }
              ]
            }
          }
        };

    const workspaces = await prisma.workspace.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    return sendSuccess(res, workspaces, 200);
  } catch (error) {
    console.error('Error listing workspaces:', error);
    return sendError(res, 'Failed to fetch workspaces.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

