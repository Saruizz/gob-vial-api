import { Request, Response, NextFunction } from 'express';
import * as reporteService from '../services/reporte.service';
import { sendSuccess, sendPaginated } from '../utils/response';

export async function crearReporte(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Evidence photo is required' });
      return;
    }

    const fotoUrl = `/uploads/evidencias/${req.file.filename}`;

    const result = await reporteService.crearReporte({
      ciudadanoId: req.user.userId,
      categoriaId: parseInt(req.body.categoriaId, 10),
      municipioId: parseInt(req.body.municipioId, 10),
      nivelPeligro: req.body.nivelPeligro,
      latitud: parseFloat(req.body.latitud),
      longitud: parseFloat(req.body.longitud),
      evidenciaFotoUrl: fotoUrl,
    });

    sendSuccess(res, 201, 'Report created successfully', result);
  } catch (error) {
    next(error);
  }
}

export async function listarMisReportes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await reporteService.listarReportesCiudadano(
      req.user.userId,
      page,
      limit
    );

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

export async function obtenerReporte(
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
    const reporte = await reporteService.obtenerReporte(reporteId, req.user.userId);

    sendSuccess(res, 200, 'Report retrieved successfully', reporte);
  } catch (error) {
    next(error);
  }
}
