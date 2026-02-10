import React, { useState, useEffect } from 'react';
import { Project, User, UserRole, Phase, Task, NewClientData, PartnerData, ChatMessage, Asset, PropertyAsset, Document, ITBIProcessData, RegistrationProcessData, Phase5ITBIData, Phase6RegistrationData, Phase8QuotasData, Phase9AgreementData, Phase10SupportData, LogEntry, Phase1Data } from '../types';
import Icon from './Icon';

// Import all phase components
import Phase1Diagnostic from './Phase1Diagnostic';
import { Phase2Constitution } from './Phase2Constitution';
import Phase3Integralization from './Phase3Integralization';
import Phase4Minuta from './Phase4Minuta';
import Phase5ITBI from './Phase5ITBI';
import Phase6Registration from './Phase6Registration';
import Phase7Conclusion from './Phase7Conclusion';
import Phase8Quotas from './Phase8Quotas';
import Phase9Agreement from './Phase9Agreement';
import Phase10Support from './Phase10Support';
import ActivityLogModal from './ActivityLogModal';
import ManageClientsModal from './ManageClientsModal';

// Hub component defined within ProjectDetailView
const PostCompletionHub: React.FC<{
    onChoosePath: (path: 'quotas' | 'agreement') => void;
    userRole: UserRole;
}> = ({ onChoosePath, userRole }) => {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 text-center">
                <Icon name="check" className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-3xl font-bold text-brand-primary mt-4">Primeira Etapa Concluída!</h3>
                <p className="text-gray-600 mt-2 max-w-xl mx-auto">Parabéns! A sua holding familiar foi constituída e os bens foram integralizados. Agora, qual será o próximo passo para o seu planejamento?</p>

                {userRole === UserRole.CLIENT ? (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <button onClick={() => onChoosePath('agreement')} className="p-6 border rounded-xl text-left hover:bg-gray-50 hover:border-brand-secondary transition-all">
                            <Icon name="file-text" className="w-10 h-10 text-brand-secondary mb-3" />
                            <h4 className="font-bold text-lg text-brand-dark">Elaborar Acordo de Sócios</h4>
                            <p className="text-sm text-gray-600 mt-1">Crie as regras de governança, administração e sucessão para garantir a harmonia e a perenidade do seu patrimônio.</p>
                        </button>
                        <button onClick={() => onChoosePath('quotas')} className="p-6 border rounded-xl text-left hover:bg-gray-50 hover:border-brand-secondary transition-all">
                            <Icon name="users" className="w-10 h-10 text-brand-secondary mb-3" />
                            <h4 className="font-bold text-lg text-brand-dark">Iniciar Transferência de Quotas</h4>
                            <p className="text-sm text-gray-600 mt-1">Comece o planejamento sucessório em vida, doando ou vendendo participações societárias para seus herdeiros.</p>
                        </button>
                    </div>
                ) : (
                    <div className="mt-8 p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg max-w-md mx-auto">
                        <p className="font-semibold">Aguardando decisão do cliente sobre o próximo passo.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


interface ProjectDetailViewProps {
    project: Project;
    currentUser: User;
    users: User[];
    onBack: () => void;
    onUpdateProject: (projectId: string, data: Partial<Project>, updatedITBIProcess?: ITBIProcessData, updatedRegProcess?: RegistrationProcessData) => void;
    onCreateTask: (projectId: string, phaseId: number, description: string, assigneeId?: string) => void;
    onOpenChat: (chatType: 'client' | 'internal') => void;
    onAdvancePhase: (projectId: string, phaseId: number) => void;
    onUpdatePhaseChat: (projectId: string, phaseId: number, content: string) => void;
    initialPhaseId?: number | null;
    onUploadAndLinkDocument: (projectId: string, phaseId: number, file: File, onLink: (docId: string) => void) => void;
    onChoosePostCompletionPath: (projectId: string, path: 'quotas' | 'agreement') => void;
    onRemoveMemberFromProject: (projectId: string, memberId: string) => void;
    onUpdateUser: (userId: string, data: Partial<User>) => void;
    availableClients: User[];
    onCreateAndAddMemberToProject: (newClientData: NewClientData) => void;
    onAddExistingMemberToProject: (userId: string, clientType: 'partner' | 'interested') => void;
    onAddUser: (user: User) => void;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, currentUser, users, onBack, onUpdateProject, onCreateTask, onOpenChat, onAdvancePhase, onUpdatePhaseChat, initialPhaseId, onUploadAndLinkDocument, onChoosePostCompletionPath, onRemoveMemberFromProject, onUpdateUser, availableClients, onCreateAndAddMemberToProject, onAddExistingMemberToProject, onAddUser }) => {
    const [selectedPhaseId, setSelectedPhaseId] = useState<number>(initialPhaseId || project.currentPhaseId);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
    
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(project.name);

    useEffect(() => {
        setSelectedPhaseId(initialPhaseId || project.currentPhaseId);
    }, [project.id, initialPhaseId, project.currentPhaseId]);

    useEffect(() => {
        setEditedName(project.name);
    }, [project.name]);

    const selectedPhase = project.phases.find(p => p.id === selectedPhaseId);
    
    if (!selectedPhase) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-600">Erro: Fase não encontrada</h2>
                <p className="text-gray-600">A fase selecionada não existe neste projeto. Por favor, volte ao painel.</p>
                <button onClick={onBack} className="mt-4 px-4 py-2 bg-brand-secondary text-white rounded-lg">
                    Voltar para o Painel
                </button>
            </div>
        );
    }
    
    const canEdit = currentUser.role === UserRole.CONSULTANT || currentUser.role === UserRole.ADMINISTRATOR || currentUser.role === UserRole.AUXILIARY;
    const isProjectCompleted = project.status === 'completed';
    const isInterestedParty = currentUser.clientType === 'interested';
    const isPhaseCompletedForClient = selectedPhase.status === 'completed' && !canEdit;
    const isReadOnly = isProjectCompleted || isInterestedParty || isPhaseCompletedForClient;

    const handlePhaseDataUpdate = (phaseKey: string, data: any) => {
        const updatedPhases = project.phases.map(p => {
            if (p.id === selectedPhaseId) {
                const updatedPhase = { ...p, [phaseKey]: data };
                if (p.id === 2 && phaseKey === 'phase2Data' && data.documents) {
                    const newDocs: Document[] = [];
                    if (data.documents.contract) newDocs.push(data.documents.contract);
                    if (data.documents.cnpj) newDocs.push(data.documents.cnpj);
                    if (newDocs.length > 0) {
                        const otherDocs = (updatedPhase.documents || []).filter(doc => !newDocs.some(newDoc => newDoc.id === doc.id));
                        updatedPhase.documents = [...otherDocs, ...newDocs];
                    }
                }
                return updatedPhase;
            }
            return p;
        });
        onUpdateProject(project.id, { phases: updatedPhases });
    };
    
    const isConsultantOnly = currentUser.role === UserRole.CONSULTANT || currentUser.role === UserRole.ADMINISTRATOR;

    const handleSaveName = () => {
        if (editedName.trim() && editedName !== project.name) {
            onUpdateProject(project.id, { name: editedName });
        }
        setIsEditingName(false);
    };

    const handleCancelEditName = () => {
        setEditedName(project.name);
        setIsEditingName(false);
    };

    const renderPhaseContent = () => {
        if (project.postCompletionStatus === 'pending_choice' && selectedPhaseId === 7) {
            return <PostCompletionHub userRole={currentUser.role} onChoosePath={(path) => onChoosePostCompletionPath(project.id, path)} />;
        }

        const phase2Data = project.phases.find(p => p.id === 2)?.phase2Data;
        const phase3Data = project.phases.find(p => p.id === 3)?.phase3Data;
        
        // FIX: Derive partners directly from the project's member list (clientIds) 
        // to ensure anyone added via "Gerenciar Membros" appears in Phase 3 immediately.
        const partners = users
            .filter(u => project.clientIds.includes(u.id) && u.clientType === 'partner')
            .map(u => ({ id: u.id, name: u.name }));
        
        const declaredCapital = Number(phase2Data?.companyData?.capital) || 0;
        const assets = phase3Data?.assets || [];
        const properties = assets.filter(a => a.type === 'property') as PropertyAsset[];
        
        const handleOpenChatWithQuestion = (question: string) => {
            onOpenChat('client');
        };

        const updatePhase1Data = (data: Partial<Phase1Data>) => {
             const updatedPhases = project.phases.map(p => 
                p.id === 1 ? { ...p, phase1Data: { ...p.phase1Data, ...data } } : p
            );
            onUpdateProject(project.id, { phases: updatedPhases });
        };

        switch (selectedPhase.id) {
            case 1:
                return <Phase1Diagnostic 
                            project={project} 
                            phase={selectedPhase} 
                            userRole={currentUser.role} 
                            currentUser={currentUser} 
                            users={users} 
                            onUpdateUser={onUpdateUser} 
                            canEdit={canEdit} 
                            onBackToDashboard={onBack} 
                            onUpdateData={updatePhase1Data} 
                            onOpenChatWithQuestion={handleOpenChatWithQuestion} 
                            isReadOnly={isReadOnly} 
                            onCreateTask={(description) => onCreateTask(project.id, selectedPhase.id, description, project.auxiliaryId)} 
                            onRemoveMember={(memberId) => onRemoveMemberFromProject(project.id, memberId)} 
                            onUpdateProject={(data) => onUpdateProject(project.id, data)}
                            onManageMembers={() => setIsManageMembersOpen(true)}
                        />;
            case 2:
                return <Phase2Constitution phase={selectedPhase} project={project} currentUser={currentUser} users={users} canEdit={canEdit} onBackToDashboard={onBack} onUpdateData={(data) => handlePhaseDataUpdate('phase2Data', data)} isReadOnly={isReadOnly} onRemoveMember={(memberId) => onRemoveMemberFromProject(project.id, memberId)} availableClients={availableClients} onCreateAndAddMember={onCreateAndAddMemberToProject} onAddExistingMember={onAddExistingMemberToProject} />;
            case 3:
                return <Phase3Integralization phase={selectedPhase} partners={partners} declaredCapital={declaredCapital} userRole={currentUser.role} currentUser={currentUser} canEdit={canEdit} onBackToDashboard={onBack} onUpdateData={(data) => handlePhaseDataUpdate('phase3Data', data)} onOpenChatWithQuestion={handleOpenChatWithQuestion} isReadOnly={isReadOnly} onUploadAndLinkDocument={async (file: File) => {
                    return new Promise((resolve) => {
                        onUploadAndLinkDocument(project.id, 3, file, (docId) => resolve(docId));
                    });
                }} />;
            case 4:
                return <Phase4Minuta phase={selectedPhase} project={project} currentUser={currentUser} users={users} canEdit={canEdit} onUpdateData={(data) => handlePhaseDataUpdate('phase4Data', data)} onUpdatePhaseChat={(content) => onUpdatePhaseChat(project.id, 4, content)} isReadOnly={isReadOnly} />;
            case 5:
                 return <Phase5ITBI phase={selectedPhase} project={project} properties={properties} userRole={currentUser.role} canEdit={canEdit} onUpdateData={(data, docs, proc) => onUpdateProject(project.id, { phases: project.phases.map(p => p.id === 5 ? { ...p, phase5Data: { ...p.phase5Data, ...data }} : p) }, proc)} onOpenChatWithQuestion={handleOpenChatWithQuestion} onUploadAndLinkDocument={onUploadAndLinkDocument} isReadOnly={isReadOnly} />;
            case 6:
                return <Phase6Registration phase={selectedPhase} project={project} properties={properties} userRole={currentUser.role} canEdit={canEdit} onUpdateData={(data, proc) => onUpdateProject(project.id, { phases: project.phases.map(p => p.id === 6 ? { ...p, phase6Data: { ...p.phase6Data, ...data }} : p) }, undefined, proc)} onOpenChatWithQuestion={handleOpenChatWithQuestion} onUploadAndLinkDocument={onUploadAndLinkDocument} isReadOnly={isReadOnly} />;
            case 7:
                return <Phase7Conclusion phase={selectedPhase} project={project} userRole={currentUser.role} canEdit={canEdit} onBackToDashboard={onBack} onUpdateData={(data) => handlePhaseDataUpdate('phase7Data', data)} onOpenChatWithQuestion={handleOpenChatWithQuestion} onUploadAndLinkDocument={onUploadAndLinkDocument} isReadOnly={isReadOnly} />;
            case 8:
                 return <Phase8Quotas phase={selectedPhase} project={project} currentUser={currentUser} users={users} partners={partners} canEdit={canEdit} onUpdateData={(data) => handlePhaseDataUpdate('phase8Data', data)} isReadOnly={isReadOnly} />;
            case 9:
                 return <Phase9Agreement phase={selectedPhase} project={project} currentUser={currentUser} users={users} canEdit={canEdit} onUpdateData={(data) => handlePhaseDataUpdate('phase9Data', data)} isReadOnly={isReadOnly} />;
            case 10:
                return <Phase10Support phase={selectedPhase} currentUser={currentUser} onUpdateData={(data) => handlePhaseDataUpdate('phase10Data', data)} project={project} />;
            default:
                return <div>Componente para a fase {selectedPhase.id} não implementado.</div>;
        }
    };
    
    const canAdvancePhase = isConsultantOnly && selectedPhase.status !== 'completed' && selectedPhase.id <= 10;


    return (
        <div className="flex flex-col h-full bg-white">
            <header className="bg-white p-4 border-b flex-shrink-0">
                <button onClick={onBack} className="flex items-center text-sm font-medium text-brand-secondary hover:text-brand-primary mb-3">
                    <Icon name="arrow-right" className="w-4 h-4 mr-2 transform rotate-180" />
                    Voltar para o Painel
                </button>
                <div className="flex justify-between items-start">
                    <div className="flex-grow">
                        {isEditingName ? (
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="text" 
                                    value={editedName} 
                                    onChange={(e) => setEditedName(e.target.value)} 
                                    className="text-2xl font-bold text-brand-primary border-b-2 border-brand-secondary focus:outline-none px-1 w-full max-w-md"
                                    autoFocus
                                />
                                <button onClick={handleSaveName} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Salvar">
                                    <Icon name="check" className="w-6 h-6" />
                                </button>
                                <button onClick={handleCancelEditName} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Cancelar">
                                    <Icon name="close" className="w-6 h-6" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center group">
                                <h2 className="text-2xl font-bold text-brand-primary">{project.name}</h2>
                                {canEdit && (
                                    <button 
                                        onClick={() => setIsEditingName(true)} 
                                        className="ml-2 p-1 text-gray-400 hover:text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                        title="Editar nome do projeto"
                                    >
                                        <Icon name="edit" className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                        <p className="text-sm text-gray-500 mt-1">Clientes: {project.clientIds.map(id => users.find(u => u.id === id)?.name).join(', ')}</p>
                    </div>
                     <div className="flex items-center space-x-3">
                        {canEdit && (
                            <button onClick={() => setIsManageMembersOpen(true)} className="flex items-center text-sm font-medium text-brand-secondary bg-white border border-gray-300 hover:bg-gray-100 px-3 py-1.5 rounded-lg">
                                <Icon name="users" className="w-4 h-4 mr-2" />Gerenciar Membros
                            </button>
                        )}
                        <button onClick={() => setIsLogModalOpen(true)} className="flex items-center text-sm font-medium text-brand-secondary bg-white border border-gray-300 hover:bg-gray-100 px-3 py-1.5 rounded-lg"><Icon name="pending" className="w-4 h-4 mr-2" />Ver Histórico</button>
                        <button onClick={() => onOpenChat('client')} className="flex items-center text-sm font-medium text-white bg-brand-secondary hover:bg-brand-primary px-3 py-1.5 rounded-lg"><Icon name="chat" className="w-4 h-4 mr-2" />Chat com Cliente</button>
                        {canEdit && project.auxiliaryId && <button onClick={() => onOpenChat('internal')} className="flex items-center text-sm font-medium text-brand-secondary bg-white border border-gray-300 hover:bg-gray-100 px-3 py-1.5 rounded-lg"><Icon name="chat" className="w-4 h-4 mr-2" />Chat Interno</button>}
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                <aside className="w-full lg:w-64 bg-gray-50 border-b lg:border-b-0 lg:border-r p-4 overflow-y-auto shrink-0">
                    <h3 className="font-semibold text-brand-dark mb-4">Fases do Projeto</h3>
                    <nav className="space-y-1">
                        {project.phases.map(phase => {
                             const isCurrent = phase.id === project.currentPhaseId;
                             const isCompleted = phase.status === 'completed';
                             const isSelected = phase.id === selectedPhaseId;
                            return(
                                <button key={phase.id} onClick={() => setSelectedPhaseId(phase.id)} className={`w-full flex items-center p-3 text-left rounded-md transition-colors text-sm ${isSelected ? 'bg-brand-accent text-brand-dark font-bold' : 'hover:bg-gray-200'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-brand-accent' : 'bg-gray-300'}`}>
                                        {isCompleted ? <Icon name="check" className="w-4 h-4 text-white" /> : <span className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-gray-600'}`}>{isCompleted ? <Icon name="check" className="w-4 h-4 text-white" /> : phase.id}</span>}
                                    </div>
                                    <span>{phase.title}</span>
                                </button>
                            )
                        })}
                    </nav>
                </aside>

                <div className="flex-1 flex flex-col overflow-y-auto">
                    <main className="flex-grow">
                        {renderPhaseContent()}
                    </main>
                    {canAdvancePhase && (
                        <footer className="flex-shrink-0 bg-white p-4 border-t flex justify-end items-center space-x-4 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
                            <button 
                                onClick={() => onAdvancePhase(project.id, selectedPhaseId)} 
                                className="flex items-center px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm"
                            >
                                <Icon name="check" className="w-5 h-5 mr-2" />
                                Concluir e Avançar Fase
                            </button>
                        </footer>
                    )}
                </div>
            </div>
            
            <ActivityLogModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                log={project.activityLog || []}
                users={users}
            />

            <ManageClientsModal 
                isOpen={isManageMembersOpen}
                onClose={() => setIsManageMembersOpen(false)}
                project={project}
                onUpdateProject={onUpdateProject}
                allUsers={users}
                onAddUser={onAddUser}
            />
        </div>
    );
};

export default ProjectDetailView;