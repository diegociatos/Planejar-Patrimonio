import React, { useState, useRef } from 'react';
import { Phase, Project, UserRole, Phase7ConclusionData, Document } from '../types';
import Icon from './Icon';
import { documentsApi } from '../services/apiService';

interface Phase7ConclusionProps {
  phase: Phase;
  project: Project;
  userRole: UserRole;
  canEdit: boolean;
  onBackToDashboard: () => void;
  onUpdateData: (data: Partial<Phase7ConclusionData>) => void;
  onOpenChatWithQuestion: (question: string) => void;
  onUploadAndLinkDocument: (projectId: string, phaseId: number, file: File, onLink: (docId: string) => void) => void;
  isReadOnly?: boolean;
}

const AI_SUGGESTIONS = [
    "Quando posso começar a usar a holding?",
    "Preciso declarar a holding no meu Imposto de Renda?",
    "Minha holding já pode emitir notas fiscais?",
    "Quais os próximos passos após a conclusão?",
];

const StarRating: React.FC<{ rating: number, setRating: (rating: number) => void, isReadOnly?: boolean }> = ({ rating, setRating, isReadOnly }) => (
    <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => !isReadOnly && setRating(star)} className={`text-3xl text-gray-300 ${!isReadOnly ? 'hover:text-brand-accent' : ''} focus:outline-none`} disabled={isReadOnly}>
                <span className={rating >= star ? 'text-brand-accent' : ''}>★</span>
            </button>
        ))}
    </div>
);


