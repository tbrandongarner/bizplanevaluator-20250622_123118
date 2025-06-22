const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cfg = require('./config/default.json');
const {
  initPostgres,
  initMongo,
  closePostgres,
  closeMongo
} = require('./src/db');
const loggerMiddleware = require('./src/middleware/logger');
const rateLimit = require('./src/middleware/rateLimit');
const authMiddleware = require('./src/middleware/auth');
const healthController = require('./src/controllers/health.controller');

let server;

async function bootstrap() {
  await initPostgres(cfg.postgres);
  await initMongo(cfg.mongo);

  const app = express();

  if (cfg.trustProxy !== undefined) {
    app.set('trust proxy', cfg.trustProxy);
  }

  app.use(helmet());
  if (cfg.cors) {
    app.use(cors(cfg.cors));
  } else {
    app.use(cors());
  }

  app.use(loggerMiddleware);
  app.use(rateLimit);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(authMiddleware.authenticate);

  app.use('/api/auth', require('./src/routes/auth.routes'));
  app.use(
    '/api/ideas',
    authMiddleware.requireAuth,
    require('./src/routes/idea.routes')
  );
  app.use(
    '/api/analysis',
    authMiddleware.requireAuth,
    require('./src/routes/analysis.routes')
  );
  app.use(
    '/api/admin',
    authMiddleware.requireAdmin,
    require('./src/routes/admin.routes')
  );

  app.get('/health', healthController);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    res
      .status(status)
      .json({ error: err.message || 'Internal Server Error' });
  });

  const port = process.env.PORT || cfg.port || 3000;
  server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  const gracefulShutdown = async () => {
    console.log('Shutting down gracefully...');
    if (server) {
      server.close(err => {
        if (err) console.error('Error closing HTTP server', err);
      });
    }
    if (typeof closePostgres === 'function') {
      try {
        await closePostgres();
      } catch (e) {
        console.error('Error closing Postgres connection', e);
      }
    }
    if (typeof closeMongo === 'function') {
      try {
        await closeMongo();
      } catch (e) {
        console.error('Error closing Mongo connection', e);
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  process.on('uncaughtException', err => {
    console.error('Uncaught Exception thrown', err);
    gracefulShutdown();
  });
}

bootstrap().catch(err => {
  console.error('Failed to bootstrap server', err);
  process.exit(1);
});