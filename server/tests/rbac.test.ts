import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Application, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { SystemRole, ProjectRole } from '@prisma/client';
import { prisma } from '../src/utils/prisma';
import { generateToken } from '../src/utils/token';
import { authenticate, requireAuth, requireSystemRole } from '../src/middleware/auth.middleware';
import { requireProjectAccess, requireTaskAccess } from '../src/middleware/rbac.middleware';
import { notFoundHandler, errorHandler } from '../src/middleware/error.middleware';

describe('Role-Based Access Control (RBAC) & Resource Authorization', () => {
  const runId = Date.now().toString().slice(-6);

  // Test Entities Identifiers
  const wsId = `ws-test-${runId}`;
  const projAId = `proj-test-a-${runId}`;
  const projBId = `proj-test-b-${runId}`;
  const taskAId = `task-test-a-${runId}`;
  const taskBId = `task-test-b-${runId}`;

  // Test Users Identifiers
  const leadId = `usr-lead-${runId}`;
  const maintainerId = `usr-maint-${runId}`;
  const contributorId = `usr-contrib-${runId}`;
  const viewerId = `usr-view-${runId}`;
  const outsideId = `usr-outsider-${runId}`;
  const adminId = `usr-admin-${runId}`;

  // JWT Tokens
  let leadToken = '';
  let maintainerToken = '';
  let contributorToken = '';
  let viewerToken = '';
  let outsideToken = '';
  let adminToken = '';

  let testApp: Application;

  beforeAll(async () => {
    // 1. Create Test Workspace
    await prisma.workspace.create({
      data: {
        id: wsId,
        name: `RBAC Test Workspace ${runId}`,
        slug: `rbac-test-ws-${runId}`
      }
    });

    // 2. Create Test Users
    await prisma.user.createMany({
      data: [
        { id: leadId, email: `lead.${runId}@teamflow.test`, name: 'Test Lead', role: SystemRole.USER },
        { id: maintainerId, email: `maint.${runId}@teamflow.test`, name: 'Test Maintainer', role: SystemRole.USER },
        { id: contributorId, email: `contrib.${runId}@teamflow.test`, name: 'Test Contributor', role: SystemRole.USER },
        { id: viewerId, email: `viewer.${runId}@teamflow.test`, name: 'Test Viewer', role: SystemRole.USER },
        { id: outsideId, email: `outside.${runId}@teamflow.test`, name: 'Test Outsider', role: SystemRole.USER },
        { id: adminId, email: `admin.${runId}@teamflow.test`, name: 'Test Global Admin', role: SystemRole.ADMIN }
      ]
    });

    // 3. Create Project A (with Lead, Maintainer, Contributor, Viewer)
    await prisma.project.create({
      data: {
        id: projAId,
        name: `Project Alpha ${runId}`,
        workspaceId: wsId,
        leadId: leadId
      }
    });

    await prisma.projectMember.createMany({
      data: [
        { projectId: projAId, userId: maintainerId, role: ProjectRole.MAINTAINER },
        { projectId: projAId, userId: contributorId, role: ProjectRole.CONTRIBUTOR },
        { projectId: projAId, userId: viewerId, role: ProjectRole.VIEWER }
      ]
    });

    // 4. Create Project B (with outsideId as Lead; users of Project A are NOT members)
    await prisma.project.create({
      data: {
        id: projBId,
        name: `Project Beta ${runId}`,
        workspaceId: wsId,
        leadId: outsideId
      }
    });

    // 5. Create Tasks
    await prisma.task.create({
      data: {
        id: taskAId,
        title: 'Project A Secret Task',
        projectId: projAId,
        creatorId: leadId
      }
    });

    await prisma.task.create({
      data: {
        id: taskBId,
        title: 'Project B Isolated Task',
        projectId: projBId,
        creatorId: outsideId
      }
    });

    // 6. Generate authentic session tokens
    leadToken = generateToken({ id: leadId, email: `lead.${runId}@teamflow.test`, role: SystemRole.USER });
    maintainerToken = generateToken({ id: maintainerId, email: `maint.${runId}@teamflow.test`, role: SystemRole.USER });
    contributorToken = generateToken({ id: contributorId, email: `contrib.${runId}@teamflow.test`, role: SystemRole.USER });
    viewerToken = generateToken({ id: viewerId, email: `viewer.${runId}@teamflow.test`, role: SystemRole.USER });
    outsideToken = generateToken({ id: outsideId, email: `outside.${runId}@teamflow.test`, role: SystemRole.USER });
    adminToken = generateToken({ id: adminId, email: `admin.${runId}@teamflow.test`, role: SystemRole.ADMIN });

    // 7. Setup a test harness app specifically executing the authorization middlewares
    testApp = express();
    testApp.use(express.json());
    testApp.use(cookieParser());
    testApp.use(authenticate);

    // Admin protected endpoint
    testApp.get('/test/admin-only', requireAuth, requireSystemRole(SystemRole.ADMIN), (_req: Request, res: Response) => {
      res.json({ success: true, message: 'Admin access granted' });
    });

    // Project Read endpoint (Requires VIEWER or higher)
    testApp.get('/test/projects/:projectId', requireAuth, requireProjectAccess(ProjectRole.VIEWER), (req: Request, res: Response) => {
      res.json({ success: true, effectiveRole: req.projectRole, projectId: req.project?.id });
    });

    // Project Write endpoint (Requires CONTRIBUTOR or higher; VIEWER blocked)
    testApp.post('/test/projects/:projectId/tasks', requireAuth, requireProjectAccess(ProjectRole.CONTRIBUTOR), (req: Request, res: Response) => {
      res.status(201).json({ success: true, effectiveRole: req.projectRole });
    });

    // Project Manage endpoint (Requires MAINTAINER or higher)
    testApp.patch('/test/projects/:projectId/settings', requireAuth, requireProjectAccess(ProjectRole.MAINTAINER), (req: Request, res: Response) => {
      res.json({ success: true, effectiveRole: req.projectRole });
    });

    // Task Read endpoint
    testApp.get('/test/tasks/:taskId', requireAuth, requireTaskAccess(false), (req: Request, res: Response) => {
      res.json({ success: true, taskId: req.task?.id, effectiveRole: req.projectRole });
    });

    // Task Write endpoint (VIEWER blocked)
    testApp.put('/test/tasks/:taskId', requireAuth, requireTaskAccess(true), (req: Request, res: Response) => {
      res.json({ success: true, taskId: req.task?.id });
    });

    testApp.use(notFoundHandler);
    testApp.use(errorHandler);
  });

  afterAll(async () => {
    // Clean up all and only the test records created for this suite
    await prisma.task.deleteMany({ where: { id: { in: [taskAId, taskBId] } } });
    await prisma.projectMember.deleteMany({ where: { projectId: { in: [projAId, projBId] } } });
    await prisma.project.deleteMany({ where: { id: { in: [projAId, projBId] } } });
    await prisma.workspace.deleteMany({ where: { id: wsId } });
    await prisma.user.deleteMany({
      where: { id: { in: [leadId, maintainerId, contributorId, viewerId, outsideId, adminId] } }
    });
    await prisma.$disconnect();
  });

  describe('System Role Authorization (requireSystemRole)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(testApp).get('/test/admin-only');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject standard USER from accessing ADMIN resource with 403', async () => {
      const res = await request(testApp)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should grant access to authenticated ADMIN user', async () => {
      const res = await request(testApp)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin access granted');
    });
  });

  describe('Project Membership & Cross-Project Isolation (requireProjectAccess)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(testApp).get(`/test/projects/${projAId}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-member user from accessing project with 403', async () => {
      // outsideUser belongs to Project B, trying to access Project A
      const res = await request(testApp)
        .get(`/test/projects/${projAId}`)
        .set('Authorization', `Bearer ${outsideToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_PROJECT_ACCESS');
      expect(res.body.error.message).toContain('not a member of this project');
    });

    it('should return 404 if project does not exist', async () => {
      const res = await request(testApp)
        .get('/test/projects/non-existent-proj-id')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should grant global ADMIN full LEAD authority over any project without explicit membership', async () => {
      const res = await request(testApp)
        .get(`/test/projects/${projAId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.effectiveRole).toBe('LEAD');
    });

    it('should grant project lead LEAD authority', async () => {
      const res = await request(testApp)
        .get(`/test/projects/${projAId}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.effectiveRole).toBe('LEAD');
    });
  });

  describe('Viewer Read-Only Restrictions & Role Hierarchy', () => {
    it('should allow VIEWER to read project details (GET)', async () => {
      const res = await request(testApp)
        .get(`/test/projects/${projAId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.effectiveRole).toBe('VIEWER');
    });

    it('should strictly reject VIEWER write operations (POST) with 403', async () => {
      const res = await request(testApp)
        .post(`/test/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Unauthorized Viewer Task' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
      expect(res.body.error.message).toContain('read-only permissions');
    });

    it('should allow CONTRIBUTOR to perform write operations (POST)', async () => {
      const res = await request(testApp)
        .post(`/test/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({ title: 'Contributor Task' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.effectiveRole).toBe('CONTRIBUTOR');
    });

    it('should reject CONTRIBUTOR from operations requiring MAINTAINER with 403', async () => {
      const res = await request(testApp)
        .patch(`/test/projects/${projAId}/settings`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({ description: 'Attempted Contributor Change' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PROJECT_ROLE');
      expect(res.body.error.message).toContain('MAINTAINER');
    });

    it('should allow MAINTAINER to perform maintainer operations', async () => {
      const res = await request(testApp)
        .patch(`/test/projects/${projAId}/settings`)
        .set('Authorization', `Bearer ${maintainerToken}`)
        .send({ description: 'Valid Maintainer Change' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.effectiveRole).toBe('MAINTAINER');
    });
  });

  describe('Task Access & Cross-Project Isolation (requireTaskAccess)', () => {
    it('should allow member to read task in their project', async () => {
      const res = await request(testApp)
        .get(`/test/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.taskId).toBe(taskAId);
    });

    it('should reject cross-project task access from non-member user with 403', async () => {
      // outsideUser (Project B) attempting to access Task A (Project A)
      const res = await request(testApp)
        .get(`/test/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${outsideToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_TASK_ACCESS');
    });

    it('should reject VIEWER from modifying task (PUT) with 403', async () => {
      const res = await request(testApp)
        .put(`/test/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ status: 'DONE' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should allow CONTRIBUTOR to modify task', async () => {
      const res = await request(testApp)
        .put(`/test/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.taskId).toBe(taskAId);
    });
  });

  describe('Client Role Spoofing Resistance', () => {
    it('should ignore client-supplied role in request body or headers', async () => {
      // Viewer attempts to spoof MAINTAINER role in body and headers
      const res = await request(testApp)
        .post(`/test/projects/${projAId}/tasks`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set('X-User-Role', 'LEAD')
        .send({
          title: 'Spoofed Task',
          role: 'MAINTAINER',
          projectRole: 'LEAD'
        });

      // Server validates against database ProjectMember record, rejecting the write
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });
  });
});
