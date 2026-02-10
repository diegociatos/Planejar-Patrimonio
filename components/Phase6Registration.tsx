import React, { useState, useMemo } from 'react';
import { Phase, Phase6RegistrationData, PropertyAsset, RegistrationProcessData, UserRole, Project, Document } from '../types';
import Icon from './Icon';
import { documentsApi } from '../services/apiService';

// Helper to download document via API (sends auth token)
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

interface Phase6RegistrationProps {
  phase: Phase;
  project: Project;
  properties: PropertyAsset[];
  userRole: UserRole;
  canEdit: boolean;
  onUpdateData: (data: Partial<Phase6RegistrationData>, updatedProcess?: RegistrationProcessData) => void;
  onOpenChatWithQuestion: (question: string) => void;
  onUploadAndLinkDocument: (projectId: string, phaseId: number, file: File, onLink: (docId: string) => void) => void;
  isReadOnly?: boolean;
}

const AI_SUGGESTIONS = [
    "O que significa 'averbação na matrícula'?",
    "Quanto tempo o cartório leva para registrar?",
    "O que acontece depois que todos os imóveis são registrados?",
    "Posso vender um imóvel da holding após o registro?",
];

const getStatusChip = (status: RegistrationProcessData['status']) => {
    const statuses = {
        pending_fee_guide: { text: 'Aguardando Guia de Custas', color: 'gray' },
        pending_fee_payment: { text: 'Aguardando Pagamento das Custas', color: 'yellow' },
        pending_registration: { text: 'Em Andamento no Cartório', color: 'blue' },
        completed: { text: 'Registrado', color: 'green' },
    };
    const s = statuses[status] || statuses.pending_fee_guide;
    const colorClasses = {
        gray: 'text-gray-800 bg-gray-100',
        yellow: 'text-yellow-800 bg-yellow-100',
        blue: 'text-blue-800 bg-blue-100',
        green: 'text-green-800 bg-green-100',
    }[s.color];

    return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorClasses}`}>{s.text}</span>;
};


const Phase6Registration: React.FC<Phase6RegistrationProps> = ({ phase, project, properties, userRole, canEdit, onUpdateData, onOpenChatWithQuestion, onUploadAndLinkDocument, isReadOnly }) => {
    
    const phaseData = phase.phase6Data || { registrationProcesses: [] };

    const registrationProcesses = useMemo(() => {
        return properties.map((prop): RegistrationProcessData => {
            const existingProcess = phaseData.registrationProcesses.find(p => p.propertyId === prop.id);
            return existingProcess || {
                propertyId: prop.id,
                registryOffice: prop.registryOffice || '',
                status: 'pending_fee_guide',
            };
        });
    }, [properties, phaseData.registrationProcesses]);

    const handleUpdateProcess = (propertyId: string, data: Partial<RegistrationProcessData>) => {
        const updatedProcesses = registrationProcesses.map(p =>
            p.propertyId === propertyId ? { ...p, ...data } : p
        );
        onUpdateData({ registrationProcesses: updatedProcesses }, updatedProcesses.find(p => p.propertyId === propertyId));
    };

    const handleFileUpload = (propertyId: string, file: File, docType: 'fee_guide' | 'fee_receipt' | 'updated_certificate') => {
        onUploadAndLinkDocument(project.id, phase.id, file, (docId) => {
            const update: Partial<RegistrationProcessData> = {};
            if (docType === 'fee_guide') {
                update.feeGuideDocId = docId;
                update.status = 'pending_fee_payment';
            } else if (docType === 'fee_receipt') {
                update.feeReceiptDocId = docId;
                update.status = 'pending_registration';
            } else { // updated_certificate
                update.updatedCertificateDocId = docId;
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
                        {properties.length > 0 ? registrationProcesses.map(process => {
                            const property = properties.find(p => p.id === process.propertyId);
                            if (!property) return null;
                            const feeGuideDoc = findDocument(process.feeGuideDocId);
                            const feeReceiptDoc = findDocument(process.feeReceiptDocId);
                            const finalCertDoc = findDocument(process.updatedCertificateDocId);

                            return (
                                <div key={property.id} className="p-4 border rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold">{property.description} ({property.address})</p>
                                        {getStatusChip(process.status)}
                                    </div>

                                    <div className="mt-4 pt-4 border-t">
                                        {canEdit ? (
                                            <div className="space-y-3">
                                                {process.status === 'pending_fee_guide' && (
                                                    <div>
                                                        <label className="text-sm font-medium">Anexar Guia de Custas Cartorárias</label>
                                                        <input type="file" onChange={e => e.target.files && handleFileUpload(property.id, e.target.files[0], 'fee_guide')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" disabled={isReadOnly}/>
                                                    </div>
                                                )}
                                                {process.status === 'pending_registration' && (
                                                    <div>
                                                        <label className="text-sm font-medium">Anexar Certidão Atualizada</label>
                                                        <input type="file" onChange={e => e.target.files && handleFileUpload(property.id, e.target.files[0], 'updated_certificate')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" disabled={isReadOnly}/>
                                                    </div>
                                                )}
                                                {feeGuideDoc && <p className="text-sm">Guia: <button onClick={() => handleDownloadDoc(feeGuideDoc.id, feeGuideDoc.name)} className="text-blue-600 hover:underline">{feeGuideDoc.name}</button></p>}
                                                {feeReceiptDoc && <p className="text-sm">Recibo: <button onClick={() => handleDownloadDoc(feeReceiptDoc.id, feeReceiptDoc.name)} className="text-blue-600 hover:underline">{feeReceiptDoc.name}</button></p>}
                                                {finalCertDoc && <p className="text-sm">Certidão Final: <button onClick={() => handleDownloadDoc(finalCertDoc.id, finalCertDoc.name)} className="text-blue-600 hover:underline">{finalCertDoc.name}</button></p>}
                                            </div>
                                        ) : ( // Client View
                                            <div className="space-y-3">
                                                 {process.status === 'pending_fee_guide' && <p className="text-sm text-gray-500">Aguardando o consultor anexar a guia de custas.</p>}
                                                 {process.status === 'pending_fee_payment' && feeGuideDoc && (
                                                    <div className="space-y-3">
                                                        <button onClick={() => handleDownloadDoc(feeGuideDoc.id, feeGuideDoc.name)} className="inline-flex items-center px-4 py-2 bg-brand-secondary text-white rounded-lg font-semibold text-sm hover:bg-brand-primary">
                                                            <Icon name="file-pdf" className="w-4 h-4 mr-2"/> Baixar Guia de Custas
                                                        </button>
                                                        <div>
                                                            <label className="text-sm font-medium">Anexar Comprovante de Pagamento</label>
                                                            <input type="file" onChange={e => e.target.files && handleFileUpload(property.id, e.target.files[0], 'fee_receipt')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" disabled={isReadOnly}/>
                                                        </div>
                                                    </div>
                                                )}
                                                {process.status === 'pending_registration' && feeReceiptDoc && (
                                                     <button onClick={() => handleDownloadDoc(feeReceiptDoc.id, feeReceiptDoc.name)} className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-semibold text-sm">
                                                        <Icon name="check" className="w-4 h-4 mr-2"/> Ver Comprovante de Custas
                                                    </button>
                                                )}
                                                 {process.status === 'completed' && finalCertDoc && (
                                                    <button onClick={() => handleDownloadDoc(finalCertDoc.id, finalCertDoc.name)} className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm">
                                                        <Icon name="check" className="w-4 h-4 mr-2"/> Ver Certidão Atualizada
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        }) : (
                            <div className="text-center p-6 border-2 border-dashed rounded-lg"><p className="text-sm text-gray-500">Nenhum imóvel para registrar.</p></div>
                        )}
                    </div>
                    
                     <div className="p-6 bg-gray-50 rounded-xl border h-fit">
                         <h4 className="font-semibold text-lg text-brand-dark mb-3">Dúvidas sobre o Registro?</h4>
                         <p className="text-sm text-gray-500 mb-4">Entenda a etapa final da transferência de seus bens.</p>
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

export default Phase6Registration;