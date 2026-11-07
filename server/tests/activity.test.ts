import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { SystemRole, ProjectRole, ActivityType } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';
import { generateToken } from '../src/utils/token';

describe('Activity Feed REST API (/api/projects/:projectId/activities & /api/tasks/:taskId/activities)', () => {
  const runId = Date.now().toString().slice(-6);

  // Test Workspaces
  const wsAId = `ws-act-a-${runId}`;
  const wsBId = `ws-act-b-${runId}`;

  // Test Projects
  const projAId = `proj-act-a-${runId}`;
  const projBId = `proj-act-b-${runId}`;

  // Test Users
  const adminId = `usr-act-admin-${runId}`;
  const leadId = `usr-act-lead-${runId}`;
  const maintId = `usr-act-maint-${runId}`;
  const contribId = `usr-act-contrib-${runId}`;
  const viewerId = `usr-act-viewer-${runId}`;
  const outsiderId = `usr-act-outside-${runId}`;

  // Test Tasks
  const taskA1Id = `task-act-a1-${runId}`;
  const taskA2Id = `task-act-a2-${runId}`;
  const taskBId = `task-act-b-${runId}`;

  // Test Activity IDs
  const act1ProjCreatedId = `act-1-${runId}`;
  const act2MemberAddedId = `act-2-${runId}`;
  const act3TaskA1CreatedId = `act-3-${runId}`;
  const act4CommentA1Id = `act-4-${runId}`;
  const act5TaskA2CreatedId = `act-5-${runId}`;
  const act6TaskA1CompletedId = `act-6-${runId}`;
  const actBProjCreatedId = `act-b-proj-${runId}`;
  const actBTaskCreatedId = `act-b-task-${runId}`;

  const allActivityIds = [
    act1ProjCreatedId,
    act2MemberAddedId,
    act3TaskA1CreatedId,
    act4CommentA1Id,
    act5TaskA2CreatedId,
    act6TaskA1CompletedId,
    actBProjCreatedId,
    actBTaskCreatedId
  ];

  // JWT Tokens
  let adminToken = '';
  let leadToken = '';
  let maintToken = '';
  let contribToken = '';
  let viewerToken = '';
  let outsiderToken = '';

  beforeAll(async () => {
    // 1. Create Workspaces
    await prisma.workspace.createMany({
      data: [
        { id: wsAId, name: `Activity WS A ${runId}`, slug: `act-ws-a-${runId}` },
        { id: wsBId, name: `Activity WS B ${runId}`, slug: `act-ws-b-${runId}` }
      ]
    });

    // 2. Create Users
    await prisma.user.createMany({
      data: [
        { id: adminId, email: `admin.${runId}@acttest.io`, name: 'Admin User', role: SystemRole.ADMIN, passwordHash: 'secret-hash' },
        { id: leadId, email: `lead.${runId}@acttest.io`, name: 'Lead User', role: SystemRole.USER, passwordHash: 'secret-hash' },
        { id: maintId, email: `maint.${runId}@acttest.io`, name: 'Maintainer User', role: SystemRole.USER, passwordHash: 'secret-hash' },
        { id: contribId, email: `contrib.${runId}@acttest.io`, name: 'Contributor User', role: SystemRole.USER, passwordHash: 'secret-hash' },
        { id: viewerId, email: `viewer.${runId}@acttest.io`, name: 'Viewer User', role: SystemRole.USER, passwordHash: 'secret-hash' },
        { id: outsiderId, email: `outside.${runId}@acttest.io`, name: 'Outsider User', role: SystemRole.USER, passwordHash: 'secret-hash' }
      ]
    });

    // 3. Create Project Alpha in WS A
    await prisma.project.create({
      data: {
        id: projAId,
        name: `Project Alpha ${runId}`,
        workspaceId: wsAId,
        leadId: leadId
      }
    });

    await prisma.projectMember.createMany({
      data: [
        { projectId: projAId, userId: leadId, role: ProjectRole.LEAD },
        { projectId: projAId, userId: maintId, role: ProjectRole.MAINTAINER },
        { projectId: projAId, userId: contribId, role: ProjectRole.CONTRIBUTOR },
        { projectId: projAId, userId: viewerId, role: ProjectRole.VIEWER }
      ]
    });

    // 4. Create Project Beta in WS B
    await prisma.project.create({
      data: {
        id: projBId,
        name: `Project Beta ${runId}`,
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

    // 5. Create Tasks
    await prisma.task.createMany({
      data: [
        {
          id: taskA1Id,
          title: 'Task A1 Critical Bug',
          projectId: projAId,
          creatorId: leadId
        },
        {
          id: taskA2Id,
          title: 'Task A2 Feature Request',
          projectId: projAId,
          creatorId: maintId
        },
        {
          id: taskBId,
          title: 'Task Beta Private',
          projectId: projBId,
          creatorId: outsiderId
        }
      ]
    });

    // 6. Create Seed Activities with distinct timestamps
    // Act 1: Project created (Oldest: 2026-05-01T10:00:00Z)
    await prisma.activity.create({
      data: {
        id: act1ProjCreatedId,
        type: ActivityType.PROJECT_CREATED,
        title: 'Project Alpha Created',
        description: 'Project Alpha was initialized.',
        projectId: projAId,
        userId: leadId,
        createdAt: new Date('2026-05-01T10:00:00Z')
      }
    });

    // Act 2: Member assigned (2026-05-02T10:00:00Z)
    await prisma.activity.create({
      data: {
        id: act2MemberAddedId,
        type: ActivityType.MEMBER_ASSIGNED,
        title: 'Member Added',
        description: 'Maintainer User was added to the project.',
        projectId: projAId,
        userId: leadId,
        createdAt: new Date('2026-05-02T10:00:00Z')
      }
    });

    // Act 3: Task A1 created (2026-05-03T10:00:00Z)
    await prisma.activity.create({
      data: {
        id: act3TaskA1CreatedId,
        type: ActivityType.TASK_CREATED,
        title: 'Task A1 Created',
        description: 'Task A1 was created.',
        projectId: projAId,
        taskId: taskA1Id,
        userId: contribId,
        createdAt: new Date('2026-05-03T10:00:00Z')
      }
    });

    // Act 4: Comment added on Task A1 (2026-05-04T10:00:00Z)
    await prisma.activity.create({
      data: {
        id: act4CommentA1Id,
        type: ActivityType.COMMENT_ADDED,
        title: 'Comment on Task A1',
        description: 'Maintainer commented on Task A1.',
        projectId: projAId,
        taskId: taskA1Id,
        userId: maintId,
        createdAt: new Date('2026-05-04T10:00:00Z')
      }
    });

    // Act 5: Task A2 created (2026-05-05T10:00:00Z)
    await prisma.activity.create({
      data: {
        id: act5TaskA2CreatedId,
        type: ActivityType.TASK_CREATED,
        title: 'Task A2 Created',
        description: 'Task A2 was created.',
        projectId: projAId,
        taskId: taskA2Id,
        userId: contribId,
        createdAt: new Date('2026-05-05T10:00:00Z')
      }
    });

    // Act 6: Task A1 completed (Newest: 2026-05-06T10:00:00Z)
    await prisma.activity.create({
      data: {
        id: act6TaskA1CompletedId,
        type: ActivityType.TASK_COMPLETED,
        title: 'Task A1 Completed',
        description: 'Task A1 was marked completed.',
        projectId: projAId,
        taskId: taskA1Id,
        userId: contribId,
        createdAt: new Date('2026-05-06T10:00:00Z')
      }
    });

    // Project B Activities
    await prisma.activity.create({
      data: {
        id: actBProjCreatedId,
        type: ActivityType.PROJECT_CREATED,
        title: 'Project Beta Created',
        description: 'Project Beta was initialized.',
        projectId: projBId,
        userId: outsiderId,
        createdAt: new Date('2026-05-06T12:00:00Z')
      }
    });

    await prisma.activity.create({
      data: {
        id: actBTaskCreatedId,
        type: ActivityType.TASK_CREATED,
        title: 'Task Beta Created',
        description: 'Task Beta was created.',
        projectId: projBId,
        taskId: taskBId,
        userId: outsiderId,
        createdAt: new Date('2026-05-06T13:00:00Z')
      }
    });

    // 7. Generate JWT Tokens
    adminToken = generateToken({ id: adminId, email: `admin.${runId}@acttest.io`, role: SystemRole.ADMIN });
    leadToken = generateToken({ id: leadId, email: `lead.${runId}@acttest.io`, role: SystemRole.USER });
    maintToken = generateToken({ id: maintId, email: `maint.${runId}@acttest.io`, role: SystemRole.USER });
    contribToken = generateToken({ id: contribId, email: `contrib.${runId}@acttest.io`, role: SystemRole.USER });
    viewerToken = generateToken({ id: viewerId, email: `viewer.${runId}@acttest.io`, role: SystemRole.USER });
    outsiderToken = generateToken({ id: outsiderId, email: `outside.${runId}@acttest.io`, role: SystemRole.USER });
  });

  afterAll(async () => {
    const allProjIds = [projAId, projBId];
    const allUserIds = [adminId, leadId, maintId, contribId, viewerId, outsiderId];
    const allTaskIds = [taskA1Id, taskA2Id, taskBId];

    // Cleanup activities
    await prisma.activity.deleteMany({
      where: {
        OR: [
          { id: { in: allActivityIds } },
          { taskId: { in: allTaskIds } },
          { projectId: { in: allProjIds } },
          { userId: { in: allUserIds } }
        ]
      }
    });

    // Cleanup tasks
    await prisma.task.deleteMany({
      where: {
        OR: [
          { id: { in: allTaskIds } },
          { projectId: { in: allProjIds } }
        ]
      }
    });

    // Cleanup project members
    await prisma.projectMember.deleteMany({
      where: {
        OR: [
          { projectId: { in: allProjIds } },
          { userId: { in: allUserIds } }
        ]
      }
    });

    // Cleanup projects
    await prisma.project.deleteMany({
      where: { id: { in: allProjIds } }
    });

    // Cleanup workspaces
    await prisma.workspace.deleteMany({
      where: { id: { in: [wsAId, wsBId] } }
    });

    // Cleanup users
    await prisma.user.deleteMany({
      where: { id: { in: allUserIds } }
    });
  });

  // =========================================================================
  // 1. PROJECT ACTIVITY FEED (GET /api/projects/:projectId/activities)
  // =========================================================================
  describe('GET /api/projects/:projectId/activities', () => {
    it('should list all activities for a project including task-level activities', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(6);
      expect(res.body.meta.total).toBe(6);

      // Verify both project-level and task-level activities are included
      const titles = res.body.data.map((a: any) => a.title);
      expect(titles).toContain('Project Alpha Created');
      expect(titles).toContain('Member Added');
      expect(titles).toContain('Task A1 Created');
      expect(titles).toContain('Comment on Task A1');
      expect(titles).toContain('Task A2 Created');
      expect(titles).toContain('Task A1 Completed');
    });

    it('should return activities in reverse chronological order (newest first)', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      const activities = res.body.data;
      expect(activities[0].id).toBe(act6TaskA1CompletedId); // Newest: 2026-05-06
      expect(activities[1].id).toBe(act5TaskA2CreatedId);   // 2026-05-05
      expect(activities[2].id).toBe(act4CommentA1Id);       // 2026-05-04
      expect(activities[3].id).toBe(act3TaskA1CreatedId);   // 2026-05-03
      expect(activities[4].id).toBe(act2MemberAddedId);     // 2026-05-02
      expect(activities[5].id).toBe(act1ProjCreatedId);     // Oldest: 2026-05-01
    });

    it('should safely serialize actor details without exposing passwordHash', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      for (const act of res.body.data) {
        expect(act.user).toBeDefined();
        expect(act.user.id).toBeDefined();
        expect(act.user.name).toBeDefined();
        expect(act.user.email).toBeDefined();
        expect(act.user.passwordHash).toBeUndefined();
      }
    });

    it('should support pagination (page and limit)', async () => {
      // Page 1, limit 2
      const res1 = await request(app)
        .get(`/api/projects/${projAId}/activities?page=1&limit=2`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBe(2);
      expect(res1.body.meta.total).toBe(6);
      expect(res1.body.meta.page).toBe(1);
      expect(res1.body.meta.limit).toBe(2);
      expect(res1.body.meta.totalPages).toBe(3);
      expect(res1.body.data[0].id).toBe(act6TaskA1CompletedId);
      expect(res1.body.data[1].id).toBe(act5TaskA2CreatedId);

      // Page 2, limit 2
      const res2 = await request(app)
        .get(`/api/projects/${projAId}/activities?page=2&limit=2`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(2);
      expect(res2.body.meta.page).toBe(2);
      expect(res2.body.data[0].id).toBe(act4CommentA1Id);
      expect(res2.body.data[1].id).toBe(act3TaskA1CreatedId);
    });

    it('should support filtering by activity type', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities?type=TASK_CREATED`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
      for (const act of res.body.data) {
        expect(act.type).toBe('TASK_CREATED');
      }
    });

    it('should support filtering by date range (startDate & endDate)', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities?startDate=2026-05-02T00:00:00Z&endDate=2026-05-04T23:59:59Z`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      // Expected: Act 2 (May 2), Act 3 (May 3), Act 4 (May 4) = 3 activities
      expect(res.body.data.length).toBe(3);
      const ids = res.body.data.map((a: any) => a.id);
      expect(ids).toContain(act2MemberAddedId);
      expect(ids).toContain(act3TaskA1CreatedId);
      expect(ids).toContain(act4CommentA1Id);
    });

    it('should allow project VIEWER role to view activities', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(6);
    });

    it('should allow Project LEAD to view activities', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(6);
    });

    it('should allow System ADMIN to view activities across any project', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(6);
    });

    it('should prevent non-members from viewing project activities (403)', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_PROJECT_ACCESS');
    });

    it('should enforce cross-project isolation', async () => {
      // Contributor of Project Alpha cannot view Project Beta activities
      const res = await request(app)
        .get(`/api/projects/${projBId}/activities`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_PROJECT_ACCESS');
    });

    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for nonexistent project ID', async () => {
      const res = await request(app)
        .get('/api/projects/00000000-0000-0000-0000-000000000000/activities')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should return 400 for malformed project ID', async () => {
      const res = await request(app)
        .get('/api/projects/bad--proj--id!!/activities')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid activity type with 400', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities?type=NONEXISTENT_TYPE`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid date format with 400', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities?startDate=not-a-real-date`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject inverted date range (startDate > endDate) with 400', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}/activities?startDate=2026-05-10&endDate=2026-05-01`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid pagination parameters with 400', async () => {
      const res1 = await request(app)
        .get(`/api/projects/${projAId}/activities?page=0`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get(`/api/projects/${projAId}/activities?limit=150`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res2.status).toBe(400);
    });
  });

  // =========================================================================
  // 2. TASK ACTIVITY FEED (GET /api/tasks/:taskId/activities)
  // =========================================================================
  describe('GET /api/tasks/:taskId/activities', () => {
    it('should list activities strictly related to a specific task', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskA1Id}/activities`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(3);
      expect(res.body.meta.total).toBe(3);

      // Verify strictly Task A1 activities
      const ids = res.body.data.map((a: any) => a.id);
      expect(ids).toContain(act3TaskA1CreatedId);
      expect(ids).toContain(act4CommentA1Id);
      expect(ids).toContain(act6TaskA1CompletedId);

      // Verify project-only activities and Task A2 are excluded
      expect(ids).not.toContain(act1ProjCreatedId);
      expect(ids).not.toContain(act2MemberAddedId);
      expect(ids).not.toContain(act5TaskA2CreatedId);
    });

    it('should return task activities in reverse chronological order', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskA1Id}/activities`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      const activities = res.body.data;
      expect(activities[0].id).toBe(act6TaskA1CompletedId); // Newest: May 6
      expect(activities[1].id).toBe(act4CommentA1Id);       // May 4
      expect(activities[2].id).toBe(act3TaskA1CreatedId);   // Oldest: May 3
    });

    it('should safely serialize actor details without passwordHash', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskA1Id}/activities`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      for (const act of res.body.data) {
        expect(act.user).toBeDefined();
        expect(act.user.id).toBeDefined();
        expect(act.user.name).toBeDefined();
        expect(act.user.passwordHash).toBeUndefined();
      }
    });

    it('should support pagination for task activities', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskA1Id}/activities?page=1&limit=2`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(2);
      expect(res.body.data[0].id).toBe(act6TaskA1CompletedId);
      expect(res.body.data[1].id).toBe(act4CommentA1Id);

      const resPage2 = await request(app)
        .get(`/api/tasks/${taskA1Id}/activities?page=2&limit=2`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(resPage2.status).toBe(200);
      expect(resPage2.body.data.length).toBe(1);
      expect(resPage2.body.data[0].id).toBe(act3TaskA1CreatedId);
    });

    it('should support filtering task activities by type', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskA1Id}/activities?type=COMMENT_ADDED`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(act4CommentA1Id);
      expect(res.body.data[0].type).toBe('COMMENT_ADDED');
    });

    it('should allow project VIEWER to view task activities', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskA1Id}/activities`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('should allow Project LEAD to view task activities', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskA1Id}/activities`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('should allow System ADMIN to view task activities', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskA1Id}/activities`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('should prevent non-members from viewing task activities (403)', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskA1Id}/activities`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_TASK_ACCESS');
    });

    it('should enforce cross-project task isolation', async () => {
      // Contributor of Project Alpha cannot access Task Beta's activities
      const res = await request(app)
        .get(`/api/tasks/${taskBId}/activities`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_TASK_ACCESS');
    });

    it('should reject unauthenticated request for task activities with 401', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskA1Id}/activities`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for nonexistent task ID', async () => {
      const res = await request(app)
        .get('/api/tasks/00000000-0000-0000-0000-000000000000/activities')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });

    it('should return 400 for malformed task ID', async () => {
      const res = await request(app)
        .get('/api/tasks/bad--task--id!!/activities')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
