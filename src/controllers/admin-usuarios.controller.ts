import { Request, Response, NextFunction } from 'express';
import * as adminUsuariosService from '../services/admin-usuarios.service';
import { sendSuccess, sendPaginated } from '../utils/response';

export async function listarUsuarios(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const rolId = req.query.rolId ? parseInt(req.query.rolId as string, 10) : null;
    const search = (req.query.search as string) || null;

    const result = await adminUsuariosService.listarUsuarios({
      rolId,
      search,
      page,
      limit,
    });

    sendPaginated(res, 'Users retrieved successfully', result.rows, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function obtenerUsuario(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const usuarioId = parseInt(req.params['id'] as string, 10);
    const user = await adminUsuariosService.obtenerUsuario(usuarioId);
    sendSuccess(res, 200, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
}

export async function cambiarRol(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const usuarioId = parseInt(req.params['id'] as string, 10);
    const { rolId } = req.body;

    const result = await adminUsuariosService.cambiarRol(
      req.user.userId,
      usuarioId,
      rolId
    );

    sendSuccess(res, 200, 'Role updated successfully', result);
  } catch (error) {
    next(error);
  }
}

export async function cambiarEstadoCuenta(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const usuarioId = parseInt(req.params['id'] as string, 10);
    const { activo } = req.body;

    const result = await adminUsuariosService.cambiarEstadoCuenta(
      req.user.userId,
      usuarioId,
      activo
    );

    sendSuccess(
      res,
      200,
      `Account ${activo ? 'activated' : 'deactivated'} successfully`,
      result
    );
  } catch (error) {
    next(error);
  }
}

export async function cambiarBiometria(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const usuarioId = parseInt(req.params['id'] as string, 10);
    const { estado } = req.body;

    const result = await adminUsuariosService.cambiarEstadoBiometria(
      req.user.userId,
      usuarioId,
      estado
    );

    sendSuccess(res, 200, 'Biometric status updated successfully', result);
  } catch (error) {
    next(error);
  }
}
