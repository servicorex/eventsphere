import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './config/db.js';
import { config, validateEnv } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';
import venueRoutes from './routes/venueRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import advancedRoutes from './routes/advancedRoutes.js';

// Validate configuration
validateEnv();

const app = express();
const PgSessionStore = connectPgSimple(session);

// Trust proxy if in production / behind reverse proxy
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

// Security: Enable CORS with credentials for specific frontend origin
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, automated tests)
    if (!origin) return callback(null, true);
    
    const allowed = [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-EventSphere-Request']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session management with PostgreSQL store
app.use(session({
  store: new PgSessionStore({
    pool,
    tableName: 'session',
    createTableIfMissing: false
  }),
  name: 'eventsphere.sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: config.sessionMaxAge
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ops', advancedRoutes);
app.use('/api', protectedRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production' 
      ? 'An unexpected error occurred on the server.' 
      : (err.message || 'Server Error')
  });
});

export default app;
