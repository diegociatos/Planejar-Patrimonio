import React, { useMemo, useState, useRef, useEffect } from 'react';
import { User, UserRole, Project } from '../types';
import Icon from './Icon';

interface ManageUsersScreenProps {
  users: User[];
  projects: Project[];
  currentUser: User;
  onBack: () => void;
  onDeleteUser: (userId: string) => void;
  onNavigateToCreate: (role?: UserRole) => void;
  onResetPassword: (userId: string) => void;
}

const getRoleInfo = (role: UserRole) => {
    switch (role) {
        case UserRole.ADMINISTRATOR: return { label: 'Admin', color: 'bg-red-100 text-red-800' };
        case UserRole.CONSULTANT: return { label: 'Consultor', color: 'bg-blue-100 text-blue-800' };
        case UserRole.AUXILIARY: return { label: 'Auxiliar', color: 'bg-green-100 text-green-800' };
        case UserRole.CLIENT: return { label: 'Cliente', color: 'bg-yellow-100 text-yellow-800' };
        default: return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
    }
}

const ManageUsersScreen: React.FC<ManageUsersScreenProps> = ({ users, projects, currentUser, onBack, onDeleteUser, onNavigateToCreate, onResetPassword }) => {
    
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isConsultantView = currentUser.role === UserRole.CONSULTANT;

  const { manageableUsers, unmanageableUsers } = useMemo(() => {
    const manageable: User[] = [];
    const unmanageable: User[] = [];

    const otherUsers = users.filter(user => user.id !== currentUser.id);

    if (currentUser.role === UserRole.ADMINISTRATOR) {
        otherUsers.forEach(user => {
            if (user.role === UserRole.ADMINISTRATOR) {
                unmanageable.push(user);
            } else {
                manageable.push(user);
            }
        });
    } else if (currentUser.role === UserRole.CONSULTANT) {
        const myClientIds = new Set<string>();
        projects.forEach(p => {
            if (p.consultantId === currentUser.id) {
                p.clientIds.forEach(id => myClientIds.add(id));
            }
        });

        otherUsers.forEach(user => {
            if (user.role === UserRole.AUXILIARY || myClientIds.has(user.id)) {
                manageable.push(user);
            }
        });
    }
    
    return { manageableUsers: manageable, unmanageableUsers: unmanageable };
  }, [users, currentUser, projects]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const title = 'Gerenciar Usuários';
  const description = isConsultantView 
    ? 'Adicione, visualize ou remova clientes e auxiliares.' 
    : 'Gerencie todos os consultores, auxiliares e clientes da plataforma.';
    
  const handleDelete = (userName: string, userId: string) => {
    setActiveMenu(null);
    if (window.confirm(`Tem certeza que deseja deletar o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      onDeleteUser(userId);
    }
  };
  
  const handleResetPassword = (userId: string) => {
      setActiveMenu(null);
      onResetPassword(userId);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-brand-secondary hover:text-brand-primary mb-6">
        <Icon name="arrow-right" className="w-4 h-4 mr-2 transform rotate-180" />
        Voltar
      </button>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-brand-primary mb-2">{title}</h2>
                <p className="text-gray-600">{description}</p>
            </div>
            <button
                onClick={() => onNavigateToCreate(isConsultantView ? UserRole.AUXILIARY : undefined)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-secondary hover:bg-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
            >
                <Icon name="user-plus" className="w-5 h-5 mr-2" />
                {isConsultantView ? 'Novo Auxiliar' : 'Novo Usuário'}
            </button>
        </div>
        
        <div className="space-y-3">
            {manageableUsers.length > 0 ? (
                manageableUsers.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    return (
                        <div key={user.id} className="p-3 bg-gray-50 border rounded-lg flex items-center justify-between hover:bg-white hover:border-brand-secondary transition-colors">
                            <div className="flex items-center">
                                {user.avatarUrl ? (
                                    <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt={user.name} />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="font-bold text-gray-600">{user.name.charAt(0)}</span>
                                    </div>
                                )}
                                <div className="ml-4">
                                    <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleInfo.color}`}>
                                    {roleInfo.label}
                                </span>
                                <div className="relative" ref={activeMenu === user.id ? menuRef : null}>
                                    <button 
                                        onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)} 
                                        className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200"
                                        aria-label="Ações"
                                    >
                                        <Icon name="dots-vertical" className="w-5 h-5" />
                                    </button>
                                    {activeMenu === user.id && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                            <div className="py-1">
                                                <button onClick={() => handleResetPassword(user.id)} className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center">
                                                    <Icon name="lock" className="w-5 h-5 mr-3 text-gray-500" /> Resetar Senha
                                                </button>
                                                <button onClick={() => handleDelete(user.name, user.id)} className="text-red-600 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center">
                                                    <Icon name="trash" className="w-5 h-5 mr-3" /> Deletar Usuário
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-center p-4">
                    <p className="text-sm text-gray-500">Nenhum usuário gerenciável para exibir.</p>
                </div>
            )}
        </div>

        {unmanageableUsers.length > 0 && (
          <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-brand-dark mb-4">Outros Usuários no Sistema (Somente Visualização)</h3>
              <div className="space-y-3">
                  {unmanageableUsers.map((user) => {
                      const roleInfo = getRoleInfo(user.role);
                      return (
                          <div key={user.id} className="p-3 bg-gray-100 border rounded-lg flex items-center justify-between opacity-80">
                              <div className="flex items-center">
                                  {user.avatarUrl ? (
                                        <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt={user.name} />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="font-bold text-gray-600">{user.name.charAt(0)}</span>
                                        </div>
                                    )}
                                  <div className="ml-4">
                                      <div className="text-sm font-bold text-gray-700">{user.name}</div>
                                      <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                              </div>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleInfo.color}`}>
                                  {roleInfo.label}
                              </span>
                          </div>
                      );
                  })}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsersScreen;