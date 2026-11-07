import { api } from './apiClient';

export interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: {
    projects: number;
  };
}

export const workspaceService = {
  async getWorkspaces(): Promise<WorkspaceItem[]> {
    return api.get<WorkspaceItem[]>('/workspaces');
  }
};

