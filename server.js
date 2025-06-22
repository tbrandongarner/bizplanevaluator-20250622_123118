const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const authRoutes = require(path.join(__dirname, 'src', 'routes', 'auth'));
const businessRoutes = require(path.join(__dirname, 'src', 'routes', 'business'));
const marketRoutes = require(path.join(__dirname, 'src', 'routes', 'market'));
const financeRoutes = require(path.join(__dirname, 'src', 'routes', 'finance'));
const generationRoutes = require(path.join(__dirname, 'src', 'routes', 'generation'));
const reportRoutes = require(path.join(__dirname, 'src', 'routes', 'report'));
const billingRoutes = require(path.join(__dirname, 'src', 'routes', 'billing'));

const app = express();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
  ),
  transports: [new winston.transports.Console()]
});

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

if (process.env.SWAGGER_PATH) {
  const swaggerDoc = YAML.load(path.join(__dirname, process.env.SWAGGER_PATH));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
}

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/generation', generationRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/billing', billingRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

process.on('uncaughtException', err => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});

const port = parseInt(process.env.PORT, 10) || 3000;
const server = app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});

const gracefulShutdown = () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;