/**
 * useApi Hook - Planejar Patrimônio
 * Hook customizado para integração com a API
 */

import { useState, useEffect, useCallback } from 'react';
import { User, Project, UserRole, Phase, ChatMessage, Task, LogEntry, Notification, NewClientData } from '../types';
import { api, getStoredUser, getStoredToken } from '../services/apiService';
import { getInitialProjectPhases } from '../constants';

export interface ApiStore {
  // State
  allUsers: User[];
  projects: Project[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];
  
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  
  // Data refresh
  refreshData: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  
  // Project actions
  createProject: (name: string, mainClient: NewClientData, additionalClients: NewClientData[], contractFile?: File) => Promise<Project | null>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  advancePhase: (projectId: string, phaseId: number) => Promise<void>;
  updatePhase: (projectId: string, phaseNumber: number, phaseData: Partial<Phase>) => Promise<void>;
  
  // User actions
  createUser: (userData: Partial<User>) => Promise<User | null>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<void>;
  
  // Chat actions
  sendProjectMessage: (projectId: string, chatType: 'client' | 'internal', content: string) => Promise<void>;
  sendPhaseMessage: (projectId: string, phaseId: number, content: string) => Promise<void>;
  
  // Task actions
  createTask: (projectId: string, phaseId: number, description: string, assigneeId?: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
  
  // Activity log
  addLogEntry: (projectId: string, action: string) => Promise<void>;
  
  // Project members
  addMemberToProject: (projectId: string, userId: string) => Promise<void>;
  removeMemberFromProject: (projectId: string, userId: string) => Promise<void>;
  createAndAddMember: (projectId: string, userData: NewClientData) => Promise<void>;
  
  // Setters for local state (for compatibility)
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

// Transform API user to frontend User type
const transformUser = (apiUser: any): User => {
  return {
    id: apiUser.id.toString(),
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role as UserRole,
    avatarUrl: apiUser.avatar_url,
    requiresPasswordChange: apiUser.requires_password_change,
    clientType: apiUser.client_type,
    qualificationData: apiUser.qualification_data ? JSON.parse(apiUser.qualification_data) : undefined,
    documents: apiUser.documents || [],
  };
};

// Transform API project to frontend Project type
const transformProject = (apiProject: any): Project => {
  const phases: Phase[] = apiProject.phases?.map((p: any) => ({
    id: p.phase_number,
    title: p.title,
    description: p.description,
    status: p.status,
    tasks: p.tasks || [],
    documents: p.documents || [],
    ...getPhaseData(p.phase_number, p.phase_data),
  })) || getInitialProjectPhases();
  
  return {
    id: apiProject.id.toString(),
    name: apiProject.name,
    status: apiProject.status,
    currentPhaseId: apiProject.current_phase_id || 1,
    consultantId: apiProject.consultant_id?.toString(),
    clientIds: apiProject.client_ids?.map((id: any) => id.toString()) || [],
    phases,
    internalChat: apiProject.internal_chat || [],
    clientChat: apiProject.client_chat || [],
    activityLog: apiProject.activity_log || [],
  };
};

// Get phase-specific data key
const getPhaseData = (phaseNumber: number, data: any) => {
  const phaseDataKey = `phase${phaseNumber}Data`;
  if (data) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return { [phaseDataKey]: parsed };
    } catch {
      return {};
    }
  }
  
  // Return default phase data
  const defaults: Record<number, any> = {
    1: { phase1Data: { isFormCompleted: false, meetingScheduled: false } },
    2: { phase2Data: { companyData: {}, partners: [], documents: {}, status: 'pending_client', processStatus: 'pending_start' } },
    3: { phase3Data: { assets: [], documents: [], status: 'pending_client' } },
    4: { phase4Data: { analysisDrafts: [], discussion: [], status: 'pending_draft', approvals: {} } },
    5: { phase5Data: { itbiProcesses: [] } },
    6: { phase6Data: { registrationProcesses: [] } },
    7: { phase7Data: { status: 'pending' } },
    8: { phase8Data: { transferProcesses: [] } },
    9: { phase9Data: { drafts: [], discussion: [], status: 'pending_draft', approvals: {}, documents: {}, includedClauses: [] } },
    10: { phase10Data: { requests: [] } },
  };
  
  return defaults[phaseNumber] || {};
};

