// types.ts

export enum UserRole {
  CLIENT = 'client',
  CONSULTANT = 'consultant',
  AUXILIARY = 'auxiliary',
  ADMINISTRATOR = 'administrator',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  password?: string;
  requiresPasswordChange?: boolean;
  
  // Client-specific fields
  clientType?: 'partner' | 'interested';
  
  // Partner-specific qualification data
  qualificationData?: PartnerQualificationData;
  documents?: UserDocument[];
}

export interface NewClientData {
    name: string;
    email: string;
    clientType: 'partner' | 'interested';
    password?: string;
}

export interface PartnerQualificationData {
    cpf?: string;
    rg?: string;
    maritalStatus?: 'solteiro' | 'casado' | 'uniao_estavel' | 'divorciado' | 'viuvo';
    propertyRegime?: 'comunhao_parcial' | 'comunhao_universal' | 'separacao_total' | 'participacao_final_nos_aquestos';
    birthDate?: string;
    nationality?: string;
    address?: string;
    phone?: string;
    declaresIncomeTax?: boolean;
}

export interface PartnerData {
  id: string;
  name: string;
}

export type UserDocumentCategory = 'identity' | 'address' | 'marriage' | 'tax_return' | 'other';

export interface UserDocument {
  id: string;
  name: string; // e.g., 'Imposto de Renda 2023', 'CNH'
  category: UserDocumentCategory;
  url: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  description: string;
  phaseId: number;
  status: 'pending' | 'completed' | 'approved';
  assigneeId?: string; // Specific user
  assigneeRole?: UserRole; // A role in general
  createdBy: string;
  createdAt: string;
  completedBy?: string;
  completedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  relatedDocumentId?: string;
  createdByAI?: boolean;
}

export interface Document {
  id: string;
  name: string;
  url: string; // Firebase Storage URL
  type: 'pdf' | 'doc' | 'other';
  uploadedAt: string;
  uploadedBy: string;
  phaseId: number;
  version: number;
  status: 'active' | 'deprecated';
}

// --- Phase Specific Data Interfaces ---

export interface AIKeyInfo {
    label: string;
    value: string;
}

export interface AIAnalysisResult {
    summary: string;
    keyInfo: AIKeyInfo[];
    suggestedTasks: string[];
}

export interface Phase1Data {
  diagnosticSummary?: string;
  objectives?: string;
  objective?: string;
  familyComposition?: string;
  mainAssets?: string;
  partners?: string;
  existingCompanies?: string;
  isFormCompleted?: boolean;
  meetingScheduled?: boolean;
  meetingDateTime?: string;
  consultantChecklist?: Record<string, boolean>;
  meetingLink?: string;
  meetingMinutes?: string;
  aiAnalysisResult?: AIAnalysisResult;
  analyzedDocumentId?: string;
}

export interface PartnerDataForPhase2 {
    userId: string; // links to User.id
    name: string;
    isAdministrator: boolean;
    participation: number | '';
    dataStatus: 'pending' | 'completed'; // To track if this partner filled their data
}

export interface CompanyData {
    name: string;
    tradeName?: string;
    capital: number | '';
    type: 'LTDA' | 'S/A' | 'SLU' | '';
    address: string;
    cnaes: string;
}

export interface Phase2Data {
    companyData: CompanyData;
    partners: PartnerDataForPhase2[];
    documents: {
        contract?: Document;
        cnpj?: Document;
        iptu?: File;
    };
    status?: 'pending_client' | 'pending_consultant_review' | 'approved';
    processStatus?: 'pending_start' | 'in_progress' | 'completed';
}

interface BaseAsset {
    id: string;
    ownerPartnerId: string;
    value: number | '';
    marketValue?: number | '';
    status: 'pendente' | 'completo' | 'em_correcao' | 'validado';
    consultantObservations?: string;
    documentId?: string;
    description: string;
}

export interface PropertyAsset extends BaseAsset {
    type: 'property';
    propertyType?: 'casa' | 'apartamento' | 'terreno' | 'sala_comercial' | '';
    address?: string;
    registrationNumber?: string;
    registryOffice?: string;
    certificateDate?: string;
    usage?: string;
}

export interface VehicleAsset extends BaseAsset {
    type: 'vehicle';
    year?: number | '';
    licensePlate?: string;
    renavam?: string;
}

export interface CashAsset extends BaseAsset {
    type: 'cash';
}

export interface OtherAsset extends BaseAsset {
    type: 'other';
    registrationDetails?: string;
}

export type Asset = PropertyAsset | VehicleAsset | CashAsset | OtherAsset;

export interface Phase3Data {
    assets: Asset[];
    documents: Document[];
    status?: 'pending_client' | 'pending_consultant_review' | 'approved';
}

