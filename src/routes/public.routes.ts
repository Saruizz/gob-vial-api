import { Router } from 'express';
import * as publicController from '../controllers/public.controller';

const router = Router();

/**
 * @swagger
 * /public/reportes:
 *   get:
 *     tags: [Public]
 *     summary: Obtener pines anonimizados para el mapa departamental
 *     description: Endpoint publico sin autenticacion. No expone datos personales.
 *     responses:
 *       200:
 *         description: Lista de pines con coordenadas, color y categoria
 */
router.get('/reportes', publicController.listarPines);

export default router;
