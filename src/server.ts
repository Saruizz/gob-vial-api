import express from 'express';
import cors from 'cors';
import path from 'path';
import env from './config/env';
import logger from './config/logger';
import { testConnection } from './config/database';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(express.static(path.resolve(__dirname, '..', 'public')));

app.use((req, _res, next) => {
  logger.debug({
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

app.get('/health', async (_req, res) => {
  const dbConnected = await testConnection();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

app.use(env.API_PREFIX, routes);

app.use(errorHandler);

app.listen(env.PORT, env.HOST, () => {
  logger.info({
    action: 'server_start',
    environment: env.NODE_ENV,
    port: env.PORT,
    host: env.HOST,
    apiPrefix: env.API_PREFIX,
  });
  console.log(`GoberVial API running on http://${env.HOST}:${env.PORT}${env.API_PREFIX}`);
});

export default app;
