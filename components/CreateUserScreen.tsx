import React, { useState } from 'react';
import { User, UserRole } from '../types';
import Icon from './Icon';

interface CreateUserScreenProps {
  currentUserRole: UserRole.ADMINISTRATOR | UserRole.CONSULTANT;
  onCreateUser: (newUser: User) => void;
  onBack: () => void;
  defaultRole?: UserRole;
}

const CreateUserScreen: React.FC<CreateUserScreenProps> = ({ currentUserRole, onCreateUser, onBack, defaultRole }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole || UserRole.CONSULTANT);
  
  const isConsultantView = currentUserRole === UserRole.CONSULTANT;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Nome, e-mail e senha são obrigatórios.');
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`, name, email, role,
      password, requiresPasswordChange: true,
    };
    
    onCreateUser(newUser);
    onBack(); // Go back after creation
  };
  
  const title = isConsultantView ? 'Cadastrar Novo Auxiliar' : 'Cadastrar Novo Usuário';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-brand-secondary hover:text-brand-primary mb-6">
        &larr; Voltar
      </button>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-brand-primary mb-6">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div><label className="block text-sm font-medium">Nome Completo</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300"/></div>
            <div><label className="block text-sm font-medium">E-mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300"/></div>
            <div><label className="block text-sm font-medium">Senha Provisória</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300"/></div>
          
            {currentUserRole === UserRole.ADMINISTRATOR && (
              <div>
                <label className="block text-sm font-medium">Função</label>
                <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="mt-1 w-full rounded-md border-gray-300">
                  <option value={UserRole.CONSULTANT}>Consultor</option>
                  <option value={UserRole.AUXILIARY}>Auxiliar</option>
                  <option value={UserRole.ADMINISTRATOR}>Administrador</option>
                </select>
              </div>
            )}
             {isConsultantView && (
                 <div>
                    <label className="block text-sm font-medium">Função</label>
                    <input type="text" value="Auxiliar" readOnly className="mt-1 w-full rounded-md border-gray-300 bg-gray-100"/>
                 </div>
             )}
          
            <div className="flex justify-end pt-4 space-x-3">
                <button type="button" onClick={onBack} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-secondary text-white rounded-lg font-semibold hover:bg-brand-primary">Criar Usuário</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserScreen;