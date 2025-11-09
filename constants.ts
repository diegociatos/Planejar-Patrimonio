import { User, Project, Phase, Task, UserRole, CompanyData, PartnerDataForPhase2, Asset, ITBIProcessData, RegistrationProcessData, QuotaTransferProcess, SupportRequest, Document, ChatMessage, LogEntry, UserDocument, PartnerQualificationData } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'admin-user-01',
    name: 'Administrador',
    email: 'admin@planejar.com',
    password: 'admin123',
    role: UserRole.ADMINISTRATOR,
    requiresPasswordChange: false,
  },
  {
    id: 'consultant-diego-01',
    name: 'Diego Garcia',
    email: 'diego.garcia@grupociatos.com.br',
    password: '250500',
    role: UserRole.CONSULTANT,
    requiresPasswordChange: false,
  },
  {
    id: 'client-joao-01',
    name: 'João da Silva Completo',
    email: 'joao.completo@email.com',
    password: '123',
    role: UserRole.CLIENT,
    clientType: 'partner',
    requiresPasswordChange: false,
    qualificationData: {
        cpf: '111.222.333-44',
        rg: '12.345.678-9',
        maritalStatus: 'casado',
        propertyRegime: 'comunhao_parcial',
        birthDate: '1965-05-20',
        nationality: 'Brasileiro',
        address: 'Rua das Flores, 123, São Paulo, SP',
        phone: '11987654321',
        declaresIncomeTax: true,
    },
    documents: [
      { id: 'userdoc-joao-1', name: 'CNH_Joao.pdf', category: 'identity', url: '#', uploadedAt: '2023-10-01T10:00:00Z'},
      { id: 'userdoc-joao-2', name: 'Comprovante_Endereco_Joao.pdf', category: 'address', url: '#', uploadedAt: '2023-10-01T10:01:00Z'},
      { id: 'userdoc-joao-3', name: 'Certidao_Casamento_Joao.pdf', category: 'marriage', url: '#', uploadedAt: '2023-10-01T10:02:00Z'},
      { id: 'userdoc-joao-4', name: 'IRPF_2023_Joao.pdf', category: 'tax_return', url: '#', uploadedAt: '2023-10-01T10:03:00Z'},
    ]
  },
  {
    id: 'client-maria-01',
    name: 'Maria Souza Completo',
    email: 'maria.completo@email.com',
    password: '123',
    role: UserRole.CLIENT,
    clientType: 'partner',
    requiresPasswordChange: false,
    qualificationData: {
        cpf: '222.333.444-55',
        rg: '23.456.789-0',
        maritalStatus: 'casado',
        propertyRegime: 'comunhao_parcial',
        birthDate: '1968-08-15',
        nationality: 'Brasileira',
        address: 'Rua das Flores, 123, São Paulo, SP',
        phone: '11987654322',
        declaresIncomeTax: true,
    },
     documents: [
      { id: 'userdoc-maria-1', name: 'RG_Maria.pdf', category: 'identity', url: '#', uploadedAt: '2023-10-01T11:00:00Z'},
    ]
  },
  {
    id: 'auxiliary-servicos-01',
    name: 'Gisele Pego',
    email: 'servicos@grupociatos.com.br',
    password: '123456',
    role: UserRole.AUXILIARY,
    requiresPasswordChange: false,
  }
];