export const useApi = (): ApiStore => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize from stored auth
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = getStoredUser();
      const storedToken = getStoredToken();
      
      if (storedUser && storedToken) {
        try {
          // Verify token is still valid
          await api.auth.checkAuth();
          setCurrentUser(transformUser(storedUser));
          await refreshData();
        } catch {
          // Token invalid, clear auth
          api.auth.logout();
        }
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    try {
      const [usersRes, projectsRes] = await Promise.all([
        api.users.getAll(),
        api.projects.getAll(),
      ]);
      
      setAllUsers(usersRes.users.map(transformUser));
      setProjects(projectsRes.projects.map(transformProject));
    } catch (err: any) {
      console.error('Failed to refresh data:', err);
      setError(err.message);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    try {
      const res = await api.projects.getAll();
      setProjects(res.projects.map(transformProject));
    } catch (err: any) {
      console.error('Failed to refresh projects:', err);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await api.users.getAll();
      setAllUsers(res.users.map(transformUser));
    } catch (err: any) {
      console.error('Failed to refresh users:', err);
    }
  }, []);

  // Auth actions
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { user } = await api.auth.login(email, password);
      const transformedUser = transformUser(user);
      setCurrentUser(transformedUser);
      
      // Load data after login
      await refreshData();
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshData]);

  const logout = useCallback(() => {
    api.auth.logout();
    setCurrentUser(null);
    setProjects([]);
    setAllUsers([]);
    setNotifications([]);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      
      // Update user to not require password change
      if (currentUser) {
        setCurrentUser({ ...currentUser, requiresPasswordChange: false });
      }
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [currentUser]);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      await api.auth.forgotPassword(email);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // Project actions
  const createProject = useCallback(async (
    name: string,
    mainClient: NewClientData,
    additionalClients: NewClientData[],
    _contractFile?: File
  ): Promise<Project | null> => {
    try {
      // Create main client
      const allClientsData = [mainClient, ...additionalClients];
      const createdUserIds: string[] = [];
      
      for (const clientData of allClientsData) {
        const { user } = await api.users.create({
          name: clientData.name,
          email: clientData.email,
          password: clientData.password || '123456',
          role: UserRole.CLIENT,
          client_type: clientData.clientType,
          requires_password_change: true,
        });
        createdUserIds.push(user.id.toString());
      }
      
      // Create project
      const { project } = await api.projects.create({
        name,
        consultant_id: currentUser?.id,
        client_ids: createdUserIds,
      });
      
      await refreshData();
      return transformProject(project);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [currentUser, refreshData]);

  const updateProject = useCallback(async (projectId: string, data: Partial<Project>) => {
    try {
      await api.projects.update(projectId, {
        name: data.name,
        status: data.status,
        current_phase_id: data.currentPhaseId,
        client_ids: data.clientIds,
      });
      
      // Update local state
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, ...data } : p
      ));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await api.projects.delete(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const advancePhase = useCallback(async (projectId: string, phaseId: number) => {
    try {
      await api.projects.advancePhase(projectId);
      
      // Update local state
      setProjects(prev => prev.map(p => {
        if (p.id === projectId && p.currentPhaseId === phaseId) {
          const nextPhaseId = phaseId + 1;
          const updatedPhases = p.phases.map(ph => {
            if (ph.id === phaseId) return { ...ph, status: 'completed' as const };
            if (ph.id === nextPhaseId) return { ...ph, status: 'in-progress' as const };
            return ph;
          });
          return { ...p, currentPhaseId: nextPhaseId, phases: updatedPhases };
        }
        return p;
      }));
      
      // Log the action
      await addLogEntry(projectId, `concluiu e avançou a Fase ${phaseId}.`);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const updatePhase = useCallback(async (projectId: string, phaseNumber: number, phaseData: Partial<Phase>) => {
    try {
      await api.projects.updatePhase(projectId, phaseNumber, phaseData);
      await refreshProjects();
    } catch (err: any) {
      setError(err.message);
    }
  }, [refreshProjects]);

  // User actions
  const createUser = useCallback(async (userData: Partial<User>): Promise<User | null> => {
    try {
      const { user } = await api.users.create({
        name: userData.name,
        email: userData.email,
        password: '123456',
        role: userData.role,
        client_type: userData.clientType,
        requires_password_change: true,
      });
      
      const newUser = transformUser(user);
      setAllUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
    try {
      await api.users.update(userId, {
        name: data.name,
        email: data.email,
        avatar_url: data.avatarUrl,
        client_type: data.clientType,
        qualification_data: data.qualificationData ? JSON.stringify(data.qualificationData) : undefined,
      });
      
      // Update local state
      setAllUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, ...data } : u
      ));
      
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [currentUser]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await api.users.delete(userId);
      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const resetUserPassword = useCallback(async (userId: string) => {
    try {
      await api.users.resetPassword(userId, 'resetpassword');
      
      setAllUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, requiresPasswordChange: true } : u
      ));
      
      alert('Senha resetada para "resetpassword". O usuário deverá alterá-la no próximo login.');
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // Chat actions
  const sendProjectMessage = useCallback(async (projectId: string, chatType: 'client' | 'internal', content: string) => {
    if (!currentUser) return;
    
    try {
      const { message } = await api.projects.sendMessage(projectId, chatType, content);
      
      const newMessage: ChatMessage = {
        id: message.id.toString(),
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatarUrl: currentUser.avatarUrl,
        authorRole: currentUser.role,
        content,
        timestamp: new Date().toISOString(),
      };
      
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const chatKey = chatType === 'client' ? 'clientChat' : 'internalChat';
          return { ...p, [chatKey]: [...p[chatKey], newMessage] };
        }
        return p;
      }));
    } catch (err: any) {
      setError(err.message);
    }
  }, [currentUser]);

  const sendPhaseMessage = useCallback(async (projectId: string, phaseId: number, content: string) => {
    if (!currentUser) return;
    
    try {
      await api.projects.sendPhaseMessage(projectId, phaseId, content);
      
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatarUrl: currentUser.avatarUrl,
        authorRole: currentUser.role,
        content,
        timestamp: new Date().toISOString(),
      };
      
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const updatedPhases = p.phases.map(ph => {
            if (ph.id === phaseId) {
              const phaseDataKey = `phase${phaseId}Data` as keyof typeof ph;
              const phaseData = (ph as any)[phaseDataKey];
              if (phaseData && phaseData.discussion) {
                const updatedPhaseData = { ...phaseData, discussion: [...phaseData.discussion, newMessage] };
                return { ...ph, [phaseDataKey]: updatedPhaseData };
              }
            }
            return ph;
          });
          return { ...p, phases: updatedPhases };
        }
        return p;
      }));
    } catch (err: any) {
      setError(err.message);
    }
  }, [currentUser]);

  // Task actions
  const createTask = useCallback(async (projectId: string, phaseId: number, description: string, assigneeId?: string) => {
    if (!currentUser) return;
    
    try {
      const { task } = await api.tasks.create(projectId, phaseId, {
        description,
        assignee_id: assigneeId || currentUser.id,
      });
      
      const newTask: Task = {
        id: task.id.toString(),
        description,
        phaseId,
        status: 'pending',
        assigneeId: assigneeId || currentUser.id,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const updatedPhases = p.phases.map(ph => {
            if (ph.id === phaseId) {
              return { ...ph, tasks: [...ph.tasks, newTask] };
            }
            return ph;
          });
          return { ...p, phases: updatedPhases };
        }
        return p;
      }));
    } catch (err: any) {
      setError(err.message);
    }
  }, [currentUser]);

  const completeTask = useCallback(async (taskId: string) => {
    try {
      await api.tasks.complete(taskId);
      
      // Update local state - find and update the task
      setProjects(prev => prev.map(p => ({
        ...p,
        phases: p.phases.map(ph => ({
          ...ph,
          tasks: ph.tasks.map(t => 
            t.id === taskId 
              ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() }
              : t
          ),
        })),
      })));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const approveTask = useCallback(async (taskId: string) => {
    try {
      await api.tasks.approve(taskId);
      
      setProjects(prev => prev.map(p => ({
        ...p,
        phases: p.phases.map(ph => ({
          ...ph,
          tasks: ph.tasks.map(t => 
            t.id === taskId 
              ? { ...t, status: 'approved' as const, approvedAt: new Date().toISOString() }
              : t
          ),
        })),
      })));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // Activity log
  const addLogEntry = useCallback(async (projectId: string, action: string) => {
    if (!currentUser) return;
    
    try {
      await api.projects.addLogEntry(projectId, action);
      
      const newEntry: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        action,
      };
      
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, activityLog: [...p.activityLog, newEntry] }
          : p
      ));
    } catch (err: any) {
      console.error('Failed to add log entry:', err);
    }
  }, [currentUser]);

  // Project members
  const addMemberToProject = useCallback(async (projectId: string, userId: string) => {
    try {
      await api.projects.addMember(projectId, userId);
      
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, clientIds: [...p.clientIds, userId] }
          : p
      ));
      
      const user = allUsers.find(u => u.id === userId);
      await addLogEntry(projectId, `adicionou ${user?.name || 'membro'} ao projeto.`);
    } catch (err: any) {
      setError(err.message);
    }
  }, [allUsers, addLogEntry]);

  const removeMemberFromProject = useCallback(async (projectId: string, userId: string) => {
    try {
      await api.projects.removeMember(projectId, userId);
      
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, clientIds: p.clientIds.filter(id => id !== userId) }
          : p
      ));
      
      await addLogEntry(projectId, `removeu um membro do projeto.`);
    } catch (err: any) {
      setError(err.message);
    }
  }, [addLogEntry]);

  const createAndAddMember = useCallback(async (projectId: string, userData: NewClientData) => {
    try {
      const newUser = await createUser({
        name: userData.name,
        email: userData.email,
        role: UserRole.CLIENT,
        clientType: userData.clientType,
      });
      
      if (newUser) {
        await addMemberToProject(projectId, newUser.id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [createUser, addMemberToProject]);

  return {
    // State
    allUsers,
    projects,
    currentUser,
    isLoading,
    error,
    notifications,
    
    // Auth actions
    login,
    logout,
    changePassword,
    forgotPassword,
    
    // Data refresh
    refreshData,
    refreshProjects,
    refreshUsers,
    
    // Project actions
    createProject,
    updateProject,
    deleteProject,
    advancePhase,
    updatePhase,
    
    // User actions
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    
    // Chat actions
    sendProjectMessage,
    sendPhaseMessage,
    
    // Task actions
    createTask,
    completeTask,
    approveTask,
    
    // Activity log
    addLogEntry,
    
    // Project members
    addMemberToProject,
    removeMemberFromProject,
    createAndAddMember,
    
    // Setters
    setCurrentUser,
    setProjects,
    setAllUsers,
  };
};

export default useApi;
