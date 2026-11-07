import { api } from './apiClient';
import {
  mapBackendTaskToFrontend,
  toBackendTaskPriority,
  toBackendTaskStatus
} from '../utils/mappers';
import type { Task, TaskPriority, TaskStatus } from '../types';

export interface CreateTaskPayload {
  title: string;
  description: string;
  projectId: string;
  assigneeId?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate: string;
  tags?: string[];
  estimatedHours?: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  assigneeId?: string | null;
  tags?: string[];
  estimatedHours?: number;
}

export const taskService = {
  async getTasks(params?: {
    projectId?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tasks: Task[]; total?: number }> {
    const query = new URLSearchParams();
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.assigneeId) query.set('assigneeId', params.assigneeId);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
    const data = await api.get<any[]>(endpoint);
    const tasks = Array.isArray(data) ? data.map((t) => mapBackendTaskToFrontend(t)) : [];
    return { tasks, total: tasks.length };
  },

  async getTaskById(id: string): Promise<Task> {
    const data = await api.get<any>(`/tasks/${id}`);
    return mapBackendTaskToFrontend(data);
  },

  async createTask(payload: CreateTaskPayload): Promise<Task> {
    const body: Record<string, any> = {
      title: payload.title,
      description: payload.description,
      projectId: payload.projectId,
      dueDate: new Date(payload.dueDate).toISOString()
    };

    if (payload.assigneeId) body.assigneeId = payload.assigneeId;
    if (payload.priority) body.priority = toBackendTaskPriority(payload.priority);
    if (payload.status) body.status = toBackendTaskStatus(payload.status);
    if (payload.tags) body.tags = payload.tags;
    if (payload.estimatedHours) body.estimatedHours = payload.estimatedHours;

    const data = await api.post<any>('/tasks', body);
    return mapBackendTaskToFrontend(data);
  },

  async updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
    const body: Record<string, any> = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.priority !== undefined) body.priority = toBackendTaskPriority(payload.priority);
    if (payload.status !== undefined) body.status = toBackendTaskStatus(payload.status);
    if (payload.dueDate !== undefined) body.dueDate = new Date(payload.dueDate).toISOString();
    if (payload.assigneeId !== undefined) body.assigneeId = payload.assigneeId;
    if (payload.tags !== undefined) body.tags = payload.tags;
    if (payload.estimatedHours !== undefined) body.estimatedHours = payload.estimatedHours;

    const data = await api.put<any>(`/tasks/${id}`, body);
    return mapBackendTaskToFrontend(data);
  },

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const backendStatus = toBackendTaskStatus(status);
    const data = await api.patch<any>(`/tasks/${id}/status`, { status: backendStatus });
    return mapBackendTaskToFrontend(data);
  },

  async updateTaskAssignee(id: string, assigneeId: string | null): Promise<Task> {
    const data = await api.patch<any>(`/tasks/${id}/assignee`, { assigneeId });
    return mapBackendTaskToFrontend(data);
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  }
};

