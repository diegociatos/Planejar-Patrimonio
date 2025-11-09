import React, { useMemo } from 'react';
import { Project, Phase, User, Task } from '../types';
import Icon from './Icon';

const ProjectCard: React.FC<{ project: Project, users: User[], onClick: () => void }> = ({ project, users, onClick }) => {
  const mainClientId = project.clientIds[0];
  const mainClient = users.find(u => u.id === mainClientId);
  
  return (
    <button onClick={onClick} className="w-full bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md hover:border-brand-secondary transition-all text-left relative">
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-bold text-brand-dark pr-2">{project.name}</h4>
        {project.status === 'completed' && (
            <span className="flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Concluído</span>
        )}
      </div>
      <p className="text-sm text-gray-500">
        {mainClient?.name || mainClientId}{project.clientIds.length > 1 ? ` + ${project.clientIds.length - 1} outro(s)` : ''}
      </p>
    </button>
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

interface AuxiliaryDashboardProps {
  projects: Project[];
  currentUser: User;
  onProjectClick: (projectId: string) => void;
  onTaskClick: (projectId: string, phaseId: number) => void;
  users: User[];
  hideTasks?: boolean;
}

const AuxiliaryDashboard: React.FC<AuxiliaryDashboardProps> = ({ projects, currentUser, onProjectClick, onTaskClick, users, hideTasks = false }) => {

  const myProjects = useMemo(() => projects.filter(p => p.auxiliaryId === currentUser.id), [projects, currentUser.id]);

  const inProgressProjects = useMemo(() => myProjects.filter(p => p.status === 'in-progress'), [myProjects]);
  const completedProjects = useMemo(() => myProjects.filter(p => p.status === 'completed'), [myProjects]);
  
  const myPendingTasks = useMemo(() => {
    const tasks: (Task & { projectName: string; projectId: string; })[] = [];
    myProjects.forEach(project => {
      project.phases.forEach(phase => {
        phase.tasks.forEach(task => {
          if (task.assigneeId === currentUser.id && task.status === 'pending') {
            tasks.push({ ...task, projectName: project.name, projectId: project.id });
          }
        });
      });
    });
    return tasks;
  }, [myProjects, currentUser.id]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="text-3xl font-bold text-brand-primary">
          {hideTasks ? 'Visão Geral dos Projetos' : 'Painel do Auxiliar'}
        </h2>
        <p className="text-gray-600">
          {hideTasks ? 'Acompanhe o andamento dos projetos.' : 'Gerencie suas tarefas e acompanhe os projetos.'}
        </p>
      </div>

      {!hideTasks && (
        <div className="mt-8 mb-8 flex-shrink-0">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-brand-dark mb-4">Minhas Tarefas Pendentes</h3>
                {myPendingTasks.length > 0 ? (
                    <div className="space-y-3">
                        {myPendingTasks.map(task => (
                            <button 
                                key={task.id} 
                                onClick={() => onTaskClick(task.projectId, task.phaseId)}
                                className="w-full text-left p-4 border rounded-lg bg-yellow-50 border-yellow-200 flex items-start hover:bg-yellow-100 hover:border-yellow-300 transition-colors"
                            >
                                <Icon name="pending" className="w-6 h-6 text-yellow-600 mr-4 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-800">{task.description}</p>
                                    <p className="text-sm text-gray-500">
                                        Projeto: {task.projectName}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Icon name="check" className="w-12 h-12 text-green-500 mx-auto" />
                        <p className="mt-4 font-semibold text-gray-700">Tudo em dia!</p>
                        <p className="text-gray-500">Nenhuma tarefa pendente no momento.</p>
                    </div>
                )}
            </div>
        </div>
      )}
      
      <div className={`flex-grow w-full flex flex-col ${hideTasks ? 'mt-8' : ''}`}>
        <h3 className="text-xl font-bold text-brand-dark mb-4 flex-shrink-0">Projetos em Andamento</h3>
        <div className="flex-grow w-full overflow-x-auto pb-4">
            <div className="inline-flex space-x-4 min-w-full h-full">
            {PHASES_CONFIG.map(phase => (
                <div key={phase.id} className="flex-shrink-0 w-80 bg-gray-100 rounded-xl p-3 flex flex-col">
                <h3 className="font-semibold text-brand-dark mb-4 px-2">{phase.id}. {phase.title}</h3>
                <div className="space-y-3 flex-grow overflow-y-auto">
                    {inProgressProjects
                    .filter(p => p.currentPhaseId === phase.id)
                    .map(project => (
                        <ProjectCard key={project.id} project={project} users={users} onClick={() => onProjectClick(project.id)} />
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

        {completedProjects.length > 0 && (
          <div className="mt-8">
              <h3 className="text-xl font-bold text-brand-primary mb-4">Projetos Concluídos</h3>
              <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {completedProjects.map(project => (
                          <ProjectCard key={project.id} project={project} users={users} onClick={() => onProjectClick(project.id)} />
                      ))}
                  </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuxiliaryDashboard;