// ===========================================
// Planejar Patrimônio - File Upload Middleware
// ===========================================

import multer from 'multer';
import path from 'path';
import { env } from '../config/env.js';
import { generateId } from '../utils/helpers.js';
import { BadRequestError } from '../utils/errors.js';

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.upload.dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${generateId()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new BadRequestError('Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG, PNG ou GIF.'));
    return;
  }
  
  cb(null, true);
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.upload.maxFileSize,
  },
});

// Single file upload
export const uploadSingle = upload.single('file');

// Multiple files upload (max 10)
export const uploadMultiple = upload.array('files', 10);

// Fields upload
export const uploadFields = upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'attachment', maxCount: 5 },
]);
