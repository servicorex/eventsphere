import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

const poolConfig = config.db.connectionString
  ? {
      connectionString: config.db.connectionString,
      ssl: config.db.ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      ssl: config.db.ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error] Unexpected idle client error:', err.message);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('[SQL Executed]', { text, duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
}

export async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() AS current_time, current_database() AS db_name');
    return res.rows[0];
  } finally {
    client.release();
  }
}