// FIX: Export 'getInitialProjectPhases' so it can be used by other modules.
export const getInitialProjectPhases = (): Phase[] => {
    return [
        { id: 1, title: 'Diagnóstico e Planejamento', description: 'Coleta de informações iniciais e definição dos objetivos da holding.', status: 'in-progress', tasks: [], documents: [], phase1Data: { isFormCompleted: false, meetingScheduled: false }},
        { id: 2, title: 'Constituição da Holding', description: 'Definição do quadro societário, elaboração do contrato social e registro da empresa.', status: 'pending', tasks: [], documents: [], phase2Data: { companyData: { name: '', capital: '', type: '', address: '', cnaes: '' }, partners: [], documents: {}, status: 'pending_client', processStatus: 'pending_start' }},
        { id: 3, title: 'Coleta de Dados para Integralização', description: 'Declaração dos bens que serão transferidos para o capital social da holding.', status: 'pending', tasks: [], documents: [], phase3Data: { assets: [], documents: [], status: 'pending_client' }},
        { id: 4, title: 'Minuta de Integralização', description: 'Elaboração e revisão da minuta do contrato de integralização dos bens.', status: 'pending', tasks: [], documents: [], phase4Data: { analysisDrafts: [], discussion: [], status: 'pending_draft', approvals: {} }},
        { id: 5, title: 'Pagamento do ITBI', description: 'Processamento do Imposto sobre Transmissão de Bens Imóveis (ITBI), se aplicável.', status: 'pending', tasks: [], documents: [], phase5Data: { itbiProcesses: [] }},
        { id: 6, title: 'Registro da Integralização', description: 'Registro da transferência dos bens no cartório de registro de imóveis competente.', status: 'pending', tasks: [], documents: [], phase6Data: { registrationProcesses: [] }},
        { id: 7, title: 'Conclusão e Entrega', description: 'Entrega do dossiê final com todos os documentos e registros concluídos.', status: 'pending', tasks: [], documents: [], phase7Data: { status: 'pending' }},
        { id: 8, title: 'Transferência de Quotas', description: 'Processo de doação ou venda de quotas sociais para herdeiros ou terceiros.', status: 'pending', tasks: [], documents: [], phase8Data: { transferProcesses: [] }},
        { id: 9, title: 'Acordo de Sócios', description: 'Elaboração do acordo para regular as relações entre os sócios da holding.', status: 'pending', tasks: [], documents: [], phase9Data: { drafts: [], discussion: [], status: 'pending_draft', approvals: {}, documents: { agreement: undefined }, includedClauses: [] }},
        { id: 10, title: 'Suporte e Alterações', description: 'Canal para solicitações de alterações, dúvidas e suporte contínuo após a conclusão do projeto.', status: 'pending', tasks: [], documents: [], phase10Data: { requests: [] }},
    ];
};

