


import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Icon from './Icon';

interface LoginScreenProps {
  onRequirePasswordChange: (user: User) => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onRequirePasswordChange, onLogin, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleForgotPassword = async () => {
    const userEmail = window.prompt("Por favor, digite seu e-mail para redefinir a senha:");
    if (!userEmail) return;

    if (!/\S+@\S+\.\S+/.test(userEmail)) {
      alert("Por favor, insira um endereço de e-mail válido.");
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onForgotPassword(userEmail);
      alert("Se o e-mail estiver cadastrado em nosso sistema, uma mensagem de redefinição de senha foi simulada.");
    } catch (err) {
      console.error("Forgot password error:", err);
      alert("Ocorreu um problema ao tentar simular o envio do e-mail de redefinição. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    
    setError('');
    setIsLoading(true);

    try {
      await onLogin(email, password);
      // Success! The parent component (App.tsx) will handle the state change.
    } catch (err: any) {
      const error = err as Error & { user?: User };
      if (error.message === 'PASSWORD_CHANGE_REQUIRED' && error.user) {
        onRequirePasswordChange(error.user);
      } else {
        setError('E-mail ou senha inválidos.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
           <svg viewBox="0 0 250 80" xmlns="http://www.w3.org/2000/svg" className="mx-auto w-64 h-auto" role="img" aria-labelledby="loginLogoTitle">
            <title id="loginLogoTitle">Planejar Patrimônio Logo</title>
            <g>
                <path d="M44 11V36C44 43.2 38.3 51 30.7 51C23 51 17.3 43.2 17.3 36V11H44ZM46.7 8H14.7V36C14.7 44.5 21.8 53.5 30.7 53.5C39.5 53.5 46.7 44.5 46.7 36V8Z" fill="white"/>
                <path d="M22.7 23.3H38.7V20.7H22.7V23.3Z" fill="white"/>
                <path d="M26.7 39.3H34.7V23.3H26.7V39.3Z" fill="white"/>
                <path d="M22.7 43.3H38.7V40.7H22.7V43.3Z" fill="white"/>
            </g>
            <g>
                <text x="60" y="27" fontFamily="Book Antiqua, serif" fontSize="18" fill="white">PLANEJAR</text>
                <text x="60" y="50" fontFamily="Book Antiqua, serif" fontSize="18" fill="white" fontWeight="bold">PATRIMÔNIO</text>
                <text x="60" y="65" fontFamily="Book Antiqua, serif" fontSize="11" fill="white">Proteja sua família</text>
            </g>
          </svg>
          <p className="mt-4 text-center text-lg text-gray-200">
            Proteja sua família, planeje seu patrimônio.
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 mt-4 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-center text-brand-dark mb-6">Acesse a Plataforma</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700 text-left block">
                Endereço de e-mail
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Icon name="email" className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password"className="text-sm font-medium text-gray-700 text-left block">
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Icon name="lock" className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 focus:outline-none" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                    <Icon name={showPassword ? 'eye-slash' : 'eye'} className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-brand-secondary focus:ring-brand-accent border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                        Lembrar-me
                    </label>
                </div>

                <div className="text-sm">
                    <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="font-medium text-brand-secondary hover:text-brand-primary"
                    >
                        Esqueceu sua senha?
                    </button>
                </div>
            </div>
            
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-secondary hover:bg-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors disabled:bg-gray-400"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;