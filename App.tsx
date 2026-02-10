import React, { useState, useEffect } from 'react';
import { User, Project, UserRole, Notification, Task, ChatMessage, NewClientData, PartnerDataForPhase2, Document, ITBIProcessData, Phase6RegistrationData, RegistrationProcessData, Phase5ITBIData, UserDocument, UserDocumentCategory, LogEntry, Asset } from './types';
import { INITIAL_USERS, INITIAL_PROJECTS, getInitialProjectPhases } from './constants';
import { api, getStoredUser, getStoredToken, documentsApi } from './services/apiService';

// Component Imports
import LoginScreen from './components/LoginScreen';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ConsultantDashboard from './components/ConsultantDashboard';
import AuxiliaryDashboard from './components/AuxiliaryDashboard';
import ProjectDetailView from './components/ProjectDetailView';
import CreateUserScreen from './components/CreateUserScreen';
import CreateClientScreen from './components/CreateClientScreen';
import ManageUsersScreen from './components/ManageUsersScreen';
import MyDataScreen from './components/MyDataScreen';
import MyTasksScreen from './components/MyTasksScreen'; // NEW
import ProjectChat from './components/ProjectChat';
import DocumentsView from './components/DocumentsView';
import ProjectsDocumentsView from './components/ProjectsDocumentsView';
import AIChat from './components/AIChat';
import { createAIChatSession } from './services/geminiService';
import Icon from './components/Icon';
import SupportDashboard from './components/SupportDashboard';

