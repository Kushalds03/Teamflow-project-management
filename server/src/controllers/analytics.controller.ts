import { Request, Response } from 'express';
import { TaskStatus, TaskPriority, ProjectStatus, SystemRole, ProjectRole, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { ProjectAnalyticsParam, WorkspaceAnalyticsParam } from '../validators/analytics.validator';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  jobTitle: true,
  department: true,
  role: true
};

/**
 * GET /api/projects/:projectId/analytics
 * Retrieve rich project management metrics for a specific project.
 * Authorization: Enforced by requireProjectAccess(ProjectRole.VIEWER).
 */
export const getProjectAnalytics = async (
  req: Request<ProjectAnalyticsParam>,
  res: Response
) => {
  try {
    const { projectId } = req.params;

    // Fetch project with lead and members
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        priority: true,
        startDate: true,
        dueDate: true,
        workspaceId: true,
        lead: {
          select: USER_SELECT
        },
        members: {
          select: {
            role: true,
            user: {
              select: USER_SELECT
            }
          }
        }
      }
    });

    if (!project) {
      return sendError(res, 'Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    // Fetch all tasks for this project
    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        assigneeId: true,
        assignee: {
          select: USER_SELECT
        }
      }
    });

    const totalTasks = tasks.length;
    const now = new Date();

    // Group tasks by status
    const tasksByStatus = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0
    };

    // Group tasks by priority
    const tasksByPriority = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0
    };

    let overdueTasks = 0;

    for (const t of tasks) {
      if (tasksByStatus[t.status] !== undefined) {
        tasksByStatus[t.status]++;
      }
      if (tasksByPriority[t.priority] !== undefined) {
        tasksByPriority[t.priority]++;
      }
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE) {
        overdueTasks++;
      }
    }

    const completedTasks = tasksByStatus.DONE;
    const inProgressTasks = tasksByStatus.IN_PROGRESS;
    const inReviewTasks = tasksByStatus.IN_REVIEW;
    const todoTasks = tasksByStatus.TODO;
    const pendingTasks = totalTasks - completedTasks;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Build member workload
    const memberMap = new Map<string, { user: any; role: string }>();

    if (project.lead) {
      memberMap.set(project.lead.id, {
        user: project.lead,
        role: ProjectRole.LEAD
      });
    }

    for (const m of project.members) {
      if (m.user) {
        memberMap.set(m.user.id, {
          user: m.user,
          role: m.role
        });
      }
    }

    const memberWorkload = Array.from(memberMap.values()).map(({ user, role }) => {
      const userTasks = tasks.filter((t) => t.assigneeId === user.id);
      const userTotal = userTasks.length;
      const userCompleted = userTasks.filter((t) => t.status === TaskStatus.DONE).length;
      return {
        user,
        role,
        totalTasks: userTotal,
        completedTasks: userCompleted,
        activeTasks: userTotal - userCompleted
      };
    });

    const unassignedTasks = tasks.filter((t) => !t.assigneeId).length;

    // Fetch recent activity trend (last 7 days)
    const activities = await prisma.activity.findMany({
      where: {
        OR: [{ projectId }, { task: { projectId } }]
      },
      select: {
        createdAt: true,
        type: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const recentActivityTrend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = activities.filter(
        (a) => a.createdAt.toISOString().split('T')[0] === dateStr
      ).length;
      recentActivityTrend.push({ date: dateStr, count });
    }

    const analyticsData = {
      projectId: project.id,
      projectName: project.name,
      category: project.category,
      status: project.status,
      priority: project.priority,
      totalTasks,
      completedTasks,
      inProgressTasks,
      inReviewTasks,
      todoTasks,
      pendingTasks,
      overdueTasks,
      completionPercentage,
      tasksByStatus,
      tasksByPriority,
      memberWorkload,
      unassignedTasks,
      recentActivityTrend
    };

    return sendSuccess(res, analyticsData, 200);
  } catch (error) {
    console.error('Error fetching project analytics:', error);
    return sendError(res, 'Failed to fetch project analytics.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * GET /api/workspaces/:workspaceId/analytics
 * Retrieve workspace-level aggregate analytics.
 * Authorization: System ADMIN or project member/lead in this workspace.
 */
export const getWorkspaceAnalytics = async (
  req: Request<WorkspaceAnalyticsParam>,
  res: Response
) => {
  try {
    const { workspaceId } = req.params;
    const user = req.user!;
    const isAdmin = user.role === SystemRole.ADMIN;

    // Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true
      }
    });

    if (!workspace) {
      return sendError(res, 'Workspace not found.', 404, 'WORKSPACE_NOT_FOUND');
    }

    // Verify workspace membership authorization for non-admin users
    if (!isAdmin) {
      const hasAccess = await prisma.project.findFirst({
        where: {
          workspaceId,
          OR: [
            { leadId: user.id },
            { members: { some: { userId: user.id } } }
          ]
        },
        select: { id: true }
      });

      if (!hasAccess) {
        return sendError(
          res,
          'Access denied. You do not have access to projects in this workspace.',
          403,
          'FORBIDDEN_WORKSPACE_ACCESS'
        );
      }
    }

    // Filter projects accessible to user in this workspace
    const projectWhere: Prisma.ProjectWhereInput = isAdmin
      ? { workspaceId }
      : {
          workspaceId,
          OR: [
            { leadId: user.id },
            { members: { some: { userId: user.id } } }
          ]
        };

    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            dueDate: true,
            assigneeId: true,
            assignee: {
              select: USER_SELECT
            }
          }
        },
        lead: {
          select: USER_SELECT
        },
        members: {
          select: {
            role: true,
            user: {
              select: USER_SELECT
            }
          }
        }
      }
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status !== ProjectStatus.COMPLETED).length;
    const completedProjects = projects.filter((p) => p.status === ProjectStatus.COMPLETED).length;

    const projectsByStatus = {
      PLANNING: 0,
      IN_PROGRESS: 0,
      ON_HOLD: 0,
      COMPLETED: 0
    };

    for (const p of projects) {
      if (projectsByStatus[p.status] !== undefined) {
        projectsByStatus[p.status]++;
      }
    }

    // Aggregate tasks across all accessible projects
    const allTasks = projects.flatMap((p) => p.tasks);
    const totalTasks = allTasks.length;
    const now = new Date();

    const tasksByStatus = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0
    };

    const tasksByPriority = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0
    };

    let overdueTasks = 0;

    for (const t of allTasks) {
      if (tasksByStatus[t.status] !== undefined) {
        tasksByStatus[t.status]++;
      }
      if (tasksByPriority[t.priority] !== undefined) {
        tasksByPriority[t.priority]++;
      }
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE) {
        overdueTasks++;
      }
    }

    const completedTasks = tasksByStatus.DONE;
    const inProgressTasks = tasksByStatus.IN_PROGRESS;
    const inReviewTasks = tasksByStatus.IN_REVIEW;
    const todoTasks = tasksByStatus.TODO;
    const pendingTasks = totalTasks - completedTasks;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Project-wise statistics
    const projectStats = projects.map((p) => {
      const pTotal = p.tasks.length;
      const pCompleted = p.tasks.filter((t) => t.status === TaskStatus.DONE).length;
      const pPercentage = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        status: p.status,
        priority: p.priority,
        totalTasks: pTotal,
        completedTasks: pCompleted,
        pendingTasks: pTotal - pCompleted,
        completionPercentage: pPercentage
      };
    });

    // Team workload distribution across workspace
    const userMap = new Map<string, any>();
    for (const p of projects) {
      if (p.lead) userMap.set(p.lead.id, p.lead);
      for (const m of p.members) {
        if (m.user) userMap.set(m.user.id, m.user);
      }
    }
    for (const t of allTasks) {
      if (t.assignee) userMap.set(t.assignee.id, t.assignee);
    }

    const teamWorkload = Array.from(userMap.values()).map((user) => {
      const userTasks = allTasks.filter((t) => t.assigneeId === user.id);
      const userTotal = userTasks.length;
      const userCompleted = userTasks.filter((t) => t.status === TaskStatus.DONE).length;
      return {
        user,
        totalTasks: userTotal,
        completedTasks: userCompleted,
        activeTasks: userTotal - userCompleted
      };
    });

    // Recent activity trend across workspace projects
    const projectIds = projects.map((p) => p.id);
    const activities =
      projectIds.length > 0
        ? await prisma.activity.findMany({
            where: {
              OR: [
                { projectId: { in: projectIds } },
                { task: { projectId: { in: projectIds } } }
              ]
            },
            select: {
              createdAt: true,
              type: true
            },
            orderBy: { createdAt: 'desc' },
            take: 200
          })
        : [];

    const recentActivityTrend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = activities.filter(
        (a) => a.createdAt.toISOString().split('T')[0] === dateStr
      ).length;
      recentActivityTrend.push({ date: dateStr, count });
    }

    const workspaceAnalyticsData = {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      totalProjects,
      activeProjects,
      completedProjects,
      projectsByStatus,
      totalTasks,
      completedTasks,
      inProgressTasks,
      inReviewTasks,
      todoTasks,
      pendingTasks,
      overdueTasks,
      completionPercentage,
      tasksByStatus,
      tasksByPriority,
      projectStats,
      teamWorkload,
      recentActivityTrend
    };

    return sendSuccess(res, workspaceAnalyticsData, 200);
  } catch (error) {
    console.error('Error fetching workspace analytics:', error);
    return sendError(res, 'Failed to fetch workspace analytics.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

