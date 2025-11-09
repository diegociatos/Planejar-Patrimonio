import React, { useState, useMemo } from 'react';
import { Project, User, UserRole } from '../types';
import Icon from './Icon';

interface ManageClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
  allUsers: User[];
  onAddUser: (user: User) => void;
}

const ManageClientsModal: React.FC<ManageClientsModalProps> = ({ isOpen, onClose, project, onUpdateProject, allUsers, onAddUser }) => {
  const [newClient, setNewClient] = useState({ name: '', email: '', password: '', clientType: 'partner' as 'partner' | 'interested' });
  const [error, setError] = useState('');

  // FIX: Derive client user objects from clientIds to use for rendering.
  const projectClients = useMemo(() => {
    return project.clientIds.map(id => allUsers.find(u => u.id === id)).filter((u): u is User => !!u);
  }, [project.clientIds, allUsers]);

  const handleAddClient = () => {
    setError('');
    if (!newClient.name.trim() || !newClient.email.trim() || !newClient.password.trim()) {
        setError('Nome, e-mail e senha são obrigatórios.');
        return;
    }
    const emailExists = allUsers.some(u => u.email.toLowerCase() === newClient.email.toLowerCase());
    if (emailExists) {
        setError('Um usuário com este e-mail já existe no sistema.');
        return;
    }

    const newUser: User = {
        id: `user-${Date.now()}`,
        name: newClient.name,
        email: newClient.email,
        password: newClient.password,
        clientType: newClient.clientType,
        role: UserRole.CLIENT,
        avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
        requiresPasswordChange: true,
    };
    
    onAddUser(newUser);
    // FIX: The 'Project' type has 'clientIds' (string array), not 'clients' (User array). Update clientIds with the new user's ID.
    onUpdateProject(project.id, { clientIds: [...project.clientIds, newUser.id] });
    setNewClient({ name: '', email: '', password: '', clientType: 'partner' });
  };

  const handleRemoveClient = (clientId: string) => {
    // FIX: The 'Project' type has 'clientIds', not 'clients'. Check length against clientIds.
    if (project.clientIds.length <= 1) {
        alert("O projeto deve ter pelo menos um cliente.");
        return;
    }
    if (window.confirm("Tem certeza que deseja remover este cliente do projeto? O usuário não será deletado do sistema.")) {
      // FIX: Filter the clientIds array (string[]) instead of an array of objects.
      const updatedClientIds = project.clientIds.filter(id => id !== clientId);
      // FIX: Update the project with the new clientIds array.
      onUpdateProject(project.id, { clientIds: updatedClientIds });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-xl flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold text-brand-primary">Gerenciar Clientes do Projeto</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
              <Icon name="close" className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Clientes Atuais</h3>
              <ul className="space-y-2">
                {/* FIX: Map over the derived projectClients array of User objects instead of the non-existent 'project.clients'. */}
                {projectClients.map(client => (
                  <li key={client.id} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                    <div className="flex items-center">
                        <img src={client.avatarUrl} alt={client.name} className="w-8 h-8 rounded-full mr-3"/>
                        <div>
                            <p className="text-sm font-medium">{client.name}</p>
                            <p className="text-xs text-gray-500">{client.email}</p>
                        </div>
                    </div>
                    <button onClick={() => handleRemoveClient(client.id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Remover</button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-800 mb-4">Adicionar Novo Cliente ao Projeto</h3>
              <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Nome do cliente" value={newClient.name} onChange={(e) => setNewClient(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 text-sm border-gray-300 rounded-md" />
                    <input type="email" placeholder="E-mail" value={newClient.email} onChange={(e) => setNewClient(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 text-sm border-gray-300 rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="password" placeholder="Senha provisória" value={newClient.password} onChange={(e) => setNewClient(p => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2 text-sm border-gray-300 rounded-md" />
                    <select value={newClient.clientType} onChange={(e) => setNewClient(p => ({ ...p, clientType: e.target.value as any }))} className="w-full px-3 py-2 text-sm border-gray-300 rounded-md">
                        <option value="partner">Sócio</option>
                        <option value="interested">Interessado</option>
                    </select>
                </div>
                <div className="flex justify-end">
                    <button type="button" onClick={handleAddClient} className="px-4 py-2 bg-brand-secondary text-white text-sm font-medium rounded-md hover:bg-brand-primary">Adicionar Cliente</button>
                </div>
                {error && <p className="text-xs text-red-500 text-right">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageClientsModal;