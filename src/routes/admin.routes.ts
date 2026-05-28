import { Router } from 'express';
import { body, query } from 'express-validator';
import * as adminController from '../controllers/admin.controller';
import * as adminUsuariosController from '../controllers/admin-usuarios.controller';
import { validate } from '../middlewares/validate';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(2));

/**
 * @swagger
 * /admin/reportes:
 *   get:
 *     tags: [Admin]
 *     summary: Listar reportes con filtro por estado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estadoId
 *         schema:
 *           type: integer
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
router.get(
  '/reportes',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  adminController.listarReportes
);

/**
 * @swagger
 * /admin/reportes/{id}:
 *   get:
 *     tags: [Admin]
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
 */
router.get('/reportes/:id', adminController.obtenerReporteDetalle);

/**
 * @swagger
 * /admin/reportes/{id}/triage:
 *   post:
 *     tags: [Admin]
 *     summary: Realizar triage (aceptar o rechazar) un reporte
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accion
 *             properties:
 *               accion:
 *                 type: string
 *                 enum: [aceptar, rechazar]
 *               prioridad:
 *                 type: string
 *                 enum: [Baja, Preventiva, Urgente]
 *               motivoRechazo:
 *                 type: string
 *               comentarioTecnico:
 *                 type: string
 *     responses:
 *       200:
 *         description: Triage realizado exitosamente
 */
const triageValidation = [
  body('accion')
    .isIn(['aceptar', 'rechazar'])
    .withMessage('Action must be "aceptar" or "rechazar"'),
  body('prioridad')
    .optional({ values: 'falsy' })
    .isIn(['Baja', 'Preventiva', 'Urgente'])
    .withMessage('Invalid priority'),
  body('motivoRechazo')
    .if(body('accion').equals('rechazar'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting'),
  body('comentarioTecnico')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Technical comment must be under 1000 characters'),
];

router.post(
  '/reportes/:id/triage',
  triageValidation,
  validate,
  adminController.realizarTriage
);

// ============================================
// User Management
// ============================================

router.get(
  '/usuarios',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  adminUsuariosController.listarUsuarios
);

router.get('/usuarios/:id', adminUsuariosController.obtenerUsuario);

const cambiarRolValidation = [
  body('rolId')
    .isInt({ min: 1, max: 2 })
    .withMessage('Role must be 1 (Ciudadano) or 2 (Administrador)'),
];

router.put(
  '/usuarios/:id/rol',
  cambiarRolValidation,
  validate,
  adminUsuariosController.cambiarRol
);

const cambiarEstadoValidation = [
  body('activo')
    .isBoolean()
    .withMessage('Activo must be true or false'),
];

router.put(
  '/usuarios/:id/estado',
  cambiarEstadoValidation,
  validate,
  adminUsuariosController.cambiarEstadoCuenta
);

const cambiarBiometriaValidation = [
  body('estado')
    .isIn(['Pendiente', 'Verificada', 'Rechazada'])
    .withMessage('State must be Pendiente, Verificada, or Rechazada'),
];

router.put(
  '/usuarios/:id/biometria',
  cambiarBiometriaValidation,
  validate,
  adminUsuariosController.cambiarBiometria
);

export default router;
