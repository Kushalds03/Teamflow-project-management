import { PrismaClient, SystemRole, ProjectRole, ProjectStatus, TaskStatus, TaskPriority, ActivityType } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TeamFlow database seed...');

  // Production safeguard: refuse to run or create development accounts in production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusing to seed development credentials in production environment.');
    process.exit(1);
  }

  // Development password must come from environment variable
  const devSeedPassword = process.env.DEV_SEED_PASSWORD;
  if (!devSeedPassword) {
    console.error('❌ DEV_SEED_PASSWORD environment variable is required to seed development accounts.');
    console.error('   Please define DEV_SEED_PASSWORD in server/.env (e.g. DEV_SEED_PASSWORD="<dev-password>")');
    process.exit(1);
  }

  // Hash the development password using the application work factor
  const devPasswordHash = await hashPassword(devSeedPassword);

  // 1. Seed Users (safe, idempotent upsert respecting existing credentials)
  const usersData = [
    {
      id: 'usr-1',
      name: 'Alex Morgan',
      email: 'alex.morgan@teamflow.io',
      role: SystemRole.ADMIN,
      jobTitle: 'Lead Full-Stack Architect',
      department: 'Engineering',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      bio: 'Specializing in distributed systems, modern React micro-frontends, and high-performance developer tooling.'
    },
    {
      id: 'usr-2',
      name: 'Sarah Chen',
      email: 'sarah.chen@teamflow.io',
      role: SystemRole.USER,
      jobTitle: 'Staff Frontend Engineer',
      department: 'Engineering',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      bio: 'Component systems expert with focus on accessibility and frontend performance.'
    },
    {
      id: 'usr-3',
      name: 'David Miller',
      email: 'david.miller@teamflow.io',
      role: SystemRole.USER,
      jobTitle: 'Senior Backend Engineer',
      department: 'Infrastructure',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      bio: 'PostgreSQL, Go, and high-throughput messaging pipelines.'
    },
    {
      id: 'usr-4',
      name: 'Elena Rostova',
      email: 'elena.rostova@teamflow.io',
      role: SystemRole.USER,
      jobTitle: 'Cloud & DevOps Architect',
      department: 'DevOps',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      status: 'away',
      bio: 'Kubernetes orchestration, Terraform infrastructure as code, and CI/CD automation.'
    },
    {
      id: 'usr-5',
      name: 'Marcus Vance',
      email: 'marcus.vance@teamflow.io',
      role: SystemRole.USER,
      jobTitle: 'Lead UI/UX Designer',
      department: 'Design',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      bio: 'Design systems creator, interaction designer, and WCAG accessibility champion.'
    },
    {
      id: 'usr-6',
      name: 'Priya Patel',
      email: 'priya.patel@teamflow.io',
      role: SystemRole.USER,
      jobTitle: 'QA & Test Automation Lead',
      department: 'Engineering',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      status: 'offline',
      bio: 'Automated end-to-end testing, Cypress frameworks, and load testing specialist.'
    },
    {
      id: 'usr-7',
      name: 'Jordan Reed',
      email: 'jordan.reed@teamflow.io',
      role: SystemRole.USER,
      jobTitle: 'Product Specialist',
      department: 'Product',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      bio: 'Agile sprint planning, backlog grooming, and customer discovery.'
    }
  ];

  for (const u of usersData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: u.email }
    });

    if (existingUser) {
      // Preserve existing credentials unless password is empty or reset is explicitly forced
      const shouldUpdatePassword =
        !existingUser.passwordHash ||
        existingUser.passwordHash === '' ||
        process.env.RESET_DEV_PASSWORDS === 'true';

      await prisma.user.update({
        where: { email: u.email },
        data: {
          name: u.name,
          jobTitle: u.jobTitle,
          department: u.department,
          avatarUrl: u.avatarUrl,
          status: u.status,
          bio: u.bio,
          ...(shouldUpdatePassword ? { passwordHash: devPasswordHash } : {})
        }
      });
    } else {
      await prisma.user.create({
        data: {
          id: u.id,
          email: u.email,
          name: u.name,
          passwordHash: devPasswordHash,
          role: u.role,
          jobTitle: u.jobTitle,
          department: u.department,
          avatarUrl: u.avatarUrl,
          status: u.status,
          bio: u.bio
        }
      });
    }
  }
  console.log(`✅ Seeded ${usersData.length} users (secured with hashed dev credentials)`);

  // 2. Seed Workspaces
  const workspacesData = [
    {
      id: 'ws-1',
      name: 'Acme Core Engineering',
      slug: 'acme-core-engineering',
      description: 'Primary product engineering and platform architecture workspace.'
    },
    {
      id: 'ws-2',
      name: 'Mobile Platform Team',
      slug: 'mobile-platform-team',
      description: 'iOS and Android client applications development.'
    },
    {
      id: 'ws-3',
      name: 'Enterprise Cloud Services',
      slug: 'enterprise-cloud-services',
      description: 'Infrastructure, DevOps, and cloud reliability team.'
    }
  ];

  for (const ws of workspacesData) {
    await prisma.workspace.upsert({
      where: { slug: ws.slug },
      update: {
        name: ws.name,
        description: ws.description
      },
      create: {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        description: ws.description
      }
    });
  }
  console.log(`✅ Seeded ${workspacesData.length} workspaces`);

  // 3. Seed Projects
  const projectsData = [
    {
      id: 'proj-1',
      name: 'Website Redesign',
      description: 'Modernizing corporate customer portal with responsive Next.js frontend, micro-interactions, and accessibility.',
      status: ProjectStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      category: 'Frontend & UX',
      dueDate: new Date('2026-11-20'),
      startDate: new Date('2026-09-01'),
      workspaceId: 'ws-1',
      leadId: 'usr-1',
      members: [
        { userId: 'usr-1', role: ProjectRole.LEAD },
        { userId: 'usr-2', role: ProjectRole.CONTRIBUTOR },
        { userId: 'usr-5', role: ProjectRole.CONTRIBUTOR }
      ]
    },
    {
      id: 'proj-2',
      name: 'Mobile App Development',
      description: 'Cross-platform iOS and Android native experience featuring biometric authentication and offline sync.',
      status: ProjectStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      category: 'Mobile',
      dueDate: new Date('2026-12-15'),
      startDate: new Date('2026-09-15'),
      workspaceId: 'ws-2',
      leadId: 'usr-2',
      members: [
        { userId: 'usr-2', role: ProjectRole.LEAD },
        { userId: 'usr-3', role: ProjectRole.CONTRIBUTOR },
        { userId: 'usr-6', role: ProjectRole.CONTRIBUTOR }
      ]
    },
    {
      id: 'proj-3',
      name: 'Marketing Dashboard',
      description: 'High-throughput analytics hub aggregating marketing campaign ROI, funnel metrics, and automated reporting.',
      status: ProjectStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      category: 'Analytics',
      dueDate: new Date('2026-11-30'),
      startDate: new Date('2026-10-01'),
      workspaceId: 'ws-1',
      leadId: 'usr-5',
      members: [
        { userId: 'usr-5', role: ProjectRole.LEAD },
        { userId: 'usr-1', role: ProjectRole.CONTRIBUTOR },
        { userId: 'usr-7', role: ProjectRole.CONTRIBUTOR }
      ]
    },
    {
      id: 'proj-4',
      name: 'API Integration & Auth Gateway',
      description: 'Unified enterprise API gateway with OAuth2, rate limiting, and third-party payment infrastructure.',
      status: ProjectStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      category: 'Backend & Security',
      dueDate: new Date('2026-11-05'),
      startDate: new Date('2026-08-15'),
      workspaceId: 'ws-1',
      leadId: 'usr-3',
      members: [
        { userId: 'usr-3', role: ProjectRole.LEAD },
        { userId: 'usr-4', role: ProjectRole.CONTRIBUTOR }
      ]
    },
    {
      id: 'proj-5',
      name: 'Cloud Microservices Migration',
      description: 'Containerized Kubernetes cluster migration for zero-downtime blue/green deployment strategy.',
      status: ProjectStatus.PLANNING,
      priority: TaskPriority.MEDIUM,
      category: 'DevOps',
      dueDate: new Date('2027-01-20'),
      startDate: new Date('2026-10-15'),
      workspaceId: 'ws-3',
      leadId: 'usr-4',
      members: [
        { userId: 'usr-4', role: ProjectRole.LEAD },
        { userId: 'usr-3', role: ProjectRole.CONTRIBUTOR }
      ]
    },
    {
      id: 'proj-6',
      name: 'Design System V2 & Tokens',
      description: 'WCAG AAA accessible UI design tokens, dark mode foundations, and multi-brand Figma-to-code pipelines.',
      status: ProjectStatus.COMPLETED,
      priority: TaskPriority.MEDIUM,
      category: 'Design System',
      dueDate: new Date('2026-10-20'),
      startDate: new Date('2026-07-01'),
      workspaceId: 'ws-1',
      leadId: 'usr-5',
      members: [
        { userId: 'usr-5', role: ProjectRole.LEAD },
        { userId: 'usr-2', role: ProjectRole.CONTRIBUTOR }
      ]
    }
  ];

  for (const p of projectsData) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        status: p.status,
        priority: p.priority,
        category: p.category,
        dueDate: p.dueDate,
        startDate: p.startDate,
        workspaceId: p.workspaceId,
        leadId: p.leadId
      },
      create: {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        priority: p.priority,
        category: p.category,
        dueDate: p.dueDate,
        startDate: p.startDate,
        workspaceId: p.workspaceId,
        leadId: p.leadId
      }
    });

    // Seed Memberships
    for (const m of p.members) {
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: p.id,
            userId: m.userId
          }
        },
        update: {
          role: m.role
        },
        create: {
          projectId: p.id,
          userId: m.userId,
          role: m.role
        }
      });
    }
  }
  console.log(`✅ Seeded ${projectsData.length} projects and memberships`);

  // 4. Seed Tasks
  const tasksData = [
    {
      id: 'task-101',
      title: 'Implement OAuth2 token refresh & session revocation',
      description: 'Ensure token rotation works seamlessly with Redis blacklist and handles multiple concurrent tab refreshes.',
      projectId: 'proj-4',
      assigneeId: 'usr-3',
      creatorId: 'usr-1',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_REVIEW,
      dueDate: new Date('2026-11-02'),
      estimatedHours: 12,
      tags: ['Security', 'OAuth', 'Backend']
    },
    {
      id: 'task-102',
      title: 'Design responsive navigation and collapsible sidebar',
      description: 'Build enterprise navigation with dark navy theme, smooth toggle animations, and keyboard accessibility.',
      projectId: 'proj-1',
      assigneeId: 'usr-1',
      creatorId: 'usr-1',
      priority: TaskPriority.HIGH,
      status: TaskStatus.DONE,
      dueDate: new Date('2026-10-25'),
      estimatedHours: 8,
      tags: ['UI', 'React', 'Tailwind']
    },
    {
      id: 'task-103',
      title: 'Setup biometric authentication flow for iOS/Android',
      description: 'Implement FaceID and fingerprint scanner fallback with encrypted Keychain/Keystore credential storage.',
      projectId: 'proj-2',
      assigneeId: 'usr-2',
      creatorId: 'usr-2',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      dueDate: new Date('2026-11-10'),
      estimatedHours: 16,
      tags: ['Mobile', 'Security', 'Auth']
    },
    {
      id: 'task-104',
      title: 'Build interactive Recharts analytics graphs',
      description: 'Render responsive bar and donut charts for task status distribution and weekly velocity tracking.',
      projectId: 'proj-3',
      assigneeId: 'usr-1',
      creatorId: 'usr-5',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.IN_PROGRESS,
      dueDate: new Date('2026-11-08'),
      estimatedHours: 10,
      tags: ['Frontend', 'Analytics', 'Charts']
    },
    {
      id: 'task-105',
      title: 'Configure automated CI/CD pipeline in GitHub Actions',
      description: 'Add linting, typecheck, unit tests, and preview deployment triggers on pull request creation.',
      projectId: 'proj-5',
      assigneeId: 'usr-4',
      creatorId: 'usr-4',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      dueDate: new Date('2026-11-14'),
      estimatedHours: 14,
      tags: ['DevOps', 'CI/CD', 'GitHub']
    },
    {
      id: 'task-106',
      title: 'Create Figma design system components & dark tokens',
      description: 'Standardize button, modal, form input, and dropdown variants with complete WCAG contrast compliance.',
      projectId: 'proj-6',
      assigneeId: 'usr-5',
      creatorId: 'usr-5',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.DONE,
      dueDate: new Date('2026-10-18'),
      estimatedHours: 20,
      tags: ['Design', 'Figma', 'Tokens']
    },
    {
      id: 'task-107',
      title: 'Optimize Postgres indexing on activity and task logs',
      description: 'Introduce compound indexes on (projectId, status) and (assigneeId) to ensure sub-10ms query latency.',
      projectId: 'proj-4',
      assigneeId: 'usr-3',
      creatorId: 'usr-3',
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      dueDate: new Date('2026-11-04'),
      estimatedHours: 6,
      tags: ['Database', 'Postgres', 'Performance']
    },
    {
      id: 'task-108',
      title: 'Implement End-to-End Cypress test suite',
      description: 'Automate critical user journeys: task creation, drag-and-drop kanban movements, and settings saves.',
      projectId: 'proj-1',
      assigneeId: 'usr-6',
      creatorId: 'usr-1',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.IN_REVIEW,
      dueDate: new Date('2026-11-09'),
      estimatedHours: 18,
      tags: ['QA', 'Automation', 'Cypress']
    },
    {
      id: 'task-109',
      title: 'Integrate Stripe customer subscription webhooks',
      description: 'Process asynchronous invoice.paid, customer.subscription.updated, and dispute webhooks with retry queuing.',
      projectId: 'proj-4',
      assigneeId: 'usr-3',
      creatorId: 'usr-1',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      dueDate: new Date('2026-11-07'),
      estimatedHours: 15,
      tags: ['Stripe', 'Billing', 'API']
    },
    {
      id: 'task-110',
      title: 'Conduct user discovery interviews for Sprint 27',
      description: 'Interview 5 enterprise engineering managers to prioritize Gantt roadmap timeline views.',
      projectId: 'proj-3',
      assigneeId: 'usr-7',
      creatorId: 'usr-7',
      priority: TaskPriority.LOW,
      status: TaskStatus.TODO,
      dueDate: new Date('2026-11-12'),
      estimatedHours: 8,
      tags: ['Product', 'Research', 'Discovery']
    }
  ];

  for (const t of tasksData) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {
        title: t.title,
        description: t.description,
        projectId: t.projectId,
        assigneeId: t.assigneeId,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
        tags: t.tags
      },
      create: {
        id: t.id,
        title: t.title,
        description: t.description,
        projectId: t.projectId,
        assigneeId: t.assigneeId,
        creatorId: t.creatorId,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
        tags: t.tags
      }
    });
  }
  console.log(`✅ Seeded ${tasksData.length} tasks`);

  // 5. Seed Activities
  const activitiesData = [
    {
      id: 'act-1',
      type: ActivityType.TASK_COMPLETED,
      title: 'Task marked as Done',
      description: 'Alex completed "Design responsive navigation and collapsible sidebar"',
      userId: 'usr-1',
      projectId: 'proj-1',
      taskId: 'task-102'
    },
    {
      id: 'act-2',
      type: ActivityType.PROJECT_CREATED,
      title: 'New project created',
      description: 'Marcus launched "Marketing Dashboard" analytics platform',
      userId: 'usr-5',
      projectId: 'proj-3'
    },
    {
      id: 'act-3',
      type: ActivityType.TASK_CREATED,
      title: 'New task created',
      description: 'David added "Integrate Stripe customer subscription webhooks"',
      userId: 'usr-3',
      projectId: 'proj-4',
      taskId: 'task-109'
    },
    {
      id: 'act-4',
      type: ActivityType.TASK_STATUS_CHANGED,
      title: 'Status changed to In Review',
      description: 'Priya moved "Implement End-to-End Cypress test suite" to review',
      userId: 'usr-6',
      projectId: 'proj-1',
      taskId: 'task-108'
    },
    {
      id: 'act-5',
      type: ActivityType.COMMENT_ADDED,
      title: 'New comment posted',
      description: 'Elena commented on "Configure automated CI/CD pipeline in GitHub Actions"',
      userId: 'usr-4',
      projectId: 'proj-5',
      taskId: 'task-105'
    }
  ];

  for (const a of activitiesData) {
    const existing = await prisma.activity.findUnique({ where: { id: a.id } });
    if (!existing) {
      await prisma.activity.create({
        data: {
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description,
          userId: a.userId,
          projectId: a.projectId,
          taskId: a.taskId
        }
      });
    }
  }
  console.log(`✅ Seeded ${activitiesData.length} activity log items`);

  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