const completedProjectPhases: Phase[] = [
    {
        // FIX: Added missing description property.
        id: 1, title: 'Diagnóstico e Planejamento', description: 'Coleta de informações iniciais e definição dos objetivos da holding.', status: 'completed', tasks: [],
        documents: [{ id: 'doc-contrato-servico', name: 'Contrato_Servicos.pdf', url: '#', type: 'pdf', uploadedAt: '2023-10-01T09:00:00Z', uploadedBy: 'Diego Garcia', phaseId: 1, version: 1, status: 'active' }],
        phase1Data: {
            isFormCompleted: true, objective: 'Proteção patrimonial e planejamento sucessório.', familyComposition: 'João (patriarca), Maria (esposa), Pedro (filho), Ana (filha).',
            mainAssets: '2 apartamentos, 1 sala comercial, participações na ABC Ltda, R$ 500.000 em investimentos.', partners: 'João da Silva Completo e Maria Souza Completo.',
            existingCompanies: 'ABC Comércio Ltda.', meetingScheduled: true, meetingDateTime: '2023-10-05T14:00:00Z', meetingMinutes: 'Discutido sobre os objetivos, alinhado sobre a estrutura da holding e próximos passos.'
        }
    },
    {
        // FIX: Added missing description property.
        id: 2, title: 'Constituição da Holding', description: 'Definição do quadro societário, elaboração do contrato social e registro da empresa.', status: 'completed', tasks: [],
        documents: [
            { id: 'doc-contrato-social', name: 'Contrato_Social_Completo_Participacoes.pdf', url: '#', type: 'pdf', uploadedAt: '2023-10-15T10:00:00Z', uploadedBy: 'Diego Garcia', phaseId: 2, version: 1, status: 'active' },
            { id: 'doc-cnpj', name: 'CNPJ_Completo_Participacoes.pdf', url: '#', type: 'pdf', uploadedAt: '2023-10-20T11:00:00Z', uploadedBy: 'Diego Garcia', phaseId: 2, version: 1, status: 'active' }
        ],
        phase2Data: {
            companyData: { name: 'Completo Participações LTDA', capital: 1500000, type: 'LTDA', address: 'Rua das Flores, 123, São Paulo, SP', cnaes: '6462-0/00 - Holdings de instituições não-financeiras' },
            partners: [
                { userId: 'client-joao-01', name: 'João da Silva Completo', isAdministrator: true, participation: 50, dataStatus: 'completed' },
                { userId: 'client-maria-01', name: 'Maria Souza Completo', isAdministrator: false, participation: 50, dataStatus: 'completed' }
            ],
            documents: {}, status: 'approved', processStatus: 'completed'
        }
    },
    {
        // FIX: Added missing description property.
        id: 3, title: 'Coleta de Dados para Integralização', description: 'Declaração dos bens que serão transferidos para o capital social da holding.', status: 'completed', tasks: [],
        documents: [
            { id: 'doc-apto1', name: 'Matricula_Apto_Ipanema.pdf', url: '#', type: 'pdf', uploadedAt: '2023-10-25T14:00:00Z', uploadedBy: 'João da Silva Completo', phaseId: 3, version: 1, status: 'active' },
            { id: 'doc-sala1', name: 'Matricula_Sala_Comercial.pdf', url: '#', type: 'pdf', uploadedAt: '2023-10-25T14:05:00Z', uploadedBy: 'João da Silva Completo', phaseId: 3, version: 1, status: 'active' }
        ],
        phase3Data: {
            assets: [
                { id: 'asset-1', ownerPartnerId: 'client-joao-01', value: 800000, status: 'validado', description: 'Apartamento em Ipanema', type: 'property', address: 'Av. Vieira Souto, 200', registrationNumber: '12345', documentId: 'doc-apto1' },
                { id: 'asset-2', ownerPartnerId: 'client-joao-01', value: 400000, status: 'validado', description: 'Sala Comercial Centro', type: 'property', address: 'Rua do Ouvidor, 50', registrationNumber: '54321', documentId: 'doc-sala1' },
                { id: 'asset-3', ownerPartnerId: 'client-maria-01', value: 300000, status: 'validado', description: 'Recursos financeiros', type: 'cash' }
            ],
            documents: [], status: 'approved'
        }
    },
    {
        // FIX: Added missing description property.
        id: 4, title: 'Minuta de Integralização', description: 'Elaboração e revisão da minuta do contrato de integralização dos bens.', status: 'completed', tasks: [], documents: [],
        phase4Data: {
            analysisDrafts: [{ id: 'doc-minuta-int', name: 'Minuta_Integralizacao_v1.pdf', url: '#', type: 'pdf', uploadedAt: '2023-11-01T10:00:00Z', uploadedBy: 'Diego Garcia', phaseId: 4, version: 1, status: 'active' }],
            discussion: [
              { id: 'msg-4-1', authorId: 'consultant-diego-01', authorName: 'Diego Garcia', authorRole: UserRole.CONSULTANT, content: 'Srs. João e Maria, segue a minuta para vossa análise.', timestamp: '2023-11-01T10:01:00Z' },
              { id: 'msg-4-2', authorId: 'client-joao-01', authorName: 'João da Silva Completo', authorRole: UserRole.CLIENT, content: 'Diego, tudo certo por aqui. Aprovado.', timestamp: '2023-11-02T15:00:00Z' }
            ],
            status: 'approved', approvals: { 'client-joao-01': true, 'client-maria-01': true }
        }
    },
    {
        // FIX: Added missing description property.
        id: 5, title: 'Pagamento do ITBI', description: 'Processamento do Imposto sobre Transmissão de Bens Imóveis (ITBI), se aplicável.', status: 'completed', tasks: [], documents: [],
        phase5Data: {
            itbiProcesses: [
                { propertyId: 'asset-1', processType: 'isencao', status: 'exemption_approved', observations: 'Processo de isenção deferido pela prefeitura.', receiptDocId: 'doc-isencao-itbi-1' },
                { propertyId: 'asset-2', processType: 'pagamento', status: 'completed', observations: 'ITBI pago conforme guia.', guideDocId: 'doc-guia-itbi-2', receiptDocId: 'doc-recibo-itbi-2' }
            ]
        }
    },
    {
        // FIX: Added missing description property.
        id: 6, title: 'Registro da Integralização', description: 'Registro da transferência dos bens no cartório de registro de imóveis competente.', status: 'completed', tasks: [], documents: [],
        phase6Data: {
            registrationProcesses: [
                { propertyId: 'asset-1', registryOffice: '9º RGI', status: 'completed', updatedCertificateDocId: 'doc-cert-final-1' },
                { propertyId: 'asset-2', registryOffice: '1º RGI', status: 'completed', updatedCertificateDocId: 'doc-cert-final-2' }
            ]
        }
    },
    {
        // FIX: Added missing description property.
        id: 7, title: 'Conclusão e Entrega', description: 'Entrega do dossiê final com todos os documentos e registros concluídos.', status: 'completed', tasks: [], documents: [],
        phase7Data: {
            status: 'completed', conclusionDate: '2023-11-20T18:00:00Z',
            feedback: { rating: 5, comment: 'Processo muito bem conduzido pelo Diego. Excelente plataforma!', wouldRecommend: true },
            dossieFinalUrl: '#'
        }
    },
    {
        // FIX: Added missing description property.
        id: 8, title: 'Transferência de Quotas', description: 'Processo de doação ou venda de quotas sociais para herdeiros ou terceiros.', status: 'completed', tasks: [], documents: [],
        phase8Data: {
            transferProcesses: [{
                id: 'qt-1', type: 'doacao', donorOrSellerId: 'client-joao-01', beneficiaryOrBuyerIds: [],
                percentage: 25, transactionValue: 0, observations: 'Doação de parte das quotas para os filhos.',
                drafts: [], discussion: [], approvals: { 'client-joao-01': true, 'client-maria-01': true },
                status: 'approved', taxPaymentStatus: 'completed'
            }]
        }
    },
    {
        // FIX: Added missing description property.
        id: 9, title: 'Acordo de Sócios', description: 'Elaboração do acordo para regular as relações entre os sócios da holding.', status: 'completed', tasks: [], documents: [],
        phase9Data: {
            drafts: [{ id: 'doc-acordo-socios', name: 'Acordo_de_Socios_Final.pdf', url: '#', type: 'pdf', uploadedAt: '2023-12-01T10:00:00Z', uploadedBy: 'Diego Garcia', phaseId: 9, version: 1, status: 'active' }],
            discussion: [], status: 'approved', approvals: { 'client-joao-01': true, 'client-maria-01': true },
            documents: { agreement: undefined }, includedClauses: ['Direito de preferência', 'Regras de sucessão', 'Administração'],
            signatureDate: '2023-12-05'
        }
    },
    {
        // FIX: Added missing description property.
        id: 10, title: 'Suporte e Alterações', description: 'Canal para solicitações de alterações, dúvidas e suporte contínuo após a conclusão do projeto.', status: 'completed', tasks: [], documents: [],
        phase10Data: {
            requests: [{
                id: 'req-1', title: 'Alteração de endereço da sede', description: 'Gostaríamos de alterar o endereço da holding para a sala comercial.',
                status: 'closed', requesterId: 'client-joao-01', createdAt: '2024-01-15T10:00:00Z',
                messages: [], documents: [], priority: 'medium', category: 'alteration'
            }]
        }
    }
];


