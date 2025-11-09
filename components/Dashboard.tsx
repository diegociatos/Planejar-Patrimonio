

import React from 'react';
import { Project, Phase, UserRole, User } from '../types';
import Icon from './Icon';
import { getAIHelp } from '../services/geminiService';

interface DashboardProps {
  project: Project;
  currentUser: User;
  onOpenChat: (chatType: 'client' | 'internal') => void;
  onNavigateToPhase: (phaseId: number) => void;
  isPartnerDataComplete: boolean;
  onNavigateToMyData: () => void;
}

const DataCompletionPrompt: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => (
    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow">
        <div className="flex">
            <div className="flex-shrink-0">
                <Icon name="tasks" className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-3">
                <p className="text-base font-bold text-yellow-800">Ação Necessária: Complete seus dados</p>
                <div className="mt-2 text-sm text-yellow-700">
                    <p>Para prosseguirmos com a constituição da holding, é fundamental que você complete seus dados de qualificação e anexe os documentos necessários.</p>
                </div>
                <div className="mt-4">
                    <button onClick={onNavigate} className="px-4 py-2 text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600">
                        Completar meus dados agora
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const AIAssistant: React.FC<{ project: Project; currentUser: User }> = ({ project, currentUser }) => {
    const [aiMessage, setAiMessage] = React.useState<string | null>("Carregando sua próxima etapa...");
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchGuidance = async () => {
            setIsLoading(true);
            const currentPhase = project.phases.find(p => p.id === project.currentPhaseId);
            const pendingTask = currentPhase?.tasks.find(t => t.assigneeId === currentUser.id && t.status === 'pending');
            
            const prompt = `
                Você é um assistente virtual paciente e didático chamado 'Plano'. Seu objetivo é guiar um cliente, com pouca familiaridade com tecnologia, no processo de criação de uma holding familiar. Fale de forma simples, clara e encorajadora.

                Contexto Atual:
                - Estamos na fase: "${currentPhase?.title}".
                - O objetivo desta fase é: "${currentPhase?.description}".
                - A próxima tarefa pendente do cliente é: "${pendingTask?.description || "Revisar o andamento da fase."}".

                Gere uma mensagem curta (2-3 frases) e amigável para o cliente explicando o que ele precisa fazer agora, por que é importante, e o tranquilizando. Comece com "Olá, ${currentUser.name.split(' ')[0]}!".
            `;
            
            try {
                const response = await getAIHelp(prompt);
                setAiMessage(response.content);
            } catch (error) {
                setAiMessage("Houve um problema ao buscar sua orientação. Por favor, contate seu consultor se tiver dúvidas.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchGuidance();
    }, [project.currentPhaseId, project.phases, currentUser.id, currentUser.name]);

    return (
        <div className="bg-gradient-to-r from-brand-secondary to-brand-primary text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
             <div className="absolute -top-4 -right-4 w-24 h-24 text-white/10">
                <Icon name="ai" className="w-full h-full" />
            </div>
            <div className="relative z-10">
                <h3 className="text-xl font-bold mb-3 flex items-center"><Icon name="ai" className="w-6 h-6 mr-2" /> Seu Assistente Virtual</h3>
                {isLoading ? (
                     <div className="flex items-center space-x-2 h-16">
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                ) : (
                    <p className="text-base font-light leading-relaxed">{aiMessage}</p>
                )}
            </div>
        </div>
    );
};

const PhaseTracker: React.FC<{ phases: Phase[], currentPhaseId: number, onNavigateToPhase: (phaseId: number) => void }> = ({ phases, currentPhaseId, onNavigateToPhase }) => (
  <div className="mt-6">
    <h3 className="text-lg font-semibold text-brand-dark mb-4">Status das Fases</h3>
    <div className="relative">
      <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200" aria-hidden="true"></div>
      <ul className="space-y-4">
        {phases.map((phase) => {
          const isCurrent = phase.id === currentPhaseId;
          const isCompleted = phase.status === 'completed';
          return (
            <li key={phase.id} className="relative pl-8">
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center
                ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-brand-accent ring-4 ring-brand-accent/30' : 'bg-gray-300'}`}>
                {isCompleted ? <Icon name="check" className="w-5 h-5 text-white" /> : <span className={`font-bold ${isCurrent ? 'text-white' : 'text-gray-600'}`}>{phase.id}</span>}
              </div>
               <button 
                  onClick={() => onNavigateToPhase(phase.id)} 
                  className="w-full text-left p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                  aria-label={`Ver detalhes da fase: ${phase.title}`}
              >
                <div className="text-left ml-4">
                  <p className={`font-semibold ${isCurrent ? 'text-brand-primary' : 'text-gray-800'}`}>{phase.title}</p>
                  <p className="text-sm text-gray-500">{isCompleted ? 'Concluída - Ver detalhes' : isCurrent ? 'Em andamento' : 'Pendente'}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  </div>
);

const QuickActions: React.FC<{ onOpenChat: () => void }> = ({ onOpenChat }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold text-brand-dark mb-4">Ações Rápidas</h3>
        <div className="space-y-3">
            <button
              onClick={onOpenChat}
              className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Icon name="chat" className="w-6 h-6 mr-4 text-brand-secondary" />
                <div>
                    <p className="font-semibold text-brand-dark">Fale com seu Consultor</p>
                    <p className="text-sm text-gray-500">Envie uma mensagem direta para tirar dúvidas.</p>
                </div>
            </button>
        </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ project, currentUser, onOpenChat, onNavigateToPhase, isPartnerDataComplete, onNavigateToMyData }) => {
  const completedPhases = project.phases.filter(p => p.status === 'completed').length;
  const totalPhases = project.phases.length;
  const progress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-bold text-brand-primary mb-2">Bem-vindo(a) ao {project.name}</h2>
      <p className="text-gray-600 mb-6">Acompanhe o andamento da constituição de sua holding familiar.</p>

      {currentUser.clientType === 'partner' && !isPartnerDataComplete && (
        <DataCompletionPrompt onNavigate={onNavigateToMyData} />
      )}

      <div className="mb-8 bg-white p-4 rounded-2xl shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-brand-dark">Progresso do Projeto</span>
              <span className="text-sm font-bold text-brand-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-brand-accent h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <PhaseTracker phases={project.phases} currentPhaseId={project.currentPhaseId} onNavigateToPhase={onNavigateToPhase} />
        </div>

        <div className="space-y-8">
          <AIAssistant project={project} currentUser={currentUser} />
          <QuickActions onOpenChat={() => onOpenChat('client')} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;