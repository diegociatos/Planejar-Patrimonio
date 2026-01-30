// ===========================================
// Planejar Patrimônio - Database Migration
// ===========================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  console.log('');
  console.log('🔄 Iniciando migração do banco de dados...');
  console.log('');

  // Create connection without database (to create it if needed)
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📄 Executando schema.sql...');

    // Execute schema
    await connection.query(schema);

    console.log('');
    console.log('✅ Migração concluída com sucesso!');
    console.log('');
    console.log('📋 Tabelas criadas:');
    console.log('   - users');
    console.log('   - partner_qualification_data');
    console.log('   - user_documents');
    console.log('   - projects');
    console.log('   - project_clients');
    console.log('   - phases');
    console.log('   - tasks');
    console.log('   - documents');
    console.log('   - assets');
    console.log('   - chat_messages');
    console.log('   - notifications');
    console.log('   - activity_log');
    console.log('   - support_requests');
    console.log('   - support_request_messages');
    console.log('   - support_request_documents');
    console.log('   - itbi_processes');
    console.log('   - registration_processes');
    console.log('   - quota_transfers');
    console.log('   - quota_transfer_beneficiaries');
    console.log('   - quota_transfer_approvals');
    console.log('   - phase2_partners');
    console.log('   - phase4_approvals');
    console.log('   - phase9_approvals');
    console.log('');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
