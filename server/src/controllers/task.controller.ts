import { Request, Response } from 'express';
import { ProjectRole, SystemRole, TaskPriority, TaskStatus, ActivityType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  UpdateTaskAssigneeInput,
  ListTasksQuery
} from '../validators/task.validator';

const TASK_INCLUDES = {
  project: {
    select: {
      id: true,
      name: true,
      workspaceId: true,
      status: true,
      priority: true
    }
  },
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      jobTitle: true,
      department: true,
      role: true
    }
  },
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      jobTitle: true,
      department: true,
      role: true
    }
  },
  _count: {
    select: {
      comments: true
    }
  }
};

/**
 * GET /api/tasks
 * List accessible tasks with query filters, pagination, and sorting.
 * - System Admins can view tasks across all projects.
 * - Standard Users only see tasks belonging to projects they lead or are members of.
 * - Supports database-level filtering: projectId, status, priority, assigneeId, search, dueDate.
 * - Supports pagination: page, limit.
 */
export const listTasks = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      projectId,
      status,
      priority,
      assigneeId,
      search,
      dueDate,
      page = 1,
      limit = 20
    } = (req.query || {}) as unknown as ListTasksQuery;

    // Project access isolation check when projectId is specified in query
    if (projectId) {
      if (user.role === SystemRole.ADMIN) {
        const project = await prisma.project.findUnique({
          where: { id: projectId }
        });
        if (!project) {
          return sendError(res, 'Project not found.', 404, 'PROJECT_NOT_FOUND');
        }
      } else {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        });

        if (!project) {
          return sendError(res, 'Project not found.', 404, 'PROJECT_NOT_FOUND');
        }

        const isMember = project.members.length > 0;
        const isLead = project.leadId === user.id;

        if (!isMember && !isLead) {
          return sendError(
            res,
            'Access denied. You are not authorized to access tasks for this project.',
            403,
            'FORBIDDEN_PROJECT_ACCESS'
          );
        }
      }
    }

    // Build database-level filter conditions
    const andConditions: any[] = [];

    if (projectId) {
      andConditions.push({ projectId });
    } else if (user.role !== SystemRole.ADMIN) {
      // Standard users only access tasks in projects where they are lead or member
      andConditions.push({
        project: {
          OR: [
            { leadId: user.id },
            { members: { some: { userId: user.id } } }
          ]
        }
      });
    }

    if (status) {
      andConditions.push({ status });
    }

    if (priority) {
      andConditions.push({ priority });
    }

    if (assigneeId) {
      andConditions.push({ assigneeId });
    }

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (dueDate) {
      const parsedDate = new Date(dueDate);
      const startOfDay = new Date(parsedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(parsedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      andConditions.push({
        dueDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};
    const skip = (page - 1) * limit;
    const take = limit;

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: TASK_INCLUDES
      })
    ]);

    return sendSuccess(res, tasks, 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error listing tasks:', error);
    return sendError(res, 'Failed to fetch tasks.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * GET /api/tasks/:id
 * Get full task details.
 * Task authorization is validated by requireTaskAccess().
 */
export const getTaskById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        ...TASK_INCLUDES,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      return sendError(res, 'Task not found.', 404, 'TASK_NOT_FOUND');
    }

    return sendSuccess(res, task, 200);
  } catch (error) {
    console.error('Error fetching task details:', error);
    return sendError(res, 'Failed to fetch task details.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * POST /api/projects/:projectId/tasks
 * Create a new task within a project.
 * - Requires CONTRIBUTOR or higher role.
 * - Enforces server-side creatorId = req.user.id.
 * - Validates that assignee belongs to the project if specified.
 * - Records an activity log inside a transaction.
 */
export const createTask = async (
  req: Request<{ projectId?: string }, unknown, CreateTaskInput & { projectId?: string }>,
  res: Response
) => {
  try {
    const user = req.user!;
    const projectId = req.params.projectId || req.body.projectId;

    if (!projectId) {
      return sendError(res, 'Project ID is required.', 400, 'PROJECT_ID_REQUIRED');
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      estimatedHours,
      tags,
      assigneeId
    } = req.body;

    // Validate assignee if supplied
    if (assigneeId) {
      const assigneeUser = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (!assigneeUser) {
        return sendError(res, 'Assignee user not found.', 404, 'USER_NOT_FOUND');
      }

      // Confirm assignee is a member of the project or lead
      const project = req.project || await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { where: { userId: assigneeId } } }
      });

      const isMember = project.members && project.members.some((m: any) => m.userId === assigneeId);
      const isLead = project.leadId === assigneeId;

      if (!isMember && !isLead) {
        // Also check DB if project.members wasn't fully queried
        const dbMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: assigneeId
            }
          }
        });

        if (!dbMember) {
          return sendError(
            res,
            'Assignee does not belong to this project.',
            400,
            'ASSIGNEE_NOT_PROJECT_MEMBER'
          );
        }
      }
    }

    // Create Task and Activity within database transaction
    const createdTask = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title,
          description: description ?? null,
          status: status || TaskStatus.TODO,
          priority: priority || TaskPriority.MEDIUM,
          dueDate: dueDate ? new Date(dueDate) : null,
          estimatedHours: estimatedHours !== undefined ? estimatedHours : null,
          tags: tags || [],
          projectId,
          creatorId: user.id,
          assigneeId: assigneeId ?? null
        },
        include: TASK_INCLUDES
      });

      await tx.activity.create({
        data: {
          type: ActivityType.TASK_CREATED,
          title: 'Task Created',
          description: `Task "${task.title}" was created.`,
          projectId,
          taskId: task.id,
          userId: user.id
        }
      });

      return task;
    });

    return sendSuccess(res, createdTask, 201);
  } catch (error) {
    console.error('Error creating task:', error);
    return sendError(res, 'Failed to create task.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * PUT /api/tasks/:id
 * Update task details.
 * - Enforces write access via requireTaskAccess(true).
 * - Validates assignee belongs to project if updated.
 * - Logs activities for status/assignment changes in transaction.
 */
export const updateTask = async (
  req: Request<{ id: string }, unknown, UpdateTaskInput>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const currentTask = req.task;
    const user = req.user!;

    const updateData: any = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;
    if (req.body.dueDate !== undefined) {
      updateData.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }
    if (req.body.estimatedHours !== undefined) {
      updateData.estimatedHours = req.body.estimatedHours;
    }
    if (req.body.tags !== undefined) updateData.tags = req.body.tags;

    let isAssigneeChanged = false;
    let targetAssigneeUser: any = null;

    if (req.body.assigneeId !== undefined) {
      const newAssigneeId = req.body.assigneeId;

      if (newAssigneeId === null) {
        updateData.assigneeId = null;
        isAssigneeChanged = currentTask.assigneeId !== null;
      } else {
        targetAssigneeUser = await prisma.user.findUnique({
          where: { id: newAssigneeId }
        });

        if (!targetAssigneeUser) {
          return sendError(res, 'Assignee user not found.', 404, 'USER_NOT_FOUND');
        }

        const isMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: currentTask.projectId,
              userId: newAssigneeId
            }
          }
        });
        const isLead = currentTask.project.leadId === newAssigneeId;

        if (!isMember && !isLead) {
          return sendError(
            res,
            'Assignee does not belong to this project.',
            400,
            'ASSIGNEE_NOT_PROJECT_MEMBER'
          );
        }

        updateData.assigneeId = newAssigneeId;
        isAssigneeChanged = currentTask.assigneeId !== newAssigneeId;
      }
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: updateData,
        include: TASK_INCLUDES
      });

      // Log status change activity
      if (req.body.status && req.body.status !== currentTask.status) {
        if (req.body.status === TaskStatus.DONE) {
          await tx.activity.create({
            data: {
              type: ActivityType.TASK_COMPLETED,
              title: 'Task Completed',
              description: `Task "${updated.title}" was marked as completed.`,
              projectId: currentTask.projectId,
              taskId: id,
              userId: user.id
            }
          });
        } else {
          await tx.activity.create({
            data: {
              type: ActivityType.TASK_STATUS_CHANGED,
              title: 'Task Status Updated',
              description: `Task "${updated.title}" status changed to ${req.body.status}.`,
              projectId: currentTask.projectId,
              taskId: id,
              userId: user.id
            }
          });
        }
      }

      // Log assignment activity
      if (isAssigneeChanged && targetAssigneeUser) {
        await tx.activity.create({
          data: {
            type: ActivityType.MEMBER_ASSIGNED,
            title: 'Task Assigned',
            description: `Task "${updated.title}" was assigned to ${targetAssigneeUser.name}.`,
            projectId: currentTask.projectId,
            taskId: id,
            userId: user.id
          }
        });
      }

      return updated;
    });

    return sendSuccess(res, updatedTask, 200);
  } catch (error) {
    console.error('Error updating task:', error);
    return sendError(res, 'Failed to update task.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * PATCH /api/tasks/:id/status
 * Update task status.
 * - Enforces write access via requireTaskAccess(true).
 * - Creates appropriate activity log (TASK_COMPLETED vs TASK_STATUS_CHANGED).
 */
export const updateTaskStatus = async (
  req: Request<{ id: string }, unknown, UpdateTaskStatusInput>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentTask = req.task;
    const user = req.user!;

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: { status },
        include: TASK_INCLUDES
      });

      const isCompleted = status === TaskStatus.DONE;
      await tx.activity.create({
        data: {
          type: isCompleted ? ActivityType.TASK_COMPLETED : ActivityType.TASK_STATUS_CHANGED,
          title: isCompleted ? 'Task Completed' : 'Task Status Updated',
          description: isCompleted
            ? `Task "${updated.title}" was marked as completed.`
            : `Task "${updated.title}" status changed to ${status}.`,
          projectId: currentTask.projectId,
          taskId: id,
          userId: user.id
        }
      });

      return updated;
    });

    return sendSuccess(res, updatedTask, 200);
  } catch (error) {
    console.error('Error updating task status:', error);
    return sendError(res, 'Failed to update task status.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * PATCH /api/tasks/:id/assignee
 * Assign or reassign a task.
 * - Supports setting assigneeId to a valid project member or null to unassign.
 * - Validates target assignee exists and belongs to the task's project.
 */
export const updateTaskAssignee = async (
  req: Request<{ id: string }, unknown, UpdateTaskAssigneeInput>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;
    const currentTask = req.task;
    const user = req.user!;

    if (assigneeId === null) {
      const updatedTask = await prisma.task.update({
        where: { id },
        data: { assigneeId: null },
        include: TASK_INCLUDES
      });
      return sendSuccess(res, updatedTask, 200);
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: assigneeId }
    });

    if (!targetUser) {
      return sendError(res, 'Assignee user not found.', 404, 'USER_NOT_FOUND');
    }

    // Verify user belongs to the project
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: currentTask.projectId,
          userId: assigneeId
        }
      }
    });
    const isLead = currentTask.project.leadId === assigneeId;

    if (!isMember && !isLead) {
      return sendError(
        res,
        'Assignee does not belong to this project.',
        400,
        'ASSIGNEE_NOT_PROJECT_MEMBER'
      );
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: { assigneeId },
        include: TASK_INCLUDES
      });

      await tx.activity.create({
        data: {
          type: ActivityType.MEMBER_ASSIGNED,
          title: 'Task Assigned',
          description: `Task "${updated.title}" was assigned to ${targetUser.name}.`,
          projectId: currentTask.projectId,
          taskId: id,
          userId: user.id
        }
      });

      return updated;
    });

    return sendSuccess(res, updatedTask, 200);
  } catch (error) {
    console.error('Error updating task assignee:', error);
    return sendError(res, 'Failed to update task assignee.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * DELETE /api/tasks/:id
 * Delete a task.
 * - Enforces authorization: System Admins, Project Leads, Maintainers, or Task Creators.
 * - Rejects unauthorized deletion by viewers, outsiders, or non-creator contributors with 403.
 * - Safely cascades task comments and activities within transaction.
 */
export const deleteTask = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const task = req.task;
    const user = req.user!;
    const projectRole = req.projectRole;

    const isCreator = task.creatorId === user.id;
    const isMaintainerOrAbove =
      user.role === SystemRole.ADMIN ||
      projectRole === ProjectRole.LEAD ||
      projectRole === ProjectRole.MAINTAINER;

    if (!isMaintainerOrAbove && !isCreator) {
      return sendError(
        res,
        'Access denied. You do not have permission to delete this task.',
        403,
        'INSUFFICIENT_PROJECT_ROLE'
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete comments on this task
      await tx.comment.deleteMany({
        where: { taskId: id }
      });

      // 2. Delete activities on this task
      await tx.activity.deleteMany({
        where: { taskId: id }
      });

      // 3. Delete task
      await tx.task.delete({
        where: { id }
      });
    });

    return sendSuccess(
      res,
      { message: 'Task deleted successfully.', taskId: id },
      200
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    return sendError(res, 'Failed to delete task.', 500, 'INTERNAL_SERVER_ERROR');
  }
};
