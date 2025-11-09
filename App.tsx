import React, { useState, useEffect } from 'react';
import { User, Project, UserRole, Notification, Task, ChatMessage, NewClientData, PartnerDataForPhase2, Document, ITBIProcessData, Phase6RegistrationData, RegistrationProcessData, Phase5ITBIData, UserDocument, UserDocumentCategory, LogEntry, Asset } from './types';
import { INITIAL_USERS, INITIAL_PROJECTS, getInitialProjectPhases } from './constants';

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

// A state management hook architected for in-memory data
const useStore = () => {
    const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
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

    useEffect(() => {
        // Simulate loading end, as data is now synchronous
        setIsLoading(false);
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
            const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

            if (!user) {
              throw new Error('AUTH_INVALID_CREDENTIALS');
            }
            
            if (user.requiresPasswordChange) {
              const err = new Error('PASSWORD_CHANGE_REQUIRED');
              (err as any).user = user;
              throw err;
            }

            setCurrentUser(user);
        },
        handleForgotPassword: async (email: string) => {
             const userExists = allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
            if (userExists) {
                console.log(`(Mock) Password reset for ${email}`);
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
            setCurrentUser(null);
            setSelectedProjectId(null);
            setTargetPhaseId(null);
        },
        handleRequirePasswordChange: (user: User) => setUserForPasswordChange(user),
        handleCancelPasswordChange: () => setUserForPasswordChange(null),
        handlePasswordChanged: (userId: string, newPassword: string) => {
            const userToUpdate = allUsers.find(u => u.id === userId);
            if (!userToUpdate) return;
            
            const updatedUser = { ...userToUpdate, password: newPassword, requiresPasswordChange: false };

            setAllUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            
            setCurrentUser(updatedUser);
            setUserForPasswordChange(null);
        },
        handleNavigate: (view: string) => {
            if (view !== 'project_detail' && view !== 'project_documents') {
                setTargetPhaseId(null);
                if (currentUser && currentUser.role !== UserRole.CLIENT) {
                    setSelectedProjectId(null);
                }
            }
            setCurrentView(view)
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
        handleUpdateProject: (
            projectId: string, 
            data: Partial<Project>, 
            updatedITBIProcess?: ITBIProcessData, 
            updatedRegProcess?: RegistrationProcessData
        ) => {
            const oldProject = projects.find(p => p.id === projectId);
            if (!oldProject) return;
        
            if (data.phases) {
                 const newPhase2 = data.phases.find(p => p.id === 2);
                 const oldPhase2 = oldProject.phases.find(p => p.id === 2);
                 if (newPhase2?.