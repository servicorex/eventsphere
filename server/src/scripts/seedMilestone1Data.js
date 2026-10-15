import { pool } from '../config/db.js';
import { validateEnv } from '../config/env.js';

export async function seedMilestone1Data() {
  validateEnv();
  console.log('[Seed] Seeding Milestone 1 venues, resources, and demo data...');

  // 1. Seed Venues
  const venues = [
    { code: 'V001', name: 'Main Auditorium', location: 'Chennai Campus', capacity: 1500, availability: 'Available', cost: 75000.00 },
    { code: 'V002', name: 'Seminar Hall A', location: 'Science Block, Chennai', capacity: 200, availability: 'Available', cost: 20000.00 },
    { code: 'V003', name: 'Convention Hall', location: 'Tech Park, Chennai', capacity: 800, availability: 'Booked', cost: 60000.00 },
    { code: 'V004', name: 'Open Air Amphitheatre', location: 'North Grounds, Chennai', capacity: 2500, availability: 'Available', cost: 90000.00 }
  ];

  for (const v of venues) {
    const existing = await pool.query('SELECT id FROM venues WHERE venue_code = $1', [v.code]);
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO venues (venue_code, name, location, capacity, availability, cost_per_day) VALUES ($1, $2, $3, $4, $5, $6)',
        [v.code, v.name, v.location, v.capacity, v.availability, v.cost]
      );
      console.log(`  Created Venue: ${v.code} - ${v.name}`);
    }
  }

  // 2. Seed Resources
  const resources = [
    { code: 'R001', name: 'HD Projector 4K', type: 'Equipment', qty: 10, avail: 10, status: 'Available' },
    { code: 'R002', name: 'Wireless Microphone Set', type: 'Equipment', qty: 20, avail: 20, status: 'Available' },
    { code: 'R003', name: 'Campus Security Staff', type: 'Staff', qty: 30, avail: 30, status: 'Available' },
    { code: 'R004', name: 'Shuttle Bus', type: 'Transport', qty: 5, avail: 5, status: 'Available' },
    { code: 'R005', name: 'PA Sound System', type: 'Equipment', qty: 8, avail: 8, status: 'Available' }
  ];

  for (const r of resources) {
    const existing = await pool.query('SELECT id FROM resources WHERE resource_code = $1', [r.code]);
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO resources (resource_code, name, type, quantity, available_quantity, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [r.code, r.name, r.type, r.qty, r.avail, r.status]
      );
      console.log(`  Created Resource: ${r.code} - ${r.name}`);
    }
  }

  // 3. Seed an initial event if none exists
  const eventsCount = await pool.query('SELECT COUNT(*) FROM events');
  if (parseInt(eventsCount.rows[0].count, 10) === 0) {
    const venueRes = await pool.query('SELECT id FROM venues WHERE venue_code = $1', ['V001']);
    const organizerRes = await pool.query('SELECT id FROM users WHERE email = $1', ['organizer@eventsphere.com']);

    if (venueRes.rows.length > 0 && organizerRes.rows.length > 0) {
      const vId = venueRes.rows[0].id;
      const oId = organizerRes.rows[0].id;

      const eventRes = await pool.query(
        `INSERT INTO events (title, event_type, date, start_time, end_time, budget, expected_attendees, venue_id, organizer_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Scheduled')
         RETURNING id`,
        ['TechFest 2026', 'Technical Festival', '2026-11-15', '10:00:00', '13:00:00', 150000.00, 1200, vId, oId]
      );

      const eventId = eventRes.rows[0].id;

      // Allocate sample resources for TechFest 2026 as per presentation
      const rProjector = await pool.query('SELECT id, available_quantity FROM resources WHERE resource_code = $1', ['R001']);
      const rMic = await pool.query('SELECT id, available_quantity FROM resources WHERE resource_code = $1', ['R002']);

      if (rProjector.rows.length > 0) {
        await pool.query('INSERT INTO event_resources (event_id, resource_id, quantity) VALUES ($1, $2, 5)', [eventId, rProjector.rows[0].id]);
        await pool.query('UPDATE resources SET available_quantity = available_quantity - 5 WHERE id = $1', [rProjector.rows[0].id]);
      }
      if (rMic.rows.length > 0) {
        await pool.query('INSERT INTO event_resources (event_id, resource_id, quantity) VALUES ($1, $2, 10)', [eventId, rMic.rows[0].id]);
        await pool.query('UPDATE resources SET available_quantity = available_quantity - 10 WHERE id = $1', [rMic.rows[0].id]);
      }

      console.log('  Created initial event: TechFest 2026 with allocated resources.');
    }
  }

  console.log('[Seed] Milestone 1 seed data complete.');
}

if (process.argv[1] && process.argv[1].endsWith('seedMilestone1Data.js')) {
  seedMilestone1Data()
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
