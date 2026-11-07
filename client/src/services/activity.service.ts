import { api } from './apiClient';
import { mapBackendActivityToFrontend } from '../utils/mappers';
import type { ActivityItem } from '../types';

export const activityService = {
  async getProjectActivities(
    projectId: string,
    params?: { limit?: number; page?: number }
  ): Promise<ActivityItem[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.page) query.set('page', String(params.page));

    const queryString = query.toString();
    const endpoint = `/projects/${projectId}/activities${queryString ? `?${queryString}` : ''}`;
    const data = await api.get<any[]>(endpoint);
    return Array.isArray(data) ? data.map(mapBackendActivityToFrontend) : [];
  },

  async getTaskActivities(
    taskId: string,
    params?: { limit?: number; page?: number }
  ): Promise<ActivityItem[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.page) query.set('page', String(params.page));

    const queryString = query.toString();
    const endpoint = `/tasks/${taskId}/activities${queryString ? `?${queryString}` : ''}`;
    const data = await api.get<any[]>(endpoint);
    return Array.isArray(data) ? data.map(mapBackendActivityToFrontend) : [];
  }
};

