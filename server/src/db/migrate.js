import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testConnection } from '../config/db.js';
import { validateEnv } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  validateEnv();
  console.log('[Migration] Verifying database connection...');
  const info = await testConnection();
  console.log(`[Migration] Connected to database: ${info.db_name} at ${info.current_time}`);

  // Create migrations tracking table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const existing = await pool.query(
      'SELECT id FROM schema_migrations WHERE migration_name = $1',
      [file]
    );

    if (existing.rows.length === 0) {
      console.log(`[Migration] Applying ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[Migration] Successfully applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migration Error] Failed to apply ${file}:`, err);
        throw err;
      } finally {
        client.release();
      }
    } else {
      console.log(`[Migration] ${file} is already applied. Skipping.`);
    }
  }

  console.log('[Migration] All migrations completed successfully.');
}

// Allow direct execution: `node src/db/migrate.js`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('[Migration] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration Fatal Error]:', err.message);
      process.exit(1);
    });
}
