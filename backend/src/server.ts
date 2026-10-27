import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimit';

// Import feature routers
import authRouter from './modules/auth/routes';
import usersRouter from './modules/users/routes';
import groupsRouter from './modules/groups/routes';
import expensesRouter from './modules/expenses/routes';
import balancesRouter from './modules/balances/routes';
import settlementsRouter from './modules/settlements/routes';
import activityRouter from './modules/activity/routes';

export const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/health' || req.url === '/ready',
      },
    })
  );
}

// Liveness check (process status only)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Readiness check (checks database connectivity)
app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ready',
      database: 'connected',
    });
  } catch (error) {
    logger.error({ error }, 'Readiness check failed: database unreachable');
    res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
    });
  }
});

// Apply rate limiter to /api
app.use('/api', apiRateLimiter);

// Mount API v1 routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/groups', groupsRouter);
app.use('/api/v1/groups/:groupId/expenses', expensesRouter);
app.use('/api/v1/groups/:groupId/balances', balancesRouter);
app.use('/api/v1/groups/:groupId/settlements', settlementsRouter);
app.use('/api/v1/groups/:groupId/activity', activityRouter);
app.use('/api/v1/activity', activityRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

// Global error handler
app.use(errorHandler);

// Start server when run directly
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`🚀 Baantika API server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Closed all connections. Process exiting.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
