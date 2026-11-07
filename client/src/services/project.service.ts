import { api } from './apiClient';
import {
  mapBackendProjectToFrontend,
  toBackendProjectStatus,
  toBackendTaskPriority
} from '../utils/mappers';
import type { Project, TaskPriority, ProjectStatus } from '../types';

export interface CreateProjectPayload {
  name: string;
  description: string;
  workspaceId: string;
  dueDate: string;
  startDate?: string;
  priority?: TaskPriority;
  category?: string;
  leadId?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: TaskPriority;
  category?: string;
  dueDate?: string;
  startDate?: string;
  leadId?: string;
}

export const projectService = {
  async getProjects(params?: {
    workspaceId?: string;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<Project[]> {
    const query = new URLSearchParams();
    if (params?.workspaceId) query.set('workspaceId', params.workspaceId);
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString();
    const endpoint = `/projects${queryString ? `?${queryString}` : ''}`;
    const data = await api.get<any[]>(endpoint);
    return Array.isArray(data) ? data.map(mapBackendProjectToFrontend) : [];
  },

  async getProjectById(id: string): Promise<Project> {
    const data = await api.get<any>(`/projects/${id}`);
    return mapBackendProjectToFrontend(data);
  },

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    const body: Record<string, any> = {
      name: payload.name,
      description: payload.description,
      workspaceId: payload.workspaceId,
      dueDate: new Date(payload.dueDate).toISOString()
    };

    if (payload.startDate) {
      body.startDate = new Date(payload.startDate).toISOString();
    }
    if (payload.priority) {
      body.priority = toBackendTaskPriority(payload.priority);
    }
    if (payload.category) {
      body.category = payload.category;
    }
    if (payload.leadId) {
      body.leadId = payload.leadId;
    }

    const data = await api.post<any>('/projects', body);
    return mapBackendProjectToFrontend(data);
  },

  async updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
    const body: Record<string, any> = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.category !== undefined) body.category = payload.category;
    if (payload.leadId !== undefined) body.leadId = payload.leadId;
    if (payload.status) body.status = toBackendProjectStatus(payload.status);
    if (payload.priority) body.priority = toBackendTaskPriority(payload.priority);
    if (payload.dueDate) body.dueDate = new Date(payload.dueDate).toISOString();
    if (payload.startDate) body.startDate = new Date(payload.startDate).toISOString();

    const data = await api.put<any>(`/projects/${id}`, body);
    return mapBackendProjectToFrontend(data);
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  async addMember(projectId: string, userId: string, role = 'CONTRIBUTOR'): Promise<any> {
    return api.post(`/projects/${projectId}/members`, { userId, role });
  }
};

