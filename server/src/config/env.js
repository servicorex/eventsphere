import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env if present
dotenv.config();

const requiredEnvVars = [
  'PGHOST',
  'PGPORT',
  'PGUSER',
  'PGDATABASE',
  'SESSION_SECRET'
];

export function validateEnv() {
  const missing = [];
  if (!process.env.DATABASE_URL) {
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar] || process.env[envVar].trim() === '') {
        missing.push(envVar);
      }
    }
  }

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.trim() === '') {
    if (!missing.includes('SESSION_SECRET')) missing.push('SESSION_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(
      `[Startup Error] Missing required environment variables: ${missing.join(', ')}.\n` +
      `Please check your .env file or refer to .env.example.`
    );
  }

  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 16) {
    throw new Error(
      `[Startup Error] SESSION_SECRET must be at least 16 characters for secure session hashing.`
    );
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET,
  sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE_MS || '86400000', 10), // 24 hours default
  db: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'eventsphere_db',
    ssl: (process.env.PGSSL === 'true' || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')))
      ? { rejectUnauthorized: false }
      : false
  }
};
