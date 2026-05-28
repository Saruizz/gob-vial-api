import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types';

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null
): void {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  error?: string
): void {
  const body: ApiResponse<null> = {
    success: false,
    message,
    data: null,
    error: error || message,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  message: string,
  data: T[],
  meta: PaginationMeta
): void {
  const body: PaginatedResponse<T[]> = {
    success: true,
    message,
    data,
    error: null,
    timestamp: new Date().toISOString(),
    meta,
  };
  res.status(200).json(body);
}
