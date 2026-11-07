/**
 * Unified API Client for TeamFlow
 * Supports credentials (cookies) + Bearer token fallback.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Token storage helpers
const TOKEN_KEY = 'teamflow_auth_token';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore local storage restrictions
  }
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // Send and receive HttpOnly cookies
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    throw new ApiError(
      `Network error: Unable to connect to TeamFlow API server at ${API_BASE_URL}. Ensure the backend is running.`,
      0,
      'NETWORK_ERROR'
    );
  }

  let json: ApiResponse<T> | null = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      json?.error?.message ||
      response.statusText ||
      `Request failed with status ${response.status}`;
    const errorCode = json?.error?.code || `HTTP_${response.status}`;

    if (response.status === 401) {
      // Clear token if expired
      setStoredToken(null);
    }

    throw new ApiError(errorMessage, response.status, errorCode, json?.error?.details);
  }

  return (json?.data !== undefined ? json.data : (json as unknown)) as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }),
  put: <T = any>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    }),
  patch: <T = any>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
};

