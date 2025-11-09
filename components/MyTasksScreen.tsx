import React, { useMemo } from 'react';
import { User, Project, Task } from '../types';
import Icon from './Icon';

interface MyTasksScreenProps {
  currentUser: User;
  projects: Project[];
  onBack: () => void;
  onNavigateToTask: (projectId: string, phaseId: number) => void;
}

const MyTasksScreen: React.FC<MyTasksScreenProps> = ({ currentUser, projects, onBack, onNavigateToTask }) => {

  const { pendingTasks, completedTasks } = useMemo(() => {
    const pending: (Task & { projectName: string; phaseTitle: string; projectId: string; })[] = [];
    const completed: (Task & { projectName: string; phaseTitle: string; projectId: string; })[] = [];
    
    const myProject = projects.find(p => p.clientIds.includes(currentUser.id));
    
    if (myProject) {
      myProject.phases.forEach(phase => {
        phase.tasks.forEach(task => {
          if (task.assigneeId === currentUser.id) {
            const taskWithContext = {
              ...task,
              projectName: myProject.name,
              phaseTitle: phase.title,
              projectId: myProject.id,
            };
            if (task.status === 'pending') {
              pending.push(taskWithContext);
            } else if (task.status === 'completed' || task.status === 'approved') {
              completed.push(taskWithContext);
            }
          }
        });
      });
    }

    completed.sort((a, b) => {
        const dateA = a.completedAt || a.createdAt;
        const dateB = b.completedAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return { pendingTasks: pending, completedTasks: completed };
  }, [projects, currentUser.id]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-brand-secondary hover:text-brand-primary mb-6">
        <Icon name="arrow-right" className="w-4 h-4 mr-2 transform rotate-180" />Voltar
      </button>
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-brand-primary mb-2">Minhas Tarefas</h2>
        <p className="text-gray-600 mb-8">Abaixo estão suas tarefas pendentes e concluídas. Clique em uma tarefa para ser direcionado à fase correspondente.</p>
        
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-brand-dark mb-4">Pendentes</h3>
            {pendingTasks.length > 0 ? (
                <div className="space-y-3">
                    {pendingTasks.map(task => (
                        <button 
                            key={task.id} 
                            onClick={() => onNavigateToTask(task.projectId, task.phaseId)}
                            className="w-full text-left p-4 border rounded-lg bg-yellow-50 border-yellow-200 flex items-start hover:bg-yellow-100 hover:border-yellow-300 transition-colors"
                        >
                             <Icon name="pending" className="w-6 h-6 text-yellow-600 mr-4 mt-1 flex-shrink-0" />
                             <div>
                                <p className="font-semibold text-gray-800">{task.description}</p>
                                <p className="text-sm text-gray-500">
                                    Projeto: {task.projectName} / Fase: {task.phaseTitle}
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

        {completedTasks.length > 0 && (
          <div>
              <details className="border rounded-lg group">
                  <summary className="p-4 cursor-pointer flex justify-between items-center font-semibold text-brand-dark hover:bg-gray-50">
                      <span>Concluídas</span>
                      <Icon name="arrow-right" className="w-5 h-5 transition-transform transform group-open:rotate-90" />
                  </summary>
                  <div className="p-4 border-t">
                      <div className="space-y-3">
                          {completedTasks.map(task => (
                              <button 
                                  key={task.id} 
                                  onClick={() => onNavigateToTask(task.projectId, task.phaseId)}
                                  className="w-full text-left p-4 border rounded-lg bg-green-50 border-green-200 flex items-start hover:bg-green-100 hover:border-green-300 transition-colors"
                              >
                                  <Icon name="check" className="w-6 h-6 text-green-600 mr-4 mt-1 flex-shrink-0" />
                                  <div>
                                      <p className="font-semibold text-gray-700 line-through">{task.description}</p>
                                      <p className="text-sm text-gray-500">
                                          Projeto: {task.projectName} / Fase: {task.phaseTitle}
                                      </p>
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
              </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasksScreen;