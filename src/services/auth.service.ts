import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import logger from '../config/logger';
import * as userRepo from '../repositories/user.repository';
import {
  RegisterInput,
  LoginInput,
  TokenResponse,
  UserResponse,
  JwtPayload,
} from '../types';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../utils/httpError';

function mapUserResponse(row: {
  id: number;
  rol_id: number;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  email: string;
  telefono: string | null;
  estado_biometria: string;
  fecha_registro: Date;
}): UserResponse {
  return {
    id: row.id,
    rolId: row.rol_id,
    nombres: row.nombres,
    apellidos: row.apellidos,
    numeroDocumento: row.numero_documento,
    email: row.email,
    telefono: row.telefono,
    estadoBiometria: row.estado_biometria,
    fechaRegistro: row.fecha_registro,
  };
}

function generateTokens(payload: JwtPayload): {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
} {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRATION,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(
    { userId: payload.userId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRATION } as jwt.SignOptions
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: env.JWT_EXPIRATION,
  };
}

export async function register(input: RegisterInput): Promise<TokenResponse> {
  const existingEmail = await userRepo.findByEmail(input.email);
  if (existingEmail) {
    throw new ConflictError('Email is already registered');
  }

  const existingDoc = await userRepo.findByDocumento(input.numeroDocumento);
  if (existingDoc) {
    throw new ConflictError('Document number is already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

  const userId = await userRepo.create({
    ...input,
    password: passwordHash,
  });

  const user = await userRepo.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found after creation');
  }

  const payload: JwtPayload = {
    userId: user.id,
    rolId: user.rol_id,
    email: user.email,
    numeroDocumento: user.numero_documento,
  };

  const tokens = generateTokens(payload);

  logger.info({
    action: 'user_registered',
    userId: user.id,
    email: user.email,
    estadoBiometria: user.estado_biometria,
  });

  return {
    ...tokens,
    user: mapUserResponse(user),
  };
}

export async function login(input: LoginInput): Promise<TokenResponse> {
  const user = await userRepo.findByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.estado_cuenta) {
    throw new UnauthorizedError('Account is disabled. Contact support.');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  await userRepo.updateUltimoLogin(user.id);

  const payload: JwtPayload = {
    userId: user.id,
    rolId: user.rol_id,
    email: user.email,
    numeroDocumento: user.numero_documento,
  };

  const tokens = generateTokens(payload);

  logger.info({
    action: 'user_login',
    userId: user.id,
    email: user.email,
  });

  return {
    ...tokens,
    user: mapUserResponse(user),
  };
}

export async function getProfile(userId: number): Promise<UserResponse> {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return mapUserResponse(user);
}
