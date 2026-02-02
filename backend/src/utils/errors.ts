// ===========================================
// Planejar Patrimônio - Custom Error Classes
// ===========================================

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Requisição inválida') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflito com recurso existente') {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  public errors: any[];

  constructor(message: string = 'Erro de validação', errors: any[] = []) {
    super(message, 422);
    this.errors = errors;
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Erro interno do servidor') {
    super(message, 500);
  }
}
