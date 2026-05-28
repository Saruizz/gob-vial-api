import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/httpError';
import logger from '../config/logger';
import { sendError } from '../utils/response';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    logger.warn({
      message: err.message,
      statusCode: err.statusCode,
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    sendError(res, err.statusCode, err.message);
    return;
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    body: req.body,
  });

  sendError(res, 500, 'Internal server error');
}
