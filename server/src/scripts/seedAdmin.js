import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { validateEnv } from '../config/env.js';

export async function seedAdmin() {
  validateEnv();

  const name = (process.env.ADMIN_NAME || 'EventSphere Administrator').trim();
  const rawEmail = process.env.ADMIN_EMAIL;
  const rawPassword = process.env.ADMIN_PASSWORD;

  if (!rawEmail || !rawPassword) {
    throw new Error(
      '[Provisioning Error] ADMIN_EMAIL and ADMIN_PASSWORD must be set in your environment or .env file.'
    );
  }

  const email = rawEmail.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('[Provisioning Error] ADMIN_EMAIL format is invalid.');
  }

  if (rawPassword.length < 8) {
    throw new Error('[Provisioning Error] ADMIN_PASSWORD must be at least 8 characters long.');
  }

  // Check if user already exists
  const checkResult = await pool.query(
    'SELECT id, name, email, role, is_active FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (checkResult.rows.length > 0) {
    const existing = checkResult.rows[0];
    console.log(`[Provisioning Notice] User with email "${existing.email}" already exists (Role: ${existing.role}, ID: ${existing.id}).`);
    return existing;
  }

  // Hash password using bcrypt
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

  const insertResult = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'ADMIN', true)
     RETURNING id, name, email, role, is_active, created_at`,
    [name, email, passwordHash]
  );

  const newAdmin = insertResult.rows[0];
  console.log('[Provisioning Success] Initial administrator account created safely:');
  console.log(`  ID: ${newAdmin.id}`);
  console.log(`  Name: ${newAdmin.name}`);
  console.log(`  Email: ${newAdmin.email}`);
  console.log(`  Role: ${newAdmin.role}`);
  console.log(`  Active: ${newAdmin.is_active}`);
  // Note: Password is NEVER printed or logged!

  return newAdmin;
}

if (process.argv[1] && process.argv[1].endsWith('seedAdmin.js')) {
  seedAdmin()
    .then(() => {
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Provisioning Failed]:', err.message);
      pool.end();
      process.exit(1);
    });
}
