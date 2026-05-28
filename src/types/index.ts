export interface JwtPayload {
  userId: number;
  rolId: number;
  email: string;
  numeroDocumento: string;
}

export interface UserRow {
  id: number;
  rol_id: number;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  email: string;
  telefono: string | null;
  password_hash: string;
  estado_biometria: 'Pendiente' | 'Verificada' | 'Rechazada';
  fecha_registro: Date;
  ultimo_login: Date | null;
  estado_cuenta: boolean;
}

export interface UserResponse {
  id: number;
  rolId: number;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  email: string;
  telefono: string | null;
  estadoBiometria: string;
  fechaRegistro: Date;
}

export interface RegisterInput {
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  email: string;
  telefono?: string;
  password: string;
  rolId?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: UserResponse;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: PaginationMeta;
}
