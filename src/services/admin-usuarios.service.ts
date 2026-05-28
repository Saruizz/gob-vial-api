import * as userRepo from '../repositories/user.repository';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/httpError';
import logger from '../config/logger';

export async function listarUsuarios(filtros: {
  rolId: number | null;
  search: string | null;
  page: number;
  limit: number;
}) {
  return userRepo.findAllAdmin(filtros.rolId, filtros.search, filtros.page, filtros.limit);
}

export async function obtenerUsuario(usuarioId: number) {
  const user = await userRepo.findById(usuarioId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}

export async function cambiarRol(
  adminId: number,
  usuarioId: number,
  nuevoRolId: number
) {
  if (adminId === usuarioId) {
    throw new ForbiddenError('You cannot change your own role');
  }

  const user = await userRepo.findById(usuarioId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (nuevoRolId !== 1 && nuevoRolId !== 2) {
    throw new BadRequestError('Invalid role. Use 1 (Ciudadano) or 2 (Administrador)');
  }

  if (nuevoRolId === 1 && user.rol_id === 2) {
    const adminCount = await userRepo.countAdminsActivos();
    if (adminCount <= 1) {
      throw new BadRequestError('Cannot demote last administrator. The system requires at least one admin.');
    }
  }

  await userRepo.updateRol(usuarioId, nuevoRolId);

  logger.info({
    action: 'rol_cambiado',
    adminId,
    usuarioId,
    rolAnterior: user.rol_id,
    rolNuevo: nuevoRolId,
  });

  return userRepo.findById(usuarioId);
}

export async function cambiarEstadoCuenta(
  adminId: number,
  usuarioId: number,
  activo: boolean
) {
  if (adminId === usuarioId) {
    throw new ForbiddenError('You cannot deactivate your own account');
  }

  const user = await userRepo.findById(usuarioId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!activo && user.rol_id === 2) {
    const adminCount = await userRepo.countAdminsActivos();
    if (adminCount <= 1) {
      throw new BadRequestError('Cannot deactivate last administrator account.');
    }
  }

  await userRepo.updateEstadoCuenta(usuarioId, activo);

  logger.info({
    action: 'estado_cuenta_cambiado',
    adminId,
    usuarioId,
    estadoNuevo: activo,
  });

  return userRepo.findById(usuarioId);
}

export async function cambiarEstadoBiometria(
  adminId: number,
  usuarioId: number,
  estado: string
) {
  const user = await userRepo.findById(usuarioId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const estadosValidos = ['Pendiente', 'Verificada', 'Rechazada'];
  if (!estadosValidos.includes(estado)) {
    throw new BadRequestError('Invalid biometric state');
  }

  await userRepo.updateEstadoBiometria(usuarioId, estado);

  logger.info({
    action: 'biometria_cambiada',
    adminId,
    usuarioId,
    estadoAnterior: user.estado_biometria,
    estadoNuevo: estado,
  });

  return userRepo.findById(usuarioId);
}
