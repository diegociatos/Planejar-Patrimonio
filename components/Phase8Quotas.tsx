import React, { useState, useEffect, useRef } from 'react';
import { Phase, Phase8QuotasData, PartnerData, UserRole, Project, User, Document, ChatMessage, QuotaTransferProcess, PartnerQualificationData } from '../types';
import Icon from './Icon';

interface Phase8QuotasProps {
  phase: Phase;
  project: Project;
  currentUser: User;
  users: User[];
  partners: PartnerData[];
  canEdit: boolean;
  onUpdateData: (data: Partial<Phase8QuotasData>) => void;
  isReadOnly?: boolean;
}

// Helper function to check if partner data is complete
const isPartnerDataComplete = (user: User): boolean => {
    if (!user || !user.clientType || !user.qualificationData) return false;
    const q = user.qualificationData;
    const hasBaseData = q.cpf && q.rg && q.maritalStatus && q.birthDate && q.nationality && q.address;
    if (!hasBaseData) return false;
    if ((q.maritalStatus === 'casado' || q.maritalStatus === 'uniao_estavel') && !q.propertyRegime) return false;
    return true;
};

const Phase8Quotas: React.FC<Phase8QuotasProps> = ({ phase, project, currentUser, users, partners, canEdit, onUpdateData, isReadOnly }) => {
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  
  const { transferProcesses = [] } = phase.phase8Data || { transferProcesses: [] };

  useEffect(() => {
    if (transferProcesses.length > 0 && !activeProcessId) {
      setActiveProcessId(transferProcesses[0].id);
    }
  }, [transferProcesses, activeProcessId]);

  const handleUpdateProcess = (processId: string, data: Partial<QuotaTransferProcess>) => {
    const updated = transferProcesses.map(p => p.id === processId ? { ...p, ...data } : p);
    onUpdateData({ transferProcesses: updated });
  };

  const handleAddNewProcess = () => {
    const newProcess: QuotaTransferProcess = {
      id: `qt-${Date.now()}`,
      type: 'doacao',
      donorOrSellerId: '',
      beneficiaryOrBuyerIds: [],
      percentage: '',
      transactionValue: '',
      observations: '',
      drafts: [],
      discussion: [],
      approvals: {},
      status: 'pending_draft',
      taxPaymentStatus: 'pending_guide'
    };
    onUpdateData({ transferProcesses: [...transferProcesses, newProcess] });
    setActiveProcessId(newProcess.id);
  };

  const getPartnerName = (id: string) => users.find(u => u.id === id)?.name || 'N/D';

  const TransferProcessItem: React.FC<{ process: QuotaTransferProcess }> = ({ process }) => {
    const isOpen = activeProcessId === process.id;
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [process.discussion]);

    const beneficiariesWithPendingData = process.beneficiaryOrBuyerIds
        .map(id => users.find(u => u.id === id))
        .filter((u): u is User => !!u && !isPartnerDataComplete(u));
        
    const findDocument = (docId?: string) => {
        if (!docId) return null;
        for (const p of project.phases) {
            const doc = p.documents.find(d => d.id === docId);
            if (doc) return doc;
        }
        return null;
    };
    
    const allRelevantPartners = partners
        .map(p => users.find(u => u.id === p.id))
        .filter((u): u is User => !!u && u.clientType === 'partner');
    
    const allApproved = allRelevantPartners.length > 0 && allRelevantPartners.every(p => process.approvals?.[p.id]);

    const handleFileUpload = (file: File) => {
        const newDoc: Document = {
            id: `doc-qt-${process.id}-${Date.now()}`,
            name: file.name,
            url: URL.createObjectURL(file),
            type: 'pdf',
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUser.name,
            phaseId: 8,
            version: (process.drafts?.length || 0) + 1,
            status: 'active'
        };
        handleUpdateProcess(process.id, { drafts: [...process.drafts, newDoc], status: 'in_review' });
    };
    
     const handleDeleteDraft = (docId: string) => {
        if (!window.confirm("Tem certeza que deseja deletar esta minuta?")) return;
        const updatedDrafts = (process.drafts || []).filter(d => d.id !== docId);
        handleUpdateProcess(process.id, { drafts: updatedDrafts });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            const newMessage: ChatMessage = {
                id: `msg-${process.id}-${Date.now()}`,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorAvatarUrl: currentUser.avatarUrl,
                authorRole: currentUser.role,
                content: message,
                timestamp: new Date().toISOString(),
            };
            handleUpdateProcess(process.id, { discussion: [...process.discussion, newMessage] });
            setMessage('');
        }
    };

    const handleClientApproval = () => {
        const newApprovals = { ...process.approvals, [currentUser.id]: true };
        const allPartnersInProject = project.clientIds.map(id => users.find(u => u.id === id)).filter((u): u is User => !!u && u.clientType === 'partner');
        const everyPartnerApproved = allPartnersInProject.every(p => newApprovals[p.id]);

        handleUpdateProcess(process.id, { 
            approvals: newApprovals, 
            status: everyPartnerApproved ? 'approved' : 'in_review' 
        });
    };

    return (
      <div className="border rounded-xl">
        <button onClick={() => setActiveProcessId(isOpen ? null : process.id)} className="w-full p-4 text-left flex justify-between items-center">
          <div>
            <p className="font-semibold text-brand-dark">Transferência de {process.percentage || ' indefinido'}% de {getPartnerName(process.donorOrSellerId)}</p>
            <p className="text-sm text-gray-500 capitalize">{process.type}</p>
          </div>
          <Icon name="arrow-right" className={`w-5 h-5 transition-transform transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        {isOpen && (
          <div className="p-4 border-t space-y-6">
            {beneficiariesWithPendingData.length > 0 && (
                 <div className="p-4 bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400 rounded-md">
                    <h4 className="font-bold flex items-center"><Icon name="pending" className="w-5 h-5 mr-2"/>Aguardando Dados dos Donatários</h4>
                    <p className="text-sm mt-2">A minuta final só poderá ser gerada após os seguintes membros completarem seus dados em "Meus Dados":</p>
                    <ul className="list-disc list-inside mt-2 font-semibold text-sm">
                        {beneficiariesWithPendingData.map(u => <li key={u.id}>{u.name}</li>)}
                    </ul>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

                {/* Left side (Docs, Approvals) */}
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h4 className="font-semibold text-brand-dark mb-3 flex items-center"><Icon name="folder" className="w-5 h-5 mr-2 text-gray-400" /> Documentos</h4>
                         {canEdit && !isReadOnly && (
                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700 block mb-1">Enviar minuta de alteração</label>
                                <input type="file" accept=".pdf" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            </div>
                        )}
                        <div className="space-y-2">
                           {(process.drafts || []).map(doc => (
                              <div key={doc.id} className="group p-2 bg-gray-50 rounded-md border flex justify-between items-center">
                                <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center text-sm">
                                    <Icon name="file-pdf" className="w-5 h-5 mr-2 text-red-500" />
                                    <span className="font-medium text-brand-secondary">{doc.name}</span>
                                </a>
                                {canEdit && !isReadOnly && (
                                    <button onClick={() => handleDeleteDraft(doc.id)} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Icon name="trash" className="w-4 h-4" />
                                    </button>
                                )}
                              </div>
                           ))}
                           {findDocument(process.taxGuideDocId) && (
                               <a href={findDocument(process.taxGuideDocId)?.url} target="_blank" rel="noreferrer" className="flex items-center p-2 bg-gray-50 rounded-md border text-sm hover:bg-gray-100">
                                <Icon name="file-text" className="w-5 h-5 mr-2 text-yellow-600" />
                                <span className="font-medium text-brand-secondary">{findDocument(process.taxGuideDocId)?.name}</span>
                              </a>
                           )}
                           {findDocument(process.taxReceiptDocId) && (
                               <a href={findDocument(process.taxReceiptDocId)?.url} target="_blank" rel="noreferrer" className="flex items-center p-2 bg-green-50 rounded-md border border-green-200 text-sm hover:bg-green-100">
                                <Icon name="check" className="w-5 h-5 mr-2 text-green-600" />
                                <span className="font-medium text-green-800">{findDocument(process.taxReceiptDocId)?.name}</span>
                              </a>
                           )}
                           {(process.drafts.length === 0) && <p className="text-xs text-center text-gray-400 py-2">Nenhuma minuta enviada.</p>}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-brand-dark mb-3 flex items-center"><Icon name="users" className="w-5 h-5 mr-2 text-gray-400" />Aprovações dos Sócios</h4>
                        <div className="space-y-2">
                            {allRelevantPartners.map(p => (
                                <div key={p.id} className="flex justify-between items-center text-sm p-2 rounded-md" style={{ backgroundColor: process.approvals?.[p.id] ? '#f0fdf4' : '#fefce8' }}>
                                    <span>{p.name}</span>
                                    {process.approvals?.[p.id] ? 
                                        <span className="flex items-center font-semibold text-green-700"><Icon name="check" className="w-4 h-4 mr-1"/>Aprovado</span> :
                                        <span className="flex items-center font-semibold text-yellow-700"><Icon name="pending" className="w-4 h-4 mr-1"/>Pendente</span>
                                    }
                                </div>
                            ))}
                        </div>
                         {currentUser.clientType === 'partner' && !process.approvals?.[currentUser.id] && (process.drafts || []).length > 0 && !isReadOnly && (
                            // FIX: The function call was passing an argument to a function that expects none.
                            <button onClick={handleClientApproval} className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 text-sm">
                                Aprovar Minuta
                            </button>
                        )}
                        {allApproved && <p className="text-center text-sm font-semibold text-green-700 mt-4">Todos os sócios aprovaram!</p>}
                    </div>
                </div>

                {/* Right side (Discussion) */}
                <div className="md:col-span-3">
                     <h4 className="font-semibold text-brand-dark mb-3 flex items-center"><Icon name="chat" className="w-5 h-5 mr-2 text-gray-400" />Discussão</h4>
                     <div className="border rounded-lg flex flex-col h-96">
                        <div className="flex-1 overflow-y-auto bg-gray-50 p-3 rounded-t-lg space-y-4">
                            {process.discussion.map(msg => {
                                const author = users.find(u => u.id === msg.authorId);
                                if (!author) return null;
                                const isCurrentUser = msg.authorId === currentUser.id;
                                return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                                     {!isCurrentUser && ( author?.avatarUrl ? <img src={author.avatarUrl} alt={author.name} className="w-7 h-7 rounded-full flex-shrink-0" /> : <div className="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0"></div> )}
                                    <div className={`max-w-md p-2 rounded-lg ${isCurrentUser ? 'bg-brand-secondary text-white' : 'bg-white border'}`}>
                                        <p className="font-semibold text-xs text-brand-primary">{author.name}</p>
                                        <p className="text-sm" style={{ wordBreak: 'break-word' }}>{msg.content}</p>
                                        <p className="text-xs mt-1 text-right text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                            {process.discussion.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Nenhuma mensagem.</p>}
                        </div>
                         {!isReadOnly && (
                            <form onSubmit={handleSendMessage} className="p-2 border-t flex items-center space-x-2">
                                <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Escreva uma mensagem..." className="w-full text-sm border-gray-200 rounded-md"/>
                                <button type="submit" className="p-2 bg-brand-secondary text-white rounded-md hover:bg-brand-primary"><Icon name="send" className="w-5 h-5"/></button>
                            </form>
                         )}
                     </div>
                </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-brand-primary">{phase.id}. {phase.title}</h3>
            <p className="text-gray-600">{phase.description}</p>
          </div>
          {canEdit && !isReadOnly && (
            <button onClick={handleAddNewProcess} className="flex items-center px-4 py-2 bg-brand-secondary text-white rounded-lg font-semibold hover:bg-brand-primary">
              <Icon name="plus" className="w-5 h-5 mr-2" />
              Nova Transferência
            </button>
          )}
        </div>

        <div className="space-y-3">
          {transferProcesses.length > 0 ? (
            transferProcesses.map(p => <TransferProcessItem key={p.id} process={p} />)
          ) : (
            <div className="text-center p-10 border-2 border-dashed rounded-lg">
              <p className="text-sm text-gray-500">Nenhum processo de transferência iniciado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Phase8Quotas;