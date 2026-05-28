import { Router } from 'express';
import authRoutes from './auth.routes';
import reporteRoutes from './reporte.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/reportes', reporteRoutes);

export default router;
