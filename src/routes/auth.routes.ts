import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar un nuevo ciudadano
 *     description: Crea una cuenta de ciudadano con biometria pendiente. Retorna tokens JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Registro exitoso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Datos de entrada invalidos
 *       409:
 *         description: Email o documento ya registrado
 */
const registroValidation = [
  body('nombres')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('apellidos')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('numeroDocumento')
    .trim()
    .notEmpty()
    .withMessage('Document number is required')
    .isLength({ min: 5, max: 20 })
    .withMessage('Document number must be between 5 and 20 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('telefono')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must be 20 characters or fewer'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesion
 *     description: Autentica al usuario y retorna tokens JWT de acceso y refresco.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Credenciales invalidas o cuenta deshabilitada
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

router.post('/register', registroValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Obtener perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Token invalido o expirado
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @swagger
 * /auth/biometria/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verificar biometria facial (mock)
 *     description: Simula una verificacion biometrica. Tarda entre 1.5 y 3.5 segundos. El 85% de las veces aprueba.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resultado de la verificacion biometrica
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/BiometriaResponse'
 *       400:
 *         description: Biometria ya verificada o rechazada
 *       401:
 *         description: Token invalido o expirado
 */
router.post('/biometria/verify', authenticate, authController.verifyBiometria);

/**
 * @swagger
 * /auth/biometria/status:
 *   get:
 *     tags: [Auth]
 *     summary: Consultar estado de verificacion biometrica
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado actual de la biometria
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/BiometriaResponse'
 *       401:
 *         description: Token invalido o expirado
 */
router.get('/biometria/status', authenticate, authController.getBiometriaStatus);

export default router;
