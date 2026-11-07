import { api } from './apiClient';
import { mapBackendUserToFrontend, formatRelativeTime } from '../utils/mappers';
import type { User } from '../types';

export interface CommentItem {
  id: string;
  content: string;
  taskId: string;
  createdAt: string;
  updatedAt: string;
  relativeTime: string;
  author: User;
}

export const commentService = {
  async getComments(taskId: string): Promise<CommentItem[]> {
    const data = await api.get<any[]>(`/tasks/${taskId}/comments`);
    if (!Array.isArray(data)) return [];

    return data.map((c) => ({
      id: c.id,
      content: c.content,
      taskId: c.taskId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      relativeTime: formatRelativeTime(c.createdAt),
      author: mapBackendUserToFrontend(c.author)
    }));
  },

  async createComment(taskId: string, content: string): Promise<CommentItem> {
    const c = await api.post<any>(`/tasks/${taskId}/comments`, { content });
    return {
      id: c.id,
      content: c.content,
      taskId: c.taskId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      relativeTime: 'Just now',
      author: mapBackendUserToFrontend(c.author)
    };
  },

  async updateComment(commentId: string, content: string): Promise<CommentItem> {
    const c = await api.put<any>(`/comments/${commentId}`, { content });
    return {
      id: c.id,
      content: c.content,
      taskId: c.taskId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      relativeTime: formatRelativeTime(c.updatedAt),
      author: mapBackendUserToFrontend(c.author)
    };
  },

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  }
};

