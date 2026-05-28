import { Router } from 'express';
import { body } from 'express-validator';
import * as reporteController from '../controllers/reporte.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { upload } from '../config/upload';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /reportes:
 *   post:
 *     tags: [Reportes]
 *     summary: Crear un nuevo reporte de danio vial
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - categoriaId
 *               - municipioId
 *               - nivelPeligro
 *               - latitud
 *               - longitud
 *               - evidencia
 *             properties:
 *               categoriaId:
 *                 type: integer
 *               municipioId:
 *                 type: integer
 *               nivelPeligro:
 *                 type: string
 *                 enum: [Bajo, Medio, Alto, Critico]
 *               latitud:
 *                 type: number
 *               longitud:
 *                 type: number
 *               evidencia:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Reporte creado exitosamente
 *       400:
 *         description: Datos invalidos o foto faltante
 *       401:
 *         description: Token invalido
 */
const crearReporteValidation = [
  body('categoriaId').isInt({ min: 1 }).withMessage('Valid category is required'),
  body('municipioId').isInt({ min: 1 }).withMessage('Valid municipality is required'),
  body('nivelPeligro')
    .isIn(['Bajo', 'Medio', 'Alto', 'Critico'])
    .withMessage('Invalid danger level'),
  body('latitud')
    .isFloat({ min: 8.0, max: 12.0 })
    .withMessage('Invalid latitude for Magdalena region'),
  body('longitud')
    .isFloat({ min: -75.5, max: -73.0 })
    .withMessage('Invalid longitude for Magdalena region'),
];

router.post(
  '/',
  upload.single('evidencia'),
  crearReporteValidation,
  validate,
  reporteController.crearReporte
);

/**
 * @swagger
 * /reportes/mis-reportes:
 *   get:
 *     tags: [Reportes]
 *     summary: Listar reportes del ciudadano autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listado paginado de reportes
 */
router.get('/mis-reportes', reporteController.listarMisReportes);

/**
 * @swagger
 * /reportes/{id}:
 *   get:
 *     tags: [Reportes]
 *     summary: Obtener detalle de un reporte
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del reporte
 *       404:
 *         description: Reporte no encontrado
 */
router.get('/:id', reporteController.obtenerReporte);

export default router;
