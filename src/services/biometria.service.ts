import * as userRepo from '../repositories/user.repository';
import { NotFoundError, BadRequestError } from '../utils/httpError';
import logger from '../config/logger';

function simulateBiometricVerification(numeroDocumento: string): Promise<boolean> {
  return new Promise((resolve) => {
    const processingTime = 1500 + Math.random() * 2000;

    setTimeout(() => {
      const isApproved = Math.random() > 0.15;
      logger.info({
        action: 'biometric_verification_simulated',
        numeroDocumento,
        result: isApproved ? 'approved' : 'rejected',
        processingTimeMs: Math.round(processingTime),
      });
      resolve(isApproved);
    }, processingTime);
  });
}

export async function verifyBiometrica(userId: number): Promise<{
  estado: string;
  mensaje: string;
}> {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.estado_biometria === 'Verificada') {
    throw new BadRequestError('Biometric verification already approved');
  }

  if (user.estado_biometria === 'Rechazada') {
    throw new BadRequestError('Biometric verification was rejected. Contact support.');
  }

  const isApproved = await simulateBiometricVerification(user.numero_documento);

  const nuevoEstado = isApproved ? 'Verificada' : 'Rechazada';
  await userRepo.updateEstadoBiometria(userId, nuevoEstado);

  const mensaje = isApproved
    ? 'Biometric verification approved. Your account is now active.'
    : 'Biometric verification failed. Please try again or contact support.';

  return {
    estado: nuevoEstado,
    mensaje,
  };
}

export async function getEstadoBiometria(userId: number): Promise<{
  estado: string;
  mensaje: string;
}> {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const mensajes: Record<string, string> = {
    Pendiente: 'Biometric verification pending. Submit your facial verification to activate your account.',
    Verificada: 'Biometric verification completed successfully.',
    Rechazada: 'Biometric verification was rejected. Please contact support.',
  };

  return {
    estado: user.estado_biometria,
    mensaje: mensajes[user.estado_biometria] || 'Unknown verification status',
  };
}
