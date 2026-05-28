import { Router } from 'express';
import authRoutes from './auth.routes';
import reporteRoutes from './reporte.routes';
import adminRoutes from './admin.routes';
import publicRoutes from './public.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/reportes', reporteRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);

export default router;
