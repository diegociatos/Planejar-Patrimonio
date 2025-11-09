import React from 'react';
import { Project, User } from '../types';
import Icon from './Icon';

interface ProjectsDocumentsViewProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

const ProjectsDocumentsView: React.FC<ProjectsDocumentsViewProps> = ({ projects, onProjectClick }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-brand-primary mb-2">Central de Documentos</h2>
        <p className="text-gray-600 mb-6">Selecione um projeto para visualizar ou adicionar documentos.</p>
        
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => onProjectClick(project.id)}
                className="p-4 border rounded-lg text-left hover:bg-gray-50 hover:border-brand-secondary transition-colors"
              >
                <div className="flex items-center mb-2">
                    <Icon name="folder" className="w-6 h-6 mr-3 text-brand-secondary"/>
                    <h3 className="font-bold text-brand-dark">{project.name}</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Status: {project.status === 'in-progress' ? 'Em Andamento' : 'Concluído'}
                </p>
                 <p className="text-sm text-gray-500">
                  Fase Atual: {project.currentPhaseId}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Icon name="folder" className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum projeto encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">Você ainda não foi atribuído a nenhum projeto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsDocumentsView;