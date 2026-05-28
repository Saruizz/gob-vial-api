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

export async function updateRol(userId: number, rolId: number): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `UPDATE usuarios SET rol_id = ? WHERE id = ?`,
    [rolId, userId]
  );
}

export async function countAdminsActivos(): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM usuarios WHERE rol_id = 2 AND estado_cuenta = TRUE`
  );
  return rows[0].total;
}

export async function findAllAdmin(
  rolId: number | null,
  search: string | null,
  page: number,
  limit: number
): Promise<{ rows: UserRow[]; total: number }> {
  const pool = getPool();
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (rolId !== null) {
    conditions.push('u.rol_id = ?');
    params.push(rolId);
  }

  if (search && search.trim()) {
    conditions.push(
      '(u.nombres LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ? OR u.numero_documento LIKE ?)'
    );
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countResult] = await pool.execute<import('mysql2').RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM usuarios u ${whereClause}`,
    params
  );

  const [rows] = await pool.query<import('mysql2').RowDataPacket[]>(
    `SELECT u.id, u.rol_id, u.nombres, u.apellidos, u.numero_documento, u.email,
            u.telefono, u.password_hash, u.estado_biometria, u.fecha_registro,
            u.ultimo_login, u.estado_cuenta,
            r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     ${whereClause}
     ORDER BY u.fecha_registro DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    rows: rows.map((r) => r as unknown as UserRow),
    total: countResult[0].total,
  };
}
