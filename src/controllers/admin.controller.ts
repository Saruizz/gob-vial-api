import { Request, Response, NextFunction } from 'express';
import * as reporteService from '../services/reporte.service';
import { sendSuccess, sendPaginated } from '../utils/response';

export async function listarReportes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const estadoId = req.query.estadoId ? parseInt(req.query.estadoId as string, 10) : null;

    const result = await reporteService.listarReportesAdmin(estadoId, page, limit);

    sendPaginated(res, 'Reports retrieved successfully', result.rows, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function obtenerReporteDetalle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reporteId = parseInt(req.params['id'] as string, 10);
    const reporte = await reporteService.obtenerReporteAdmin(reporteId);

    sendSuccess(res, 200, 'Report retrieved successfully', reporte);
  } catch (error) {
    next(error);
  }
}

export async function realizarTriage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const reporteId = parseInt(req.params['id'] as string, 10);
    const { accion, prioridad, motivoRechazo, comentarioTecnico } = req.body;

    let nuevoEstadoId: number;
    let prioridadAsignada: string | null = null;
    let motivo: string | null = null;

    if (accion === 'aceptar') {
      nuevoEstadoId = 2;
      prioridadAsignada = prioridad || null;
    } else if (accion === 'rechazar') {
      nuevoEstadoId = 5;
      motivo = motivoRechazo || null;
    } else {
      res.status(400).json({ success: false, message: 'Invalid action. Use "aceptar" or "rechazar".' });
      return;
    }

    const result = await reporteService.cambiarEstado(
      reporteId,
      nuevoEstadoId,
      req.user.userId,
      prioridadAsignada,
      motivo,
      comentarioTecnico || 'Triage realizado por administrador'
    );

    sendSuccess(res, 200, `Report ${accion === 'aceptar' ? 'accepted' : 'rejected'} successfully`, result);
  } catch (error) {
    next(error);
  }
}
