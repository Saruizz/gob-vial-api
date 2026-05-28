import { Request, Response, NextFunction } from 'express';
import { HttpError, ValidationError } from '../utils/httpError';
import logger from '../config/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    logger.warn({
      action: 'validation_error',
      message: err.message,
      errors: err.errors,
      method: req.method,
      path: req.path,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (err instanceof HttpError) {
    logger.warn({
      action: 'http_error',
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      method: req.method,
      path: req.path,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: [],
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.error({
    action: 'unhandled_error',
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'ERR_INTERNAL',
    errors: [],
    timestamp: new Date().toISOString(),
  });
}
