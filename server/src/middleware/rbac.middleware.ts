import { Request, Response, NextFunction } from 'express';
import { ProjectRole, SystemRole } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { sendError } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      project?: any;
      projectRole?: ProjectRole;
      projectMember?: any;
      task?: any;
    }
  }
}

export const PROJECT_ROLE_LEVELS: Record<ProjectRole, number> = {
  [ProjectRole.VIEWER]: 1,
  [ProjectRole.CONTRIBUTOR]: 2,
  [ProjectRole.MAINTAINER]: 3,
  [ProjectRole.LEAD]: 4
};

/**
 * Validates that the authenticated user is a verified member of the target project
 * (or a System Administrator / Project Lead) and possesses the required minimum role.
 * 
 * Strict Server-Side Validation:
 * - Rejects any attempt to forge roles or IDs.
 * - Confirms existence in database.
 * - Viewers are strictly prohibited from write operations (POST, PUT, PATCH, DELETE).
 */
export const requireProjectAccess = (minRole: ProjectRole = ProjectRole.VIEWER) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return sendError(
        res,
        'Authentication required.',
        401,
        'UNAUTHORIZED'
      );
    }

    const projectId =
      req.params.projectId ||
      req.params.id ||
      req.body?.projectId ||
      (req.query?.projectId as string);

    if (!projectId || typeof projectId !== 'string') {
      return sendError(
        res,
        'Valid project ID is required for access validation.',
        400,
        'PROJECT_ID_REQUIRED'
      );
    }

    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: {
            where: { userId: user.id }
          }
        }
      });

      if (!project) {
        return sendError(
          res,
          'Project not found.',
          404,
          'PROJECT_NOT_FOUND'
        );
      }

      // Determine the user's validated effective role
      let effectiveRole: ProjectRole | null = null;

      if (user.role === SystemRole.ADMIN) {
        // System Administrators possess full project leadership authority across workspaces
        effectiveRole = ProjectRole.LEAD;
      } else if (project.leadId === user.id) {
        // Explicit Project Lead designated in Project record
        effectiveRole = ProjectRole.LEAD;
      } else if (project.members.length > 0) {
        // Direct project membership verified from database
        effectiveRole = project.members[0].role;
      }

      // Non-member access rejection: Prevents cross-project unauthorized data leaks
      if (!effectiveRole) {
        return sendError(
          res,
          'Access denied. You are not a member of this project.',
          403,
          'FORBIDDEN_PROJECT_ACCESS'
        );
      }

      // Hard enforcement: Viewers cannot perform any write operation
      const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      if (effectiveRole === ProjectRole.VIEWER && isWriteOperation) {
        return sendError(
          res,
          'Access denied. Viewers have read-only permissions and cannot modify project resources.',
          403,
          'VIEWER_READ_ONLY'
        );
      }

      // Role hierarchy enforcement
      const userLevel = PROJECT_ROLE_LEVELS[effectiveRole];
      const requiredLevel = PROJECT_ROLE_LEVELS[minRole];

      if (userLevel < requiredLevel) {
        return sendError(
          res,
          `Access denied. Requires at least ${minRole} role on this project.`,
          403,
          'INSUFFICIENT_PROJECT_ROLE'
        );
      }

      // Attach validated context to request
      req.project = project;
      req.projectRole = effectiveRole;
      req.projectMember = project.members[0] || null;

      next();
    } catch (error) {
      console.error('Error during project access check:', error);
      return sendError(
        res,
        'Failed to verify project permissions.',
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  };
};

/**
 * Validates task access and ownership.
 * Confirms the task belongs to a project the user can access and enforces write restrictions.
 */
export const requireTaskAccess = (requireWrite = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return sendError(res, 'Authentication required.', 401, 'UNAUTHORIZED');
    }

    const taskId = req.params.taskId || req.params.id;
    if (!taskId || typeof taskId !== 'string') {
      return sendError(res, 'Valid task ID is required.', 400, 'TASK_ID_REQUIRED');
    }

    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: {
            include: {
              members: {
                where: { userId: user.id }
              }
            }
          }
        }
      });

      if (!task) {
        return sendError(res, 'Task not found.', 404, 'TASK_NOT_FOUND');
      }

      let effectiveRole: ProjectRole | null = null;
      if (user.role === SystemRole.ADMIN || task.project.leadId === user.id) {
        effectiveRole = ProjectRole.LEAD;
      } else if (task.project.members.length > 0) {
        effectiveRole = task.project.members[0].role;
      }

      if (!effectiveRole) {
        return sendError(
          res,
          'Access denied. You do not have access to the project containing this task.',
          403,
          'FORBIDDEN_TASK_ACCESS'
        );
      }

      const isWrite = requireWrite || ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      if (effectiveRole === ProjectRole.VIEWER && isWrite) {
        return sendError(
          res,
          'Access denied. Viewers have read-only permissions and cannot modify tasks.',
          403,
          'VIEWER_READ_ONLY'
        );
      }

      req.task = task;
      req.project = task.project;
      req.projectRole = effectiveRole;

      next();
    } catch (error) {
      console.error('Error during task access check:', error);
      return sendError(res, 'Failed to verify task permissions.', 500, 'INTERNAL_SERVER_ERROR');
    }
  };
};
