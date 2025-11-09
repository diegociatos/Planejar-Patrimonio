import React, { useState, useEffect, useMemo } from 'react';
import { Phase, Phase5ITBIData, PropertyAsset, ITBIProcessData, UserRole, Project, User, Document } from '../types';
import Icon from './Icon';

interface Phase5ITBIProps {
  phase: Phase;
  project: Project;
  properties: PropertyAsset[]; // From Phase 3
  userRole: UserRole;
  canEdit: boolean;
  onUpdateData: (data: Partial<Phase5ITBIData>, newDocuments?: Document[], updatedProcess?: ITBIProcessData) => void;
  onOpenChatWithQuestion: (question: string) => void;
  onUploadAndLinkDocument: (projectId: string, phaseId: number, file: File, onLink: (docId: string) => void) => void;
  isReadOnly?: boolean;
}

const AI_SUGGESTIONS = [
    "Quando sou isento de ITBI?",
    "Como sei se minha prefeitura aceita isenção para holding?",
    "Onde consigo a guia de ITBI?",
    "O que acontece se eu não pagar o ITBI?",
];

const getStatusChip = (status: ITBIProcessData['status']) => {
    const statuses = {
        pending_guide: { text: 'Aguardando Guia', color: 'gray' },
        pending_payment: { text: 'Aguardando Pagamento', color: 'yellow' },
        completed: { text: 'Pago', color: 'blue' },
        exemption_approved: { text: 'Isenção Aprovada', color: 'green' },
    };
    const s = statuses[status] || statuses.pending_guide;
    const colorClasses = {
        gray: 'text-gray-800 bg-gray-100',
        yellow: 'text-yellow-800 bg-yellow-100',
        blue: 'text-blue-800 bg-blue-100',
        green: 'text-green-800 bg-green-100',
    }[s.color];

    return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorClasses}`}>{s.text}</span>;
};

const Phase5ITBI: React.FC<Phase5ITBIProps> = ({ phase, project, properties, userRole, canEdit, onUpdateData, onOpenChatWithQuestion, onUploadAndLinkDocument, isReadOnly }) => {
    const phaseData = phase.phase5Data || { itbiProcesses: [] };
    
    // Initialize or sync processes from properties listed in phase 3
    const itbiProcesses = useMemo(() => {
        return properties.map((prop): ITBIProcessData => {
            const existingProcess = phaseData.itbiProcesses.find(p => p.propertyId === prop.id);
            return existingProcess || {
                propertyId: prop.id,
                processType: 'pagamento', // Default to payment
                status: 'pending_guide',
                observations: '',
            };
        });
    }, [properties, phaseData.itbiProcesses]);

    const handleUpdateProcess = (propertyId: string, data: Partial<ITBIProcessData>) => {
        const updatedProcesses = itbiProcesses.map(p =>
            p.propertyId === propertyId ? { ...p, ...data } : p
        );
        onUpdateData({ itbiProcesses: updatedProcesses }, undefined, updatedProcesses.find(p => p.propertyId === propertyId));
    };

    const handleFileUpload = (propertyId: string, file: File, docType: 'guide' | 'receipt') => {
        onUploadAndLinkDocument(project.id, phase.id, file, (docId) => {
            const update: Partial<ITBIProcessData> = {};
            if (docType === 'guide') {
                update.guideDocId = docId;
                update.status = 'pending_payment';
            } else {
                update.receiptDocId = docId;
                update.status = 'completed';
            }
            handleUpdateProcess(propertyId, update);
        });
    };

    const findDocument = (docId?: string) => {
        if (!docId) return null;
        for (const p of project.phases) {
            const doc = p.documents.find(d => d.id === docId);
            if (doc) return doc;
        }
        return null;
    };
    
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-2xl font-bold text-brand-primary mb-2">{phase.id}. {phase.title}</h3>
                <p className="text-gray-600 mb-6">{phase.description}</p>
                
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="font-semibold text-lg text-brand-dark">Andamento por Imóvel</h4>
                        {properties.length > 0 ? itbiProcesses.map(process => {
                            const property = properties.find(p => p.id === process.propertyId);
                            if (!property) return null;
                            const guideDoc = findDocument(process.guideDocId);
                            const receiptDoc = findDocument(process.receiptDocId);

                            return (
                                <div key={property.id} className="p-4 border rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold">{property.description} ({property.address})</p>
                                        {getStatusChip(process.status)}
                                    </div>

                                    {canEdit ? (
                                        <div className="mt-4 pt-4 border-t">
                                            {process.status === 'pending_guide' && (
                                                 <div>
                                                    <label className="text-sm font-medium">Anexar Guia de ITBI</label>
                                                    <input type="file" onChange={(e) => e.target.files && handleFileUpload(property.id, e.target.files[0], 'guide')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" disabled={isReadOnly}/>
                                                </div>
                                            )}
                                            {guideDoc && <p className="text-sm">Guia: <a href={guideDoc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{guideDoc.name}</a></p>}
                                            {receiptDoc && <p className="text-sm">Recibo: <a href={receiptDoc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{receiptDoc.name}</a></p>}
                                        </div>
                                    ) : (
                                        <div className="mt-4 pt-4 border-t">
                                            {process.status === 'pending_payment' && guideDoc && (
                                                <div className="space-y-3">
                                                    <a href={guideDoc.url} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-brand-secondary text-white rounded-lg font-semibold text-sm hover:bg-brand-primary">
                                                        <Icon name="file-pdf" className="w-4 h-4 mr-2"/> Baixar Guia para Pagamento
                                                    </a>
                                                    <div>
                                                        <label className="text-sm font-medium">Anexar Comprovante de Pagamento</label>
                                                        <input type="file" onChange={(e) => e.target.files && handleFileUpload(property.id, e.target.files[0], 'receipt')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" disabled={isReadOnly}/>
                                                    </div>
                                                </div>
                                            )}
                                            {process.status === 'completed' && receiptDoc && (
                                                <a href={receiptDoc.url} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm">
                                                    <Icon name="check" className="w-4 h-4 mr-2"/> Ver Comprovante
                                                </a>
                                            )}
                                             {process.status === 'pending_guide' && <p className="text-sm text-gray-500">Aguardando o consultor anexar a guia de pagamento.</p>}
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="text-center p-6 border-2 border-dashed rounded-lg"><p className="text-sm text-gray-500">Nenhum imóvel da Fase 3 para gerenciar o ITBI.</p></div>
                        )}
                    </div>
                    
                     <div className="p-6 bg-gray-50 rounded-xl border h-fit">
                         <h4 className="font-semibold text-lg text-brand-dark mb-3">Dúvidas sobre ITBI?</h4>
                         <p className="text-sm text-gray-500 mb-4">Entenda os próximos passos com a ajuda da nossa IA.</p>
                         <div className="space-y-2">
                            {AI_SUGGESTIONS.map(q => (
                                <button key={q} onClick={() => onOpenChatWithQuestion(q)} className="w-full text-left text-sm p-3 bg-white border rounded-md hover:bg-gray-100 hover:border-brand-secondary transition-colors">{q}</button>
                            ))}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Phase5ITBI;