export const INITIAL_PROJECTS: Project[] = [
    {
        id: 'proj-completo-01',
        name: 'Holding Família Completo',
        status: 'completed',
        currentPhaseId: 10,
        consultantId: 'consultant-diego-01',
        auxiliaryId: 'auxiliary-servicos-01',
        clientIds: ['client-joao-01', 'client-maria-01'],
        phases: completedProjectPhases,
        internalChat: [],
        clientChat: [
            { id: 'msg-cli-1', authorId: 'consultant-diego-01', authorName: 'Diego Garcia', authorRole: UserRole.CONSULTANT, content: 'Seja bem-vindo à plataforma, Sr. João! O primeiro passo é preencher o formulário na Fase 1.', timestamp: '2023-10-01T09:05:00Z' },
            { id: 'msg-cli-2', authorId: 'client-joao-01', authorName: 'João da Silva Completo', authorRole: UserRole.CLIENT, content: 'Obrigado, Diego! Já preenchi. Aguardo o agendamento.', timestamp: '2023-10-02T11:20:00Z' }
        ],
        postCompletionStatus: 'completed',
        activityLog: [
            { id: 'log-1', actorId: 'consultant-diego-01', actorName: 'Diego Garcia', action: 'criou o projeto.', timestamp: '2023-10-01T09:00:00Z' },
            { id: 'log-2', actorId: 'client-joao-01', actorName: 'João da Silva Completo', action: 'enviou o formulário de diagnóstico para análise.', timestamp: '2023-10-02T11:19:00Z' },
            { id: 'log-3', actorId: 'consultant-diego-01', actorName: 'Diego Garcia', action: 'avançou o projeto para a Fase 2.', timestamp: '2023-10-06T10:00:00Z' },
            { id: 'log-4', actorId: 'consultant-diego-01', actorName: 'Diego Garcia', action: 'avançou o projeto para a Fase 7.', timestamp: '2023-11-15T16:00:00Z' },
            { id: 'log-5', actorId: 'consultant-diego-01', actorName: 'Diego Garcia', action: 'marcou o projeto como concluído.', timestamp: '2023-11-20T18:01:00Z' },
        ],
    }
];