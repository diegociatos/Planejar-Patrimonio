import React, { useState } from 'react';
import { Project, User } from '../types';
import Icon from './Icon';
import Phase10Support from './Phase10Support'; // Reusing this component

interface SupportDashboardProps {
  projects: Project[];
  users: User[];
  currentUser: User;
  onUpdateProject: (projectId: string, data: Partial<Project>) => void;
}

const SupportDashboard: React.FC<SupportDashboardProps> = ({ projects, users, currentUser, onUpdateProject }) => {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const completedProjects = projects.filter(p => p.status === 'completed');

    const handleUpdateTickets = (phase10Data: any) => {
        if (!selectedProject) return;
        const updatedPhases = selectedProject.phases.map(p => p.id === 10 ? { ...p, phase10Data } : p);
        onUpdateProject(selectedProject.id, { phases: updatedPhases });
    };

    if (selectedProject) {
        const supportPhase = selectedProject.phases.find(p => p.id === 10);
        if (!supportPhase) {
            return (
                 <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-red-600">Erro</h2>
                    <p className="text-gray-600">A fase de suporte não foi encontrada para este projeto.</p>
                     <button onClick={() => setSelectedProject(null)} className="mt-4 px-4 py-2 bg-brand-secondary text-white rounded-lg">
                        Voltar
                    </button>
                </div>
            );
        }

        return (
            <div className="animate-fade-in-up">
                 <button onClick={() => setSelectedProject(null)} className="flex items-center text-sm font-medium text-brand-secondary hover:text-brand-primary m-4 sm:m-6 lg:m-8 mb-0">
                    <Icon name="arrow-right" className="w-4 h-4 mr-2 transform rotate-180" />
                    Voltar para a lista de projetos
                </button>
                <Phase10Support
                    phase={supportPhase}
                    currentUser={currentUser}
                    onUpdateData={handleUpdateTickets}
                    project={selectedProject}
                />
            </div>
        );
    }
    
    // Main list view
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-brand-primary mb-2">Suporte Pós-Projeto</h2>
                <p className="text-gray-600 mb-6">Gerencie tickets e solicitações de clientes com projetos concluídos.</p>

                <div className="space-y-3">
                    {completedProjects.length > 0 ? (
                        completedProjects.map(project => {
                            const openTicketsCount = project.phases.find(p => p.id === 10)?.phase10Data?.requests.filter(r => r.status !== 'closed').length || 0;
                            const mainClient = users.find(u => u.id === project.clientIds[0]);
                            return (
                                <button key={project.id} onClick={() => setSelectedProject(project)} className="w-full p-4 border rounded-lg text-left hover:bg-gray-50 hover:border-brand-secondary transition-colors flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-brand-dark">{project.name}</h3>
                                        <p className="text-sm text-gray-500">Cliente Principal: {mainClient?.name || 'N/A'}</p>
                                    </div>
                                    {openTicketsCount > 0 ? (
                                        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                            <Icon name="pending" className="w-4 h-4" />
                                            <span className="text-sm font-semibold">{openTicketsCount} Ticket(s) em Aberto</span>
                                        </div>
                                    ) : (
                                         <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-100 text-green-800">
                                            <Icon name="check" className="w-4 h-4" />
                                            <span className="text-sm font-semibold">Nenhum ticket aberto</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    ) : (
                        <div className="text-center py-16">
                            <Icon name="check" className="w-16 h-16 text-gray-300 mx-auto" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum projeto concluído</h3>
                            <p className="mt-1 text-sm text-gray-500">As solicitações de suporte aparecerão aqui quando os projetos forem finalizados.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportDashboard;