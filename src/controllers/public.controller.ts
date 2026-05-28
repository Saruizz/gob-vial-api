import { Request, Response, NextFunction } from 'express';
import * as reporteRepo from '../repositories/reporte.repository';
import { sendSuccess } from '../utils/response';

export async function listarPines(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pines = await reporteRepo.findAllPublic();
    sendSuccess(res, 200, 'Map pins retrieved successfully', pines);
  } catch (error) {
    next(error);
  }
}
