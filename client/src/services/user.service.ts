import { api } from './apiClient';
import { mapBackendUserToFrontend } from '../utils/mappers';
import type { User } from '../types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const data = await api.get<any[]>('/users');
    if (!Array.isArray(data)) return [];
    return data.map(mapBackendUserToFrontend);
  },

  async getProfile(): Promise<User> {
    const data = await api.get<any>('/users/profile');
    return mapBackendUserToFrontend(data);
  },

  async updateProfile(profileData: {
    name?: string;
    jobTitle?: string;
    department?: string;
    bio?: string;
    avatarUrl?: string;
    status?: 'active' | 'away' | 'offline';
  }): Promise<User> {
    const data = await api.put<any>('/users/profile', profileData);
    return mapBackendUserToFrontend(data);
  }
};