const Phase7Conclusion: React.FC<Phase7ConclusionProps> = ({ phase, project, userRole, canEdit, onBackToDashboard, onUpdateData, onOpenChatWithQuestion, onUploadAndLinkDocument, isReadOnly }) => {
    const phaseData = phase.phase7Data || { status: 'pending' };
    const [uploadedDocs, setUploadedDocs] = useState<Document[]>(phaseData.additionalDocuments || []);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAdditionalFileUpload = (file: File) => {
        setIsUploading(true);
        onUploadAndLinkDocument(project.id, phase.id, file, (docId) => {
            const newDoc: Document = {
                id: docId,
                name: file.name,
                url: '',
                type: file.name.endsWith('.pdf') ? 'pdf' : 'other',
                uploadedAt: new Date().toISOString(),
                uploadedBy: '',
                phaseId: phase.id,
                version: 1,
                status: 'active',
            };
            const updatedDocs = [...uploadedDocs, newDoc];
            setUploadedDocs(updatedDocs);
            onUpdateData({ additionalDocuments: updatedDocs });
            setIsUploading(false);
        });
    };

    const handleDownloadDoc = async (docId: string, docName: string) => {
        try {
            const blob = await documentsApi.download(docId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = docName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erro ao baixar documento:', err);
            alert('Erro ao baixar documento.');
        }
    };
    const [consultantObservations, setConsultantObservations] = useState(phaseData.consultantObservations || '');
    const [feedbackRating, setFeedbackRating] = useState(phaseData.feedback?.rating || 0);
    const [feedbackComment, setFeedbackComment] = useState(phaseData.feedback?.comment || '');
    const [feedbackRecommendation, setFeedbackRecommendation] = useState<boolean | undefined>(phaseData.feedback?.wouldRecommend);
    
    const arePreviousPhasesComplete = project.phases.slice(0, 6).every(p => p.status === 'completed');

    const handleFinalizeProject = () => {
      if (window.confirm("Tem certeza que deseja concluir este projeto? Esta ação notificará o cliente e não poderá ser desfeita.")) {
          onUpdateData({
              status: 'completed',
              conclusionDate: new Date().toISOString(),
              consultantObservations,
          });
      }
    };

    const handleSubmitFeedback = () => {
        if (feedbackRating === 0) {
            alert("Por favor, selecione uma avaliação de 1 a 5 estrelas.");
            return;
        };
        const feedback: Phase7ConclusionData['feedback'] = {
            rating: feedbackRating,
            comment: feedbackComment,
            wouldRecommend: feedbackRecommendation,
        };
        onUpdateData({ feedback });
    };

    // Client View
    if (!canEdit) {
        if (phaseData.status !== 'completed') {
            return (
                <div className="p-4 sm:p-6 lg:p-8">
                    <button onClick={onBackToDashboard} className="flex items-center text-sm font-medium text-brand-secondary hover:text-brand-primary mb-6"><Icon name="arrow-right" className="w-4 h-4 mr-2 transform rotate-180" />Voltar</button>
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 text-center">
                        <Icon name="pending" className="w-16 h-16 text-brand-accent mx-auto animate-pulse" />
                        <h3 className="text-2xl font-bold text-brand-primary mt-4">Quase lá!</h3>
                        <p className="text-gray-600 mt-2">Seu projeto está em fase de finalização.</p>
                        <div className="mt-6 p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg flex items-center justify-center">
                            <Icon name="consultant" className="w-6 h-6 mr-3"/>
                            <div>
                                <h5 className="font-semibold">Aguardando a conclusão pelo consultor.</h5>
                                <p className="text-sm">Você será notificado assim que o dossiê final estiver pronto.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        
        return (
             <div className="p-4 sm:p-6 lg:p-8">
                <button onClick={onBackToDashboard} className="flex items-center text-sm font-medium text-brand-secondary hover:text-brand-primary mb-6"><Icon name="arrow-right" className="w-4 h-4 mr-2 transform rotate-180" />Voltar</button>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                    <div className="text-center">
                        <Icon name="check" className="w-16 h-16 text-green-500 mx-auto" />
                        <h3 className="text-3xl font-bold text-brand-primary mt-4">Seu Projeto Foi Concluído!</h3>
                        <p className="text-gray-600 mt-2">Parabéns! A constituição da sua holding familiar foi finalizada com sucesso.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="p-4 border rounded-xl">
                                <h4 className="font-semibold text-lg text-brand-dark mb-3">Resumo do Projeto</h4>
                                <div className="space-y-2">
                                    {project.phases.slice(0, 6).map(p => (
                                        <div key={p.id} className="p-2 flex justify-between items-center bg-gray-50 rounded-md">
                                            <p className="font-medium text-sm text-gray-700">{p.id}. {p.title}</p>
                                            <span className="text-green-600 flex items-center text-sm"><Icon name="check" className="w-4 h-4 mr-1"/>Concluída</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {!phaseData.feedback ? (
                                <div className="p-6 border rounded-xl bg-brand-light">
                                    <h4 className="font-semibold text-lg text-brand-dark mb-3">Avalie sua Experiência</h4>
                                    <p className="text-sm text-gray-600 mb-4">Seu feedback é muito importante para nós.</p>
                                    <div className="space-y-4">
                                        <div><label className="font-medium text-sm">Sua avaliação geral:</label><StarRating rating={feedbackRating} setRating={setFeedbackRating} isReadOnly={isReadOnly} /></div>
                                        <div><label className="font-medium text-sm">Você indicaria nossos serviços?</label><div className="flex space-x-2 mt-1"><button onClick={() => setFeedbackRecommendation(true)} className={`px-4 py-1 text-sm rounded-full border ${feedbackRecommendation === true ? 'bg-brand-secondary text-white border-brand-secondary' : 'bg-white'}`} disabled={isReadOnly}>Sim</button><button onClick={() => setFeedbackRecommendation(false)} className={`px-4 py-1 text-sm rounded-full border ${feedbackRecommendation === false ? 'bg-red-500 text-white border-red-500' : 'bg-white'}`} disabled={isReadOnly}>Não</button></div></div>
                                        <div><label className="font-medium text-sm">Deixe um comentário (opcional):</label><textarea value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm disabled:bg-gray-100" disabled={isReadOnly}></textarea></div>
                                        {!isReadOnly && <button onClick={handleSubmitFeedback} disabled={feedbackRating === 0} className="px-6 py-2 bg-brand-accent text-brand-dark rounded-lg font-semibold hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed">Enviar Avaliação</button>}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 border rounded-xl bg-green-50 text-green-800"><p className="font-semibold text-center">Obrigado pelo seu feedback!</p></div>
                            )}

                        </div>
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                                <Icon name="file-pdf" className="w-10 h-10 text-brand-secondary mx-auto mb-2" />
                                <h4 className="font-semibold text-brand-dark mb-2">Dossiê Final</h4>
                                <p className="text-xs text-gray-600 mb-3">Todos os documentos importantes compilados para você.</p>
                                <button onClick={() => alert("Funcionalidade de download em desenvolvimento.")} className="w-full px-4 py-2 bg-brand-secondary text-white rounded-lg font-semibold text-sm hover:bg-brand-primary">Baixar Dossiê (.pdf)</button>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-xl border h-fit">
                                <h4 className="font-semibold text-lg text-brand-dark mb-3">E agora?</h4>
                                <p className="text-sm text-gray-500 mb-4">Tire suas dúvidas finais com a nossa IA.</p>
                                <div className="space-y-2">{AI_SUGGESTIONS.map(q => (<button key={q} onClick={() => onOpenChatWithQuestion(q)} className="w-full text-left text-sm p-3 bg-white border rounded-md hover:bg-gray-100">{q}</button>))}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Consultant/Admin View
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <button onClick={onBackToDashboard} className="flex items-center text-sm font-medium text-brand-secondary hover:text-brand-primary mb-6"><Icon name="arrow-right" className="w-4 h-4 mr-2 transform rotate-180" />Voltar</button>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-2xl font-bold text-brand-primary mb-2">{phase.id}. {phase.title}</h3>
                <p className="text-gray-600 mb-6">{phase.description}</p>
                 <div className="max-w-2xl mx-auto">
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Observações Finais para o Cliente</label>
                            <textarea value={consultantObservations} onChange={(e) => setConsultantObservations(e.target.value)} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-secondary focus:ring-brand-secondary sm:text-sm"></textarea>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-700">Documentos Finais Adicionais (Opcional)</label>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && handleAdditionalFileUpload(e.target.files[0])} disabled={isUploading} />
                            <div onClick={() => !isUploading && fileInputRef.current?.click()} className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-brand-secondary hover:bg-gray-50 transition-colors">
                                <div className="space-y-1 text-center">
                                    {isUploading ? (
                                        <>
                                            <svg className="animate-spin mx-auto h-12 w-12 text-brand-secondary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                            <p className="text-sm text-brand-secondary font-medium">Enviando arquivo...</p>
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="folder" className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="text-sm text-gray-600"><span className="font-medium text-brand-secondary">Clique para enviar</span> ou arraste e solte</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            {uploadedDocs.length > 0 && (
                                <ul className="mt-3 space-y-1">
                                    {uploadedDocs.map(doc => (
                                        <li key={doc.id} className="flex items-center text-sm text-gray-700">
                                            <Icon name="file-pdf" className="w-4 h-4 mr-2 text-brand-secondary" />
                                            <button onClick={() => handleDownloadDoc(doc.id, doc.name)} className="text-blue-600 hover:underline">{doc.name}</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="p-4 bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400">
                            <h4 className="font-bold">Atenção</h4>
                            <p className="text-sm">Ao concluir o projeto, ele será arquivado e o cliente será notificado. Esta ação não pode ser desfeita.</p>
                        </div>
                         <button 
                            onClick={handleFinalizeProject} 
                            disabled={!arePreviousPhasesComplete || phaseData.status === 'completed'}
                            className="w-full flex items-center justify-center px-6 py-4 bg-brand-accent text-brand-dark rounded-lg font-bold text-lg hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed">
                            <Icon name="check" className="w-6 h-6 mr-3" />
                            {phaseData.status === 'completed' ? 'Projeto Já Concluído' : 'Marcar Projeto como Concluído'}
                        </button>
                        {!arePreviousPhasesComplete && phaseData.status !== 'completed' && <p className="text-center text-sm text-red-600 mt-2">Finalize todas as fases anteriores (1 a 6) para habilitar esta opção.</p>}
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default Phase7Conclusion;