export interface Phase4MinutaData {
    analysisDrafts: Document[];
    finalDraft?: Document;
    discussion: ChatMessage[];
    status: 'pending_draft' | 'in_review' | 'approved' | 'changes_requested';
    approvals?: Record<string, boolean>;
}

export interface ITBIProcessData {
    propertyId: string;
    processType: 'isencao' | 'pagamento' | '';
    status: 'pending_guide' | 'pending_payment' | 'completed' | 'exemption_approved';
    observations: string;
    protocolDate?: string;
    protocolNumber?: string;
    guideDocId?: string;
    receiptDocId?: string;
}

export interface Phase5ITBIData {
    itbiProcesses: ITBIProcessData[];
    documents?: Record<string, { itbiDocument?: File }>;
}

export interface RegistrationProcessData {
    propertyId: string;
    registryOffice: string;
    status: 'pending_fee_guide' | 'pending_fee_payment' | 'pending_registration' | 'completed';
    feeGuideDocId?: string;
    feeReceiptDocId?: string;
    updatedCertificateDocId?: string;
    registrationDate?: string;
    registrationNumber?: string;
    observations?: string;
}

export interface Phase6RegistrationData {
    registrationProcesses: RegistrationProcessData[];
    documents?: Record<string, { updatedCertificate?: File }>;
}

export interface Phase7ConclusionData {
    consultantObservations?: string;
    status?: 'pending' | 'completed';
    conclusionDate?: string;
    feedback?: {
        rating: number;
        comment: string;
        wouldRecommend?: boolean;
    };
    dossieFinalUrl?: string;
    additionalDocuments?: Document[];
}

export interface SupportRequest {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'closed';
  requesterId: string;
  createdAt: string;
  messages: ChatMessage[];
  documents: Document[];
  priority: 'low' | 'medium' | 'high';
  category: 'alteration' | 'query' | 'document_request' | 'other';
  assignedToId?: string;
}

// NEW: Redefined Quota Transfer with iterative process
export interface QuotaTransferProcess {
  id: string;
  type: 'doacao' | 'venda';
  donorOrSellerId: string;
  beneficiaryOrBuyerIds: string[];
  percentage: number | '';
  transactionValue: number | '';
  observations: string;
  
  // Review/Approval cycle
  drafts: Document[];
  discussion: ChatMessage[];
  approvals: Record<string, boolean>; // { [clientId: string]: boolean }
  status: 'pending_draft' | 'in_review' | 'approved';
  
  // Tax Payment (ITCD) for donations
  taxGuideDocId?: string;
  taxReceiptDocId?: string;
  taxPaymentStatus: 'pending_guide' | 'pending_payment' | 'completed' | 'exempt';
}

export interface Phase8QuotasData {
  transferProcesses: QuotaTransferProcess[];
  // FIX: Add documents property to align with component logic and other phases.
  documents?: Record<string, { itcdGuide?: File, saleContract?: File }>;
}

// NEW: Updated Phase 9 for review cycle
export interface Phase9AgreementData {
  drafts: Document[];
  discussion: ChatMessage[];
  status: 'pending_draft' | 'in_review' | 'approved';
  approvals: Record<string, boolean>;
  finalSignedDocumentId?: string;
  consultantObservations?: string;
  clientFeedback?: string;
  // FIX: Add missing properties used in the Phase8Agreement component.
  documents: { agreement?: File };
  includedClauses: string[];
  signatureDate?: string;
}

// NEW: Phase 10 data structure
export interface Phase10SupportData {
    requests: SupportRequest[];
}

export interface Phase {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'awaiting-approval' | 'completed';
  tasks: Task[];
  documents: Document[];
  phase1Data?: Phase1Data;
  phase2Data?: Phase2Data;
  phase3Data?: Phase3Data;
  phase4Data?: Phase4MinutaData;
  phase5Data?: Phase5ITBIData;
  phase6Data?: Phase6RegistrationData;
  phase7Data?: Phase7ConclusionData;
  phase8Data?: Phase8QuotasData;
  phase9Data?: Phase9AgreementData;
  phase10Data?: Phase10SupportData; // Added
}

export interface Project {
  id: string;
  name: string;
  status: 'in-progress' | 'completed' | 'archived';
  currentPhaseId: number;
  consultantId: string;
  auxiliaryId?: string;
  clientIds: string[];
  phases: Phase[];
  internalChat: ChatMessage[];
  clientChat: ChatMessage[];
  postCompletionStatus?: 'pending_choice' | 'in_progress' | 'completed' | null; // Added for new workflow
  activityLog: LogEntry[];
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole: UserRole;
  content: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  link: string; // e.g., `/project/{projectId}/phase/{phaseId}`
  isRead: boolean;
  createdAt: string;
  type?: 'message' | 'task' | 'alert';
}

export interface LogEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  timestamp: string;
}