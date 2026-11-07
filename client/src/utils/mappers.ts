import type {
  Task,
  Project,
  User,
  ActivityItem,
  TaskPriority,
  TaskStatus,
  ProjectStatus
} from '../types';

export const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

// Status mappings
export const toBackendTaskStatus = (status: TaskStatus): string => {
  switch (status) {
    case 'To Do':
      return 'TODO';
    case 'In Progress':
      return 'IN_PROGRESS';
    case 'In Review':
      return 'IN_REVIEW';
    case 'Done':
      return 'DONE';
    default:
      return 'TODO';
  }
};

export const toFrontendTaskStatus = (status: string): TaskStatus => {
  switch (status?.toUpperCase()) {
    case 'TODO':
      return 'To Do';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'IN_REVIEW':
      return 'In Review';
    case 'DONE':
      return 'Done';
    default:
      return 'To Do';
  }
};

// Priority mappings
export const toBackendTaskPriority = (priority: TaskPriority): string => {
  switch (priority) {
    case 'High':
      return 'HIGH';
    case 'Medium':
      return 'MEDIUM';
    case 'Low':
      return 'LOW';
    default:
      return 'MEDIUM';
  }
};

export const toFrontendTaskPriority = (priority: string): TaskPriority => {
  switch (priority?.toUpperCase()) {
    case 'URGENT':
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    case 'LOW':
      return 'Low';
    default:
      return 'Medium';
  }
};

// Project status mappings
export const toBackendProjectStatus = (status: ProjectStatus): string => {
  switch (status) {
    case 'In Progress':
      return 'IN_PROGRESS';
    case 'Completed':
      return 'COMPLETED';
    case 'On Hold':
      return 'ON_HOLD';
    case 'Planning':
      return 'PLANNING';
    default:
      return 'IN_PROGRESS';
  }
};

export const toFrontendProjectStatus = (status: string): ProjectStatus => {
  switch (status?.toUpperCase()) {
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'ON_HOLD':
      return 'On Hold';
    case 'PLANNING':
      return 'Planning';
    case 'CANCELLED':
      return 'On Hold';
    default:
      return 'In Progress';
  }
};

// User mapper
export const mapBackendUserToFrontend = (user: any): User => {
  if (!user) {
    return {
      id: 'usr-unknown',
      name: 'Unassigned',
      email: '',
      role: 'Member',
      department: 'Engineering',
      avatar: DEFAULT_AVATAR,
      projectsCount: 0,
      completedTasks: 0,
      status: 'active'
    };
  }

  return {
    id: user.id,
    name: user.name || 'Anonymous User',
    email: user.email || '',
    role: user.jobTitle || (user.role === 'ADMIN' ? 'Administrator' : 'Team Member'),
    department: user.department || 'Engineering',
    avatar: user.avatarUrl || user.avatar || DEFAULT_AVATAR,
    projectsCount: user.projectsCount ?? (user._count?.memberships ?? 0) + (user._count?.ledProjects ?? 0),
    completedTasks: user.completedTasks ?? (user._count?.assignedTasks ?? 0),
    status: (user.status as 'active' | 'away' | 'offline') || 'active'
  };
};

// Project mapper
export const mapBackendProjectToFrontend = (p: any): Project => {
  const totalTasks = p._count?.tasks ?? (p.tasks ? p.tasks.length : (p.totalTasks ?? 0));
  const completedTasks = p.completedTasks ?? (
    p.tasks ? p.tasks.filter((t: any) => t.status === 'DONE').length : 0
  );
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (p.progress ?? 0);

  const members: User[] = Array.isArray(p.members)
    ? p.members.map((m: any) => mapBackendUserToFrontend(m.user || m))
    : [];

  // Ensure lead is present in members list if not already
  if (p.lead && !members.some((m) => m.id === p.lead.id)) {
    members.unshift(mapBackendUserToFrontend(p.lead));
  }

  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    status: toFrontendProjectStatus(p.status),
    progress,
    dueDate: p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : '',
    startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    leadId: p.leadId || p.lead?.id || '',
    leadName: p.lead?.name || 'Project Lead',
    members,
    category: p.category || 'General',
    priority: toFrontendTaskPriority(p.priority || 'MEDIUM'),
    totalTasks,
    completedTasks,
    workspaceId: p.workspaceId || p.workspace?.id || '',
    workspaceName: p.workspace?.name || ''
  };
};

// Task mapper
export const mapBackendTaskToFrontend = (t: any, projectLookup?: Map<string, string>): Task => {
  const projectName =
    t.project?.name ||
    (projectLookup && t.projectId ? projectLookup.get(t.projectId) : '') ||
    'Project';

  return {
    id: t.id,
    title: t.title,
    description: t.description || '',
    projectId: t.projectId,
    projectName,
    assignee: mapBackendUserToFrontend(t.assignee),
    priority: toFrontendTaskPriority(t.priority),
    status: toFrontendTaskStatus(t.status),
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
    estimatedHours: t.estimatedHours || undefined,
    tags: Array.isArray(t.tags) ? t.tags : [],
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  };
};

// Relative time helper
export const formatRelativeTime = (dateInput: string | Date): string => {
  try {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
};

// Activity mapper
export const mapBackendActivityToFrontend = (act: any): ActivityItem => {
  let mappedType: ActivityItem['type'] = 'task_status_changed';
  const typeStr = (act.type || '').toUpperCase();

  if (typeStr.includes('TASK_COMPLETED')) {
    mappedType = 'task_completed';
  } else if (typeStr.includes('PROJECT_CREATED')) {
    mappedType = 'project_created';
  } else if (typeStr.includes('TASK_CREATED')) {
    mappedType = 'task_created';
  } else if (typeStr.includes('MEMBER_ASSIGNED') || typeStr.includes('MEMBER_ADDED')) {
    mappedType = 'member_assigned';
  } else if (typeStr.includes('COMMENT_ADDED')) {
    mappedType = 'comment_added';
  } else if (typeStr.includes('STATUS')) {
    mappedType = 'task_status_changed';
  }

  const user = mapBackendUserToFrontend(act.actor);

  return {
    id: act.id,
    type: mappedType,
    title: act.action || 'Activity recorded',
    description: act.action || `${user.name} made an update`,
    timestamp: act.createdAt ? formatRelativeTime(act.createdAt) : 'Just now',
    user,
    entityId: act.entityId
  };
};

