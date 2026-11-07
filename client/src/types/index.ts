export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';
export type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold' | 'Planning';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  projectsCount: number;
  completedTasks: number;
  status: 'active' | 'away' | 'offline';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  startDate: string;
  leadId: string;
  leadName: string;
  members: User[];
  category: string;
  priority: TaskPriority;
  totalTasks: number;
  completedTasks: number;
  workspaceId?: string;
  workspaceName?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  assignee: User;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  estimatedHours?: number;
  tags: string[];
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'task_completed' | 'project_created' | 'task_created' | 'task_status_changed' | 'member_assigned' | 'comment_added';
  title: string;
  description: string;
  timestamp: string;
  user: User;
  entityId?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export interface UserSettings {
  name: string;
  email: string;
  role: string;
  department: string;
  bio: string;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  taskAssignmentAlerts: boolean;
}
