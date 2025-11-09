
import React, { useState } from 'react';
import { User } from '../types';
import Icon from './Icon';

interface ChangePasswordScreenProps {
  user: User;
  onPasswordChanged: (userId: string, newPassword: string) => void;
  onCancel: () => void;
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ user, onPasswordChanged, onCancel }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha ambos os campos.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    onPasswordChanged(user.id, newPassword);
  };

  return (
    <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
           <svg viewBox="0 0 250 80" xmlns="http://www.w3.org/2000/svg" className="mx-auto w-64 h-auto" role="img" aria-labelledby="logoTitle">
            <title id="logoTitle">Planejar Patrimônio Logo</title>
             <g>
                <path d="M44 11V36C44 43.2 38.3 51 30.7 51C23 51 17.3 43.2 17.3 36V11H44ZM46.7 8H14.7V36C14.7 44.5 21.8 53.5 30.7 53.5C39.5 53.5 46.7 44.5 46.7 36V8Z" fill="white"/>
                <path d="M22.7 23.3H38.7V20.7H22.7V23.3Z" fill="white"/>
                <path d="M26.7 39.3H34.7V23.3H26.7V39.3Z" fill="white"/>
                <path d="M22.7 43.3H38.7V40.7H22.7V43.3Z" fill="white"/>
            </g>
            <g>
                <text x="60" y="27" fontFamily="Book Antiqua, serif" fontSize="18" fill="white">PLANEJAR</text>
                <text x="60" y="50" fontFamily="Book Antiqua, serif" fontSize="18" fill="white" fontWeight="bold">PATRIMÔNIO</text>
            </g>
          </svg>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-center text-brand-dark mb-2">Altere sua Senha</h2>
          <p className="text-center text-sm text-gray-500 mb-6">Olá, {user.name.split(' ')[0]}. Por segurança, crie uma nova senha para seu primeiro acesso.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newPassword"className="text-sm font-medium text-gray-700">
                Nova Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Icon name="lock" className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                    <Icon name={showPassword ? 'eye-slash' : 'eye'} className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword"className="text-sm font-medium text-gray-700">
                Confirme a Nova Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Icon name="lock" className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                  placeholder="••••••••"
                />
                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                    <Icon name={showConfirmPassword ? 'eye-slash' : 'eye'} className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-secondary hover:bg-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors"
              >
                Definir Nova Senha e Acessar
              </button>
            </div>
          </form>
        </div>
        
        <p className="mt-6 text-center text-sm">
          <button onClick={onCancel} className="font-medium text-gray-300 hover:text-white">
            Sair
          </button>
        </p>
      </div>
    </div>
  );
};

export default ChangePasswordScreen;
