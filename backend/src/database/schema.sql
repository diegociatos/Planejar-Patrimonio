-- ===========================================
-- Planejar Patrimônio - Database Schema
-- Sistema de Gestão de Holdings Familiares
-- ===========================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS planejar_patrimonio
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE planejar_patrimonio;

-- ===========================================
-- TABELA: users
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('client', 'consultant', 'auxiliary', 'administrator') NOT NULL DEFAULT 'client',
  avatar_url VARCHAR(500),
  requires_password_change BOOLEAN DEFAULT TRUE,
  client_type ENUM('partner', 'interested') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: partner_qualification_data
-- ===========================================
CREATE TABLE IF NOT EXISTS partner_qualification_data (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  cpf VARCHAR(14),
  rg VARCHAR(20),
  marital_status ENUM('solteiro', 'casado', 'uniao_estavel', 'divorciado', 'viuvo'),
  property_regime ENUM('comunhao_parcial', 'comunhao_universal', 'separacao_total', 'participacao_final_nos_aquestos'),
  birth_date DATE,
  nationality VARCHAR(100),
  address TEXT,
  phone VARCHAR(20),
  declares_income_tax BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_qualification_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: user_documents
-- ===========================================
CREATE TABLE IF NOT EXISTS user_documents (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category ENUM('identity', 'address', 'marriage', 'tax_return', 'other') NOT NULL,
  url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_documents_user (user_id),
  INDEX idx_user_documents_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: projects
-- ===========================================
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status ENUM('in-progress', 'completed', 'archived') NOT NULL DEFAULT 'in-progress',
  current_phase_id INT NOT NULL DEFAULT 1,
  consultant_id VARCHAR(36) NOT NULL,
  auxiliary_id VARCHAR(36),
  post_completion_status ENUM('pending_choice', 'in_progress', 'completed'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (consultant_id) REFERENCES users(id),
  FOREIGN KEY (auxiliary_id) REFERENCES users(id),
  INDEX idx_projects_status (status),
  INDEX idx_projects_consultant (consultant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: project_clients (many-to-many)
-- ===========================================
CREATE TABLE IF NOT EXISTS project_clients (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_client (project_id, user_id),
  INDEX idx_project_clients_project (project_id),
  INDEX idx_project_clients_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: phases
-- ===========================================
CREATE TABLE IF NOT EXISTS phases (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  phase_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('pending', 'in-progress', 'awaiting-approval', 'completed') NOT NULL DEFAULT 'pending',
  phase_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_phase (project_id, phase_number),
  INDEX idx_phases_project (project_id),
  INDEX idx_phases_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: tasks
-- ===========================================
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(36) PRIMARY KEY,
  phase_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('pending', 'completed', 'approved') NOT NULL DEFAULT 'pending',
  assignee_id VARCHAR(36),
  assignee_role ENUM('client', 'consultant', 'auxiliary', 'administrator'),
  created_by VARCHAR(36) NOT NULL,
  completed_by VARCHAR(36),
  completed_at TIMESTAMP NULL,
  approved_by VARCHAR(36),
  approved_at TIMESTAMP NULL,
  related_document_id VARCHAR(36),
  created_by_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (completed_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_tasks_phase (phase_id),
  INDEX idx_tasks_project (project_id),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_assignee (assignee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: documents
-- ===========================================
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) PRIMARY KEY,
  phase_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  type ENUM('pdf', 'doc', 'other') NOT NULL DEFAULT 'other',
  uploaded_by VARCHAR(36) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  status ENUM('active', 'deprecated') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_documents_phase (phase_id),
  INDEX idx_documents_project (project_id),
  INDEX idx_documents_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: assets
-- ===========================================
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(36) PRIMARY KEY,
  phase_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  type ENUM('property', 'vehicle', 'cash', 'other') NOT NULL,
  owner_partner_id VARCHAR(36) NOT NULL,
  description TEXT NOT NULL,
  value DECIMAL(15, 2) NOT NULL DEFAULT 0,
  market_value DECIMAL(15, 2),
  status ENUM('pendente', 'completo', 'em_correcao', 'validado') NOT NULL DEFAULT 'pendente',
  consultant_observations TEXT,
  document_id VARCHAR(36),
  -- Property specific
  property_type ENUM('casa', 'apartamento', 'terreno', 'sala_comercial'),
  address TEXT,
  registration_number VARCHAR(100),
  registry_office VARCHAR(255),
  certificate_date DATE,
  asset_usage VARCHAR(255),
  -- Vehicle specific
  year INT,
  license_plate VARCHAR(20),
  renavam VARCHAR(50),
  -- Other specific
  registration_details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_partner_id) REFERENCES users(id),
  FOREIGN KEY (document_id) REFERENCES documents(id),
  INDEX idx_assets_phase (phase_id),
  INDEX idx_assets_project (project_id),
  INDEX idx_assets_owner (owner_partner_id),
  INDEX idx_assets_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: chat_messages
-- ===========================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  chat_type ENUM('client', 'internal', 'phase') NOT NULL,
  phase_id VARCHAR(36),
  author_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id),
  INDEX idx_chat_project (project_id),
  INDEX idx_chat_type (chat_type),
  INDEX idx_chat_phase (phase_id),
  INDEX idx_chat_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: notifications
-- ===========================================
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  recipient_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  type ENUM('message', 'task', 'alert') NOT NULL DEFAULT 'alert',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_recipient (recipient_id),
  INDEX idx_notifications_read (is_read),
  INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: activity_log
-- ===========================================
CREATE TABLE IF NOT EXISTS activity_log (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  actor_id VARCHAR(36) NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX idx_log_project (project_id),
  INDEX idx_log_actor (actor_id),
  INDEX idx_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: support_requests
-- ===========================================
CREATE TABLE IF NOT EXISTS support_requests (
  id VARCHAR(36) PRIMARY KEY,
  phase_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open', 'in-progress', 'closed') NOT NULL DEFAULT 'open',
  requester_id VARCHAR(36) NOT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  category ENUM('alteration', 'query', 'document_request', 'other') NOT NULL,
  assigned_to_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to_id) REFERENCES users(id),
  INDEX idx_support_phase (phase_id),
  INDEX idx_support_project (project_id),
  INDEX idx_support_status (status),
  INDEX idx_support_requester (requester_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: support_request_messages
-- ===========================================
CREATE TABLE IF NOT EXISTS support_request_messages (
  id VARCHAR(36) PRIMARY KEY,
  support_request_id VARCHAR(36) NOT NULL,
  author_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (support_request_id) REFERENCES support_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id),
  INDEX idx_support_msg_request (support_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: support_request_documents
-- ===========================================
CREATE TABLE IF NOT EXISTS support_request_documents (
  id VARCHAR(36) PRIMARY KEY,
  support_request_id VARCHAR(36) NOT NULL,
  document_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (support_request_id) REFERENCES support_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE KEY unique_support_document (support_request_id, document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: itbi_processes (Fase 5)
-- ===========================================
CREATE TABLE IF NOT EXISTS itbi_processes (
  id VARCHAR(36) PRIMARY KEY,
  phase_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  property_id VARCHAR(36) NOT NULL,
  process_type ENUM('isencao', 'pagamento') NOT NULL,
  status ENUM('pending_guide', 'pending_payment', 'completed', 'exemption_approved') NOT NULL DEFAULT 'pending_guide',
  observations TEXT,
  protocol_date DATE,
  protocol_number VARCHAR(100),
  guide_doc_id VARCHAR(36),
  receipt_doc_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES assets(id),
  FOREIGN KEY (guide_doc_id) REFERENCES documents(id),
  FOREIGN KEY (receipt_doc_id) REFERENCES documents(id),
  INDEX idx_itbi_phase (phase_id),
  INDEX idx_itbi_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: registration_processes (Fase 6)
-- ===========================================
CREATE TABLE IF NOT EXISTS registration_processes (
  id VARCHAR(36) PRIMARY KEY,
  phase_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  property_id VARCHAR(36) NOT NULL,
  registry_office VARCHAR(255) NOT NULL,
  status ENUM('pending_fee_guide', 'pending_fee_payment', 'pending_registration', 'completed') NOT NULL DEFAULT 'pending_fee_guide',
  fee_guide_doc_id VARCHAR(36),
  fee_receipt_doc_id VARCHAR(36),
  updated_certificate_doc_id VARCHAR(36),
  registration_date DATE,
  registration_number VARCHAR(100),
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES assets(id),
  FOREIGN KEY (fee_guide_doc_id) REFERENCES documents(id),
  FOREIGN KEY (fee_receipt_doc_id) REFERENCES documents(id),
  FOREIGN KEY (updated_certificate_doc_id) REFERENCES documents(id),
  INDEX idx_registration_phase (phase_id),
  INDEX idx_registration_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: quota_transfers (Fase 8)
-- ===========================================
CREATE TABLE IF NOT EXISTS quota_transfers (
  id VARCHAR(36) PRIMARY KEY,
  phase_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  type ENUM('doacao', 'venda') NOT NULL,
  donor_or_seller_id VARCHAR(36) NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  transaction_value DECIMAL(15, 2) DEFAULT 0,
  observations TEXT,
  status ENUM('pending_draft', 'in_review', 'approved') NOT NULL DEFAULT 'pending_draft',
  tax_guide_doc_id VARCHAR(36),
  tax_receipt_doc_id VARCHAR(36),
  tax_payment_status ENUM('pending_guide', 'pending_payment', 'completed', 'exempt') NOT NULL DEFAULT 'pending_guide',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (donor_or_seller_id) REFERENCES users(id),
  FOREIGN KEY (tax_guide_doc_id) REFERENCES documents(id),
  FOREIGN KEY (tax_receipt_doc_id) REFERENCES documents(id),
  INDEX idx_quota_phase (phase_id),
  INDEX idx_quota_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: quota_transfer_beneficiaries
-- ===========================================
CREATE TABLE IF NOT EXISTS quota_transfer_beneficiaries (
  id VARCHAR(36) PRIMARY KEY,
  quota_transfer_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (quota_transfer_id) REFERENCES quota_transfers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_transfer_beneficiary (quota_transfer_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: quota_transfer_approvals
-- ===========================================
CREATE TABLE IF NOT EXISTS quota_transfer_approvals (
  id VARCHAR(36) PRIMARY KEY,
  quota_transfer_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMP NULL,
  
  FOREIGN KEY (quota_transfer_id) REFERENCES quota_transfers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_transfer_approval (quota_transfer_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: phase2_partners (Constituição da Holding)
-- ===========================================
CREATE TABLE IF NOT EXISTS phase2_partners (
  id VARCHAR(36) PRIMARY KEY,
  phase_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  is_administrator BOOLEAN DEFAULT FALSE,
  participation DECIMAL(5, 2) NOT NULL DEFAULT 0,
  data_status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_phase_partner (phase_id, user_id),
  INDEX idx_phase2_partners_phase (phase_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: phase4_approvals (Minuta de Integralização)
-- ===========================================
CREATE TABLE IF NOT EXISTS phase4_approvals (
  id VARCHAR(36) PRIMARY KEY,
  phase_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMP NULL,
  
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_phase4_approval (phase_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TABELA: phase9_approvals (Acordo de Sócios)
-- ===========================================
CREATE TABLE IF NOT EXISTS phase9_approvals (
  id VARCHAR(36) PRIMARY KEY,
  phase_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMP NULL,
  
  FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_phase9_approval (phase_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
