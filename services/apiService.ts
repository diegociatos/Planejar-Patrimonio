/**
 * API Service - Planejar Patrimônio
 * Serviço para comunicação com o backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://app.planejarpatrimonio.com.br/api';

// Token storage
const TOKEN_KEY = 'planejar_token';
const USER_KEY = 'planejar_user';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): any | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setStoredAuth = (token: string, user: any): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// HTTP Client
const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getStoredToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro de conexão' }));
    throw new Error(error.error || error.message || `HTTP Error ${response.status}`);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();
  
  // API returns { success: true, data: {...} }, extract data
  if (json.success && json.data !== undefined) {
    return json.data as T;
  }
  
  return json as T;
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredAuth(data.token, data.user);
    return data;
  },

  logout: () => {
    clearStoredAuth();
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  forgotPassword: async (email: string) => {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  checkAuth: async () => {
    return request<{ user: any }>('/auth/me');
  },
};

// Users API
export const usersApi = {
  getAll: async () => {
    const data = await request<any[]>('/users');
    return { users: data };
  },

  getById: async (id: string) => {
    const data = await request<any>(`/users/${id}`);
    return { user: data };
  },

  create: async (userData: any) => {
    const data = await request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return { user: data };
  },

  update: async (id: string, userData: any) => {
    const data = await request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return { user: data };
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  resetPassword: async (id: string, newPassword?: string) => {
    return request<{ message: string }>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },
};

// Projects API
export const projectsApi = {
  getAll: async () => {
    const data = await request<any[]>('/projects');
    return { projects: data };
  },

  getById: async (id: string) => {
    const data = await request<any>(`/projects/${id}`);
    return { project: data };
  },

  create: async (projectData: any) => {
    const data = await request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
    return { project: data };
  },

  update: async (id: string, projectData: any) => {
    const data = await request<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
    return { project: data };
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Phase operations
  updatePhase: async (projectId: string, phaseNumber: number, phaseData: any) => {
    return request<{ phase: any }>(`/projects/${projectId}/phases/${phaseNumber}`, {
      method: 'PUT',
      body: JSON.stringify(phaseData),
    });
  },

  advancePhase: async (projectId: string, phaseNumber?: number) => {
    return request<{ project: any }>(`/projects/${projectId}/advance-phase`, {
      method: 'POST',
      body: JSON.stringify({ phaseNumber: phaseNumber || 1 }),
    });
  },

  // Chat operations
  getChat: async (projectId: string, chatType: 'client' | 'internal') => {
    return request<{ messages: any[] }>(`/projects/${projectId}/chat/${chatType}`);
  },

  sendMessage: async (projectId: string, chatType: 'client' | 'internal', content: string) => {
    return request<{ message: any }>(`/projects/${projectId}/chat/${chatType}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Phase chat operations
  sendPhaseMessage: async (projectId: string, phaseNumber: number, content: string) => {
    return request<{ message: any }>(`/projects/${projectId}/phases/${phaseNumber}/chat`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Activity log
  getActivityLog: async (projectId: string) => {
    return request<{ logs: any[] }>(`/projects/${projectId}/activity-log`);
  },

  addLogEntry: async (projectId: string, action: string) => {
    return request<{ entry: any }>(`/projects/${projectId}/activity-log`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  // Members
  addMember: async (projectId: string, userId: string) => {
    return request<{ project: any }>(`/projects/${projectId}/clients`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  removeMember: async (projectId: string, userId: string) => {
    return request<{ project: any }>(`/projects/${projectId}/clients/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Tasks API
export const tasksApi = {
  getByProject: async (projectId: string) => {
    return request<{ tasks: any[] }>(`/projects/${projectId}/tasks`);
  },

  create: async (projectId: string, phaseId: number, taskData: any) => {
    return request<{ task: any }>(`/projects/${projectId}/phases/${phaseId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  update: async (taskId: string, taskData: any) => {
    return request<{ task: any }>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  },

  complete: async (taskId: string) => {
    return request<{ task: any }>(`/tasks/${taskId}/complete`, {
      method: 'POST',
    });
  },

  approve: async (taskId: string) => {
    return request<{ task: any }>(`/tasks/${taskId}/approve`, {
      method: 'POST',
    });
  },

  delete: async (taskId: string) => {
    return request<{ message: string }>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};

// Documents API
export const documentsApi = {
  getByProject: async (projectId: string) => {
    return request<{ documents: any[] }>(`/projects/${projectId}/documents`);
  },

  getByPhase: async (projectId: string, phaseNumber: number) => {
    return request<{ documents: any[] }>(`/projects/${projectId}/phases/${phaseNumber}/documents`);
  },

  upload: async (projectId: string, phaseNumber: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getStoredToken();
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/phases/${phaseNumber}/documents`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro no upload' }));
      throw new Error(error.message);
    }

    return response.json();
  },

  delete: async (documentId: string) => {
    return request<{ message: string }>(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  },

  download: async (documentId: string) => {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao baixar documento');
    }

    return response.blob();
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async () => {
    return request<{ notifications: any[] }>('/notifications');
  },

  markAsRead: async (id: string) => {
    return request<{ notification: any }>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  markAllAsRead: async () => {
    return request<{ message: string }>('/notifications/read-all', {
      method: 'POST',
    });
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

// Health check
export const healthCheck = async () => {
  return request<{ status: string; timestamp: string }>('/health');
};

// Export all APIs
export const api = {
  auth: authApi,
  users: usersApi,
  projects: projectsApi,
  tasks: tasksApi,
  documents: documentsApi,
  notifications: notificationsApi,
  health: healthCheck,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
  clearStoredAuth,
};

export default api;
