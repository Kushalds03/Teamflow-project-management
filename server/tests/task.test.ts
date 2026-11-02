import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { SystemRole, ProjectRole, ProjectStatus, TaskPriority, TaskStatus } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';
import { generateToken } from '../src/utils/token';

describe('Tasks REST API (/api/tasks & /api/projects/:projectId/tasks)', () => {
  const runId = Date.now().toString().slice(-6);

  // Test Workspaces
  const wsAId = `ws-ttest-a-${runId}`;
  const wsBId = `ws-ttest-b-${runId}`;

  // Test Projects
  const projAId = `proj-ttest-a-${runId}`;
  const projBId = `proj-ttest-b-${runId}`;

  // Test Users
  const adminId = `usr-ttest-admin-${runId}`;
  const leadId = `usr-ttest-lead-${runId}`;
  const maintId = `usr-ttest-maint-${runId}`;
  const contribId = `usr-ttest-contrib-${runId}`;
  const contrib2Id = `usr-ttest-contrib2-${runId}`;
  const viewerId = `usr-ttest-viewer-${runId}`;
  const outsiderId = `usr-ttest-outside-${runId}`;
  const nonMemberId = `usr-ttest-nonmem-${runId}`;

  // Pre-created Tasks
  const taskAId = `task-ttest-a-${runId}`;
  const taskBId = `task-ttest-b-${runId}`;
  const taskSelfCreatedId = `task-ttest-self-${runId}`;
  const taskDelMaintId = `task-ttest-del-maint-${runId}`;
  const taskDelLeadId = `task-ttest-del-lead-${runId}`;
  const taskDelAdminId = `task-ttest-del-admin-${runId}`;

  // Dynamically created task IDs for tracking cleanup
  const createdTaskIds: string[] = [];

  // JWT Tokens
  let adminToken = '';
  let leadToken = '';
  let maintToken = '';
  let contribToken = '';
  let contrib2Token = '';
  let viewerToken = '';
  let outsiderToken = '';
  let nonMemberToken = '';

  beforeAll(async () => {
    // 1. Create Workspaces
    await prisma.workspace.createMany({
      data: [
        { id: wsAId, name: `Tasks Workspace A ${runId}`, slug: `tasks-ws-a-${runId}` },
        { id: wsBId, name: `Tasks Workspace B ${runId}`, slug: `tasks-ws-b-${runId}` }
      ]
    });

    // 2. Create Users
    await prisma.user.createMany({
      data: [
        { id: adminId, email: `admin.${runId}@ttest.io`, name: 'Admin User', role: SystemRole.ADMIN },
        { id: leadId, email: `lead.${runId}@ttest.io`, name: 'Lead User', role: SystemRole.USER },
        { id: maintId, email: `maint.${runId}@ttest.io`, name: 'Maintainer User', role: SystemRole.USER },
        { id: contribId, email: `contrib.${runId}@ttest.io`, name: 'Contributor User', role: SystemRole.USER },
        { id: contrib2Id, email: `contrib2.${runId}@ttest.io`, name: 'Contributor 2 User', role: SystemRole.USER },
        { id: viewerId, email: `viewer.${runId}@ttest.io`, name: 'Viewer User', role: SystemRole.USER },
        { id: outsiderId, email: `outside.${runId}@ttest.io`, name: 'Outsider User', role: SystemRole.USER },
        { id: nonMemberId, email: `nonmem.${runId}@ttest.io`, name: 'Non Member User', role: SystemRole.USER }
      ]
    });

    // 3. Create Project Alpha in Workspace A
    await prisma.project.create({
      data: {
        id: projAId,
        name: `Project Alpha ${runId}`,
        description: 'Main project for task integration tests',
        workspaceId: wsAId,
        leadId: leadId
      }
    });

    await prisma.projectMember.createMany({
      data: [
        { projectId: projAId, userId: leadId, role: ProjectRole.LEAD },
        { projectId: projAId, userId: maintId, role: ProjectRole.MAINTAINER },
        { projectId: projAId, userId: contribId, role: ProjectRole.CONTRIBUTOR },
        { projectId: projAId, userId: contrib2Id, role: ProjectRole.CONTRIBUTOR },
        { projectId: projAId, userId: viewerId, role: ProjectRole.VIEWER }
      ]
    });

    // 4. Create Project Beta in Workspace B (Isolated project owned by outsider)
    await prisma.project.create({
      data: {
        id: projBId,
        name: `Project Beta ${runId}`,
        description: 'Isolated beta project',
        workspaceId: wsBId,
        leadId: outsiderId
      }
    });

    await prisma.projectMember.create({
      data: {
        projectId: projBId,
        userId: outsiderId,
        role: ProjectRole.LEAD
      }
    });

    // 5. Pre-create Tasks for Testing
    await prisma.task.create({
      data: {
        id: taskAId,
        title: 'Initial Alpha Task',
        description: 'Detailed description for task A',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2026-12-15T00:00:00.000Z'),
        estimatedHours: 8,
        tags: ['backend', 'api'],
        projectId: projAId,
        creatorId: leadId,
        assigneeId: contribId
      }
    });

    await prisma.task.create({
      data: {
        id: taskBId,
        title: 'Initial Beta Task',
        description: 'Task belonging strictly to Project Beta',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.LOW,
        projectId: projBId,
        creatorId: outsiderId,
        assigneeId: outsiderId
      }
    });

    // Task created by Contributor (for testing creator self-deletion)
    await prisma.task.create({
      data: {
        id: taskSelfCreatedId,
        title: 'Self Created Task by Contributor',
        description: 'Task for testing contributor self-deletion permissions',
        projectId: projAId,
        creatorId: contribId
      }
    });

    // Tasks for testing deletion by Maintainer, Lead, Admin
    await prisma.task.createMany({
      data: [
        {
          id: taskDelMaintId,
          title: 'Task To Delete by Maintainer',
          projectId: projAId,
          creatorId: leadId
        },
        {
          id: taskDelLeadId,
          title: 'Task To Delete by Lead',
          projectId: projAId,
          creatorId: maintId
        },
        {
          id: taskDelAdminId,
          title: 'Task To Delete by Admin',
          projectId: projAId,
          creatorId: leadId
        }
      ]
    });

    // 6. Generate JWT auth tokens
    adminToken = generateToken({ id: adminId, email: `admin.${runId}@ttest.io`, role: SystemRole.ADMIN });
    leadToken = generateToken({ id: leadId, email: `lead.${runId}@ttest.io`, role: SystemRole.USER });
    maintToken = generateToken({ id: maintId, email: `maint.${runId}@ttest.io`, role: SystemRole.USER });
    contribToken = generateToken({ id: contribId, email: `contrib.${runId}@ttest.io`, role: SystemRole.USER });
    contrib2Token = generateToken({ id: contrib2Id, email: `contrib2.${runId}@ttest.io`, role: SystemRole.USER });
    viewerToken = generateToken({ id: viewerId, email: `viewer.${runId}@ttest.io`, role: SystemRole.USER });
    outsiderToken = generateToken({ id: outsiderId, email: `outside.${runId}@ttest.io`, role: SystemRole.USER });
    nonMemberToken = generateToken({ id: nonMemberId, email: `nonmem.${runId}@ttest.io`, role: SystemRole.USER });
  });

  afterAll(async () => {
    const allProjIds = [projAId, projBId];
    const allUserIds = [
      adminId,
      leadId,
      maintId,
      contribId,
      contrib2Id,
      viewerId,
      outsiderId,
      nonMemberId
    ];
    const allPrecreatedTaskIds = [
      taskAId,
      taskBId,
      taskSelfCreatedId,
      taskDelMaintId,
      taskDelLeadId,
      taskDelAdminId,
      ...createdTaskIds
    ];

    // Clean up in strict foreign key order
    await prisma.comment.deleteMany({
      where: {
        OR: [
          { taskId: { in: allPrecreatedTaskIds } },
          { authorId: { in: allUserIds } }
        ]
      }
    });

    await prisma.activity.deleteMany({
      where: {
        OR: [
          { taskId: { in: allPrecreatedTaskIds } },
          { projectId: { in: allProjIds } },
          { userId: { in: allUserIds } }
        ]
      }
    });

    await prisma.task.deleteMany({
      where: {
        OR: [
          { id: { in: allPrecreatedTaskIds } },
          { projectId: { in: allProjIds } }
        ]
      }
    });

    await prisma.projectMember.deleteMany({
      where: {
        OR: [
          { projectId: { in: allProjIds } },
          { userId: { in: allUserIds } }
        ]
      }
    });

    await prisma.project.deleteMany({ where: { id: { in: allProjIds } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsAId, wsBId] } } });
    await prisma.user.deleteMany({ where: { id: { in: allUserIds } } });

    await prisma.$disconnect();
  });

  // ==========================================
  // 1. Authentication Enforcement
  // ==========================================
  describe('Authentication Enforcement', () => {
    it('should reject unauthenticated GET /api/tasks with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated GET /api/tasks/:id with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get(`/api/tasks/${taskAId}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated POST /api/projects/:projectId/tasks with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .send({ title: 'Unauthorized Task' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated PUT /api/tasks/:id with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .send({ title: 'Unauthorized Update' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated PATCH /api/tasks/:id/status with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/status`)
        .send({ status: TaskStatus.IN_PROGRESS });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated PATCH /api/tasks/:id/assignee with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/assignee`)
        .send({ assigneeId: contribId });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated DELETE /api/tasks/:id with 401 UNAUTHORIZED', async () => {
      const res = await request(app).delete(`/api/tasks/${taskAId}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ==========================================
  // 2. Task Creation (POST /api/projects/:projectId/tasks)
  // ==========================================
  describe('Task Creation (POST /api/projects/:projectId/tasks)', () => {
    it('should successfully create a task with required fields by CONTRIBUTOR', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ title: 'New Contributor Task' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('New Contributor Task');
      expect(res.body.data.status).toBe(TaskStatus.TODO);
      expect(res.body.data.priority).toBe(TaskPriority.MEDIUM);
      expect(res.body.data.creator.id).toBe(contribId);
      expect(res.body.data.projectId).toBe(projAId);

      createdTaskIds.push(res.body.data.id);
    });

    it('should successfully create a task with all optional fields and assignee', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({
          title: 'Comprehensive Task',
          description: 'Full feature description with all attributes',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          dueDate: '2026-11-30T18:00:00.000Z',
          estimatedHours: 12.5,
          tags: ['frontend', 'ux', 'critical'],
          assigneeId: contrib2Id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Comprehensive Task');
      expect(res.body.data.description).toBe('Full feature description with all attributes');
      expect(res.body.data.status).toBe(TaskStatus.IN_PROGRESS);
      expect(res.body.data.priority).toBe(TaskPriority.HIGH);
      expect(res.body.data.estimatedHours).toBe(12.5);
      expect(res.body.data.tags).toEqual(['frontend', 'ux', 'critical']);
      expect(res.body.data.assignee.id).toBe(contrib2Id);
      expect(res.body.data.creator.id).toBe(leadId);

      createdTaskIds.push(res.body.data.id);
    });

    it('should automatically set creatorId to authenticated user, ignoring client-supplied creatorId', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({
          title: 'Tamper Attempt Task',
          creatorId: adminId // Attempt to spoof creator as admin
        });

      expect(res.status).toBe(201);
      expect(res.body.data.creator.id).toBe(contribId); // Must remain contribId
      expect(res.body.data.creator.id).not.toBe(adminId);

      createdTaskIds.push(res.body.data.id);
    });

    it('should record ActivityType.TASK_CREATED activity upon creation', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${maintToken}`)
        .send({ title: 'Activity Logging Task' });

      expect(res.status).toBe(201);
      const taskId = res.body.data.id;
      createdTaskIds.push(taskId);

      const activity = await prisma.activity.findFirst({
        where: { taskId, type: 'TASK_CREATED' }
      });
      expect(activity).not.toBeNull();
      expect(activity?.userId).toBe(maintId);
      expect(activity?.projectId).toBe(projAId);
    });

    it('should strictly reject VIEWER from creating tasks with 403 VIEWER_READ_ONLY', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Viewer Attempt Task' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should reject outsider non-member from creating tasks in Project Alpha with 403 FORBIDDEN_PROJECT_ACCESS', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ title: 'Outsider Cross-Project Task' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_PROJECT_ACCESS');
    });

    it('should return 404 PROJECT_NOT_FOUND when creating task in nonexistent project', async () => {
      const res = await request(app)
        .post('/api/projects/proj-nonexistent-123/tasks')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ title: 'Ghost Project Task' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should reject task creation with empty title with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject task creation with invalid priority with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ title: 'Invalid Priority Task', priority: 'SUPER_URGENT' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject task creation with invalid status with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ title: 'Invalid Status Task', status: 'ARCHIVED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject task creation with malformed dueDate with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ title: 'Bad Date Task', dueDate: 'not-a-valid-date' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject task creation with negative estimatedHours with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ title: 'Negative Hours Task', estimatedHours: -5 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject malformed projectId parameter with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/projects/invalid--projectId!!$$/tasks')
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ title: 'Malformed Param Task' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 USER_NOT_FOUND when assigning to nonexistent user', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ title: 'Ghost Assignee Task', assigneeId: 'usr-nonexistent-999' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 400 ASSIGNEE_NOT_PROJECT_MEMBER when assigning to user not in project', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ title: 'Cross Project Assignee Task', assigneeId: outsiderId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ASSIGNEE_NOT_PROJECT_MEMBER');
    });
  });

  // ==========================================
  // 3. Task Listing & Query Filtering (GET /api/tasks)
  // ==========================================
  describe('Task Listing & Query Filtering (GET /api/tasks)', () => {
    it('should list tasks accessible to the authenticated member', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);

      // Verify all tasks returned belong to Project Alpha
      res.body.data.forEach((task: any) => {
        expect(task.projectId).toBe(projAId);
        expect(task.project).toBeDefined();
        expect(task.creator).toBeDefined();
      });
    });

    it('should isolate outsider from accessing Project Alpha tasks in listing', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Outsider should only see Project Beta tasks, never Project Alpha tasks
      res.body.data.forEach((task: any) => {
        expect(task.projectId).toBe(projBId);
      });
    });

    it('should allow System ADMIN to list all tasks across workspaces', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const projectIds = res.body.data.map((t: any) => t.projectId);
      expect(projectIds).toContain(projAId);
      expect(projectIds).toContain(projBId);
    });

    it('should filter tasks by projectId query parameter', async () => {
      const res = await request(app)
        .get(`/api/tasks?projectId=${projAId}`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((t: any) => t.projectId === projAId)).toBe(true);
    });

    it('should return 403 FORBIDDEN_PROJECT_ACCESS when standard user filters by unauthorized projectId', async () => {
      const res = await request(app)
        .get(`/api/tasks?projectId=${projBId}`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_PROJECT_ACCESS');
    });

    it('should return 404 PROJECT_NOT_FOUND when filtering by nonexistent projectId', async () => {
      const res = await request(app)
        .get('/api/tasks?projectId=proj-fake-999')
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should filter tasks by status query parameter', async () => {
      const res = await request(app)
        .get(`/api/tasks?projectId=${projAId}&status=${TaskStatus.TODO}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every((t: any) => t.status === TaskStatus.TODO)).toBe(true);
    });

    it('should filter tasks by priority query parameter', async () => {
      const res = await request(app)
        .get(`/api/tasks?projectId=${projAId}&priority=${TaskPriority.HIGH}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every((t: any) => t.priority === TaskPriority.HIGH)).toBe(true);
    });

    it('should filter tasks by assigneeId query parameter', async () => {
      const res = await request(app)
        .get(`/api/tasks?projectId=${projAId}&assigneeId=${contribId}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every((t: any) => t.assigneeId === contribId)).toBe(true);
    });

    it('should search tasks by title or description query parameter', async () => {
      const res = await request(app)
        .get(`/api/tasks?projectId=${projAId}&search=Initial`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toContain('Initial');
    });

    it('should filter tasks by dueDate query parameter', async () => {
      const res = await request(app)
        .get(`/api/tasks?projectId=${projAId}&dueDate=2026-12-15`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(new Date(res.body.data[0].dueDate).toISOString().slice(0, 10)).toBe('2026-12-15');
    });

    it('should support pagination (page and limit)', async () => {
      const res = await request(app)
        .get(`/api/tasks?projectId=${projAId}&page=1&limit=2`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(2);
      expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should reject invalid status query parameter with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/tasks?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject malformed page/limit query parameters with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/tasks?page=zero&limit=-5')
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject malformed projectId query parameter with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/tasks?projectId=bad%20id!@#')
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 4. Task Details (GET /api/tasks/:id)
  // ==========================================
  describe('Task Details (GET /api/tasks/:id)', () => {
    it('should return full task details for member of the project', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(taskAId);
      expect(res.body.data.title).toBe('Initial Alpha Task');
      expect(res.body.data.project).toBeDefined();
      expect(res.body.data.project.id).toBe(projAId);
      expect(res.body.data.assignee).toBeDefined();
      expect(res.body.data.assignee.id).toBe(contribId);
      expect(res.body.data.creator).toBeDefined();
      expect(res.body.data.creator.id).toBe(leadId);
    });

    it('should allow VIEWER member to read task details', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(taskAId);
    });

    it('should allow System ADMIN to view any task details across workspaces', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskBId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(taskBId);
    });

    it('should reject cross-project task access from outsider with 403 FORBIDDEN_TASK_ACCESS', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_TASK_ACCESS');
    });

    it('should return 404 TASK_NOT_FOUND for nonexistent task ID', async () => {
      const res = await request(app)
        .get('/api/tasks/task-nonexistent-123')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });

    it('should return 400 VALIDATION_ERROR for malformed task ID', async () => {
      const res = await request(app)
        .get('/api/tasks/invalid%20id!@#')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 5. Task Updates (PUT /api/tasks/:id)
  // ==========================================
  describe('Task Updates (PUT /api/tasks/:id)', () => {
    it('should allow CONTRIBUTOR to update task details', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({
          title: 'Updated Alpha Task Title',
          description: 'Updated description from contributor',
          priority: TaskPriority.MEDIUM,
          tags: ['backend', 'v2']
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Alpha Task Title');
      expect(res.body.data.description).toBe('Updated description from contributor');
      expect(res.body.data.priority).toBe(TaskPriority.MEDIUM);
      expect(res.body.data.tags).toEqual(['backend', 'v2']);
    });

    it('should allow MAINTAINER to update task details', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${maintToken}`)
        .send({
          estimatedHours: 16
        });

      expect(res.status).toBe(200);
      expect(res.body.data.estimatedHours).toBe(16);
    });

    it('should allow project LEAD to update task details', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({
          priority: TaskPriority.HIGH
        });

      expect(res.status).toBe(200);
      expect(res.body.data.priority).toBe(TaskPriority.HIGH);
    });

    it('should reject VIEWER from modifying task with 403 VIEWER_READ_ONLY', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Viewer Illegal Update' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should reject outsider non-member from modifying task with 403 FORBIDDEN_TASK_ACCESS', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ title: 'Outsider Illegal Update' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_TASK_ACCESS');
    });

    it('should reject empty update body with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject update with invalid priority with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ priority: 'INVALID_PRIORITY' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 USER_NOT_FOUND when updating assignee to nonexistent user', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ assigneeId: 'usr-nonexistent-999' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 400 ASSIGNEE_NOT_PROJECT_MEMBER when updating assignee to user not in project', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ assigneeId: outsiderId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ASSIGNEE_NOT_PROJECT_MEMBER');
    });

    it('should allow updating assignee to null (unassigning task)', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ assigneeId: null });

      expect(res.status).toBe(200);
      expect(res.body.data.assigneeId).toBeNull();
      expect(res.body.data.assignee).toBeNull();
    });

    it('should return 404 TASK_NOT_FOUND when updating nonexistent task', async () => {
      const res = await request(app)
        .put('/api/tasks/task-nonexistent-123')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ title: 'Updating Ghost' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });

    it('should return 400 VALIDATION_ERROR for malformed task ID in update', async () => {
      const res = await request(app)
        .put('/api/tasks/invalid%20id!@#')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ title: 'Bad Param' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 6. Task Status Updates (PATCH /api/tasks/:id/status)
  // ==========================================
  describe('Task Status Updates (PATCH /api/tasks/:id/status)', () => {
    it('should allow CONTRIBUTOR to update status to IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/status`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ status: TaskStatus.IN_PROGRESS });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(TaskStatus.IN_PROGRESS);

      const activity = await prisma.activity.findFirst({
        where: { taskId: taskAId, type: 'TASK_STATUS_CHANGED' }
      });
      expect(activity).not.toBeNull();
    });

    it('should allow updating status to DONE and log TASK_COMPLETED activity', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/status`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ status: TaskStatus.DONE });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TaskStatus.DONE);

      const activity = await prisma.activity.findFirst({
        where: { taskId: taskAId, type: 'TASK_COMPLETED' }
      });
      expect(activity).not.toBeNull();
      expect(activity?.description).toContain('marked as completed');
    });

    it('should reject VIEWER from updating status with 403 VIEWER_READ_ONLY', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/status`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ status: TaskStatus.IN_REVIEW });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should reject outsider non-member from updating status with 403 FORBIDDEN_TASK_ACCESS', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/status`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ status: TaskStatus.DONE });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_TASK_ACCESS');
    });

    it('should reject invalid status enum with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/status`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ status: 'COMPLETED_SOON' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 TASK_NOT_FOUND when updating status of nonexistent task', async () => {
      const res = await request(app)
        .patch('/api/tasks/task-nonexistent-123/status')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ status: TaskStatus.DONE });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });

    it('should return 400 VALIDATION_ERROR for malformed task ID in status update', async () => {
      const res = await request(app)
        .patch('/api/tasks/bad--task--id!!/status')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ status: TaskStatus.DONE });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 7. Task Assignment & Reassignment (PATCH /api/tasks/:id/assignee)
  // ==========================================
  describe('Task Assignment & Reassignment (PATCH /api/tasks/:id/assignee)', () => {
    it('should allow CONTRIBUTOR to reassign task to another valid project member', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/assignee`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ assigneeId: contrib2Id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assigneeId).toBe(contrib2Id);
      expect(res.body.data.assignee.id).toBe(contrib2Id);

      const activity = await prisma.activity.findFirst({
        where: { taskId: taskAId, type: 'MEMBER_ASSIGNED' }
      });
      expect(activity).not.toBeNull();
      expect(activity?.description).toContain('was assigned to');
    });

    it('should allow unassigning task by setting assigneeId to null', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/assignee`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ assigneeId: null });

      expect(res.status).toBe(200);
      expect(res.body.data.assigneeId).toBeNull();
      expect(res.body.data.assignee).toBeNull();
    });

    it('should reject VIEWER from assigning task with 403 VIEWER_READ_ONLY', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/assignee`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ assigneeId: contribId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should reject outsider non-member from assigning task with 403 FORBIDDEN_TASK_ACCESS', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/assignee`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ assigneeId: contribId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_TASK_ACCESS');
    });

    it('should return 404 USER_NOT_FOUND when assigning to nonexistent user', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/assignee`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ assigneeId: 'usr-nonexistent-123' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 400 ASSIGNEE_NOT_PROJECT_MEMBER when assigning to user not belonging to project', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/assignee`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ assigneeId: outsiderId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ASSIGNEE_NOT_PROJECT_MEMBER');
    });

    it('should return 400 VALIDATION_ERROR for missing or malformed assigneeId in body', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskAId}/assignee`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ assigneeId: 'bad!id@#' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 TASK_NOT_FOUND when assigning nonexistent task', async () => {
      const res = await request(app)
        .patch('/api/tasks/task-nonexistent-123/assignee')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ assigneeId: contribId });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });

    it('should return 400 VALIDATION_ERROR for malformed task ID in assignee update', async () => {
      const res = await request(app)
        .patch('/api/tasks/bad--task--id!!/assignee')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ assigneeId: contribId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 8. Task Deletion (DELETE /api/tasks/:id)
  // ==========================================
  describe('Task Deletion (DELETE /api/tasks/:id)', () => {
    it('should reject VIEWER from deleting task with 403 VIEWER_READ_ONLY', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should reject outsider non-member from deleting task with 403 FORBIDDEN_TASK_ACCESS', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_TASK_ACCESS');
    });

    it('should reject CONTRIBUTOR from deleting a task created by another user with 403 INSUFFICIENT_PROJECT_ROLE', async () => {
      // taskAId was created by leadId, contribUser is not creator, not maintainer
      const res = await request(app)
        .delete(`/api/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PROJECT_ROLE');
    });

    it('should allow CONTRIBUTOR to delete a task they created themselves', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskSelfCreatedId}`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.taskId).toBe(taskSelfCreatedId);

      const deleted = await prisma.task.findUnique({ where: { id: taskSelfCreatedId } });
      expect(deleted).toBeNull();
    });

    it('should allow MAINTAINER to delete any task in the project', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskDelMaintId}`)
        .set('Authorization', `Bearer ${maintToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.taskId).toBe(taskDelMaintId);

      const deleted = await prisma.task.findUnique({ where: { id: taskDelMaintId } });
      expect(deleted).toBeNull();
    });

    it('should allow project LEAD to delete any task in the project', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskDelLeadId}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.taskId).toBe(taskDelLeadId);

      const deleted = await prisma.task.findUnique({ where: { id: taskDelLeadId } });
      expect(deleted).toBeNull();
    });

    it('should allow System ADMIN to delete any task across workspaces', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskDelAdminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.taskId).toBe(taskDelAdminId);

      const deleted = await prisma.task.findUnique({ where: { id: taskDelAdminId } });
      expect(deleted).toBeNull();
    });

    it('should return 404 TASK_NOT_FOUND when deleting nonexistent task', async () => {
      const res = await request(app)
        .delete('/api/tasks/task-nonexistent-123')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });

    it('should return 400 VALIDATION_ERROR for malformed task ID in deletion', async () => {
      const res = await request(app)
        .delete('/api/tasks/bad%20id!@#')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
