import React, { useState } from 'react';
import { Project, Phase, User, UserRole } from '../types';
import Icon from './Icon';

interface ConsultantDashboardProps {
  projects: Project[];
  users: User[];
  onProjectClick: (projectId: string) => void;
  onNavigateToCreate: () => void;
  onDeleteProject: (projectId: string) => void;
  currentUser: User;
}

const DeleteProjectModal: React.FC<{
  project: Project | null;
  onClose: () => void;
  onConfirm: (projectId: string) => void;
}> = ({ project, onClose, onConfirm }) => {
  const [confirmationText, setConfirmationText] = useState('');
  if (!project) return null;

  const CONFIRMATION_PHRASE = 'querodeletarprojeto';
  const isConfirmed = confirmationText === CONFIRMATION_PHRASE;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-fade-in-up">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <Icon name="trash" className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-5 text-lg font-medium text-gray-900">Deletar Projeto</h3>
          <div className="mt-2 text-sm text-gray-500">
            <p>Você tem certeza que deseja deletar o projeto <span className="font-bold">{project.name}</span>?</p>
            <p className="mt-2 text-red-700 font-semibold">Esta ação é irreversível e todos os dados do projeto, incluindo documentos e conversas, serão permanentemente removidos.</p>
          </div>
          <div className="mt-6 text-left">
            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700">
              Para confirmar, digite <span className="font-bold text-red-600">{CONFIRMATION_PHRASE}</span> abaixo:
            </label>
            <input
              type="text"
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            onClick={() => onConfirm(project.id)}
            disabled={!isConfirmed}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-300"
          >
            Deletar Projeto
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{ project: Project, users: User[], onClick: () => void, onDelete: () => void, isConsultantOrAdmin: boolean }> = ({ project, users, onClick, onDelete, isConsultantOrAdmin }) => {
  const mainClientId = project.clientIds[0];
  const mainClient = users.find(u => u.id === mainClientId);
  
  return (
    <div className="w-full bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md hover:border-brand-secondary transition-all text-left relative group">
      <button onClick={onClick} className="w-full text-left">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-brand-dark pr-8">{project.name}</h4>
          {project.status === 'completed' && (
              <span className="flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Concluído</span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {mainClient?.name || mainClientId}{project.clientIds.length > 1 ? ` + ${project.clientIds.length - 1} outro(s)` : ''}
        </p>
      </button>
      {isConsultantOrAdmin && (
          <div className="absolute top-2 right-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label={`Deletar projeto ${project.name}`}
              >
                  <Icon name="trash" className="w-5 h-5" />
              </button>
          </div>
      )}
    </div>
  );
};

const PHASES_CONFIG: Pick<Phase, 'id' | 'title'>[] = [
    { id: 1, title: 'Diagnóstico e Planejamento' },
    { id: 2, title: 'Constituição da Holding' },
    { id: 3, title: 'Coleta de Dados para Integralização' },
    { id: 4, title: 'Minuta de Integralização' },
    { id: 5, title: 'Pagamento do ITBI' },
    { id: 6, title: 'Registro da Integralização' },
    { id: 7, title: 'Conclusão e Entrega' },
    { id: 8, title: 'Transferência de Quotas' },
    { id: 9, title: 'Acordo de Sócios' },
];

const ConsultantDashboard: React.FC<ConsultantDashboardProps> = ({ projects, users, onProjectClick, onNavigateToCreate, onDeleteProject, currentUser }) => {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  const inProgressProjects = projects.filter(p => p.status === 'in-progress');
  const completedProjects = projects.filter(p => p.status === 'completed');

  const isConsultantOrAdmin = currentUser.role === UserRole.CONSULTANT || currentUser.role === UserRole.ADMINISTRATOR;

  const handleConfirmDelete = (projectId: string) => {
    onDeleteProject(projectId);
    setProjectToDelete(null);
  };

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
              <h2 className="text-3xl font-bold text-brand-primary">Painel de Projetos</h2>
              <p className="text-gray-600">Gerencie todos os projetos em andamento e concluídos.</p>
          </div>
          <button
              onClick={onNavigateToCreate}
              className="flex items-center px-4 py-2 bg-brand-secondary text-white rounded-lg font-semibold hover:bg-brand-primary transition-colors"
          >
              <Icon name="user-plus" className="w-5 h-5 mr-2" />
              Novo Projeto
          </button>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xl font-bold text-brand-primary mb-4">Projetos em Andamento</h3>
          <div className="w-full overflow-x-auto pb-4">
              <div className="inline-flex space-x-4 min-w-full">
              {PHASES_CONFIG.map(phase => (
                  <div key={phase.id} className="flex-shrink-0 w-80 bg-gray-100 rounded-xl p-3 flex flex-col">
                  <h3 className="font-semibold text-brand-dark mb-4 px-2">{phase.id}. {phase.title}</h3>
                  <div className="space-y-3 flex-grow overflow-y-auto min-h-[100px]">
                      {inProgressProjects
                      .filter(p => p.currentPhaseId === phase.id)
                      .map(project => (
                          <ProjectCard 
                            key={project.id} 
                            project={project} 
                            users={users} 
                            onClick={() => onProjectClick(project.id)} 
                            onDelete={() => setProjectToDelete(project)}
                            isConsultantOrAdmin={isConsultantOrAdmin}
                          />
                      ))}
                      {inProgressProjects.filter(p => p.currentPhaseId === phase.id).length === 0 && (
                      <div className="text-center text-sm text-gray-400 py-4 px-2 h-full flex items-center justify-center">
                          <p>Nenhum projeto nesta fase.</p>
                      </div>
                      )}
                  </div>
                  </div>
              ))}
              </div>
          </div>
        </div>
        
        {completedProjects.length > 0 && (
            <div>
                <h3 className="text-xl font-bold text-brand-primary mb-4">Projetos Concluídos</h3>
                <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {completedProjects.map(project => (
                            <ProjectCard 
                              key={project.id} 
                              project={project} 
                              users={users} 
                              onClick={() => onProjectClick(project.id)} 
                              onDelete={() => setProjectToDelete(project)}
                              isConsultantOrAdmin={isConsultantOrAdmin}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
      <DeleteProjectModal 
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default ConsultantDashboard;