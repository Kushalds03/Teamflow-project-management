import { Request, Response } from 'express';
import { ProjectRole, ProjectStatus, SystemRole, TaskPriority, ActivityType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { PROJECT_ROLE_LEVELS } from '../middleware/rbac.middleware';
import {
  CreateProjectInput,
  UpdateProjectInput,
  AddProjectMemberInput,
  ListProjectsQuery
} from '../validators/project.validator';

/**
 * GET /api/projects
 * List projects accessible to the authenticated user.
 * - System Admins can view all projects.
 * - Standard Users only see projects they lead or belong to as members.
 * - Supports optional query filtering by workspaceId, status, category, and search.
 */
export const listProjects = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { workspaceId, status, category, search } = (req.query || {}) as ListProjectsQuery;

    let where: any;

    if (user.role === SystemRole.ADMIN) {
      where = {
        ...(workspaceId ? { workspaceId } : {}),
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
              ]
            }
          : {})
      };
    } else {
      const accessFilter = {
        OR: [
          { leadId: user.id },
          { members: { some: { userId: user.id } } }
        ]
      };

      const andConditions: any[] = [accessFilter];
      if (workspaceId) andConditions.push({ workspaceId });
      if (status) andConditions.push({ status });
      if (category) andConditions.push({ category });
      if (search) {
        andConditions.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        });
      }

      where = { AND: andConditions };
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        lead: {
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                jobTitle: true,
                department: true,
                role: true
              }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      }
    });

    return sendSuccess(res, projects, 200);
  } catch (error) {
    console.error('Error listing projects:', error);
    return sendError(res, 'Failed to fetch projects.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * GET /api/projects/:id
 * Get detailed project information.
 * Project-level authorization is validated by requireProjectAccess(ProjectRole.VIEWER).
 */
export const getProjectById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id as string;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        lead: {
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                jobTitle: true,
                department: true,
                role: true
              }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      }
    });

    if (!project) {
      return sendError(res, 'Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    return sendSuccess(res, project, 200);
  } catch (error) {
    console.error('Error fetching project details:', error);
    return sendError(res, 'Failed to fetch project details.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * POST /api/projects
 * Create a new project.
 * - Validates target workspace exists.
 * - Defaults project lead to the authenticated user unless designated by an ADMIN.
 * - Adds lead to ProjectMember with LEAD role within a transaction.
 * - Logs project creation activity.
 */
export const createProject = async (
  req: Request<unknown, unknown, CreateProjectInput>,
  res: Response
) => {
  try {
    const user = req.user!;
    const {
      name,
      description,
      category,
      status,
      priority,
      dueDate,
      startDate,
      workspaceId,
      leadId
    } = req.body;

    // 1. Validate target workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      return sendError(res, 'Target workspace not found.', 404, 'WORKSPACE_NOT_FOUND');
    }

    // 2. Authorize project lead assignment
    let effectiveLeadId = user.id;

    if (leadId && leadId !== user.id) {
      if (user.role !== SystemRole.ADMIN) {
        return sendError(
          res,
          'Access denied. Only system administrators can designate another user as project lead upon creation.',
          403,
          'FORBIDDEN'
        );
      }
      effectiveLeadId = leadId;
    }

    // Verify lead user exists in database
    const leadUser = await prisma.user.findUnique({
      where: { id: effectiveLeadId }
    });

    if (!leadUser) {
      return sendError(res, 'Designated project lead user not found.', 404, 'USER_NOT_FOUND');
    }

    // 3. Create Project, Lead Membership, and Activity in a database transaction
    const createdProject = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name,
          description: description ?? null,
          category: category || 'General',
          status: status || ProjectStatus.IN_PROGRESS,
          priority: priority || TaskPriority.MEDIUM,
          dueDate: dueDate ? new Date(dueDate) : null,
          startDate: startDate ? new Date(startDate) : null,
          workspaceId,
          leadId: effectiveLeadId
        }
      });

      // Automatically register lead in ProjectMember table
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: effectiveLeadId,
          role: ProjectRole.LEAD
        }
      });

      // Log project creation activity
      await tx.activity.create({
        data: {
          type: ActivityType.PROJECT_CREATED,
          title: 'Project Created',
          description: `Project "${project.name}" was created.`,
          projectId: project.id,
          userId: user.id
        }
      });

      return tx.project.findUnique({
        where: { id: project.id },
        include: {
          lead: {
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
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  jobTitle: true,
                  department: true,
                  role: true
                }
              }
            }
          },
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              tasks: true,
              members: true
            }
          }
        }
      });
    });

    return sendSuccess(res, createdProject, 201);
  } catch (error) {
    console.error('Error creating project:', error);
    return sendError(res, 'Failed to create project.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * PUT /api/projects/:id
 * Update project details.
 * - Requires MAINTAINER or higher role.
 * - Changing leadId or moving workspace requires LEAD role or System ADMIN.
 * - When lead changes, upserts the new lead into ProjectMember as LEAD.
 */
export const updateProject = async (
  req: Request<{ id: string }, unknown, UpdateProjectInput>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const currentProject = req.project;
    const actingRole = req.projectRole;
    const systemRole = req.user!.role;

    const updateData: any = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;
    if (req.body.dueDate !== undefined) {
      updateData.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }
    if (req.body.startDate !== undefined) {
      updateData.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    }

    // 1. Moving project workspace
    if (req.body.workspaceId && req.body.workspaceId !== currentProject.workspaceId) {
      if (actingRole !== ProjectRole.LEAD && systemRole !== SystemRole.ADMIN) {
        return sendError(
          res,
          'Access denied. Only project leads or system administrators can move a project to another workspace.',
          403,
          'FORBIDDEN'
        );
      }

      const targetWorkspace = await prisma.workspace.findUnique({
        where: { id: req.body.workspaceId }
      });
      if (!targetWorkspace) {
        return sendError(res, 'Target workspace not found.', 404, 'WORKSPACE_NOT_FOUND');
      }
      updateData.workspaceId = req.body.workspaceId;
    }

    // 2. Reassigning project lead
    let isLeadChanged = false;
    const newLeadId = req.body.leadId;
    if (newLeadId && newLeadId !== currentProject.leadId) {
      if (actingRole !== ProjectRole.LEAD && systemRole !== SystemRole.ADMIN) {
        return sendError(
          res,
          'Access denied. Only project leads or system administrators can reassign project leadership.',
          403,
          'FORBIDDEN'
        );
      }

      const targetLead = await prisma.user.findUnique({
        where: { id: newLeadId }
      });
      if (!targetLead) {
        return sendError(res, 'Designated project lead user not found.', 404, 'USER_NOT_FOUND');
      }

      updateData.leadId = newLeadId;
      isLeadChanged = true;
    }

    // 3. Execute updates in a transaction
    const updatedProject = await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: updateData
      });

      if (isLeadChanged && newLeadId) {
        await tx.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: id,
              userId: newLeadId
            }
          },
          update: {
            role: ProjectRole.LEAD
          },
          create: {
            projectId: id,
            userId: newLeadId,
            role: ProjectRole.LEAD
          }
        });
      }

      return tx.project.findUnique({
        where: { id },
        include: {
          lead: {
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
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  jobTitle: true,
                  department: true,
                  role: true
                }
              }
            },
            orderBy: { joinedAt: 'asc' }
          },
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              tasks: true,
              members: true
            }
          }
        }
      });
    });

    return sendSuccess(res, updatedProject, 200);
  } catch (error) {
    console.error('Error updating project:', error);
    return sendError(res, 'Failed to update project.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * DELETE /api/projects/:id
 * Delete a project.
 * - Requires LEAD role or System ADMIN.
 * - Safely cleans up all related records in dependency order using a database transaction.
 */
export const deleteProject = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.$transaction(async (tx) => {
      // 1. Delete comments of tasks in this project
      const tasks = await tx.task.findMany({
        where: { projectId: id },
        select: { id: true }
      });
      const taskIds = tasks.map((t) => t.id);

      if (taskIds.length > 0) {
        await tx.comment.deleteMany({
          where: { taskId: { in: taskIds } }
        });
      }

      // 2. Delete tasks
      await tx.task.deleteMany({
        where: { projectId: id }
      });

      // 3. Delete activities
      await tx.activity.deleteMany({
        where: { projectId: id }
      });

      // 4. Delete project members
      await tx.projectMember.deleteMany({
        where: { projectId: id }
      });

      // 5. Delete project
      await tx.project.delete({
        where: { id }
      });
    });

    return sendSuccess(
      res,
      { message: 'Project deleted successfully.', projectId: id },
      200
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return sendError(res, 'Failed to delete project.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * POST /api/projects/:id/members
 * Add a member to a project.
 * - Requires MAINTAINER role or higher.
 * - Prevents role escalation (acting user cannot grant a role higher than their own).
 * - Verifies the invited user exists.
 * - Prevents duplicate project memberships.
 * - Records an activity log.
 */
export const addProjectMember = async (
  req: Request<{ id: string }, unknown, AddProjectMemberInput>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    const actingRole = req.projectRole || ProjectRole.VIEWER;
    const requestedRole = role || ProjectRole.CONTRIBUTOR;
    const systemRole = req.user!.role;

    // 1. Role escalation check
    if (systemRole !== SystemRole.ADMIN) {
      const actingLevel = PROJECT_ROLE_LEVELS[actingRole];
      const requestedLevel = PROJECT_ROLE_LEVELS[requestedRole];

      if (requestedLevel > actingLevel) {
        return sendError(
          res,
          `Access denied. You cannot assign a role (${requestedRole}) higher than your own project role (${actingRole}).`,
          403,
          'FORBIDDEN_ROLE_ESCALATION'
        );
      }
    }

    // 2. Validate target user exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToAdd) {
      return sendError(res, 'User not found.', 404, 'USER_NOT_FOUND');
    }

    // 3. Prevent duplicate memberships
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId
        }
      }
    });

    if (existingMember) {
      return sendError(
        res,
        'User is already a member of this project.',
        409,
        'MEMBER_ALREADY_EXISTS'
      );
    }

    // 4. Create membership and activity in transaction
    const newMember = await prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.create({
        data: {
          projectId: id,
          userId,
          role: requestedRole
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              jobTitle: true,
              department: true,
              role: true
            }
          }
        }
      });

      await tx.activity.create({
        data: {
          type: ActivityType.MEMBER_ASSIGNED,
          title: 'Member Added',
          description: `${userToAdd.name} was added to the project as ${requestedRole}.`,
          projectId: id,
          userId: req.user!.id
        }
      });

      return member;
    });

    return sendSuccess(res, newMember, 201);
  } catch (error) {
    console.error('Error adding project member:', error);
    return sendError(res, 'Failed to add project member.', 500, 'INTERNAL_SERVER_ERROR');
  }
};
