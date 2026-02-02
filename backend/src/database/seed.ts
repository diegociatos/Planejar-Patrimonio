// ===========================================
// Planejar Patrimônio - Database Seed
// ===========================================

import { pool, query } from '../config/database.js';
import { hashPassword, generateId } from '../utils/helpers.js';
import { UserRole } from '../types/index.js';

async function seed() {
  console.log('');
  console.log('🌱 Iniciando seed do banco de dados...');
  console.log('');

  try {
    // Check if admin already exists
    const [existingAdmin] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      ['admin@planejar.com']
    ) as any;

    if (existingAdmin.length > 0) {
      console.log('⚠️  Dados de seed já existem. Pulando...');
      await pool.end();
      return;
    }

    // ===========================================
    // Create Users
    // ===========================================
    console.log('👤 Criando usuários...');

    // Admin
    const adminId = generateId();
    const adminPassword = await hashPassword('admin123');
    await pool.execute(
      `INSERT INTO users (id, name, email, password, role, requires_password_change)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId, 'Administrador', 'admin@planejar.com', adminPassword, UserRole.ADMINISTRATOR, false]
    );
    console.log('   ✅ Admin criado (admin@planejar.com / admin123)');

    // Consultant (Diego)
    const consultantId = generateId();
    const consultantPassword = await hashPassword('250500');
    await pool.execute(
      `INSERT INTO users (id, name, email, password, role, requires_password_change)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [consultantId, 'Diego Garcia', 'diego.garcia@grupociatos.com.br', consultantPassword, UserRole.CONSULTANT, false]
    );
    console.log('   ✅ Consultor criado (diego.garcia@grupociatos.com.br / 250500)');

    // Auxiliary
    const auxiliaryId = generateId();
    const auxiliaryPassword = await hashPassword('123456');
    await pool.execute(
      `INSERT INTO users (id, name, email, password, role, requires_password_change)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [auxiliaryId, 'Gisele Pego', 'servicos@grupociatos.com.br', auxiliaryPassword, UserRole.AUXILIARY, false]
    );
    console.log('   ✅ Auxiliar criado (servicos@grupociatos.com.br / 123456)');

    // Client 1 (João)
    const client1Id = generateId();
    const clientPassword = await hashPassword('123');
    await pool.execute(
      `INSERT INTO users (id, name, email, password, role, client_type, requires_password_change)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [client1Id, 'João da Silva Completo', 'joao.completo@email.com', clientPassword, UserRole.CLIENT, 'partner', false]
    );
    console.log('   ✅ Cliente 1 criado (joao.completo@email.com / 123)');

    // Client 1 Qualification Data
    const qual1Id = generateId();
    await pool.execute(
      `INSERT INTO partner_qualification_data 
       (id, user_id, cpf, rg, marital_status, property_regime, birth_date, nationality, address, phone, declares_income_tax)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [qual1Id, client1Id, '111.222.333-44', '12.345.678-9', 'casado', 'comunhao_parcial', '1965-05-20', 'Brasileiro', 'Rua das Flores, 123, São Paulo, SP', '11987654321', true]
    );

    // Client 2 (Maria)
    const client2Id = generateId();
    await pool.execute(
      `INSERT INTO users (id, name, email, password, role, client_type, requires_password_change)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [client2Id, 'Maria Souza Completo', 'maria.completo@email.com', clientPassword, UserRole.CLIENT, 'partner', false]
    );
    console.log('   ✅ Cliente 2 criado (maria.completo@email.com / 123)');

    // Client 2 Qualification Data
    const qual2Id = generateId();
    await pool.execute(
      `INSERT INTO partner_qualification_data 
       (id, user_id, cpf, rg, marital_status, property_regime, birth_date, nationality, address, phone, declares_income_tax)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [qual2Id, client2Id, '222.333.444-55', '23.456.789-0', 'casado', 'comunhao_parcial', '1968-08-15', 'Brasileira', 'Rua das Flores, 123, São Paulo, SP', '11987654322', true]
    );

    // ===========================================
    // Create Sample Project
    // ===========================================
    console.log('');
    console.log('📁 Criando projeto de exemplo...');

    const projectId = generateId();
    await pool.execute(
      `INSERT INTO projects (id, name, status, current_phase_id, consultant_id, auxiliary_id, post_completion_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, 'Holding Família Completo', 'in-progress', 1, consultantId, auxiliaryId, null]
    );

    // Add clients to project
    const pc1Id = generateId();
    const pc2Id = generateId();
    await pool.execute(
      'INSERT INTO project_clients (id, project_id, user_id) VALUES (?, ?, ?), (?, ?, ?)',
      [pc1Id, projectId, client1Id, pc2Id, projectId, client2Id]
    );

    // Create phases
    const phaseDefinitions = [
      { number: 1, title: 'Diagnóstico e Planejamento', description: 'Coleta de informações iniciais e definição dos objetivos da holding.', status: 'in-progress' },
      { number: 2, title: 'Constituição da Holding', description: 'Definição do quadro societário, elaboração do contrato social e registro da empresa.', status: 'pending' },
      { number: 3, title: 'Coleta de Dados para Integralização', description: 'Declaração dos bens que serão transferidos para o capital social da holding.', status: 'pending' },
      { number: 4, title: 'Minuta de Integralização', description: 'Elaboração e revisão da minuta do contrato de integralização dos bens.', status: 'pending' },
      { number: 5, title: 'Pagamento do ITBI', description: 'Processamento do Imposto sobre Transmissão de Bens Imóveis (ITBI), se aplicável.', status: 'pending' },
      { number: 6, title: 'Registro da Integralização', description: 'Registro da transferência dos bens no cartório de registro de imóveis competente.', status: 'pending' },
      { number: 7, title: 'Conclusão e Entrega', description: 'Entrega do dossiê final com todos os documentos e registros concluídos.', status: 'pending' },
      { number: 8, title: 'Transferência de Quotas', description: 'Processo de doação ou venda de quotas sociais para herdeiros ou terceiros.', status: 'pending' },
      { number: 9, title: 'Acordo de Sócios', description: 'Elaboração do acordo para regular as relações entre os sócios da holding.', status: 'pending' },
      { number: 10, title: 'Suporte e Alterações', description: 'Canal para solicitações de alterações, dúvidas e suporte contínuo após a conclusão do projeto.', status: 'pending' },
    ];

    for (const phase of phaseDefinitions) {
      const phaseId = generateId();
      await pool.execute(
        `INSERT INTO phases (id, project_id, phase_number, title, description, status, phase_data)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [phaseId, projectId, phase.number, phase.title, phase.description, phase.status, '{}']
      );
    }

    console.log('   ✅ Projeto "Holding Família Completo" criado com 10 fases');

    // Add activity log
    const logId = generateId();
    await pool.execute(
      'INSERT INTO activity_log (id, project_id, actor_id, action) VALUES (?, ?, ?, ?)',
      [logId, projectId, consultantId, 'criou o projeto.']
    );

    // ===========================================
    // Summary
    // ===========================================
    console.log('');
    console.log('✅ Seed concluído com sucesso!');
    console.log('');
    console.log('📋 Resumo:');
    console.log('   - 1 Administrador');
    console.log('   - 1 Consultor (Diego Garcia)');
    console.log('   - 1 Auxiliar (Gisele Pego)');
    console.log('   - 2 Clientes (João e Maria)');
    console.log('   - 1 Projeto de exemplo');
    console.log('');
    console.log('🔐 Credenciais de acesso:');
    console.log('   Admin:      admin@planejar.com / admin123');
    console.log('   Consultor:  diego.garcia@grupociatos.com.br / 250500');
    console.log('   Auxiliar:   servicos@grupociatos.com.br / 123456');
    console.log('   Cliente:    joao.completo@email.com / 123');
    console.log('   Cliente:    maria.completo@email.com / 123');
    console.log('');

  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
