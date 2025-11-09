import React from 'react';
import { LogEntry, User } from '../types';
import Icon, { IconName } from './Icon';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: LogEntry[];
  users: User[];
}

const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `há ${Math.floor(interval)} anos`;
    interval = seconds / 2592000;
    if (interval > 1) return `há ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `há ${Math.floor(interval)} dias`;
    interval = seconds / 3600;
    if (interval > 1) return `há ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `há ${Math.floor(interval)} minutos`;
    return "agora mesmo";
};

const getActionIcon = (action: string): IconName => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('criou o projeto')) return 'folder';
    if (lowerAction.includes('adicionou') && (lowerAction.includes('cliente') || lowerAction.includes('membro'))) return 'user-plus';
    if (lowerAction.includes('avançou')) return 'arrow-right';
    if (lowerAction.includes('completou a tarefa') || lowerAction.includes('aprovou')) return 'check';
    if (lowerAction.includes('adicionou o documento')) return 'file-text';
    if (lowerAction.includes('enviou') && lowerAction.includes('para análise')) return 'send';
    return 'user-circle';
};

const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose, log, users }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 animate-fade-in-up" onClick={onClose} aria-hidden="true" style={{ animationDuration: '0.2s' }}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="log-modal-title">
        <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
          <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
            <h2 id="log-modal-title" className="text-xl font-bold text-brand-primary flex items-center">
                <Icon name="pending" className="w-6 h-6 mr-3" />
                Histórico de Atividades do Projeto
            </h2>
            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Fechar">
              <Icon name="close" className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow bg-gray-50">
            {log && log.length > 0 ? (
                <ul className="space-y-4">
                    {log.map(entry => {
                        const icon = getActionIcon(entry.action);
                        return (
                            <li key={entry.id} className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Icon name={icon} className="w-5 h-5 text-gray-600" />
                                    </div>
                                </div>
                                <div className="flex-grow pt-1">
                                    <p className="text-sm text-gray-800">
                                        <span className="font-bold">{entry.actorName}</span> {entry.action}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {timeSince(entry.timestamp)}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="text-center py-10">
                    <Icon name="folder" className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Nenhuma atividade registrada ainda.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityLogModal;