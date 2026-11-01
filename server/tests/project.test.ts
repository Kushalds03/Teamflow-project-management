import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { SystemRole, ProjectRole, ProjectStatus, TaskPriority } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';
import { generateToken } from '../src/utils/token';

describe('Projects REST API (/api/projects)', () => {
  const runId = Date.now().toString().slice(-6);

  // Test Workspace Identifiers
  const wsAId = `ws-ptest-a-${runId}`;
  const wsBId = `ws-ptest-b-${runId}`;

  // Test Project Identifiers
  const projAId = `proj-ptest-a-${runId}`;
  const projBId = `proj-ptest-b-${runId}`;
  const projDeleteId = `proj-ptest-del-${runId}`;
  const projAdminDelId = `proj-ptest-admindel-${runId}`;

  // Dynamic project created during tests
  let dynamicCreatedProjId = '';

  // Test User Identifiers
  const adminId = `usr-ptest-admin-${runId}`;
  const leadId = `usr-ptest-lead-${runId}`;
  const maintId = `usr-ptest-maint-${runId}`;
  const contribId = `usr-ptest-contrib-${runId}`;
  const viewerId = `usr-ptest-viewer-${runId}`;
  const outsiderId = `usr-ptest-outside-${runId}`;
  const candidateMemberId = `usr-ptest-cand-${runId}`;
  const candidateMember2Id = `usr-ptest-cand2-${runId}`;
  const newLeadUserId = `usr-ptest-newlead-${runId}`;

  // JWT Tokens
  let adminToken = '';
  let leadToken = '';
  let maintToken = '';
  let contribToken = '';
  let viewerToken = '';
  let outsiderToken = '';

  beforeAll(async () => {
    // 1. Create Test Workspaces
    await prisma.workspace.createMany({
      data: [
        {
          id: wsAId,
          name: `Projects Test Workspace A ${runId}`,
          slug: `projects-test-ws-a-${runId}`
        },
        {
          id: wsBId,
          name: `Projects Test Workspace B ${runId}`,
          slug: `projects-test-ws-b-${runId}`
        }
      ]
    });

    // 2. Create Test Users
    await prisma.user.createMany({
      data: [
        { id: adminId, email: `admin.${runId}@ptest.io`, name: 'Admin User', role: SystemRole.ADMIN },
        { id: leadId, email: `lead.${runId}@ptest.io`, name: 'Lead User', role: SystemRole.USER },
        { id: maintId, email: `maint.${runId}@ptest.io`, name: 'Maintainer User', role: SystemRole.USER },
        { id: contribId, email: `contrib.${runId}@ptest.io`, name: 'Contributor User', role: SystemRole.USER },
        { id: viewerId, email: `viewer.${runId}@ptest.io`, name: 'Viewer User', role: SystemRole.USER },
        { id: outsiderId, email: `outside.${runId}@ptest.io`, name: 'Outsider User', role: SystemRole.USER },
        { id: candidateMemberId, email: `cand.${runId}@ptest.io`, name: 'Candidate User', role: SystemRole.USER },
        { id: candidateMember2Id, email: `cand2.${runId}@ptest.io`, name: 'Candidate 2 User', role: SystemRole.USER },
        { id: newLeadUserId, email: `newlead.${runId}@ptest.io`, name: 'New Lead User', role: SystemRole.USER }
      ]
    });

    // 3. Create Project Alpha in Workspace A (with Lead, Maintainer, Contributor, Viewer)
    await prisma.project.create({
      data: {
        id: projAId,
        name: `Project Alpha ${runId}`,
        description: 'Primary test project for API verification',
        category: 'Engineering',
        status: ProjectStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
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

    // 4. Create Project Beta in Workspace B (Isolated project owned by outsider)
    await prisma.project.create({
      data: {
        id: projBId,
        name: `Project Beta ${runId}`,
        description: 'Isolated test project',
        category: 'Research',
        status: ProjectStatus.PLANNING,
        priority: TaskPriority.LOW,
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

    // 5. Create projects designated for deletion tests
    await prisma.project.create({
      data: {
        id: projDeleteId,
        name: `Project To Delete ${runId}`,
        workspaceId: wsAId,
        leadId: leadId
      }
    });

    await prisma.projectMember.createMany({
      data: [
        { projectId: projDeleteId, userId: leadId, role: ProjectRole.LEAD },
        { projectId: projDeleteId, userId: maintId, role: ProjectRole.MAINTAINER },
        { projectId: projDeleteId, userId: contribId, role: ProjectRole.CONTRIBUTOR },
        { projectId: projDeleteId, userId: viewerId, role: ProjectRole.VIEWER }
      ]
    });

    await prisma.project.create({
      data: {
        id: projAdminDelId,
        name: `Project For Admin Delete ${runId}`,
        workspaceId: wsAId,
        leadId: outsiderId
      }
    });

    await prisma.projectMember.create({
      data: {
        projectId: projAdminDelId,
        userId: outsiderId,
        role: ProjectRole.LEAD
      }
    });

    // 6. Generate auth tokens
    adminToken = generateToken({ id: adminId, email: `admin.${runId}@ptest.io`, role: SystemRole.ADMIN });
    leadToken = generateToken({ id: leadId, email: `lead.${runId}@ptest.io`, role: SystemRole.USER });
    maintToken = generateToken({ id: maintId, email: `maint.${runId}@ptest.io`, role: SystemRole.USER });
    contribToken = generateToken({ id: contribId, email: `contrib.${runId}@ptest.io`, role: SystemRole.USER });
    viewerToken = generateToken({ id: viewerId, email: `viewer.${runId}@ptest.io`, role: SystemRole.USER });
    outsiderToken = generateToken({ id: outsiderId, email: `outside.${runId}@ptest.io`, role: SystemRole.USER });
  });

  afterAll(async () => {
    // Collect all project IDs involved in tests
    const allProjIds = [projAId, projBId, projDeleteId, projAdminDelId];
    if (dynamicCreatedProjId) allProjIds.push(dynamicCreatedProjId);

    // Collect all user IDs involved
    const allUserIds = [
      adminId,
      leadId,
      maintId,
      contribId,
      viewerId,
      outsiderId,
      candidateMemberId,
      candidateMember2Id,
      newLeadUserId
    ];

    // Clean up in strict foreign key order
    const tasks = await prisma.task.findMany({
      where: { projectId: { in: allProjIds } },
      select: { id: true }
    });
    const taskIds = tasks.map((t) => t.id);

    if (taskIds.length > 0) {
      await prisma.comment.deleteMany({ where: { taskId: { in: taskIds } } });
      await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
    }

    await prisma.activity.deleteMany({
      where: {
        OR: [
          { projectId: { in: allProjIds } },
          { userId: { in: allUserIds } }
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
    it('should reject unauthenticated GET /api/projects with 401', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated POST /api/projects with 401', async () => {
      const res = await request(app).post('/api/projects').send({ name: 'Secret' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated GET /api/projects/:id with 401', async () => {
      const res = await request(app).get(`/api/projects/${projAId}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated PUT /api/projects/:id with 401', async () => {
      const res = await request(app).put(`/api/projects/${projAId}`).send({ name: 'Hacked' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated DELETE /api/projects/:id with 401', async () => {
      const res = await request(app).delete(`/api/projects/${projAId}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated POST /api/projects/:id/members with 401', async () => {
      const res = await request(app).post(`/api/projects/${projAId}/members`).send({ userId: candidateMemberId });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ==========================================
  // 2. Project Creation (POST /api/projects)
  // ==========================================
  describe('POST /api/projects (Project Creation)', () => {
    it('should successfully create a new project and designate the creator as LEAD in ProjectMember', async () => {
      const payload = {
        name: `Dynamic Initiative ${runId}`,
        description: 'Created via automated REST test suite',
        category: 'DevOps',
        status: ProjectStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: '2026-12-31T00:00:00.000Z',
        startDate: '2026-11-01T00:00:00.000Z',
        workspaceId: wsAId
      };

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${leadToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(payload.name);
      expect(res.body.data.leadId).toBe(leadId);
      expect(res.body.data.workspaceId).toBe(wsAId);
      expect(res.body.data.lead.email).toBe(`lead.${runId}@ptest.io`);

      // Verify that creator is automatically in members list with LEAD role
      const leadMember = res.body.data.members.find((m: any) => m.userId === leadId);
      expect(leadMember).toBeDefined();
      expect(leadMember.role).toBe(ProjectRole.LEAD);

      dynamicCreatedProjId = res.body.data.id;
    });

    it('should reject project creation when name is missing with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ workspaceId: wsAId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject project creation when name is an empty string with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ name: '   ', workspaceId: wsAId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject project creation when workspaceId is missing with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ name: 'Valid Project Name' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject project creation when workspaceId is malformed with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ name: 'Valid Name', workspaceId: 'invalid!workspace@id' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject project creation with nonexistent workspaceId with 404 WORKSPACE_NOT_FOUND', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ name: 'Valid Name', workspaceId: 'ws-non-existent-99999' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('WORKSPACE_NOT_FOUND');
    });

    it('should reject project creation with invalid status with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ name: 'Valid Name', workspaceId: wsAId, status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject project creation with invalid priority with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ name: 'Valid Name', workspaceId: wsAId, priority: 'CRITICAL' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent standard user from assigning another user as project lead with 403 FORBIDDEN', async () => {
      // leadUser attempts to assign candidateMemberId as lead
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({
          name: 'Unauthorized Lead Assignment Project',
          workspaceId: wsAId,
          leadId: candidateMemberId
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow System ADMIN to create project and designate another user as project lead', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Admin Appointed Project ${runId}`,
          workspaceId: wsAId,
          leadId: candidateMemberId
        });

      expect(res.status).toBe(201);
      expect(res.body.data.leadId).toBe(candidateMemberId);

      // Clean up appointed project
      await prisma.projectMember.deleteMany({ where: { projectId: res.body.data.id } });
      await prisma.project.delete({ where: { id: res.body.data.id } });
    });

    it('should return 404 USER_NOT_FOUND if Admin designates a nonexistent user as lead', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Nonexistent Lead Project',
          workspaceId: wsAId,
          leadId: 'usr-nonexistent-user-id'
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  // ==========================================
  // 3. Project Listing & Access Isolation (GET /api/projects)
  // ==========================================
  describe('GET /api/projects (Listing & Access Isolation)', () => {
    it('should only list projects accessible to the authenticated user', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const returnedIds = res.body.data.map((p: any) => p.id);
      // Project Alpha should be visible (user is lead/member)
      expect(returnedIds).toContain(projAId);
      // Project Beta must NOT be visible (user is NOT lead or member)
      expect(returnedIds).not.toContain(projBId);
    });

    it('should isolate outsider from accessing Project Alpha in list', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(200);
      const returnedIds = res.body.data.map((p: any) => p.id);
      expect(returnedIds).toContain(projBId);
      expect(returnedIds).not.toContain(projAId);
    });

    it('should allow System ADMIN to list all projects across workspaces', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const returnedIds = res.body.data.map((p: any) => p.id);
      expect(returnedIds).toContain(projAId);
      expect(returnedIds).toContain(projBId);
    });

    it('should filter projects by workspaceId query parameter', async () => {
      const res = await request(app)
        .get(`/api/projects?workspaceId=${wsAId}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((p: any) => {
        expect(p.workspaceId).toBe(wsAId);
      });
    });

    it('should filter projects by status query parameter', async () => {
      const res = await request(app)
        .get(`/api/projects?status=${ProjectStatus.IN_PROGRESS}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((p: any) => {
        expect(p.status).toBe(ProjectStatus.IN_PROGRESS);
      });
    });

    it('should reject invalid status query parameter with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/projects?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 4. Fetching Project Details (GET /api/projects/:id)
  // ==========================================
  describe('GET /api/projects/:id (Project Details)', () => {
    it('should return project details for project LEAD with full relationships', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(projAId);
      expect(res.body.data.lead).toBeDefined();
      expect(res.body.data.lead.name).toBe('Lead User');
      expect(res.body.data.workspace.id).toBe(wsAId);
      expect(res.body.data.members.length).toBeGreaterThanOrEqual(4);
      expect(res.body.data._count).toBeDefined();
    });

    it('should allow VIEWER member to read project details', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(projAId);
    });

    it('should allow System ADMIN to view any project details without explicit membership', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(projAId);
    });

    it('should reject cross-project access for non-member user with 403 FORBIDDEN_PROJECT_ACCESS', async () => {
      const res = await request(app)
        .get(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_PROJECT_ACCESS');
    });

    it('should return 404 PROJECT_NOT_FOUND for nonexistent project ID', async () => {
      const res = await request(app)
        .get('/api/projects/proj-non-existent-9999')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should reject malformed project ID with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/projects/malformed!id@$')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 5. Updating Project Details (PUT /api/projects/:id)
  // ==========================================
  describe('PUT /api/projects/:id (Project Updates)', () => {
    it('should allow MAINTAINER to update project details', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${maintToken}`)
        .send({
          name: `Project Alpha Updated ${runId}`,
          description: 'Updated by MAINTAINER',
          status: ProjectStatus.ON_HOLD
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(`Project Alpha Updated ${runId}`);
      expect(res.body.data.status).toBe(ProjectStatus.ON_HOLD);
    });

    it('should allow LEAD to update project details', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({
          status: ProjectStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ProjectStatus.IN_PROGRESS);
    });

    it('should reject empty update body with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject update with empty name with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject update with invalid status with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ status: 'UNKNOWN_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should strictly reject VIEWER from modifying project with 403 VIEWER_READ_ONLY', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Viewer Hacked Project' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should reject CONTRIBUTOR from modifying project details with 403 INSUFFICIENT_PROJECT_ROLE', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ name: 'Contributor Modified' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PROJECT_ROLE');
    });

    it('should reject non-member from modifying project with 403 FORBIDDEN_PROJECT_ACCESS', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ name: 'Outsider Modified' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_PROJECT_ACCESS');
    });

    it('should reject MAINTAINER from reassigning leadId with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${maintToken}`)
        .send({ leadId: newLeadUserId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow project LEAD to reassign leadId and upsert new lead as LEAD in ProjectMember', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ leadId: newLeadUserId });

      expect(res.status).toBe(200);
      expect(res.body.data.leadId).toBe(newLeadUserId);

      // Verify that new lead is now registered in ProjectMember with LEAD role
      const memberRecord = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: projAId,
            userId: newLeadUserId
          }
        }
      });
      expect(memberRecord).toBeDefined();
      expect(memberRecord?.role).toBe(ProjectRole.LEAD);

      // Revert leadId back to leadId for subsequent tests
      await prisma.project.update({
        where: { id: projAId },
        data: { leadId }
      });
    });

    it('should return 404 USER_NOT_FOUND when changing leadId to nonexistent user', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ leadId: 'usr-nonexistent-user-999' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 404 WORKSPACE_NOT_FOUND when moving project to nonexistent workspace', async () => {
      const res = await request(app)
        .put(`/api/projects/${projAId}`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ workspaceId: 'ws-nonexistent-999' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('WORKSPACE_NOT_FOUND');
    });
  });

  // ==========================================
  // 6. Adding Project Members (POST /api/projects/:id/members)
  // ==========================================
  describe('POST /api/projects/:id/members (Adding Members & Escalation Checks)', () => {
    it('should allow project LEAD to add a new member to the project', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/members`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({
          userId: candidateMemberId,
          role: ProjectRole.CONTRIBUTOR
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(candidateMemberId);
      expect(res.body.data.role).toBe(ProjectRole.CONTRIBUTOR);
      expect(res.body.data.user.name).toBe('Candidate User');
    });

    it('should prevent duplicate project memberships with 409 MEMBER_ALREADY_EXISTS', async () => {
      // candidateMemberId was added above; attempting to add them again must fail
      const res = await request(app)
        .post(`/api/projects/${projAId}/members`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({
          userId: candidateMemberId,
          role: ProjectRole.CONTRIBUTOR
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('MEMBER_ALREADY_EXISTS');
    });

    it('should return 404 USER_NOT_FOUND when adding a nonexistent user to the project', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/members`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({
          userId: 'usr-ghost-user-999',
          role: ProjectRole.CONTRIBUTOR
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should allow MAINTAINER to add a CONTRIBUTOR or VIEWER member', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/members`)
        .set('Authorization', `Bearer ${maintToken}`)
        .send({
          userId: candidateMember2Id,
          role: ProjectRole.VIEWER
        });

      expect(res.status).toBe(201);
      expect(res.body.data.userId).toBe(candidateMember2Id);
      expect(res.body.data.role).toBe(ProjectRole.VIEWER);
    });

    it('should strictly prevent MAINTAINER from escalating a user to LEAD with 403 FORBIDDEN_ROLE_ESCALATION', async () => {
      // Create a temporary user for testing escalation
      const tempEscalationId = `usr-ptest-esc-${runId}`;
      await prisma.user.create({
        data: {
          id: tempEscalationId,
          email: `esc.${runId}@ptest.io`,
          name: 'Escalation Target',
          role: SystemRole.USER
        }
      });

      const res = await request(app)
        .post(`/api/projects/${projAId}/members`)
        .set('Authorization', `Bearer ${maintToken}`)
        .send({
          userId: tempEscalationId,
          role: ProjectRole.LEAD
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE_ESCALATION');

      // Clean up temp user
      await prisma.user.delete({ where: { id: tempEscalationId } });
    });

    it('should reject VIEWER from adding project members with 403 VIEWER_READ_ONLY', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/members`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ userId: newLeadUserId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should reject CONTRIBUTOR from adding project members with 403 INSUFFICIENT_PROJECT_ROLE', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/members`)
        .set('Authorization', `Bearer ${contribToken}`)
        .send({ userId: newLeadUserId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PROJECT_ROLE');
    });

    it('should reject non-member from adding members with 403 FORBIDDEN_PROJECT_ACCESS', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/members`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ userId: newLeadUserId });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_PROJECT_ACCESS');
    });

    it('should reject invalid role with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/members`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({
          userId: newLeadUserId,
          role: 'SUPER_LEAD'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing or empty userId with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/projects/${projAId}/members`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ role: ProjectRole.CONTRIBUTOR });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 7. Deleting Projects (DELETE /api/projects/:id)
  // ==========================================
  describe('DELETE /api/projects/:id (Project Deletion & Authorization)', () => {
    it('should reject VIEWER from deleting project with 403 VIEWER_READ_ONLY', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projDeleteId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should reject CONTRIBUTOR from deleting project with 403 INSUFFICIENT_PROJECT_ROLE', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projDeleteId}`)
        .set('Authorization', `Bearer ${contribToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PROJECT_ROLE');
    });

    it('should reject MAINTAINER from deleting project with 403 INSUFFICIENT_PROJECT_ROLE', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projDeleteId}`)
        .set('Authorization', `Bearer ${maintToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PROJECT_ROLE');
    });

    it('should reject non-member from deleting project with 403 FORBIDDEN_PROJECT_ACCESS', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projDeleteId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_PROJECT_ACCESS');
    });

    it('should return 404 PROJECT_NOT_FOUND when attempting to delete nonexistent project', async () => {
      const res = await request(app)
        .delete('/api/projects/proj-nonexistent-ghost-id')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should allow project LEAD to successfully delete the project and cascade related records', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projDeleteId}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projectId).toBe(projDeleteId);

      // Verify deletion in database
      const deletedProject = await prisma.project.findUnique({
        where: { id: projDeleteId }
      });
      expect(deletedProject).toBeNull();

      // Verify memberships were cleaned up
      const members = await prisma.projectMember.findMany({
        where: { projectId: projDeleteId }
      });
      expect(members.length).toBe(0);
    });

    it('should allow System ADMIN to delete any project across workspaces', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projAdminDelId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deletedProject = await prisma.project.findUnique({
        where: { id: projAdminDelId }
      });
      expect(deletedProject).toBeNull();
    });
  });
});
