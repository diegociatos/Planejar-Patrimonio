


import React from 'react';
import { UserRole } from '../types';
import Icon, { IconName } from './Icon';

interface NavItem {
    view: string;
    label: string;
    icon: IconName;
}

const clientNav: NavItem[] = [
    { view: 'dashboard', label: 'Meu Projeto', icon: 'dashboard' },
    { view: 'my_tasks', label: 'Minhas Tarefas', icon: 'tasks' },
    { view: 'my_data', label: 'Meus Dados', icon: 'user-circle' },
    { view: 'documents', label: 'Documentos', icon: 'folder' },
    { view: 'support', label: 'Suporte e Solicitações', icon: 'chat' },
];

const auxiliaryNav: NavItem[] = [
    { view: 'dashboard', label: 'Minhas Tarefas', icon: 'tasks' },
    { view: 'documents', label: 'Documentos', icon: 'file-text' },
];

const consultantNav: NavItem[] = [
  { view: 'dashboard', label: 'Projetos', icon: 'dashboard' },
  { view: 'support', label: 'Suporte e Tickets', icon: 'tasks' },
  { view: 'documents', label: 'Documentos', icon: 'file-text' },
  { view: 'create_client', label: 'Novo Projeto', icon: 'user-plus' },
  { view: 'manage_users', label: 'Gerenciar Usuários', icon: 'users' },
];

const adminNav: NavItem[] = [
  { view: 'dashboard', label: 'Painel Geral', icon: 'dashboard' },
  { view: 'support', label: 'Suporte e Tickets', icon: 'tasks' },
  { view: 'manage_users', label: 'Gerenciar Usuários', icon: 'users' },
  { view: 'documents', label: 'Documentos', icon: 'file-text' },
];

interface SidebarProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
  activeView: string;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole, onNavigate, activeView, isOpen, onClose }) => {
  const navItems = {
    [UserRole.CLIENT]: clientNav,
    [UserRole.AUXILIARY]: auxiliaryNav,
    [UserRole.CONSULTANT]: consultantNav,
    [UserRole.ADMINISTRATOR]: adminNav,
  }[userRole];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-64 bg-brand-dark text-white flex-shrink-0 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeView.startsWith(item.view)
                  ? 'bg-brand-accent text-brand-dark'
                  : 'text-gray-300 hover:bg-brand-secondary hover:text-white'
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">Plataforma de Gestão v2.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;