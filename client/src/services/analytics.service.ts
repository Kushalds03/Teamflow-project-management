import { api } from './apiClient';

export interface ProjectAnalyticsData {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  statusBreakdown: {
    TODO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
  };
  priorityBreakdown: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  memberDistribution: Array<{
    memberId: string;
    name: string;
    avatarUrl: string | null;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  }>;
  unassignedTasks: number;
  recentActivityTrend: Array<{
    date: string;
    count: number;
  }>;
}

export interface WorkspaceAnalyticsData {
  workspaceId: string;
  workspaceName: string;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  statusBreakdown: {
    PLANNING: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  projectStats: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  }>;
  teamWorkload: Array<{
    memberId: string;
    name: string;
    avatarUrl: string | null;
    assignedProjects: number;
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
  }>;
}

export const analyticsService = {
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalyticsData> {
    return api.get<ProjectAnalyticsData>(`/projects/${projectId}/analytics`);
  },

  async getWorkspaceAnalytics(workspaceId: string): Promise<WorkspaceAnalyticsData> {
    return api.get<WorkspaceAnalyticsData>(`/workspaces/${workspaceId}/analytics`);
  }
};

