import * as reporteRepo from '../repositories/reporte.repository';
import * as trazabilidadRepo from '../repositories/trazabilidad.repository';
import { BadRequestError, NotFoundError } from '../utils/httpError';
import logger from '../config/logger';

export async function crearReporte(input: {
  ciudadanoId: number;
  categoriaId: number;
  municipioId: number;
  nivelPeligro: string;
  latitud: number;
  longitud: number;
  evidenciaFotoUrl: string;
}) {
  if (!validateCoordenadas(input.latitud, input.longitud)) {
    throw new BadRequestError('Invalid coordinates for Magdalena region');
  }

  const nivelesValidos = ['Bajo', 'Medio', 'Alto', 'Critico'];
  if (!nivelesValidos.includes(input.nivelPeligro)) {
    throw new BadRequestError('Invalid danger level');
  }

  const reporteId = await reporteRepo.create({
    ciudadanoId: input.ciudadanoId,
    categoriaId: input.categoriaId,
    municipioId: input.municipioId,
    nivelPeligro: input.nivelPeligro,
    latitud: input.latitud,
    longitud: input.longitud,
    evidenciaFotoUrl: input.evidenciaFotoUrl,
  });

  await trazabilidadRepo.registrarCambio(
    reporteId,
    1,
    1,
    input.ciudadanoId,
    'Reporte creado por ciudadano. Estado inicial: Pendiente'
  );

  const reporte = await reporteRepo.getById(reporteId);

  logger.info({
    action: 'reporte_creado',
    reporteId,
    ciudadanoId: input.ciudadanoId,
    categoriaId: input.categoriaId,
    municipioId: input.municipioId,
  });

  return reporte;
}

export async function listarReportesCiudadano(
  ciudadanoId: number,
  page: number,
  limit: number
) {
  return reporteRepo.findByCiudadano(ciudadanoId, page, limit);
}

export async function listarReportesAdmin(
  estadoId: number | null,
  page: number,
  limit: number
) {
  return reporteRepo.findAll(estadoId, page, limit);
}

export async function obtenerReporte(reporteId: number, ciudadanoId: number) {
  const reporte = await reporteRepo.findById(reporteId, ciudadanoId);
  if (!reporte) {
    throw new NotFoundError('Report not found');
  }
  return reporte;
}

export async function obtenerReporteAdmin(reporteId: number) {
  const reporte = await reporteRepo.getById(reporteId);
  if (!reporte) {
    throw new NotFoundError('Report not found');
  }
  return reporte;
}

export async function cambiarEstado(
  reporteId: number,
  nuevoEstadoId: number,
  adminId: number,
  prioridadAsignada: string | null,
  motivoRechazo: string | null,
  comentarioTecnico: string
) {
  const reporte = await reporteRepo.getById(reporteId);
  if (!reporte) {
    throw new NotFoundError('Report not found');
  }

  if (motivoRechazo && (!motivoRechazo.trim())) {
    throw new BadRequestError('Rejection reason is required');
  }

  if (prioridadAsignada) {
    const prioridadesValidas = ['Baja', 'Preventiva', 'Urgente'];
    if (!prioridadesValidas.includes(prioridadAsignada)) {
      throw new BadRequestError('Invalid priority level');
    }
  }

  const estadoAnteriorId = reporte.estado_id;

  await reporteRepo.updateEstado(
    reporteId,
    nuevoEstadoId,
    adminId,
    prioridadAsignada,
    motivoRechazo?.trim() || null
  );

  await trazabilidadRepo.registrarCambio(
    reporteId,
    estadoAnteriorId,
    nuevoEstadoId,
    adminId,
    comentarioTecnico
  );

  logger.info({
    action: 'estado_cambiado',
    reporteId,
    estadoAnteriorId,
    estadoNuevoId: nuevoEstadoId,
    adminId,
  });

  return reporteRepo.getById(reporteId);
}

function validateCoordenadas(lat: number, lng: number): boolean {
  const MAGDALENA_LAT_MIN = 8.5;
  const MAGDALENA_LAT_MAX = 11.5;
  const MAGDALENA_LNG_MIN = -75.0;
  const MAGDALENA_LNG_MAX = -73.5;

  return (
    lat >= MAGDALENA_LAT_MIN &&
    lat <= MAGDALENA_LAT_MAX &&
    lng >= MAGDALENA_LNG_MIN &&
    lng <= MAGDALENA_LNG_MAX
  );
}
