// ===========================================
// Planejar Patrimônio - Express Application
// ===========================================

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// ===========================================
// Middlewares
// ===========================================

// CORS
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', env.upload.dir)));

// ===========================================
// Routes
// ===========================================

// API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Planejar Patrimônio API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/health',
  });
});

// ===========================================
// Error Handling
// ===========================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
