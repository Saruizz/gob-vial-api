import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import * as biometriaService from '../services/biometria.service';
import { sendSuccess } from '../utils/response';
import { RegisterInput, LoginInput } from '../types';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input: RegisterInput = {
      nombres: req.body.nombres,
      apellidos: req.body.apellidos,
      numeroDocumento: req.body.numeroDocumento,
      email: req.body.email,
      telefono: req.body.telefono,
      password: req.body.password,
    };

    const result = await authService.register(input);
    sendSuccess(res, 201, 'Registration successful', result);
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input: LoginInput = {
      email: req.body.email,
      password: req.body.password,
    };

    const result = await authService.login(input);
    sendSuccess(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
}

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await authService.getProfile(req.user.userId);
    sendSuccess(res, 200, 'Profile retrieved successfully', user);
  } catch (error) {
    next(error);
  }
}

export async function verifyBiometria(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await biometriaService.verifyBiometrica(req.user.userId);
    sendSuccess(res, 200, result.mensaje, { estado: result.estado });
  } catch (error) {
    next(error);
  }
}

export async function getBiometriaStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await biometriaService.getEstadoBiometria(req.user.userId);
    sendSuccess(res, 200, result.mensaje, { estado: result.estado });
  } catch (error) {
    next(error);
  }
}
