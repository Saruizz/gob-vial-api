export class HttpError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || `ERR_${statusCode}`;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad request') {
    super(400, message, 'ERR_BAD_REQUEST');
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'ERR_UNAUTHORIZED');
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'ERR_FORBIDDEN');
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'ERR_NOT_FOUND');
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Resource already exists') {
    super(409, message, 'ERR_CONFLICT');
  }
}

export class InternalError extends HttpError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'ERR_INTERNAL');
  }
}

export interface FieldError {
  field: string;
  message: string;
}

export class ValidationError extends HttpError {
  public errors: FieldError[];

  constructor(message: string, errors: FieldError[]) {
    super(422, message, 'ERR_VALIDATION');
    this.errors = errors;
  }
}
