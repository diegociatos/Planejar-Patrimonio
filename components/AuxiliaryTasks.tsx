
import React, { useState } from 'react';
import { Phase, User, Task, Project, Document as DocType } from '../types';
import Icon from './Icon';

interface AuxiliaryTasksProps {
  phase: Phase;
  project: Project;
  auxiliary: User;
  onCreateTask: (phaseId: number, description: string) => void;
}

const AuxiliaryTasks: React.FC<AuxiliaryTasksProps> = ({ phase, project, auxiliary, onCreateTask }) => {
  const [taskDescription, setTaskDescription] = useState('');

  const auxiliaryPendingTasks = phase.tasks.filter(
    task => task.assigneeId === auxiliary.id && task.status === 'pending'
  );
  
  const auxiliaryCompletedTasks = phase.tasks.filter(
    task => task.assigneeId === auxiliary.id && task.status === 'completed'
  );

  const findDocumentForTask = (taskId: string): DocType | undefined => {
    const task = phase.tasks.find(t => t.id === taskId);
    if (!task || !task.relatedDocumentId) return undefined;
    
    for (const p of project.phases) {
        const doc = p.documents.find(d => d.id === task.relatedDocumentId);
        if (doc) return doc;
    }
    return undefined;
  };

  const handleCreateTask = () => {
    if (taskDescription.trim()) {
      onCreateTask(phase.id, taskDescription);
      setTaskDescription('');
    }
  };

  return (
    <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg mt-4">
      <h5 className="font-semibold text-brand-dark mb-3">
        Tarefas para o Auxiliar: <span className="font-bold">{auxiliary.name.split(' ')[0]}</span>
      </h5>

      {/* Task Creation Form */}
      <div className="flex items-center space-x-2 mb-4">
        <input
          type="text"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          placeholder="Descreva a nova tarefa..."
          className="flex-grow text-sm rounded-md border-gray-300 focus:ring-brand-secondary focus:border-brand-secondary"
        />
        <button
          onClick={handleCreateTask}
          disabled={!taskDescription.trim()}
          className="px-4 py-2 bg-brand-secondary text-white text-sm font-semibold rounded-md hover:bg-brand-primary disabled:bg-gray-400"
        >
          Delegar
        </button>
      </div>

      {/* Pending Task List */}
      {auxiliaryPendingTasks.length > 0 && (
        <ul className="space-y-2">
          {auxiliaryPendingTasks.map(task => (
            <li key={task.id} className="flex items-center p-2 bg-white rounded-md border">
              <Icon name="pending" className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
              <span className="text-sm text-gray-800">{task.description}</span>
            </li>
          ))}
        </ul>
      )}

       {/* Completed Task List */}
       {auxiliaryCompletedTasks.length > 0 && (
        <div className="mt-4 pt-3 border-t">
            <h6 className="font-semibold text-sm text-gray-600 mb-2">Tarefas Concluídas</h6>
            <ul className="space-y-2">
            {auxiliaryCompletedTasks.map(task => {
                const doc = findDocumentForTask(task.id);
                return (
                <li key={task.id} className="flex items-center p-2 bg-green-100/50 rounded-md border border-green-200">
                    <Icon name="check" className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <div className="flex-grow">
                    <p className="text-sm text-gray-800 line-through">{task.description}</p>
                    {doc && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                        <Icon name="file-pdf" className="w-3 h-3 mr-1" />
                        {doc.name}
                        </a>
                    )}
                    </div>
                </li>
                );
            })}
            </ul>
        </div>
      )}

      {auxiliaryPendingTasks.length === 0 && auxiliaryCompletedTasks.length === 0 && (
         <p className="text-center text-sm text-gray-500 py-2">Nenhuma tarefa delegada nesta fase.</p>
      )}
    </div>
  );
};

export default AuxiliaryTasks;
