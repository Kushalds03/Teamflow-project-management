import type { User, Project, Task, ActivityItem, NotificationItem, UserSettings } from '../types';

export const currentUser: User = {
  id: 'usr-1',
  name: 'Alex Morgan',
  email: 'alex.morgan@teamflow.io',
  role: 'Lead Full-Stack Architect',
  department: 'Engineering',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  projectsCount: 4,
  completedTasks: 38,
  status: 'active'
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: 'usr-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@teamflow.io',
    role: 'Staff Frontend Engineer',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    projectsCount: 3,
    completedTasks: 42,
    status: 'active'
  },
  {
    id: 'usr-3',
    name: 'David Miller',
    email: 'david.miller@teamflow.io',
    role: 'Senior Backend Engineer',
    department: 'Infrastructure',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    projectsCount: 4,
    completedTasks: 29,
    status: 'active'
  },
  {
    id: 'usr-4',
    name: 'Elena Rostova',
    email: 'elena.rostova@teamflow.io',
    role: 'Cloud & DevOps Architect',
    department: 'DevOps',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    projectsCount: 2,
    completedTasks: 31,
    status: 'away'
  },
  {
    id: 'usr-5',
    name: 'Marcus Vance',
    email: 'marcus.vance@teamflow.io',
    role: 'Lead UI/UX Designer',
    department: 'Design',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    projectsCount: 3,
    completedTasks: 24,
    status: 'active'
  },
  {
    id: 'usr-6',
    name: 'Priya Patel',
    email: 'priya.patel@teamflow.io',
    role: 'QA & Test Automation Lead',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    projectsCount: 3,
    completedTasks: 35,
    status: 'offline'
  },
  {
    id: 'usr-7',
    name: 'Jordan Reed',
    email: 'jordan.reed@teamflow.io',
    role: 'Product Specialist',
    department: 'Product',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    projectsCount: 2,
    completedTasks: 19,
    status: 'active'
  }
];

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    description: 'Modernizing corporate customer portal with responsive Next.js frontend, micro-interactions, and accessibility.',
    status: 'In Progress',
    progress: 74,
    dueDate: '2026-11-20',
    startDate: '2026-09-01',
    leadId: 'usr-1',
    leadName: 'Alex Morgan',
    members: [mockUsers[0], mockUsers[1], mockUsers[4]],
    category: 'Frontend & UX',
    priority: 'High',
    totalTasks: 18,
    completedTasks: 13
  },
  {
    id: 'proj-2',
    name: 'Mobile App Development',
    description: 'Cross-platform iOS and Android native experience featuring biometric authentication and offline sync.',
    status: 'In Progress',
    progress: 58,
    dueDate: '2026-12-15',
    startDate: '2026-09-15',
    leadId: 'usr-2',
    leadName: 'Sarah Chen',
    members: [mockUsers[1], mockUsers[2], mockUsers[5]],
    category: 'Mobile',
    priority: 'High',
    totalTasks: 24,
    completedTasks: 14
  },
  {
    id: 'proj-3',
    name: 'Marketing Dashboard',
    description: 'High-throughput analytics hub aggregating marketing campaign ROI, funnel metrics, and automated reporting.',
    status: 'In Progress',
    progress: 42,
    dueDate: '2026-11-30',
    startDate: '2026-10-01',
    leadId: 'usr-5',
    leadName: 'Marcus Vance',
    members: [mockUsers[4], mockUsers[0], mockUsers[6]],
    category: 'Analytics',
    priority: 'Medium',
    totalTasks: 14,
    completedTasks: 6
  },
  {
    id: 'proj-4',
    name: 'API Integration & Auth Gateway',
    description: 'Unified enterprise API gateway with OAuth2, rate limiting, and third-party payment infrastructure.',
    status: 'In Progress',
    progress: 88,
    dueDate: '2026-11-05',
    startDate: '2026-08-15',
    leadId: 'usr-3',
    leadName: 'David Miller',
    members: [mockUsers[2], mockUsers[3]],
    category: 'Backend & Security',
    priority: 'High',
    totalTasks: 16,
    completedTasks: 14
  },
  {
    id: 'proj-5',
    name: 'Cloud Microservices Migration',
    description: 'Containerized Kubernetes cluster migration for zero-downtime blue/green deployment strategy.',
    status: 'Planning',
    progress: 25,
    dueDate: '2027-01-20',
    startDate: '2026-10-15',
    leadId: 'usr-4',
    leadName: 'Elena Rostova',
    members: [mockUsers[3], mockUsers[2]],
    category: 'DevOps',
    priority: 'Medium',
    totalTasks: 12,
    completedTasks: 3
  },
  {
    id: 'proj-6',
    name: 'Design System V2 & Tokens',
    description: 'WCAG AAA accessible UI design tokens, dark mode foundations, and multi-brand Figma-to-code pipelines.',
    status: 'Completed',
    progress: 100,
    dueDate: '2026-10-20',
    startDate: '2026-07-01',
    leadId: 'usr-5',
    leadName: 'Marcus Vance',
    members: [mockUsers[4], mockUsers[1]],
    category: 'Design System',
    priority: 'Medium',
    totalTasks: 15,
    completedTasks: 15
  }
];

export const initialTasks: Task[] = [
  {
    id: 'task-101',
    title: 'Implement OAuth2 token refresh & session revocation',
    description: 'Ensure token rotation works seamlessly with Redis blacklist and handles multiple concurrent tab refreshes.',
    projectId: 'proj-4',
    projectName: 'API Integration & Auth Gateway',
    assignee: mockUsers[2],
    priority: 'High',
    status: 'In Review',
    dueDate: '2026-11-02',
    estimatedHours: 12,
    tags: ['Security', 'OAuth', 'Backend'],
    createdAt: '2026-10-20'
  },
  {
    id: 'task-102',
    title: 'Design responsive navigation and collapsible sidebar',
    description: 'Build enterprise navigation with dark navy theme, smooth toggle animations, and keyboard accessibility.',
    projectId: 'proj-1',
    projectName: 'Website Redesign',
    assignee: mockUsers[0],
    priority: 'High',
    status: 'Done',
    dueDate: '2026-10-25',
    estimatedHours: 8,
    tags: ['UI', 'React', 'Tailwind'],
    createdAt: '2026-10-18'
  },
  {
    id: 'task-103',
    title: 'Setup biometric authentication flow for iOS/Android',
    description: 'Implement FaceID and fingerprint scanner fallback with encrypted Keychain/Keystore credential storage.',
    projectId: 'proj-2',
    projectName: 'Mobile App Development',
    assignee: mockUsers[1],
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-11-10',
    estimatedHours: 16,
    tags: ['Mobile', 'Security', 'Auth'],
    createdAt: '2026-10-21'
  },
  {
    id: 'task-104',
    title: 'Build interactive Recharts analytics graphs',
    description: 'Render responsive bar and donut charts for task status distribution and weekly velocity tracking.',
    projectId: 'proj-3',
    projectName: 'Marketing Dashboard',
    assignee: mockUsers[0],
    priority: 'Medium',
    status: 'In Progress',
    dueDate: '2026-11-08',
    estimatedHours: 10,
    tags: ['Frontend', 'Analytics', 'Charts'],
    createdAt: '2026-10-22'
  },
  {
    id: 'task-105',
    title: 'Configure automated CI/CD pipeline in GitHub Actions',
    description: 'Add linting, typecheck, unit tests, and preview deployment triggers on pull request creation.',
    projectId: 'proj-5',
    projectName: 'Cloud Microservices Migration',
    assignee: mockUsers[3],
    priority: 'Medium',
    status: 'To Do',
    dueDate: '2026-11-14',
    estimatedHours: 14,
    tags: ['DevOps', 'CI/CD', 'GitHub'],
    createdAt: '2026-10-24'
  },
  {
    id: 'task-106',
    title: 'Fix edge-case payment gateway webhook retries',
    description: 'Handle idempotent Stripe webhooks to prevent duplicate invoice records on network failure.',
    projectId: 'proj-4',
    projectName: 'API Integration & Auth Gateway',
    assignee: mockUsers[2],
    priority: 'High',
    status: 'Done',
    dueDate: '2026-10-22',
    estimatedHours: 6,
    tags: ['Stripe', 'Webhooks', 'Bugfix'],
    createdAt: '2026-10-15'
  },
  {
    id: 'task-107',
    title: 'Refactor typography & color token hierarchy in Figma',
    description: 'Ensure color tokens map directly to Tailwind CSS custom theme variables with accessible contrast.',
    projectId: 'proj-6',
    projectName: 'Design System V2 & Tokens',
    assignee: mockUsers[4],
    priority: 'Low',
    status: 'Done',
    dueDate: '2026-10-19',
    estimatedHours: 8,
    tags: ['Design', 'Tokens', 'Figma'],
    createdAt: '2026-10-10'
  },
  {
    id: 'task-108',
    title: 'Implement End-to-End Cypress test suite for Checkout',
    description: 'Cover cart checkout, address validation, coupon code application, and receipt confirmation.',
    projectId: 'proj-1',
    projectName: 'Website Redesign',
    assignee: mockUsers[5],
    priority: 'Medium',
    status: 'In Review',
    dueDate: '2026-11-04',
    estimatedHours: 12,
    tags: ['QA', 'E2E', 'Testing'],
    createdAt: '2026-10-23'
  },
  {
    id: 'task-109',
    title: 'Audit database slow queries and add missing indexes',
    description: 'Investigate Postgres connection pool spikes during batch analytics query execution.',
    projectId: 'proj-3',
    projectName: 'Marketing Dashboard',
    assignee: mockUsers[2],
    priority: 'High',
    status: 'To Do',
    dueDate: '2026-10-26', // Overdue for demonstration!
    estimatedHours: 8,
    tags: ['Database', 'PostgreSQL', 'Performance'],
    createdAt: '2026-10-19'
  },
  {
    id: 'task-110',
    title: 'Create project creation and task creation modal workflows',
    description: 'Provide form validation, member selector, and instant optimistic state updates.',
    projectId: 'proj-1',
    projectName: 'Website Redesign',
    assignee: mockUsers[0],
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-11-01',
    estimatedHours: 9,
    tags: ['UI', 'Forms', 'React'],
    createdAt: '2026-10-25'
  },
  {
    id: 'task-111',
    title: 'Define SLA and disaster recovery playbook',
    description: 'Document RTO/RPO targets, multi-region replication steps, and incident commander responsibilities.',
    projectId: 'proj-5',
    projectName: 'Cloud Microservices Migration',
    assignee: mockUsers[3],
    priority: 'Low',
    status: 'To Do',
    dueDate: '2026-11-28',
    estimatedHours: 18,
    tags: ['DevOps', 'Documentation', 'SLA'],
    createdAt: '2026-10-26'
  },
  {
    id: 'task-112',
    title: 'Customer onboarding survey funnel analytics',
    description: 'Track drop-off percentage across the 4-step registration wizard.',
    projectId: 'proj-3',
    projectName: 'Marketing Dashboard',
    assignee: mockUsers[6],
    priority: 'Medium',
    status: 'In Progress',
    dueDate: '2026-11-06',
    estimatedHours: 7,
    tags: ['Product', 'Analytics'],
    createdAt: '2026-10-24'
  }
];

export const initialActivities: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'task_completed',
    title: 'Task marked as Done',
    description: 'Sarah completed "Setup biometric authentication flow"',
    timestamp: '12 minutes ago',
    user: mockUsers[1],
    entityId: 'task-103'
  },
  {
    id: 'act-2',
    type: 'project_created',
    title: 'New project created',
    description: 'Alex launched "Website Redesign" sprint milestone',
    timestamp: '45 minutes ago',
    user: mockUsers[0],
    entityId: 'proj-1'
  },
  {
    id: 'act-3',
    type: 'member_assigned',
    title: 'Member assigned',
    description: 'David was assigned to "Audit database slow queries"',
    timestamp: '2 hours ago',
    user: mockUsers[2],
    entityId: 'task-109'
  },
  {
    id: 'act-4',
    type: 'task_status_changed',
    title: 'Status changed to In Review',
    description: 'Priya moved "Implement End-to-End Cypress test suite" to review',
    timestamp: '4 hours ago',
    user: mockUsers[5],
    entityId: 'task-108'
  },
  {
    id: 'act-5',
    type: 'comment_added',
    title: 'New comment posted',
    description: 'Elena commented on "Configure automated CI/CD pipeline"',
    timestamp: 'Yesterday at 4:30 PM',
    user: mockUsers[3],
    entityId: 'task-105'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Task Due Tomorrow',
    message: '"Audit database slow queries" is scheduled for completion soon.',
    time: '25m ago',
    read: false,
    type: 'warning'
  },
  {
    id: 'notif-2',
    title: 'Pull Request Approved',
    message: 'David approved your PR for "Design responsive navigation".',
    time: '2h ago',
    read: false,
    type: 'success'
  },
  {
    id: 'notif-3',
    title: 'New Project Member',
    message: 'Sarah added Priya Patel to the Website Redesign workspace.',
    time: '5h ago',
    read: true,
    type: 'info'
  }
];

export const defaultSettings: UserSettings = {
  name: 'Alex Morgan',
  email: 'alex.morgan@teamflow.io',
  role: 'Lead Full-Stack Architect',
  department: 'Engineering',
  bio: 'Specializing in distributed systems, modern React micro-frontends, and high-performance developer tooling.',
  theme: 'light',
  compactMode: false,
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: true,
  taskAssignmentAlerts: true
};
