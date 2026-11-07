import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import {
  ListActivitiesQuery,
  ProjectActivitiesParam,
  TaskActivitiesParam
} from '../validators/activity.validator';

const ACTIVITY_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  jobTitle: true,
  department: true,
  role: true
};

const ACTIVITY_INCLUDES = {
  user: {
    select: ACTIVITY_USER_SELECT
  },
  project: {
    select: {
      id: true,
      name: true
    }
  },
  task: {
    select: {
      id: true,
      title: true
    }
  }
};

/**
 * GET /api/projects/:projectId/activities
 * List activity feed for a project.
 * Includes project-level activities and activities related to its tasks.
 * Validates membership / lead / admin access via requireProjectAccess(VIEWER).
 */
export const listProjectActivities = async (
  req: Request<ProjectActivitiesParam>,
  res: Response
) => {
  try {
    const { projectId } = req.params;
    const query = (req.query || {}) as unknown as ListActivitiesQuery;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const type = query.type;
    const startDate = query.startDate || query.from;
    const endDate = query.endDate || query.to;

    const andConditions: Prisma.ActivityWhereInput[] = [
      {
        OR: [
          { projectId },
          { task: { projectId } }
        ]
      }
    ];

    if (type) {
      andConditions.push({ type });
    }

    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        if (typeof endDate === 'string' && endDate.length <= 10) {
          end.setUTCHours(23, 59, 59, 999);
        }
        dateFilter.lte = end;
      }
      andConditions.push({ createdAt: dateFilter });
    }

    const where: Prisma.ActivityWhereInput = { AND: andConditions };
    const skip = (page - 1) * limit;
    const take = limit;

    const [total, activities] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: ACTIVITY_INCLUDES
      })
    ]);

    const formattedActivities = activities.map((act) => ({
      ...act,
      timestamp: act.createdAt.toISOString()
    }));

    return sendSuccess(res, formattedActivities, 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching project activities:', error);
    return sendError(res, 'Failed to fetch project activities.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * GET /api/tasks/:taskId/activities
 * List activity history for a specific task.
 * Only returns activities associated with that task.
 * Validates access to parent project via requireTaskAccess(false).
 */
export const listTaskActivities = async (
  req: Request<TaskActivitiesParam>,
  res: Response
) => {
  try {
    const { taskId } = req.params;
    const query = (req.query || {}) as unknown as ListActivitiesQuery;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const type = query.type;
    const startDate = query.startDate || query.from;
    const endDate = query.endDate || query.to;

    const andConditions: Prisma.ActivityWhereInput[] = [
      { taskId }
    ];

    if (type) {
      andConditions.push({ type });
    }

    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        if (typeof endDate === 'string' && endDate.length <= 10) {
          end.setUTCHours(23, 59, 59, 999);
        }
        dateFilter.lte = end;
      }
      andConditions.push({ createdAt: dateFilter });
    }

    const where: Prisma.ActivityWhereInput = { AND: andConditions };
    const skip = (page - 1) * limit;
    const take = limit;

    const [total, activities] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: ACTIVITY_INCLUDES
      })
    ]);

    const formattedActivities = activities.map((act) => ({
      ...act,
      timestamp: act.createdAt.toISOString()
    }));

    return sendSuccess(res, formattedActivities, 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching task activities:', error);
    return sendError(res, 'Failed to fetch task activities.', 500, 'INTERNAL_SERVER_ERROR');
  }
};
