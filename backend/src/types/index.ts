// ===========================================
// Planejar Patrimônio - Type Definitions
// ===========================================

// ============ ENUMS ============

export enum UserRole {
  CLIENT = 'client',
  CONSULTANT = 'consultant',
  AUXILIARY = 'auxiliary',
  ADMINISTRATOR = 'administrator',
}

export type ClientType = 'partner' | 'interested';

export type MaritalStatus = 'solteiro' | 'casado' | 'uniao_estavel' | 'divorciado' | 'viuvo';

export type PropertyRegime = 
  | 'comunhao_parcial' 
  | 'comunhao_universal' 
  | 'separacao_total' 
  | 'participacao_final_nos_aquestos';

export type UserDocumentCategory = 'identity' | 'address' | 'marriage' | 'tax_return' | 'other';

export type TaskStatus = 'pending' | 'completed' | 'approved';

export type DocumentStatus = 'active' | 'deprecated';

export type DocumentType = 'pdf' | 'doc' | 'other';

export type PhaseStatus = 'pending' | 'in-progress' | 'awaiting-approval' | 'completed';

export type ProjectStatus = 'in-progress' | 'completed' | 'archived';

export type AssetType = 'property' | 'vehicle' | 'cash' | 'other';

export type AssetStatus = 'pendente' | 'completo' | 'em_correcao' | 'validado';

export type PropertyType = 'casa' | 'apartamento' | 'terreno' | 'sala_comercial';

export type SupportRequestStatus = 'open' | 'in-progress' | 'closed';

export type SupportRequestPriority = 'low' | 'medium' | 'high';

export type SupportRequestCategory = 'alteration' | 'query' | 'document_request' | 'other';

export type NotificationType = 'message' | 'task' | 'alert';

// ============ INTERFACES ============

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatarUrl?: string;
  requiresPasswordChange: boolean;
  clientType?: ClientType;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerQualificationData {
  id: string;
  userId: string;
  cpf?: string;
  rg?: string;
  maritalStatus?: MaritalStatus;
  propertyRegime?: PropertyRegime;
  birthDate?: string;
  nationality?: string;
  address?: string;
  phone?: string;
  declaresIncomeTax: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument {
  id: string;
  userId: string;
  name: string;
  category: UserDocumentCategory;
  url: string;
  uploadedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  currentPhaseId: number;
  consultantId: string;
  auxiliaryId?: string;
  postCompletionStatus?: 'pending_choice' | 'in_progress' | 'completed' | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectClient {
  id: string;
  projectId: string;
  userId: string;
  createdAt: Date;
}

export interface Phase {
  id: string;
  projectId: string;
  phaseNumber: number;
  title: string;
  description: string;
  status: PhaseStatus;
  phaseData?: string; // JSON stringified phase-specific data
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  phaseId: string;
  projectId: string;
  description: string;
  status: TaskStatus;
  assigneeId?: string;
  assigneeRole?: UserRole;
  createdBy: string;
  completedBy?: string;
  completedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  relatedDocumentId?: string;
  createdByAI: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  phaseId: string;
  projectId: string;
  name: string;
  url: string;
  type: DocumentType;
  uploadedBy: string;
  version: number;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  phaseId: string;
  projectId: string;
  type: AssetType;
  ownerPartnerId: string;
  description: string;
  value: number;
  marketValue?: number;
  status: AssetStatus;
  consultantObservations?: string;
  documentId?: string;
  // Property specific
  propertyType?: PropertyType;
  address?: string;
  registrationNumber?: string;
  registryOffice?: string;
  certificateDate?: string;
  usage?: string;
  // Vehicle specific
  year?: number;
  licensePlate?: string;
  renavam?: string;
  // Other specific
  registrationDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  chatType: 'client' | 'internal' | 'phase';
  phaseId?: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  type: NotificationType;
  createdAt: Date;
}

export interface LogEntry {
  id: string;
  projectId: string;
  actorId: string;
  action: string;
  createdAt: Date;
}

export interface SupportRequest {
  id: string;
  phaseId: string;
  projectId: string;
  title: string;
  description: string;
  status: SupportRequestStatus;
  requesterId: string;
  priority: SupportRequestPriority;
  category: SupportRequestCategory;
  assignedToId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============ REQUEST/RESPONSE TYPES ============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  clientType?: ClientType;
}

export interface CreateProjectRequest {
  name: string;
  mainClient: {
    name: string;
    email: string;
    clientType: ClientType;
    password?: string;
  };
  additionalClients?: {
    name: string;
    email: string;
    clientType: ClientType;
    password?: string;
  }[];
}

export interface UpdateProjectRequest {
  name?: string;
  status?: ProjectStatus;
  currentPhaseId?: number;
  auxiliaryId?: string;
  postCompletionStatus?: 'pending_choice' | 'in_progress' | 'completed' | null;
}

export interface UpdatePhaseRequest {
  status?: PhaseStatus;
  phaseData?: any;
}

export interface CreateTaskRequest {
  description: string;
  assigneeId?: string;
  assigneeRole?: UserRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ JWT PAYLOAD ============

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
