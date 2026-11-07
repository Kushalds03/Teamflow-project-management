import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { SystemRole, ProjectRole, ProjectStatus, TaskPriority, TaskStatus } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';
import { generateToken } from '../src/utils/token';

describe('Task Comments REST API (/api/tasks/:taskId/comments & /api/comments/:id)', () => {
  const runId = Date.now().toString().slice(-6);

  // Test Workspaces
  const wsAId = `ws-ctest-a-${runId}`;
  const wsBId = `ws-ctest-b-${runId}`;

  // Test Projects
  const projAId = `proj-ctest-a-${runId}`;
  const projBId = `proj-ctest-b-${runId}`;

  // Test Users
  const adminId = `usr-ctest-admin-${runId}`;
  const leadId = `usr-ctest-lead-${runId}`;
  const maintId = `usr-ctest-maint-${runId}`;
  const contrib1Id = `usr-ctest-contrib1-${runId}`;
  const contrib2Id = `usr-ctest-contrib2-${runId}`;
  const viewerId = `usr-ctest-viewer-${runId}`;
  const outsiderId = `usr-ctest-outside-${runId}`;

  // Test Tasks
  const taskAId = `task-ctest-a-${runId}`;
  const taskBId = `task-ctest-b-${runId}`;

  // Test Comments
  const comment1Id = `comm-ctest-1-${runId}`;
  const comment2Id = `comm-ctest-2-${runId}`;
  const commentForMaintDelId = `comm-ctest-del-maint-${runId}`;
  const commentForLeadDelId = `comm-ctest-del-lead-${runId}`;
  const commentForAdminDelId = `comm-ctest-del-admin-${runId}`;
  const commentBId = `comm-ctest-b-${runId}`;

  // Dynamically created comment IDs for cleanup
  const createdCommentIds: string[] = [];

  // JWT Tokens
  let adminToken = '';
  let leadToken = '';
  let maintToken = '';
  let contrib1Token = '';
  let contrib2Token = '';
  let viewerToken = '';
  let outsiderToken = '';

  beforeAll(async () => {
    // 1. Create Workspaces
    await prisma.workspace.createMany({
      data: [
        { id: wsAId, name: `Comments WS A ${runId}`, slug: `comm-ws-a-${runId}` },
        { id: wsBId, name: `Comments WS B ${runId}`, slug: `comm-ws-b-${runId}` }
      ]
    });

    // 2. Create Users
    await prisma.user.createMany({
      data: [
        { id: adminId, email: `admin.${runId}@ctest.io`, name: 'Admin User', role: SystemRole.ADMIN },
        { id: leadId, email: `lead.${runId}@ctest.io`, name: 'Lead User', role: SystemRole.USER },
        { id: maintId, email: `maint.${runId}@ctest.io`, name: 'Maintainer User', role: SystemRole.USER },
        { id: contrib1Id, email: `contrib1.${runId}@ctest.io`, name: 'Contributor 1 User', role: SystemRole.USER },
        { id: contrib2Id, email: `contrib2.${runId}@ctest.io`, name: 'Contributor 2 User', role: SystemRole.USER },
        { id: viewerId, email: `viewer.${runId}@ctest.io`, name: 'Viewer User', role: SystemRole.USER },
        { id: outsiderId, email: `outside.${runId}@ctest.io`, name: 'Outsider User', role: SystemRole.USER }
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
        { projectId: projAId, userId: contrib1Id, role: ProjectRole.CONTRIBUTOR },
        { projectId: projAId, userId: contrib2Id, role: ProjectRole.CONTRIBUTOR },
        { projectId: projAId, userId: viewerId, role: ProjectRole.VIEWER }
      ]
    });

    // 4. Create Project Beta in WS B (Isolated)
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
    await prisma.task.create({
      data: {
        id: taskAId,
        title: 'Alpha Comments Task',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        projectId: projAId,
        creatorId: leadId
      }
    });

    await prisma.task.create({
      data: {
        id: taskBId,
        title: 'Beta Comments Task',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        projectId: projBId,
        creatorId: outsiderId
      }
    });

    // 6. Pre-create Comments on Task Alpha
    await prisma.comment.create({
      data: {
        id: comment1Id,
        content: 'First chronological comment on task A',
        taskId: taskAId,
        authorId: contrib1Id,
        createdAt: new Date(Date.now() - 60000)
      }
    });

    await prisma.comment.create({
      data: {
        id: comment2Id,
        content: 'Second chronological comment by contributor 2',
        taskId: taskAId,
        authorId: contrib2Id,
        createdAt: new Date(Date.now() - 30000)
      }
    });

    await prisma.comment.createMany({
      data: [
        {
          id: commentForMaintDelId,
          content: 'Comment to be deleted by Maintainer',
          taskId: taskAId,
          authorId: contrib1Id
        },
        {
          id: commentForLeadDelId,
          content: 'Comment to be deleted by Project Lead',
          taskId: taskAId,
          authorId: contrib1Id
        },
        {
          id: commentForAdminDelId,
          content: 'Comment to be deleted by Admin',
          taskId: taskAId,
          authorId: contrib1Id
        }
      ]
    });

    // Comment on Task Beta
    await prisma.comment.create({
      data: {
        id: commentBId,
        content: 'Isolated Beta project comment',
        taskId: taskBId,
        authorId: outsiderId
      }
    });

    // 7. Generate JWT Tokens
    adminToken = generateToken({ id: adminId, email: `admin.${runId}@ctest.io`, role: SystemRole.ADMIN });
    leadToken = generateToken({ id: leadId, email: `lead.${runId}@ctest.io`, role: SystemRole.USER });
    maintToken = generateToken({ id: maintId, email: `maint.${runId}@ctest.io`, role: SystemRole.USER });
    contrib1Token = generateToken({ id: contrib1Id, email: `contrib1.${runId}@ctest.io`, role: SystemRole.USER });
    contrib2Token = generateToken({ id: contrib2Id, email: `contrib2.${runId}@ctest.io`, role: SystemRole.USER });
    viewerToken = generateToken({ id: viewerId, email: `viewer.${runId}@ctest.io`, role: SystemRole.USER });
    outsiderToken = generateToken({ id: outsiderId, email: `outside.${runId}@ctest.io`, role: SystemRole.USER });
  });

  afterAll(async () => {
    const allProjIds = [projAId, projBId];
    const allUserIds = [adminId, leadId, maintId, contrib1Id, contrib2Id, viewerId, outsiderId];
    const allTaskIds = [taskAId, taskBId];
    const allCommentIds = [
      comment1Id,
      comment2Id,
      commentForMaintDelId,
      commentForLeadDelId,
      commentForAdminDelId,
      commentBId,
      ...createdCommentIds
    ];

    // Clean up in strict foreign key dependency order
    await prisma.activity.deleteMany({
      where: {
        OR: [
          { entityId: { in: allCommentIds } },
          { taskId: { in: allTaskIds } },
          { projectId: { in: allProjIds } },
          { userId: { in: allUserIds } }
        ]
      }
    });

    await prisma.comment.deleteMany({
      where: {
        OR: [
          { id: { in: allCommentIds } },
          { taskId: { in: allTaskIds } },
          { authorId: { in: allUserIds } }
        ]
      }
    });

    await prisma.task.deleteMany({
      where: {
        OR: [
          { id: { in: allTaskIds } },
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
    it('should reject unauthenticated GET /api/tasks/:taskId/comments with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get(`/api/tasks/${taskAId}/comments`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated POST /api/tasks/:taskId/comments with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskAId}/comments`)
        .send({ content: 'Anonymous comment' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated PUT /api/comments/:id with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .put(`/api/comments/${comment1Id}`)
        .send({ content: 'Anonymous update' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated DELETE /api/comments/:id with 401 UNAUTHORIZED', async () => {
      const res = await request(app).delete(`/api/comments/${comment1Id}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ==========================================
  // 2. Listing Comments (GET /api/tasks/:taskId/comments)
  // ==========================================
  describe('Listing Comments (GET /api/tasks/:taskId/comments)', () => {
    it('should list comments for a task in chronological order (createdAt: asc)', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${contrib1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      // Verify chronological sorting
      const first = new Date(res.body.data[0].createdAt).getTime();
      const second = new Date(res.body.data[1].createdAt).getTime();
      expect(first).toBeLessThanOrEqual(second);
    });

    it('should return author details safely without password hashes', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${contrib1Token}`);

      expect(res.status).toBe(200);
      const comment = res.body.data[0];
      expect(comment.author).toBeDefined();
      expect(comment.author.id).toBeDefined();
      expect(comment.author.name).toBeDefined();
      expect(comment.author.email).toBeDefined();
      expect(comment.author.passwordHash).toBeUndefined();
    });

    it('should allow VIEWER member to list comments', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should allow System ADMIN to view comments across any project', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskBId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.some((c: any) => c.id === commentBId)).toBe(true);
    });

    it('should reject outsider non-member from listing comments with 403 FORBIDDEN_TASK_ACCESS', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_TASK_ACCESS');
    });

    it('should return 404 TASK_NOT_FOUND when listing comments for nonexistent task', async () => {
      const res = await request(app)
        .get('/api/tasks/task-nonexistent-999/comments')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });

    it('should return 400 VALIDATION_ERROR for malformed taskId parameter', async () => {
      const res = await request(app)
        .get('/api/tasks/bad--task--id!!/comments')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 3. Creating Comments (POST /api/tasks/:taskId/comments)
  // ==========================================
  describe('Creating Comments (POST /api/tasks/:taskId/comments)', () => {
    it('should successfully create a comment by CONTRIBUTOR', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${contrib1Token}`)
        .send({ content: 'New insightful comment from contributor 1' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('New insightful comment from contributor 1');
      expect(res.body.data.author.id).toBe(contrib1Id);
      expect(res.body.data.author.passwordHash).toBeUndefined();
      expect(res.body.data.taskId).toBe(taskAId);

      createdCommentIds.push(res.body.data.id);
    });

    it('should automatically set authorId to authenticated user, ignoring client-supplied authorId', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${contrib2Token}`)
        .send({
          content: 'Author spoofing attempt',
          authorId: adminId
        });

      expect(res.status).toBe(201);
      expect(res.body.data.author.id).toBe(contrib2Id);
      expect(res.body.data.author.id).not.toBe(adminId);

      createdCommentIds.push(res.body.data.id);
    });

    it('should record ActivityType.COMMENT_ADDED activity upon comment creation', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${contrib1Token}`)
        .send({ content: 'Comment for activity tracking verification' });

      expect(res.status).toBe(201);
      const commentId = res.body.data.id;
      createdCommentIds.push(commentId);

      const activity = await prisma.activity.findFirst({
        where: { entityId: commentId, type: 'COMMENT_ADDED' }
      });
      expect(activity).not.toBeNull();
      expect(activity?.userId).toBe(contrib1Id);
      expect(activity?.projectId).toBe(projAId);
      expect(activity?.taskId).toBe(taskAId);
    });

    it('should strictly reject VIEWER from creating comments with 403 VIEWER_READ_ONLY', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ content: 'Viewer write attempt' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should reject outsider non-member from creating comments with 403 FORBIDDEN_TASK_ACCESS', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ content: 'Outsider unauthorized comment' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_TASK_ACCESS');
    });

    it('should reject empty comment content with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${contrib1Token}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject whitespace-only comment content with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${contrib1Token}`)
        .send({ content: '      ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject comment content exceeding 5000 characters with 400 VALIDATION_ERROR', async () => {
      const longContent = 'A'.repeat(5001);
      const res = await request(app)
        .post(`/api/tasks/${taskAId}/comments`)
        .set('Authorization', `Bearer ${contrib1Token}`)
        .send({ content: longContent });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 TASK_NOT_FOUND when creating comment on nonexistent task', async () => {
      const res = await request(app)
        .post('/api/tasks/task-nonexistent-999/comments')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ content: 'Ghost task comment' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });
  });

  // ==========================================
  // 4. Editing Comments (PUT /api/comments/:id)
  // ==========================================
  describe('Editing Comments (PUT /api/comments/:id)', () => {
    it('should allow author (CONTRIBUTOR) to edit their own comment', async () => {
      const res = await request(app)
        .put(`/api/comments/${comment1Id}`)
        .set('Authorization', `Bearer ${contrib1Token}`)
        .send({ content: 'Author revised comment content' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(comment1Id);
      expect(res.body.data.content).toBe('Author revised comment content');
    });

    it('should allow project MAINTAINER to edit another user comment', async () => {
      const res = await request(app)
        .put(`/api/comments/${comment1Id}`)
        .set('Authorization', `Bearer ${maintToken}`)
        .send({ content: 'Maintainer moderation edit' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Maintainer moderation edit');
    });

    it('should allow project LEAD to edit another user comment', async () => {
      const res = await request(app)
        .put(`/api/comments/${comment1Id}`)
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ content: 'Lead moderation edit' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Lead moderation edit');
    });

    it('should allow System ADMIN to edit any comment across projects', async () => {
      const res = await request(app)
        .put(`/api/comments/${commentBId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Admin global edit' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Admin global edit');
    });

    it('should reject non-author CONTRIBUTOR from editing another user comment with 403 INSUFFICIENT_PROJECT_ROLE', async () => {
      // contrib2 attempting to edit comment1 (authored by contrib1)
      const res = await request(app)
        .put(`/api/comments/${comment1Id}`)
        .set('Authorization', `Bearer ${contrib2Token}`)
        .send({ content: 'Unauthorized peer edit attempt' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PROJECT_ROLE');
    });

    it('should strictly reject VIEWER from editing comments with 403 VIEWER_READ_ONLY', async () => {
      const res = await request(app)
        .put(`/api/comments/${comment1Id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ content: 'Viewer edit attempt' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should reject outsider non-member from editing comment with 403 FORBIDDEN_COMMENT_ACCESS', async () => {
      const res = await request(app)
        .put(`/api/comments/${comment1Id}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ content: 'Cross-project outsider edit' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_COMMENT_ACCESS');
    });

    it('should reject empty comment content in edit with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put(`/api/comments/${comment1Id}`)
        .set('Authorization', `Bearer ${contrib1Token}`)
        .send({ content: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 COMMENT_NOT_FOUND when editing nonexistent comment', async () => {
      const res = await request(app)
        .put('/api/comments/comm-nonexistent-999')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ content: 'Ghost edit' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('COMMENT_NOT_FOUND');
    });

    it('should return 400 VALIDATION_ERROR for malformed comment ID', async () => {
      const res = await request(app)
        .put('/api/comments/bad--comm--id!!')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ content: 'Bad ID edit' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 5. Deleting Comments (DELETE /api/comments/:id)
  // ==========================================
  describe('Deleting Comments (DELETE /api/comments/:id)', () => {
    it('should allow author (CONTRIBUTOR) to delete their own comment', async () => {
      // Create a temporary comment by contrib1 to delete
      const created = await prisma.comment.create({
        data: {
          content: 'Comment to be self-deleted by author',
          taskId: taskAId,
          authorId: contrib1Id
        }
      });

      const res = await request(app)
        .delete(`/api/comments/${created.id}`)
        .set('Authorization', `Bearer ${contrib1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.commentId).toBe(created.id);

      const check = await prisma.comment.findUnique({ where: { id: created.id } });
      expect(check).toBeNull();
    });

    it('should allow project MAINTAINER to delete another user comment', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentForMaintDelId}`)
        .set('Authorization', `Bearer ${maintToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.commentId).toBe(commentForMaintDelId);

      const check = await prisma.comment.findUnique({ where: { id: commentForMaintDelId } });
      expect(check).toBeNull();
    });

    it('should allow project LEAD to delete another user comment', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentForLeadDelId}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.commentId).toBe(commentForLeadDelId);

      const check = await prisma.comment.findUnique({ where: { id: commentForLeadDelId } });
      expect(check).toBeNull();
    });

    it('should allow System ADMIN to delete any comment across projects', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentForAdminDelId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.commentId).toBe(commentForAdminDelId);

      const check = await prisma.comment.findUnique({ where: { id: commentForAdminDelId } });
      expect(check).toBeNull();
    });

    it('should reject non-author CONTRIBUTOR from deleting another user comment with 403 INSUFFICIENT_PROJECT_ROLE', async () => {
      // contrib2 attempting to delete comment2 (authored by contrib1)
      const res = await request(app)
        .delete(`/api/comments/${comment2Id}`)
        .set('Authorization', `Bearer ${contrib1Token}`); // comment2 author is contrib2! contrib1 is non-author

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PROJECT_ROLE');
    });

    it('should strictly reject VIEWER from deleting comments with 403 VIEWER_READ_ONLY', async () => {
      const res = await request(app)
        .delete(`/api/comments/${comment2Id}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('VIEWER_READ_ONLY');
    });

    it('should reject outsider non-member from deleting comment with 403 FORBIDDEN_COMMENT_ACCESS', async () => {
      const res = await request(app)
        .delete(`/api/comments/${comment2Id}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_COMMENT_ACCESS');
    });

    it('should return 404 COMMENT_NOT_FOUND when deleting nonexistent comment', async () => {
      const res = await request(app)
        .delete('/api/comments/comm-nonexistent-999')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('COMMENT_NOT_FOUND');
    });

    it('should return 400 VALIDATION_ERROR for malformed comment ID in deletion', async () => {
      const res = await request(app)
        .delete('/api/comments/bad--comm--id!!')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
