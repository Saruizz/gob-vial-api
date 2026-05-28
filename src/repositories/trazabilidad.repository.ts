import { getPool } from '../config/database';

export async function registrarCambio(
  reporteId: number,
  estadoAnteriorId: number,
  estadoNuevoId: number,
  usuarioAccionId: number,
  comentarioTecnico: string
): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO trazabilidad_reportes
     (reporte_id, estado_anterior_id, estado_nuevo_id, usuario_accion_id, comentario_tecnico)
     VALUES (?, ?, ?, ?, ?)`,
    [reporteId, estadoAnteriorId, estadoNuevoId, usuarioAccionId, comentarioTecnico]
  );
}
