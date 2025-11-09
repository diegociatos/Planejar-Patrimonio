import React, { useState, useRef, useEffect } from 'react';
import { Phase, Project, User, UserRole, Phase4MinutaData, ChatMessage, Document as DocType } from '../types';
import Icon from './Icon';

interface Phase4MinutaProps {
  phase: Phase;
  project: Project;
  currentUser: User;
  users: User[];
  canEdit: boolean;
  onUpdateData: (data: Partial<Phase4MinutaData>) => void;
  onUpdatePhaseChat: (content: string) => void;
  isReadOnly?: boolean;
}

const Phase4Minuta: React.FC<Phase4MinutaProps> = ({ phase, project, currentUser, users, canEdit, onUpdateData, onUpdatePhaseChat, isReadOnly }) => {
    const [message, setMessage] = useState('');
    const phaseData = phase.phase4Data || { analysisDrafts: [], discussion: [], status: 'pending_draft', approvals: {} };
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const allPartners = project.clientIds
        .map(id => users.find(u => u.id === id))
        .filter((u): u is User => !!u && u.clientType === 'partner');
        
    const allApproved = allPartners.length > 0 && allPartners.every(p => phaseData.approvals?.[p.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    useEffect(scrollToBottom, [phaseData.discussion]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onUpdatePhaseChat(message);
            setMessage('');
        }
    };
    
    const handleUpload = (file: File, type: 'analysis' | 'final') => {
        const newDoc: DocType = {
            id: `doc-${Date.now()}`,
            name: file.name,
            url: URL.createObjectURL(file), // Using blob URL for simplicity
            type: 'pdf',
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUser.name,
            phaseId: 4,
            version: (phaseData.analysisDrafts?.length || 0) + 1,
            status: 'active'
        };

        if (type === 'analysis') {
            onUpdateData({ 
                ...phaseData, 
                analysisDrafts: [...(phaseData.analysisDrafts || []), newDoc], 
                status: 'in_review' 
            });
        } else {
            onUpdateData({ ...phaseData, finalDraft: newDoc });
        }
    };

    const handleDelete = (docId: string, type: 'analysis' | 'final') => {
        if (!window.confirm("Tem certeza que deseja deletar esta minuta?")) return;
        
        if (type === 'analysis') {
            const updatedDrafts = (phaseData.analysisDrafts || []).filter(d => d.id !== docId);
            onUpdateData({ ...phaseData, analysisDrafts: updatedDrafts });
        } else {
            onUpdateData({ ...phaseData, finalDraft: undefined });
        }
    };


    const handleClientApproval = () => {
        const newApprovals = { ...phaseData.approvals, [currentUser.id]: true };
        onUpdateData({ approvals: newApprovals });
    };
    
    const getUser = (authorId: string) => users.find(u => u.id === authorId);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-2xl font-bold text-brand-primary mb-2">{phase.id}. {phase.title}</h3>
                <p className="text-gray-600 mb-6">{phase.description}</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Drafts & Approvals */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-4 border rounded-xl">
                            <h4 className="font-semibold text-lg text-brand-dark mb-3">Minutas para Análise</h4>
                            {canEdit && !isReadOnly && (
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Enviar nova versão para análise</label>
                                    <input type="file" accept=".pdf" onChange={(e) => e.target.files && handleUpload(e.target.files[0], 'analysis')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                </div>
                            )}
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {(phaseData.analysisDrafts || []).slice().reverse().map(draft => (
                                    <div key={draft.id} className="group p-3 bg-gray-50 rounded-md hover:bg-gray-100 border flex justify-between items-center">
                                        <a href={draft.url} target="_blank" rel="noreferrer" className="flex items-center">
                                            <Icon name="file-pdf" className="w-4 h-4 mr-2 text-red-500"/>
                                            <p className="font-semibold text-sm text-brand-secondary">{draft.name} (v{draft.version})</p>
                                        </a>
                                        {canEdit && !isReadOnly && (
                                            <button onClick={() => handleDelete(draft.id, 'analysis')} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Icon name="trash" className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {(phaseData.analysisDrafts || []).length === 0 && <p className="text-sm text-gray-500 text-center py-4">Aguardando a primeira versão da minuta.</p>}
                            </div>
                        </div>

                        <div className="p-4 border rounded-xl">
                            <h4 className="font-semibold text-lg text-brand-dark mb-3">Minuta Final</h4>
                            {canEdit && !isReadOnly && !phaseData.finalDraft && (
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Anexar minuta final</label>
                                    <input type="file" accept=".pdf" onChange={(e) => e.target.files && handleUpload(e.target.files[0], 'final')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/>
                                </div>
                            )}
                            {phaseData.finalDraft ? (
                                <div className="group p-3 bg-green-50 rounded-md border border-green-200 flex justify-between items-center">
                                     <a href={phaseData.finalDraft.url} target="_blank" rel="noreferrer" className="flex items-center">
                                        <Icon name="check" className="w-4 h-4 mr-2 text-green-600"/>
                                        <p className="font-semibold text-sm text-green-800">{phaseData.finalDraft.name}</p>
                                    </a>
                                     {canEdit && !isReadOnly && (
                                        <button onClick={() => handleDelete(phaseData.finalDraft!.id, 'final')} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Icon name="trash" className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ) : <p className="text-sm text-gray-500 text-center py-4">Aguardando a versão final da minuta.</p>}
                        </div>


                        <div className="p-4 border rounded-xl">
                            <h4 className="font-semibold text-lg text-brand-dark mb-3">Status de Aprovação</h4>
                             {!allApproved && <p className="text-xs text-yellow-800 bg-yellow-100 p-2 rounded-md mb-3">Esta fase só poderá avançar após a aprovação de todos os sócios.</p>}
                            <div className="space-y-2">
                                {allPartners.map(p => (
                                    <div key={p.id} className="flex justify-between items-center text-sm p-2 rounded-md" style={{ backgroundColor: phaseData.approvals?.[p.id] ? '#f0fdf4' : '#fefce8' }}>
                                        <span>{p.name}</span>
                                        {phaseData.approvals?.[p.id] ? 
                                            <span className="flex items-center font-semibold text-green-700"><Icon name="check" className="w-4 h-4 mr-1"/>Aprovado</span> :
                                            <span className="flex items-center font-semibold text-yellow-700"><Icon name="pending" className="w-4 h-4 mr-1"/>Pendente</span>
                                        }
                                    </div>
                                ))}
                                {allPartners.length === 0 && <p className="text-xs text-gray-500">Nenhum sócio para aprovar.</p>}
                            </div>
                            {currentUser.clientType === 'partner' && !phaseData.approvals?.[currentUser.id] && (phaseData.analysisDrafts || []).length > 0 && !isReadOnly && (
                                <button onClick={handleClientApproval} className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 text-sm">
                                    Aprovar Versão da Minuta
                                </button>
                            )}
                            {allApproved && <p className="text-center text-sm font-semibold text-green-700 mt-4">Todos os sócios aprovaram!</p>}
                        </div>
                    </div>

                    {/* Right Column: Discussion */}
                    <div className="lg:col-span-2 p-4 border rounded-xl flex flex-col h-[600px]">
                        <h4 className="font-semibold text-lg text-brand-dark mb-3">Discussão sobre a Minuta</h4>
                        <div className="flex-1 overflow-y-auto bg-gray-50 p-3 rounded-md space-y-4">
                            {(phaseData.discussion || []).map(msg => {
                                const author = getUser(msg.authorId);
                                const isCurrentUser = msg.authorId === currentUser.id;
                                return (
                                    <div key={msg.id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                        {!isCurrentUser && ( author?.avatarUrl ? <img src={author.avatarUrl} alt={author.name} className="w-7 h-7 rounded-full flex-shrink-0" /> : <div className="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0"></div> )}
                                        <div className={`max-w-md p-3 rounded-2xl ${isCurrentUser ? 'bg-brand-secondary text-white rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                                            {!isCurrentUser && <p className="font-semibold text-xs text-brand-primary">{author?.name}</p>}
                                            <p className="text-sm" style={{ wordBreak: 'break-word' }}>{msg.content}</p>
                                            <p className={`text-xs mt-1 text-right ${isCurrentUser ? 'text-gray-300' : 'text-gray-500'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                            {(phaseData.discussion || []).length === 0 && <p className="text-sm text-gray-500 text-center py-8">Nenhuma mensagem ainda. Inicie a conversa!</p>}
                        </div>
                        {!isReadOnly && (
                            <form onSubmit={handleSendMessage} className="mt-3 flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm"
                                />
                                <button type="submit" className="bg-brand-secondary text-white rounded-full p-3 hover:bg-brand-primary transition-colors">
                                    <Icon name="send" className="w-5 h-5" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Phase4Minuta;