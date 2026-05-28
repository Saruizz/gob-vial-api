import { getPool } from '../config/database';
import { ResultSetHeader } from 'mysql2';

export interface CreateReporteInput {
  ciudadanoId: number;
  categoriaId: number;
  municipioId: number;
  nivelPeligro: string;
  latitud: number;
  longitud: number;
  evidenciaFotoUrl: string;
}

export interface ReporteRow {
  id: number;
  ciudadano_id: number;
  admin_id: number | null;
  categoria_id: number;
  estado_id: number;
  municipio_id: number;
  nivel_peligro: string;
  prioridad_asignada: string | null;
  latitud: number;
  longitud: number;
  evidencia_foto_url: string;
  motivo_rechazo: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export async function create(input: CreateReporteInput): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO reportes (ciudadano_id, categoria_id, estado_id, municipio_id,
       nivel_peligro, latitud, longitud, evidencia_foto_url)
     VALUES (?, ?, 1, ?, ?, ?, ?, ?)`,
    [
      input.ciudadanoId,
      input.categoriaId,
      input.municipioId,
      input.nivelPeligro,
      input.latitud,
      input.longitud,
      input.evidenciaFotoUrl,
    ]
  );
  return result.insertId;
}

export async function findById(id: number, ciudadanoId: number): Promise<ReporteRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
    `SELECT * FROM reportes WHERE id = ? AND ciudadano_id = ?`,
    [id, ciudadanoId]
  );
  return rows.length > 0 ? (rows[0] as ReporteRow) : null;
}

export async function findByCiudadano(
  ciudadanoId: number,
  page: number,
  limit: number
): Promise<{ rows: ReporteRow[]; total: number }> {
  const pool = getPool();
  const offset = (page - 1) * limit;

  const [countResult] = await pool.execute<import('mysql2').RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM reportes WHERE ciudadano_id = ?`,
    [ciudadanoId]
  );

  const [rows] = await pool.query<import('mysql2').RowDataPacket[]>(
    `SELECT r.*, e.nombre AS estado_nombre, e.color_hex AS estado_color,
            c.nombre AS categoria_nombre, m.nombre AS municipio_nombre
     FROM reportes r
     JOIN estados_reporte e ON r.estado_id = e.id
     JOIN categorias_danio c ON r.categoria_id = c.id
     JOIN municipios_magdalena m ON r.municipio_id = m.id
     WHERE r.ciudadano_id = ?
     ORDER BY r.fecha_creacion DESC
     LIMIT ? OFFSET ?`,
    [ciudadanoId, limit, offset]
  );

  return {
    rows: rows.map((r) => r as ReporteRow),
    total: countResult[0].total,
  };
}

export async function findAll(
  estadoId: number | null,
  page: number,
  limit: number
): Promise<{ rows: ReporteRow[]; total: number }> {
  const pool = getPool();
  const offset = (page - 1) * limit;

  const countParams: number[] = [];
  const listParams: number[] = [];

  if (estadoId !== null) {
    countParams.push(estadoId);
    listParams.push(estadoId);
  }

  const whereClause = estadoId !== null ? 'WHERE r.estado_id = ?' : '';

  const [countResult] = await pool.execute<import('mysql2').RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM reportes r ${whereClause}`,
    countParams
  );

  listParams.push(limit, offset);

  const [rows] = await pool.query<import('mysql2').RowDataPacket[]>(
    `SELECT r.*, e.nombre AS estado_nombre, e.color_hex AS estado_color,
            c.nombre AS categoria_nombre, m.nombre AS municipio_nombre,
            CONCAT(u.nombres, ' ', u.apellidos) AS ciudadano_nombre
     FROM reportes r
     JOIN estados_reporte e ON r.estado_id = e.id
     JOIN categorias_danio c ON r.categoria_id = c.id
     JOIN municipios_magdalena m ON r.municipio_id = m.id
     JOIN usuarios u ON r.ciudadano_id = u.id
     ${whereClause}
     ORDER BY r.fecha_creacion DESC
     LIMIT ? OFFSET ?`,
    listParams
  );

  return {
    rows: rows.map((r) => r as ReporteRow),
    total: countResult[0].total,
  };
}

export async function getById(id: number): Promise<ReporteRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
    `SELECT r.*, e.nombre AS estado_nombre, e.color_hex AS estado_color,
            c.nombre AS categoria_nombre, m.nombre AS municipio_nombre,
            CONCAT(u.nombres, ' ', u.apellidos) AS ciudadano_nombre
     FROM reportes r
     JOIN estados_reporte e ON r.estado_id = e.id
     JOIN categorias_danio c ON r.categoria_id = c.id
     JOIN municipios_magdalena m ON r.municipio_id = m.id
     JOIN usuarios u ON r.ciudadano_id = u.id
     WHERE r.id = ?`,
    [id]
  );
  return rows.length > 0 ? (rows[0] as ReporteRow) : null;
}

export async function updateEstado(
  id: number,
  estadoId: number,
  adminId: number,
  prioridadAsignada: string | null,
  motivoRechazo: string | null
): Promise<void> {
  const pool = getPool();
  let query: string;
  const params: (number | string | null)[] = [];

  if (motivoRechazo !== null) {
    query = `UPDATE reportes
             SET estado_id = ?, admin_id = ?, prioridad_asignada = NULL, motivo_rechazo = ?
             WHERE id = ?`;
    params.push(estadoId, adminId, motivoRechazo, id);
  } else {
    query = `UPDATE reportes
             SET estado_id = ?, admin_id = ?, prioridad_asignada = ?, motivo_rechazo = NULL
             WHERE id = ?`;
    params.push(estadoId, adminId, prioridadAsignada, id);
  }

  await pool.execute(query, params);
}
