// ===========================================
// Planejar Patrimônio - Server Entry Point
// ===========================================

import app from './app.js';
import { env } from './config/env.js';
import { testConnection } from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', env.upload.dir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Diretório de uploads criado: ${uploadsDir}`);
}

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected && env.isProduction) {
      console.error('❌ Não foi possível conectar ao banco de dados. Encerrando...');
      process.exit(1);
    }

    // Start listening
    app.listen(env.port, () => {
      console.log('');
      console.log('🚀 =========================================');
      console.log('   PLANEJAR PATRIMÔNIO - BACKEND API');
      console.log('   =========================================');
      console.log('');
      console.log(`   🌐 Servidor:    http://localhost:${env.port}`);
      console.log(`   📡 API:         http://localhost:${env.port}/api`);
      console.log(`   💚 Health:      http://localhost:${env.port}/api/health`);
      console.log(`   🔧 Ambiente:    ${env.nodeEnv}`);
      console.log(`   🗄️  Database:    ${dbConnected ? 'Conectado ✅' : 'Desconectado ⚠️'}`);
      console.log('');
      console.log('   =========================================');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recebido. Encerrando gracefully...');
  process.exit(0);
});

// Start the server
startServer();
