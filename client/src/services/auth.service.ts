import { api, setStoredToken } from './apiClient';
import { mapBackendUserToFrontend } from '../utils/mappers';
import type { User } from '../types';

export interface AuthResponse {
  user: any;
  token?: string;
}

export const authService = {
  async getMe(): Promise<User | null> {
    try {
      const data = await api.get<{ user: any }>('/auth/me');
      return data && data.user ? mapBackendUserToFrontend(data.user) : null;
    } catch (err: any) {
      if (err.status === 401) {
        return null;
      }
      throw err;
    }
  },

  async login(credentials: { email: string; password: string }): Promise<User> {
    const data = await api.post<AuthResponse>('/auth/login', credentials);
    if (data.token) {
      setStoredToken(data.token);
    }
    return mapBackendUserToFrontend(data.user);
  },

  async register(registrationData: {
    name: string;
    email: string;
    password: string;
    jobTitle?: string;
    department?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const data = await api.post<AuthResponse>('/auth/register', registrationData);
    if (data.token) {
      setStoredToken(data.token);
    }
    return mapBackendUserToFrontend(data.user);
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      setStoredToken(null);
    }
  }
};

