import { getPool } from '../config/database';
import { UserRow, RegisterInput } from '../types';

export async function findByEmail(email: string): Promise<UserRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
    `SELECT id, rol_id, nombres, apellidos, numero_documento, email,
            telefono, password_hash, estado_biometria, fecha_registro,
            ultimo_login, estado_cuenta
     FROM usuarios
     WHERE email = ?`,
    [email]
  );
  return rows.length > 0 ? (rows[0] as UserRow) : null;
}

export async function findByDocumento(numeroDocumento: string): Promise<UserRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
    `SELECT id, rol_id, nombres, apellidos, numero_documento, email,
            telefono, password_hash, estado_biometria, fecha_registro,
            ultimo_login, estado_cuenta
     FROM usuarios
     WHERE numero_documento = ?`,
    [numeroDocumento]
  );
  return rows.length > 0 ? (rows[0] as UserRow) : null;
}

export async function findById(id: number): Promise<UserRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
    `SELECT id, rol_id, nombres, apellidos, numero_documento, email,
            telefono, password_hash, estado_biometria, fecha_registro,
            ultimo_login, estado_cuenta
     FROM usuarios
     WHERE id = ?`,
    [id]
  );
  return rows.length > 0 ? (rows[0] as UserRow) : null;
}

export async function create(input: RegisterInput): Promise<number> {
  const pool = getPool();
  const rolId = input.rolId || 1;

  const [result] = await pool.execute<import('mysql2').ResultSetHeader>(
    `INSERT INTO usuarios (rol_id, nombres, apellidos, numero_documento, email, telefono, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      rolId,
      input.nombres,
      input.apellidos,
      input.numeroDocumento,
      input.email,
      input.telefono || null,
      input.password,
    ]
  );
  return result.insertId;
}

export async function updateUltimoLogin(userId: number): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?`,
    [userId]
  );
}

export async function updateEstadoBiometria(
  userId: number,
  estado: string
): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `UPDATE usuarios SET estado_biometria = ? WHERE id = ?`,
    [estado, userId]
  );
}

export async function updatePassword(userId: number, newHash: string): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `UPDATE usuarios SET password_hash = ? WHERE id = ?`,
    [newHash, userId]
  );
}

export async function updateEstadoCuenta(userId: number, activo: boolean): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `UPDATE usuarios SET estado_cuenta = ? WHERE id = ?`,
    [activo, userId]
  );
}
