import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { SystemRole, ProjectRole, TaskStatus, TaskPriority, ProjectStatus, ActivityType } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';
import { generateToken } from '../src/utils/token';

describe('Analytics REST API (/api/projects/:projectId/analytics & /api/workspaces/:workspaceId/analytics)', () => {
  const runId = Date.now().toString().slice(-6);

  // Test Workspaces
  const wsAId = `ws-ana-a-${runId}`;
  const wsBId = `ws-ana-b-${runId}`;
  const wsEmptyId = `ws-ana-empty-${runId}`;

  // Test Projects
  const projA1Id = `proj-ana-a1-${runId}`;
  const projA2EmptyId = `proj-ana-a2-empty-${runId}`;
  const projB1Id = `proj-ana-b1-${runId}`;

  // Test Users
  const adminId = `usr-ana-admin-${runId}`;
  const leadId = `usr-ana-lead-${runId}`;
  const memberId = `usr-ana-member-${runId}`;
  const viewerId = `usr-ana-viewer-${runId}`;
  const outsiderId = `usr-ana-outside-${runId}`;

  // Test Tasks in Project A1
  const task1Id = `task-ana-1-${runId}`;
  const task2Id = `task-ana-2-${runId}`;
  const task3Id = `task-ana-3-${runId}`;
  const task4Id = `task-ana-4-${runId}`;
  const task5Id = `task-ana-5-${runId}`;

  // Test Task in Project B1
  const taskBId = `task-ana-b-${runId}`;

  // Activity IDs
  const act1Id = `act-ana-1-${runId}`;
  const act2Id = `act-ana-2-${runId}`;

  // JWT Tokens
  let adminToken = '';
  let leadToken = '';
  let memberToken = '';
  let viewerToken = '';
  let outsiderToken = '';

  beforeAll(async () => {
    // 1. Create Workspaces
    await prisma.workspace.createMany({
      data: [
        { id: wsAId, name: `Analytics WS A ${runId}`, slug: `ana-ws-a-${runId}` },
        { id: wsBId, name: `Analytics WS B ${runId}`, slug: `ana-ws-b-${runId}` },
        { id: wsEmptyId, name: `Analytics Empty WS ${runId}`, slug: `ana-ws-empty-${runId}` }
      ]
    });

    // 2. Create Users
    await prisma.user.createMany({
      data: [
        { id: adminId, email: `admin.${runId}@anatest.io`, name: 'Admin User', role: SystemRole.ADMIN, passwordHash: 'secret-hash' },
        { id: leadId, email: `lead.${runId}@anatest.io`, name: 'Lead User', role: SystemRole.USER, passwordHash: 'secret-hash' },
        { id: memberId, email: `member.${runId}@anatest.io`, name: 'Member User', role: SystemRole.USER, passwordHash: 'secret-hash' },
        { id: viewerId, email: `viewer.${runId}@anatest.io`, name: 'Viewer User', role: SystemRole.USER, passwordHash: 'secret-hash' },
        { id: outsiderId, email: `outside.${runId}@anatest.io`, name: 'Outsider User', role: SystemRole.USER, passwordHash: 'secret-hash' }
      ]
    });

    // 3. Create Projects
    // Project A1: Active project with tasks in WS A
    await prisma.project.create({
      data: {
        id: projA1Id,
        name: `Project Alpha 1 ${runId}`,
        category: 'Engineering',
        status: ProjectStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        workspaceId: wsAId,
        leadId: leadId
      }
    });

    // Project A2: Empty project (0 tasks) in WS A, completed status
    await prisma.project.create({
      data: {
        id: projA2EmptyId,
        name: `Project Alpha 2 Empty ${runId}`,
        category: 'Design',
        status: ProjectStatus.COMPLETED,
        priority: TaskPriority.LOW,
        workspaceId: wsAId,
        leadId: leadId
      }
    });

    // Project B1: Project in WS B owned by outsider
    await prisma.project.create({
      data: {
        id: projB1Id,
        name: `Project Beta 1 ${runId}`,
        category: 'Marketing',
        status: ProjectStatus.PLANNING,
        priority: TaskPriority.MEDIUM,
        workspaceId: wsBId,
        leadId: outsiderId
      }
    });

    // 4. Project Memberships
    await prisma.projectMember.createMany({
      data: [
        { projectId: projA1Id, userId: leadId, role: ProjectRole.LEAD },
        { projectId: projA1Id, userId: memberId, role: ProjectRole.CONTRIBUTOR },
        { projectId: projA1Id, userId: viewerId, role: ProjectRole.VIEWER },
        { projectId: projA2EmptyId, userId: leadId, role: ProjectRole.LEAD },
        { projectId: projB1Id, userId: outsiderId, role: ProjectRole.LEAD }
      ]
    });

    // 5. Create Tasks in Project A1:
    // Task 1: DONE, HIGH, assigned to memberId, dueDate past (not overdue because DONE)
    // Task 2: IN_PROGRESS, MEDIUM, assigned to memberId, dueDate in past (OVERDUE)
    // Task 3: IN_REVIEW, HIGH, assigned to leadId, dueDate in future (not overdue)
    // Task 4: TODO, LOW, assigned to leadId, dueDate in past (OVERDUE)
    // Task 5: TODO, MEDIUM, unassigned (assigneeId null), no dueDate (not overdue)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.task.createMany({
      data: [
        {
          id: task1Id,
          title: 'Task 1 Completed Past Due',
          status: TaskStatus.DONE,
          priority: TaskPriority.HIGH,
          dueDate: yesterday,
          projectId: projA1Id,
          creatorId: leadId,
          assigneeId: memberId
        },
        {
          id: task2Id,
          title: 'Task 2 In Progress Overdue',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          dueDate: yesterday,
          projectId: projA1Id,
          creatorId: leadId,
          assigneeId: memberId
        },
        {
          id: task3Id,
          title: 'Task 3 In Review Future',
          status: TaskStatus.IN_REVIEW,
          priority: TaskPriority.HIGH,
          dueDate: tomorrow,
          projectId: projA1Id,
          creatorId: leadId,
          assigneeId: leadId
        },
        {
          id: task4Id,
          title: 'Task 4 Todo Overdue',
          status: TaskStatus.TODO,
          priority: TaskPriority.LOW,
          dueDate: yesterday,
          projectId: projA1Id,
          creatorId: leadId,
          assigneeId: leadId
        },
        {
          id: task5Id,
          title: 'Task 5 Todo Unassigned',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          dueDate: null,
          projectId: projA1Id,
          creatorId: leadId,
          assigneeId: null
        },
        // Project B task
        {
          id: taskBId,
          title: 'Task B Private',
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          projectId: projB1Id,
          creatorId: outsiderId,
          assigneeId: outsiderId
        }
      ]
    });

    // 6. Create Seed Activities
    await prisma.activity.createMany({
      data: [
        {
          id: act1Id,
          type: ActivityType.PROJECT_CREATED,
          title: 'Project Initialized',
          description: 'Project Alpha was created.',
          projectId: projA1Id,
          userId: leadId,
          createdAt: new Date()
        },
        {
          id: act2Id,
          type: ActivityType.TASK_COMPLETED,
          title: 'Task Finished',
          description: 'Task 1 was marked done.',
          projectId: projA1Id,
          taskId: task1Id,
          userId: memberId,
          createdAt: new Date()
        }
      ]
    });

    // 7. Tokens
    adminToken = generateToken({ id: adminId, email: `admin.${runId}@anatest.io`, role: SystemRole.ADMIN });
    leadToken = generateToken({ id: leadId, email: `lead.${runId}@anatest.io`, role: SystemRole.USER });
    memberToken = generateToken({ id: memberId, email: `member.${runId}@anatest.io`, role: SystemRole.USER });
    viewerToken = generateToken({ id: viewerId, email: `viewer.${runId}@anatest.io`, role: SystemRole.USER });
    outsiderToken = generateToken({ id: outsiderId, email: `outside.${runId}@anatest.io`, role: SystemRole.USER });
  });

  afterAll(async () => {
    const allProjIds = [projA1Id, projA2EmptyId, projB1Id];
    const allUserIds = [adminId, leadId, memberId, viewerId, outsiderId];
    const allTaskIds = [task1Id, task2Id, task3Id, task4Id, task5Id, taskBId];
    const allWsIds = [wsAId, wsBId, wsEmptyId];

    await prisma.activity.deleteMany({
      where: {
        OR: [
          { id: { in: [act1Id, act2Id] } },
          { taskId: { in: allTaskIds } },
          { projectId: { in: allProjIds } },
          { userId: { in: allUserIds } }
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

    await prisma.project.deleteMany({
      where: { id: { in: allProjIds } }
    });

    await prisma.workspace.deleteMany({
      where: { id: { in: allWsIds } }
    });

    await prisma.user.deleteMany({
      where: { id: { in: allUserIds } }
    });
  });

  // =========================================================================
  // 1. PROJECT ANALYTICS (/api/projects/:projectId/analytics)
  // =========================================================================
  describe('GET /api/projects/:projectId/analytics', () => {
    it('should return correct task totals and status groupings', async () => {
      const res = await request(app)
        .get(`/api/projects/${projA1Id}/analytics`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(data.projectId).toBe(projA1Id);
      expect(data.totalTasks).toBe(5);
      expect(data.completedTasks).toBe(1); // Task 1
      expect(data.inProgressTasks).toBe(1); // Task 2
      expect(data.inReviewTasks).toBe(1); // Task 3
      expect(data.todoTasks).toBe(2); // Task 4, Task 5
      expect(data.pendingTasks).toBe(4); // 5 - 1 = 4

      expect(data.tasksByStatus.DONE).toBe(1);
      expect(data.tasksByStatus.IN_PROGRESS).toBe(1);
      expect(data.tasksByStatus.IN_REVIEW).toBe(1);
      expect(data.tasksByStatus.TODO).toBe(2);
    });

    it('should return correct priority groupings', async () => {
      const res = await request(app)
        .get(`/api/projects/${projA1Id}/analytics`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.tasksByPriority.HIGH).toBe(2); // Task 1, Task 3
      expect(data.tasksByPriority.MEDIUM).toBe(2); // Task 2, Task 5
      expect(data.tasksByPriority.LOW).toBe(1); // Task 4
    });

    it('should accurately calculate overdue tasks (excluding completed tasks)', async () => {
      const res = await request(app)
        .get(`/api/projects/${projA1Id}/analytics`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      // Task 2 (IN_PROGRESS past due) + Task 4 (TODO past due) = 2 overdue
      // Task 1 is DONE with past due date, so it is NOT overdue
      expect(data.overdueTasks).toBe(2);
    });

    it('should accurately compute task completion percentage', async () => {
      const res = await request(app)
        .get(`/api/projects/${projA1Id}/analytics`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      // 1 done out of 5 total = 20%
      expect(data.completionPercentage).toBe(20);
    });

    it('should calculate member workload and unassigned tasks', async () => {
      const res = await request(app)
        .get(`/api/projects/${projA1Id}/analytics`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.unassignedTasks).toBe(1); // Task 5

      expect(data.memberWorkload).toBeInstanceOf(Array);
      const memberEntry = data.memberWorkload.find((m: any) => m.user.id === memberId);
      expect(memberEntry).toBeDefined();
      expect(memberEntry.totalTasks).toBe(2); // Task 1, Task 2
      expect(memberEntry.completedTasks).toBe(1); // Task 1
      expect(memberEntry.activeTasks).toBe(1); // Task 2

      const leadEntry = data.memberWorkload.find((m: any) => m.user.id === leadId);
      expect(leadEntry).toBeDefined();
      expect(leadEntry.totalTasks).toBe(2); // Task 3, Task 4
      expect(leadEntry.completedTasks).toBe(0);
      expect(leadEntry.activeTasks).toBe(2);
    });

    it('should return recent activity trend data', async () => {
      const res = await request(app)
        .get(`/api/projects/${projA1Id}/analytics`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.recentActivityTrend).toBeInstanceOf(Array);
      expect(data.recentActivityTrend.length).toBe(7);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayTrend = data.recentActivityTrend.find((t: any) => t.date === todayStr);
      expect(todayTrend).toBeDefined();
      expect(todayTrend.count).toBeGreaterThanOrEqual(2);
    });

    it('should handle projects with zero tasks gracefully (0% completion, no NaN)', async () => {
      const res = await request(app)
        .get(`/api/projects/${projA2EmptyId}/analytics`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.totalTasks).toBe(0);
      expect(data.completedTasks).toBe(0);
      expect(data.completionPercentage).toBe(0);
      expect(data.overdueTasks).toBe(0);
      expect(data.unassignedTasks).toBe(0);
    });

    it('should allow project VIEWER role to view project analytics', async () => {
      const res = await request(app)
        .get(`/api/projects/${projA1Id}/analytics`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projectId).toBe(projA1Id);
    });

    it('should allow System ADMIN to view any project analytics', async () => {
      const res = await request(app)
        .get(`/api/projects/${projA1Id}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should prevent non-members from viewing project analytics (403)', async () => {
      const res = await request(app)
        .get(`/api/projects/${projA1Id}/analytics`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_PROJECT_ACCESS');
    });

    it('should enforce cross-project isolation', async () => {
      // Member of Project A1 cannot access Project B1 analytics
      const res = await request(app)
        .get(`/api/projects/${projB1Id}/analytics`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_PROJECT_ACCESS');
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .get(`/api/projects/${projA1Id}/analytics`);

      expect(res.status).toBe(401);
    });

    it('should return 404 for nonexistent project ID', async () => {
      const res = await request(app)
        .get('/api/projects/00000000-0000-0000-0000-000000000000/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should return 400 for malformed project ID', async () => {
      const res = await request(app)
        .get('/api/projects/bad--id!!/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should also be accessible via alternate route /api/analytics/projects/:projectId', async () => {
      const res = await request(app)
        .get(`/api/analytics/projects/${projA1Id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.projectId).toBe(projA1Id);
      expect(res.body.data.totalTasks).toBe(5);
    });
  });

  // =========================================================================
  // 2. WORKSPACE ANALYTICS (/api/workspaces/:workspaceId/analytics)
  // =========================================================================
  describe('GET /api/workspaces/:workspaceId/analytics', () => {
    it('should aggregate metrics across all projects in the workspace', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${wsAId}/analytics`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(data.workspaceId).toBe(wsAId);
      expect(data.totalProjects).toBe(2); // Proj A1 and Proj A2
      expect(data.activeProjects).toBe(1); // Proj A1 (IN_PROGRESS)
      expect(data.completedProjects).toBe(1); // Proj A2 (COMPLETED)

      expect(data.projectsByStatus.IN_PROGRESS).toBe(1);
      expect(data.projectsByStatus.COMPLETED).toBe(1);
      expect(data.projectsByStatus.PLANNING).toBe(0);

      expect(data.totalTasks).toBe(5);
      expect(data.completedTasks).toBe(1);
      expect(data.pendingTasks).toBe(4);
      expect(data.overdueTasks).toBe(2);
      expect(data.completionPercentage).toBe(20);
    });

    it('should provide project-wise completion breakdown', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${wsAId}/analytics`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.projectStats).toBeInstanceOf(Array);
      expect(data.projectStats.length).toBe(2);

      const p1 = data.projectStats.find((p: any) => p.id === projA1Id);
      expect(p1).toBeDefined();
      expect(p1.totalTasks).toBe(5);
      expect(p1.completedTasks).toBe(1);
      expect(p1.completionPercentage).toBe(20);

      const p2 = data.projectStats.find((p: any) => p.id === projA2EmptyId);
      expect(p2).toBeDefined();
      expect(p2.totalTasks).toBe(0);
      expect(p2.completionPercentage).toBe(0);
    });

    it('should provide team workload distribution across the workspace', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${wsAId}/analytics`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.teamWorkload).toBeInstanceOf(Array);

      const memberStats = data.teamWorkload.find((t: any) => t.user.id === memberId);
      expect(memberStats).toBeDefined();
      expect(memberStats.totalTasks).toBe(2);
      expect(memberStats.completedTasks).toBe(1);
      expect(memberStats.activeTasks).toBe(1);
    });

    it('should handle completely empty workspaces gracefully', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${wsEmptyId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.totalProjects).toBe(0);
      expect(data.activeProjects).toBe(0);
      expect(data.completedProjects).toBe(0);
      expect(data.totalTasks).toBe(0);
      expect(data.completedTasks).toBe(0);
      expect(data.completionPercentage).toBe(0);
      expect(data.projectStats).toEqual([]);
      expect(data.teamWorkload).toEqual([]);
    });

    it('should allow System ADMIN to view any workspace analytics', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${wsAId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should prevent outsider non-members from viewing workspace analytics (403)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${wsAId}/analytics`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_WORKSPACE_ACCESS');
    });

    it('should enforce cross-workspace isolation', async () => {
      // Member of WS A cannot view WS B analytics
      const res = await request(app)
        .get(`/api/workspaces/${wsBId}/analytics`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN_WORKSPACE_ACCESS');
    });

    it('should reject unauthenticated workspace analytics request with 401', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${wsAId}/analytics`);

      expect(res.status).toBe(401);
    });

    it('should return 404 for nonexistent workspace ID', async () => {
      const res = await request(app)
        .get('/api/workspaces/00000000-0000-0000-0000-000000000000/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('WORKSPACE_NOT_FOUND');
    });

    it('should return 400 for malformed workspace ID', async () => {
      const res = await request(app)
        .get('/api/workspaces/bad--workspace--id!!/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should also be accessible via alternate route /api/analytics/workspaces/:workspaceId', async () => {
      const res = await request(app)
        .get(`/api/analytics/workspaces/${wsAId}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.workspaceId).toBe(wsAId);
      expect(res.body.data.totalProjects).toBe(2);
    });
  });

  // =========================================================================
  // 3. WORKSPACES LISTING (/api/workspaces)
  // =========================================================================
  describe('GET /api/workspaces', () => {
    it('should list accessible workspaces for authenticated user', async () => {
      const res = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${leadToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);

      const wsIds = res.body.data.map((w: any) => w.id);
      expect(wsIds).toContain(wsAId);
    });

    it('should allow System ADMIN to list all workspaces', async () => {
      const res = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const wsIds = res.body.data.map((w: any) => w.id);
      expect(wsIds).toContain(wsAId);
      expect(wsIds).toContain(wsBId);
      expect(wsIds).toContain(wsEmptyId);
    });

    it('should reject unauthenticated request for workspaces with 401', async () => {
      const res = await request(app)
        .get('/api/workspaces');

      expect(res.status).toBe(401);
    });
  });
});

