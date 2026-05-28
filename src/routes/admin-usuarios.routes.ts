import { Router } from 'express';
import { body, query } from 'express-validator';
import * as adminUsuariosController from '../controllers/admin-usuarios.controller';
import { validate } from '../middlewares/validate';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(2));

/**
 * @swagger
 * /admin/usuarios:
 *   get:
 *     tags: [Admin-Usuarios]
 *     summary: Listar usuarios con filtros y paginacion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rolId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *         description: Listado paginado de usuarios
 */
router.get(
  '/usuarios',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  adminUsuariosController.listarUsuarios
);

router.get('/usuarios/:id', adminUsuariosController.obtenerUsuario);

/**
 * @swagger
 * /admin/usuarios/{id}/rol:
 *   put:
 *     tags: [Admin-Usuarios]
 *     summary: Cambiar rol de un usuario
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
 *               - rolId
 *             properties:
 *               rolId:
 *                 type: integer
 *                 enum: [1, 2]
 *     responses:
 *       200:
 *         description: Rol actualizado
 */
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

/**
 * @swagger
 * /admin/usuarios/{id}/estado:
 *   put:
 *     tags: [Admin-Usuarios]
 *     summary: Activar o desactivar cuenta de usuario
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
 *               - activo
 *             properties:
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado de cuenta actualizado
 */
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

/**
 * @swagger
 * /admin/usuarios/{id}/biometria:
 *   put:
 *     tags: [Admin-Usuarios]
 *     summary: Cambiar estado de biometria de un usuario
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
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [Pendiente, Verificada, Rechazada]
 *     responses:
 *       200:
 *         description: Estado de biometria actualizado
 */
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