// A state management hook architected for API integration
const useStore = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userForPasswordChange, setUserForPasswordChange] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<string>('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activeChat, setActiveChat] = useState<{ projectId: string; chatType: 'client' | 'internal' } | null>(null);
    const [targetPhaseId, setTargetPhaseId] = useState<number | null>(null);
    
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    const [aiChatMessages, setAiChatMessages] = useState<ChatMessage[]>([]);
    const [aiChatSession, setAiChatSession] = useState<ReturnType<typeof createAIChatSession> | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Transform API user to frontend User type
    const transformUser = (apiUser: any): User => ({
        id: apiUser.id?.toString() || apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role as UserRole,
        avatarUrl: apiUser.avatar_url || apiUser.avatarUrl,
        password: apiUser.password,
        requiresPasswordChange: apiUser.requires_password_change ?? apiUser.requiresPasswordChange,
        clientType: apiUser.client_type || apiUser.clientType,
        qualificationData: apiUser.qualification_data 
            ? (typeof apiUser.qualification_data === 'string' 
                ? JSON.parse(apiUser.qualification_data) 
                : apiUser.qualification_data)
            : apiUser.qualificationData,
        documents: apiUser.documents || [],
    });

    // Transform API project to frontend Project type  
    const transformProject = (apiProject: any): Project => {
        // If already in frontend format (phase.id is numeric), return as-is
        if (apiProject.phases && Array.isArray(apiProject.phases) && 
            apiProject.phases[0]?.title && typeof apiProject.phases[0]?.id === 'number') {
            return apiProject;
        }
        
        const phases = apiProject.phases?.map((p: any) => {
            // Support both snake_case and camelCase from API
            const phaseNumber = p.phaseNumber || p.phase_number || p.id;
            const phaseDataRaw = p.phaseData || p.phase_data;
            
            return {
                id: phaseNumber,
                title: p.title,
                description: p.description,
                status: p.status,
                tasks: p.tasks || [],
                documents: p.documents || [],
                ...(phaseDataRaw ? parsePhaseData(phaseNumber, phaseDataRaw) : {}),
            };
        }) || getInitialProjectPhases();
        
        return {
            id: apiProject.id?.toString() || apiProject.id,
            name: apiProject.name,
            status: apiProject.status,
            currentPhaseId: apiProject.current_phase_id || apiProject.currentPhaseId || 1,
            consultantId: apiProject.consultant_id?.toString() || apiProject.consultantId,
            clientIds: (apiProject.client_ids || apiProject.clientIds || []).map((id: any) => id?.toString() || id),
            phases,
            internalChat: apiProject.internal_chat || apiProject.internalChat || [],
            clientChat: apiProject.client_chat || apiProject.clientChat || [],
            activityLog: apiProject.activity_log || apiProject.activityLog || [],
        };
    };

    // Parse phase-specific data
    const parsePhaseData = (phaseNumber: number, data: any) => {
        const phaseDataKey = `phase${phaseNumber}Data`;
        if (data) {
            try {
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                return { [phaseDataKey]: parsed };
            } catch {
                return {};
            }
        }
        return {};
    };

    // Load data from API
    const loadData = async () => {
        try {
            // Load projects (accessible to all authenticated users)
            const projectsRes = await api.projects.getAll();
            setProjects(projectsRes.projects.map(transformProject));
            
            // Load users - may fail for CLIENT role (403 Forbidden)
            try {
                const usersRes = await api.users.getAll();
                setAllUsers(usersRes.users.map(transformUser));
            } catch (usersErr: any) {
                console.warn('Could not load all users (restricted for client role):', usersErr.message);
                // For clients, extract unique user IDs from projects and fetch them individually
                const allClientIds = new Set<string>();
                projectsRes.projects.forEach((p: any) => {
                    const clientIds = p.client_ids || p.clientIds || [];
                    clientIds.forEach((id: string) => allClientIds.add(id?.toString()));
                    if (p.consultant_id || p.consultantId) {
                        allClientIds.add((p.consultant_id || p.consultantId)?.toString());
                    }
                });
                
                const fetchedUsers: User[] = [];
                for (const uid of allClientIds) {
                    try {
                        const { user } = await api.users.getById(uid);
                        fetchedUsers.push(transformUser(user));
                    } catch {
                        // Skip users we can't access
                    }
                }
                setAllUsers(fetchedUsers);
            }
        } catch (err) {
            console.error('Failed to load data from API:', err);
        }
    };

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedUser = getStoredUser();
            const storedToken = getStoredToken();
            
            if (storedUser && storedToken) {
                try {
                    // Verify token is still valid
                    await api.auth.checkAuth();
                    setCurrentUser(transformUser(storedUser));
                    await loadData();
                } catch {
                    // Token invalid, clear auth
                    api.auth.logout();
                }
            }
            setIsLoading(false);
        };
        
        initAuth();
    }, []);

    const selectedProject = React.useMemo(() => {
        return projects.find(p => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);

    React.useEffect(() => {
        if (currentUser && currentUser.role === UserRole.CLIENT) {
            const userProject = projects.find(p => p.clientIds.includes(currentUser.id));
            if (userProject) {
                setSelectedProjectId(userProject.id);
            }
        } else if (currentUser && !selectedProjectId) {
            setSelectedProjectId(null); 
            setCurrentView('dashboard');
        }
    }, [currentUser, projects, selectedProjectId]);

    const isPartnerDataComplete = (user: User): boolean => {
        if (!user || !user.clientType || !user.qualificationData) return false;
        
        const q = user.qualificationData;
        const hasBaseData = q.cpf && q.rg && q.maritalStatus && q.birthDate && q.nationality && q.address;
        if (!hasBaseData) return false;
        
        if ((q.maritalStatus === 'casado' || q.maritalStatus === 'uniao_estavel') && !q.propertyRegime) return false;
        
        if (q.declaresIncomeTax) {
            const docs = user.documents || [];
            if (!docs.some(d => d.category === 'tax_return')) {
                return false;
            }
        }

        return true;
    };
    
    const availableClients = React.useMemo(() => {
        const allProjectClientIds = new Set(projects.flatMap(p => p.clientIds));
        return allUsers.filter(u => u.role === UserRole.CLIENT && !allProjectClientIds.has(u.id));
    }, [projects, allUsers]);

    const actions = {
        handleLogin: async (email: string, password: string) => {
            try {
                // Try API login first
                const { user } = await api.auth.login(email, password);
                const transformedUser = transformUser(user);
                
                setCurrentUser(transformedUser);
                await loadData();
            } catch (apiError: any) {
                // Handle password change required (thrown from apiService)
                if (apiError.message === 'PASSWORD_CHANGE_REQUIRED') {
                    // Create a minimal user for the ChangePasswordScreen
                    const minimalUser: User = {
                        id: apiError.userId,
                        name: email.split('@')[0],
                        email: email,
                        role: UserRole.CLIENT,
                        requiresPasswordChange: true,
                    };
                    const err = new Error('PASSWORD_CHANGE_REQUIRED') as any;
                    err.user = minimalUser;
                    throw err;
                }
                
                // API login failed - throw error (no local fallback)
                console.error('Login failed:', apiError);
                throw new Error('AUTH_INVALID_CREDENTIALS');
            }
        },
        handleForgotPassword: async (email: string) => {
            try {
                await api.auth.forgotPassword(email);
            } catch {
                // Fallback to console log
                const userExists = allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
                if (userExists) {
                    console.log(`(Mock) Password reset for ${email}`);
                }
            }
            return Promise.resolve();
        },
        addLogEntry: (projectId: string, actorId: string, action: string) => {
            const actor = allUsers.find(u => u.id === actorId);
            const actorName = actor ? actor.name : (actorId === 'system' ? 'Sistema' : 'Desconhecido');
            
            const projectToUpdate = projects.find(p => p.id === projectId);
            if (!projectToUpdate) return;

            const newLogEntry: LogEntry = {
                id: `log-${Date.now()}-${Math.random()}`,
                actorId,
                actorName,
                action,
                timestamp: new Date().toISOString(),
            };
            
            const updatedLog = [newLogEntry, ...(projectToUpdate.activityLog || [])];
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, activityLog: updatedLog } : p));
        },
        handleLogout: () => {
            api.auth.logout();
            setCurrentUser(null);
            setSelectedProjectId(null);
            setTargetPhaseId(null);
            setAllUsers([]);
            setProjects([]);
        },
        handleRequirePasswordChange: (user: User) => setUserForPasswordChange(user),
        handleCancelPasswordChange: () => setUserForPasswordChange(null),
        handlePasswordChanged: async (userId: string, newPassword: string) => {
            try {
                // Use change-password endpoint (doesn't require auth token)
                // Backend returns token + user after successful password change
                const data = await api.auth.changeFirstPassword(userId, newPassword);
                const transformedUser = transformUser(data.user);
                
                setCurrentUser(transformedUser);
                setUserForPasswordChange(null);
                await loadData();
            } catch (err) {
                console.error('Password change failed:', err);
                alert('Erro ao alterar senha. Tente novamente.');
            }
        },
        handleNavigate: (view: string) => {
            if (view !== 'project_detail' && view !== 'project_documents') {
                setTargetPhaseId(null);
                if (currentUser && currentUser.role !== UserRole.CLIENT) {
                    setSelectedProjectId(null);
                }
            }
            setCurrentView(view);
            setIsSidebarOpen(false);
        },
        handleBackToDashboard: () => {
            setSelectedProjectId(null);
            setTargetPhaseId(null);
            setCurrentView('dashboard');
        },
        handleSelectProject: (projectId: string) => {
            setSelectedProjectId(projectId);
            setTargetPhaseId(null);
            setCurrentView('project_detail');
        },
         handleSelectProjectForDocuments: (projectId: string) => {
            setSelectedProjectId(projectId);
            setCurrentView('project_documents');
        },
        handleUpdateProject: async (
            projectId: string,
            data: Partial<Project>
        ) => {
            const oldProject = projects.find(p => p.id === projectId);
            if (!oldProject) return;

            if (data.currentPhaseId && data.currentPhaseId !== oldProject.currentPhaseId && currentUser) {
                const newPhase = oldProject.phases.find(p => p.id === data.currentPhaseId);
                actions.addLogEntry(projectId, currentUser.id, `avançou o projeto para a Fase ${data.currentPhaseId}: ${newPhase?.title}.`);
            }

            // Update local state immediately for responsiveness
            setProjects(prev =>
                prev.map(p =>
                    p.id === projectId ? { ...p, ...data } : p
                )
            );

            // Sync with API
            try {
                // Update project basic info
                await api.projects.update(projectId, {
                    name: data.name,
                    status: data.status,
                    current_phase_id: data.currentPhaseId,
                    client_ids: data.clientIds,
                });
                
                // If phases were updated, sync each phase with API
                if (data.phases) {
                    for (const phase of data.phases) {
                        const phaseDataKey = `phase${phase.id}Data` as keyof typeof phase;
                        const phaseData = (phase as any)[phaseDataKey];
                        if (phaseData) {
                            try {
                                await api.projects.updatePhase(projectId, phase.id, {
                                    phase_data: phaseData,
                                    status: phase.status,
                                });
                            } catch (phaseErr) {
                                console.error(`Failed to update phase ${phase.id}:`, phaseErr);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to update project on API:', err);
            }
        },
        handleCreateTask: async (projectId: string, phaseId: number, description: string, assigneeId?: string) => {
            const newTask: Task = {
                id: `task-${Date.now()}`,
                description,
                phaseId,
                status: 'pending',
                assigneeId: assigneeId || currentUser!.id,
                createdBy: currentUser!.id,
                createdAt: new Date().toISOString(),
            };

            // Update local state immediately
            setProjects(prev => prev.map(p => {
                if (p.id === projectId) {
                    const newPhases = p.phases.map(ph => {
                        if (ph.id === phaseId) {
                            return { ...ph, tasks: [...ph.tasks, newTask] };
                        }
                        return ph;
                    });
                    return { ...p, phases: newPhases };
                }
                return p;
            }));

            // Sync with API
            try {
                await api.tasks.create(projectId, phaseId, {
                    description,
                    assignee_id: assigneeId || currentUser!.id,
                });
            } catch (err) {
                console.error('Failed to create task on API:', err);
            }
        },
        handleAdvancePhase: async (projectId: string, phaseId: number) => {
            // Update local state immediately
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
            
            actions.addLogEntry(projectId, currentUser!.id, `concluiu e avançou a Fase ${phaseId}.`);

            // Sync with API
            try {
                await api.projects.advancePhase(projectId, phaseId);
            } catch (err) {
                console.error('Failed to advance phase on API:', err);
            }
        },
        handleDeleteProject: async (projectId: string) => {
            // Update local state immediately
            setProjects(prev => prev.filter(p => p.id !== projectId));
            
            // Sync with API
            try {
                await api.projects.delete(projectId);
            } catch (err) {
                console.error('Failed to delete project on API:', err);
                // Reload projects to restore if delete failed
                const projectsRes = await api.projects.getAll();
                setProjects(projectsRes.projects.map(transformProject));
            }
        },
        handleUpdatePhaseChat: async (projectId: string, phaseId: number, content: string) => {
            if (!currentUser) return;
            const newMessage: ChatMessage = {
                id: `msg-${Date.now()}`,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorAvatarUrl: currentUser.avatarUrl,
                authorRole: currentUser.role,
                content: content,
                timestamp: new Date().toISOString(),
            };
            
            // Update local state immediately
            setProjects(prev => prev.map(p => {
                if (p.id === projectId) {
                    const updatedPhases = p.phases.map(ph => {
                        if (ph.id === phaseId) {
                            const phaseDataKey = `phase${phaseId}Data` as keyof typeof ph;
                            const phaseData = (ph as any)[phaseDataKey];
                            if(phaseData && phaseData.discussion) {
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

            // Sync with API
            try {
                await api.projects.sendPhaseMessage(projectId, phaseId, content);
            } catch (err) {
                console.error('Failed to send phase message on API:', err);
            }
        },
        handleUpdateUser: async (userId: string, data: Partial<User>) => {
            // Update local state immediately
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
            if (currentUser?.id === userId) {
                setCurrentUser(prev => prev ? { ...prev, ...data } : null);
            }

            // Sync with API
            try {
                await api.users.update(userId, {
                    name: data.name,
                    email: data.email,
                    avatar_url: data.avatarUrl,
                    client_type: data.clientType,
                    qualification_data: data.qualificationData ? JSON.stringify(data.qualificationData) : undefined,
                });
            } catch (err) {
                console.error('Failed to update user on API:', err);
            }
        },
        handleCreateClient: async (projectName: string, mainClientData: NewClientData, additionalClientsData: NewClientData[], _contractFile: File) => {
            // Try to create project with clients via API
            try {
                // Create project via API - backend will create users automatically
                const { project } = await api.projects.create({
                    name: projectName,
                    mainClient: {
                        name: mainClientData.name,
                        email: mainClientData.email,
                        password: mainClientData.password || '123456',
                        clientType: mainClientData.clientType,
                    },
                    additionalClients: additionalClientsData.map(c => ({
                        name: c.name,
                        email: c.email,
                        password: c.password || '123456',
                        clientType: c.clientType,
                    })),
                });
                
                // Reload data from API
                await loadData();
                
                actions.addLogEntry(project.id.toString(), currentUser!.id, 'criou o projeto.');
                setCurrentView('dashboard');
            } catch (err) {
                console.error('Failed to create client/project on API:', err);
                alert('Erro ao criar projeto: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
            }
            
            // Go to dashboard to see the new project
            setCurrentView('dashboard');
        },
         handleOpenChat: (chatType: 'client' | 'internal') => {
            if (selectedProject) {
                setActiveChat({ projectId: selectedProject.id, chatType });
            }
        },
        handleSendProjectMessage: async (content: string) => {
            if (!activeChat || !selectedProject || !currentUser) return;

            const newMessage: ChatMessage = {
                id: `msg-${Date.now()}`,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorAvatarUrl: currentUser.avatarUrl,
                authorRole: currentUser.role,
                content,
                timestamp: new Date().toISOString(),
            };
            
            // Update local state immediately
            setProjects(prev => prev.map(p => {
                if (p.id === selectedProject.id) {
                    const chatHistory = activeChat.chatType === 'client' ? p.clientChat : p.internalChat;
                    const updatedChat = [...chatHistory, newMessage];
                    return activeChat.chatType === 'client' 
                        ? { ...p, clientChat: updatedChat }
                        : { ...p, internalChat: updatedChat };
                }
                return p;
            }));

            // Sync with API
            try {
                await api.projects.sendMessage(selectedProject.id, activeChat.chatType, content);
            } catch (err) {
                console.error('Failed to send project message on API:', err);
            }
        },
        handleAiSendMessage: async (content: string) => {
            if (!currentUser || !aiChatSession) return;
            
            const userMessage: ChatMessage = {
                id: `msg-ai-${Date.now()}`,
                authorId: currentUser.id,
                authorName: currentUser.name,
                content,
                timestamp: new Date().toISOString(),
                authorRole: currentUser.role,
            };

            setAiChatMessages(prev => [...prev, userMessage]);
            setIsAiLoading(true);

            try {
                const responseText = await aiChatSession.sendMessage(content);
                const aiResponse: ChatMessage = {
                    id: `msg-ai-${Date.now() + 1}`,
                    authorId: 'ai',
                    authorName: 'Assistente IA',
                    content: responseText,
                    timestamp: new Date().toISOString(),
                    authorRole: UserRole.CONSULTANT,
                };
                setAiChatMessages(prev => [...prev, aiResponse]);
            } catch (error) {
                 const errorResponse: ChatMessage = {
                    id: `msg-ai-err-${Date.now()}`,
                    authorId: 'ai',
                    authorName: 'Assistente IA',
                    content: "Desculpe, ocorreu um erro. Tente novamente.",
                    timestamp: new Date().toISOString(),
                    authorRole: UserRole.CONSULTANT,
                };
                setAiChatMessages(prev => [...prev, errorResponse]);
            } finally {
                setIsAiLoading(false);
            }
        },
    };

    return {
        allUsers, projects, currentUser, isLoading, userForPasswordChange,
        currentView, selectedProject, notifications, activeChat, targetPhaseId, isAiChatOpen,
        aiChatMessages, isAiLoading, availableClients, isSidebarOpen,
        aiChatSession,
        actions, setCurrentUser, setUserForPasswordChange, setCurrentView,
        setSelectedProjectId, setNotifications, setActiveChat, setTargetPhaseId,
        setIsAiChatOpen, setAiChatMessages, setAiChatSession, setIsAiLoading,
        isPartnerDataComplete, setProjects, setAllUsers, setIsSidebarOpen,
        transformUser, transformProject, loadData,
    };
};

const App = () => {
  const store = useStore();

  useEffect(() => {
    if (store.currentUser && !store.aiChatSession) {
      try {
        store.setAiChatSession(createAIChatSession());
        store.setAiChatMessages([
            {
                id: 'initial-ai-msg',
                authorId: 'ai',
                authorName: 'Assistente IA',
                content: 'Olá! Eu sou o Plano, seu assistente de IA. Como posso ajudar com seu projeto de holding hoje?',
                timestamp: new Date().toISOString(),
                authorRole: UserRole.CONSULTANT,
            }
        ]);
      } catch (error) {
          console.error("Failed to initialize AI Chat Session:", error);
          store.setAiChatMessages([
             {
                  id: 'initial-ai-msg-error',
                  authorId: 'ai',
                  authorName: 'Assistente IA',
                  content: 'Não foi possível iniciar o assistente de IA. A funcionalidade de chat com IA estará desativada.',
                  timestamp: new Date().toISOString(),
                  authorRole: UserRole.CONSULTANT,
              }
          ]);
      }
    }
  }, [store.currentUser]);

  if (store.isLoading) {
    return <div>Carregando...</div>;
  }
  
  if (store.userForPasswordChange) {
    return <ChangePasswordScreen user={store.userForPasswordChange} onPasswordChanged={store.actions.handlePasswordChanged} onCancel={store.actions.handleCancelPasswordChange} />;
  }

  if (!store.currentUser) {
    return <LoginScreen onLogin={store.actions.handleLogin} onRequirePasswordChange={store.actions.handleRequirePasswordChange} onForgotPassword={store.actions.handleForgotPassword} />;
  }

  const renderView = () => {
    switch (store.currentView) {
        case 'dashboard':
            if (store.currentUser?.role === UserRole.CLIENT) {
                return store.selectedProject ? 
                  <Dashboard 
                    project={store.selectedProject} 
                    currentUser={store.currentUser} 
                    onOpenChat={store.actions.handleOpenChat} 
                    onNavigateToPhase={(phaseId) => { store.setTargetPhaseId(phaseId); store.actions.handleNavigate('project_detail'); }}
                    isPartnerDataComplete={store.isPartnerDataComplete(store.currentUser)}
                    onNavigateToMyData={() => store.actions.handleNavigate('my_data')}
                  /> : <div>Nenhum projeto associado.</div>;
            }
            if (store.currentUser?.role === UserRole.CONSULTANT || store.currentUser?.role === UserRole.ADMINISTRATOR) {
                return <ConsultantDashboard 
                            projects={store.projects} 
                            users={store.allUsers} 
                            currentUser={store.currentUser}
                            onProjectClick={store.actions.handleSelectProject} 
                            onNavigateToCreate={() => store.actions.handleNavigate('create_client')}
                            onDeleteProject={store.actions.handleDeleteProject}
                        />;
            }
             if (store.currentUser?.role === UserRole.AUXILIARY) {
                return <AuxiliaryDashboard 
                        projects={store.projects} 
                        users={store.allUsers} 
                        currentUser={store.currentUser} 
                        onProjectClick={store.actions.handleSelectProject} 
                        onTaskClick={(projectId, phaseId) => { store.setTargetPhaseId(phaseId); store.actions.handleSelectProject(projectId); }}
                       />;
            }
            return <div>Dashboard não implementado para esta função.</div>;
        case 'project_detail':
            return store.selectedProject ? 
                <ProjectDetailView 
                    project={store.selectedProject} 
                    currentUser={store.currentUser!}
                    users={store.allUsers}
                    onBack={store.actions.handleBackToDashboard}
                    onUpdateProject={store.actions.handleUpdateProject}
                    onCreateTask={store.actions.handleCreateTask}
                    onOpenChat={store.actions.handleOpenChat}
                    onAdvancePhase={store.actions.handleAdvancePhase}
                    onUpdatePhaseChat={store.actions.handleUpdatePhaseChat}
                    initialPhaseId={store.targetPhaseId}
                    onUploadAndLinkDocument={async (projectId, phaseId, file, onLink) => {
                        try {
                            const result = await documentsApi.upload(projectId, phaseId, file);
                            const docId = result.data?.id || result.id;
                            if (docId) {
                                // Add the uploaded document to the local phase documents array
                                const newDoc = result.data || result;
                                store.setProjects(prev => prev.map(p => {
                                    if (p.id === projectId) {
                                        const updatedPhases = p.phases.map(ph => {
                                            if (ph.id === phaseId) {
                                                return { ...ph, documents: [...(ph.documents || []), {
                                                    id: docId,
                                                    name: newDoc.name || file.name,
                                                    url: newDoc.url || '',
                                                    type: file.name.split('.').pop() || 'pdf',
                                                    uploadedAt: new Date().toISOString(),
                                                    uploadedBy: store.currentUser?.name || '',
                                                    phaseId,
                                                    version: 1,
                                                    status: 'active',
                                                }]};
                                            }
                                            return ph;
                                        });
                                        return { ...p, phases: updatedPhases };
                                    }
                                    return p;
                                }));
                                onLink(docId);
                            }
                        } catch (error) {
                            console.error('Erro ao fazer upload do documento:', error);
                            alert('Erro ao fazer upload do arquivo. Tente novamente.');
                        }
                    }}
                    onChoosePostCompletionPath={() => {}}
                    onRemoveMemberFromProject={async (pid, mid) => {
                        try {
                            await api.projects.removeMember(pid, mid);
                            // Reload projects
                            await store.loadData();
                            store.actions.addLogEntry(pid, store.currentUser!.id, `removeu um membro do projeto.`);
                        } catch (err: any) {
                            console.error('Failed to remove member:', err);
                            alert('Erro ao remover membro: ' + (err.message || 'Erro desconhecido'));
                        }
                    }}
                    onUpdateUser={store.actions.handleUpdateUser}
                    availableClients={store.availableClients}
                    onCreateAndAddMemberToProject={async (data) => {
                        try {
                            const pid = store.selectedProject!.id;
                            // Use the backend endpoint to create user and add to project
                            await api.projects.addMember(pid, undefined as any, {
                                name: data.name,
                                email: data.email,
                                password: data.password || '123456',
                                clientType: data.clientType,
                            });
                            // Reload data to get the real user from DB
                            await store.loadData();
                            store.actions.addLogEntry(pid, store.currentUser!.id, `adicionou ${data.name} ao projeto.`);
                        } catch (err: any) {
                            console.error('Failed to create and add member:', err);
                            alert('Erro ao adicionar membro: ' + (err.message || 'Erro desconhecido'));
                        }
                    }}
                    onAddExistingMemberToProject={async (uid, type) => {
                        try {
                            const pid = store.selectedProject!.id;
                            await api.projects.addMember(pid, uid);
                            // Reload projects to get updated clientIds
                            await store.loadData();
                            const user = store.allUsers.find(u => u.id === uid);
                            store.actions.addLogEntry(pid, store.currentUser!.id, `adicionou ${user?.name || 'membro'} ao projeto.`);
                        } catch (err: any) {
                            console.error('Failed to add existing member:', err);
                            alert('Erro ao adicionar membro: ' + (err.message || 'Erro desconhecido'));
                        }
                    }}
                    onAddUser={(user) => store.setAllUsers(prev => [...prev, user])}
                /> : <div>Projeto não encontrado.</div>;
         case 'my_data':
            return <MyDataScreen 
                        currentUser={store.currentUser}
                        projects={store.projects}
                        onUpdateUser={store.actions.handleUpdateUser}
                        onUploadUserDocument={() => {}}
                        onDeleteUserDocument={() => {}}
                        onBack={store.actions.handleBackToDashboard}
                        onChangePassword={store.actions.handlePasswordChanged}
                        onNavigateToTask={() => {}}
                    />;
        case 'create_client':
            return <CreateClientScreen onBack={store.actions.handleBackToDashboard} onCreateClient={store.actions.handleCreateClient} allUsers={store.allUsers} />;
        case 'manage_users':
            return <ManageUsersScreen 
                        users={store.allUsers}
                        projects={store.projects}
                        currentUser={store.currentUser}
                        onBack={store.actions.handleBackToDashboard} 
                        onDeleteUser={(id) => store.setAllUsers(u => u.filter(user => user.id !== id))}
                        onNavigateToCreate={(role) => store.actions.handleNavigate('create_user')}
                        onResetPassword={(id) => {
                            store.setAllUsers(users => users.map(u => u.id === id ? { ...u, requiresPasswordChange: true, password: 'resetpassword' } : u));
                            alert('Senha resetada para "resetpassword". O usuário deverá alterá-la no próximo login.');
                        }}
                    />;
        case 'my_tasks':
            return <MyTasksScreen 
                    currentUser={store.currentUser}
                    projects={store.projects}
                    onBack={store.actions.handleBackToDashboard}
                    onNavigateToTask={(projectId, phaseId) => {
                        store.setTargetPhaseId(phaseId);
                        store.actions.handleSelectProject(projectId);
                    }}
                   />;
        case 'documents':
            if (store.currentUser.role === UserRole.CLIENT) {
                return store.selectedProject ? <DocumentsView project={store.selectedProject} users={store.allUsers} onUploadDocument={() => {}} /> : <div>Selecione um projeto</div>
            }
            return <ProjectsDocumentsView projects={store.projects} onProjectClick={store.actions.handleSelectProjectForDocuments} />;
         case 'project_documents':
            return store.selectedProject ? <DocumentsView project={store.selectedProject} users={store.allUsers} onUploadDocument={() => {}} onBack={() => store.actions.handleNavigate('documents')} /> : <div>Projeto não encontrado.</div>;
        case 'support':
            return <SupportDashboard projects={store.projects} users={store.allUsers} currentUser={store.currentUser} onUpdateProject={store.actions.handleUpdateProject} />;
        default:
            return <div>Visualização '{store.currentView}' não encontrada.</div>
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        userRole={store.currentUser.role} 
        onNavigate={store.actions.handleNavigate} 
        activeView={store.currentView}
        isOpen={store.isSidebarOpen}
        onClose={() => store.setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={store.currentUser} 
          onLogout={store.actions.handleLogout}
          notifications={store.notifications}
          onNotificationClick={() => {}}
          onClearAllNotifications={() => {}}
          onNavigateToMyData={() => store.actions.handleNavigate('my_data')}
          onToggleSidebar={() => store.setIsSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-light">
          {renderView()}
        </main>
      </div>

       {store.activeChat && store.selectedProject && (
          <ProjectChat 
            project={store.selectedProject}
            chatType={store.activeChat.chatType}
            currentUser={store.currentUser}
            onSendMessage={store.actions.handleSendProjectMessage}
            onClose={() => store.setActiveChat(null)}
          />
        )}

      {store.isAiChatOpen && store.aiChatSession && (
        <AIChat
          currentUser={store.currentUser}
          messages={store.aiChatMessages}
          onSendMessage={store.actions.handleAiSendMessage}
          onClose={() => store.setIsAiChatOpen(false)}
          isLoading={store.isAiLoading}
        />
      )}

      {!store.isAiChatOpen && (
          <button 
            onClick={() => store.setIsAiChatOpen(true)}
            className="fixed bottom-6 right-6 bg-brand-primary text-white rounded-full p-4 shadow-lg hover:bg-brand-dark transition-transform hover:scale-110"
            aria-label="Abrir chat com assistente IA"
          >
              <Icon name="ai" className="w-8 h-8"/>
          </button>
      )}
    </div>
  );
};

export default App;