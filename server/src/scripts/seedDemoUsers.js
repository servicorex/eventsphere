import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { validateEnv } from '../config/env.js';

export async function seedDemoUsers() {
  validateEnv();

  const users = [
    { name: 'Sarah Jenkins', email: 'organizer@eventsphere.com', password: 'OrganizerPass!2026', role: 'ORGANIZER', active: true },
    { name: 'Apex Audio Visuals', email: 'vendor@eventsphere.com', password: 'VendorPass!2026', role: 'VENDOR', active: true },
    { name: 'Alex Rivera', email: 'attendee@eventsphere.com', password: 'AttendeePass!2026', role: 'ATTENDEE', active: true },
    { name: 'Deactivated Member', email: 'disabled@eventsphere.com', password: 'DisabledPass!2026', role: 'ATTENDEE', active: false },
  ];

  console.log('[Seed] Seeding demo role accounts...');
  for (const u of users) {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [u.email]);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(u.password, 10);
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)',
        [u.name, u.email, hash, u.role, u.active]
      );
      console.log(`  Created ${u.role}: ${u.email}`);
    } else {
      console.log(`  User ${u.email} already exists.`);
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('seedDemoUsers.js')) {
  seedDemoUsers()
    .then(() => {
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Error]:', err);
      pool.end();
      process.exit(1);
    });
}
