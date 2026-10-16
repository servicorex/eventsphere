import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { pool } from '../src/config/db.js';

describe('EventSphere Milestone 1: Event, Venue, Resource & Conflict Engine', () => {
  let agent;
  let organizerUser;
  let testVenueId;
  let testResourceId;
  let testEventId;

  const organizerEmail = 'm1_organizer@eventsphere.com';
  const organizerPassword = 'OrgPassword123!';

  beforeAll(async () => {
    // Clean up any residual test records from prior runs
    await pool.query('DELETE FROM events WHERE title LIKE \'TechFest%\' OR title LIKE \'Grand%\' OR title LIKE \'AI Conf%\'');
    await pool.query('DELETE FROM venues WHERE venue_code = \'TEST_V01\'');
    await pool.query('DELETE FROM resources WHERE resource_code = \'TEST_R01\'');
    await pool.query('DELETE FROM users WHERE email = $1', [organizerEmail]);
    const hash = await bcrypt.hash(organizerPassword, 10);
    const userRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ('M1 Organizer', $1, $2, 'ORGANIZER', true)
       RETURNING id, name, email, role`,
      [organizerEmail, hash]
    );
    organizerUser = userRes.rows[0];

    // Establish authenticated agent session
    agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: organizerEmail, password: organizerPassword });
    expect(loginRes.status).toBe(200);
  });

  afterAll(async () => {
    // Cleanup created test records
    if (testEventId) {
      await pool.query('DELETE FROM events WHERE id = $1', [testEventId]);
    }
    if (testVenueId) {
      await pool.query('DELETE FROM venues WHERE id = $1', [testVenueId]);
    }
    if (testResourceId) {
      await pool.query('DELETE FROM resources WHERE id = $1', [testResourceId]);
    }
    await pool.query('DELETE FROM users WHERE email = $1', [organizerEmail]);
    await pool.end();
  });

  // --- 1. VENUE CRUD ---
  test('1. Venue CRUD - Create, Read, Update, Delete', async () => {
    // Create Venue
    const createRes = await agent
      .post('/api/venues')
      .send({
        venue_code: 'TEST_V01',
        name: 'Grand Conference Hall',
        location: 'Building C, Floor 2',
        capacity: 500,
        availability: 'Available',
        cost_per_day: 35000.00
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.venue).toBeDefined();
    expect(createRes.body.venue.capacity).toBe(500);
    testVenueId = createRes.body.venue.id;

    // Get Venues
    const listRes = await agent.get('/api/venues');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.venues)).toBe(true);
    expect(listRes.body.venues.some(v => v.id === testVenueId)).toBe(true);

    // Update Venue
    const updateRes = await agent
      .put(`/api/venues/${testVenueId}`)
      .send({ capacity: 600 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.venue.capacity).toBe(600);
  });

  // --- 2. RESOURCE CRUD ---
  test('2. Resource CRUD - Create, Read, Update', async () => {
    const createRes = await agent
      .post('/api/resources')
      .send({
        resource_code: 'TEST_R01',
        name: 'Wireless Projector Unit',
        type: 'Equipment',
        quantity: 15
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.resource.quantity).toBe(15);
    expect(createRes.body.resource.available_quantity).toBe(15);
    expect(createRes.body.resource.status).toBe('Available');
    testResourceId = createRes.body.resource.id;

    const listRes = await agent.get('/api/resources');
    expect(listRes.status).toBe(200);
    expect(listRes.body.resources.some(r => r.id === testResourceId)).toBe(true);
  });

  // --- 3. ATTENDEE CAPACITY VALIDATION ---
  test('3. Capacity Validation - Rejects event creation when expected attendees exceed venue capacity', async () => {
    // Venue capacity is 600. Try creating event with 750 attendees.
    const res = await agent
      .post('/api/events')
      .send({
        title: 'Mega Tech Summit',
        event_type: 'Conference',
        date: '2026-12-10',
        start_time: '09:00:00',
        end_time: '12:00:00',
        budget: 50000,
        expected_attendees: 750, // Exceeds 600
        venue_id: testVenueId
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/sufficient capacity/i);
  });

  // --- 4. EVENT CREATION & RESOURCE ALLOCATION ---
  test('4. Event Creation - Creates event within capacity and allocates resources', async () => {
    const res = await agent
      .post('/api/events')
      .send({
        title: 'Morning AI Workshop',
        event_type: 'Workshop',
        date: '2026-12-10',
        start_time: '09:00:00',
        end_time: '12:00:00',
        budget: 25000,
        expected_attendees: 300, // Within 600 capacity
        venue_id: testVenueId,
        resources: [
          { resourceId: testResourceId, quantity: 5 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    testEventId = res.body.event.id;

    // Verify resource available_quantity was reduced by 5 (15 -> 10)
    const resourceRes = await agent.get(`/api/resources/${testResourceId}`);
    expect(resourceRes.status).toBe(200);
    expect(resourceRes.body.resource.available_quantity).toBe(10);
  });

  // --- 5. VENUE CONFLICT DETECTION ---
  test('5. Conflict Detection - Rejects booking for same venue during overlapping time', async () => {
    // Event 1 is 09:00 - 12:00 on 2026-12-10 at testVenueId.
    // Attempt Event 2 from 11:00 to 14:00 (overlaps by 1 hour)
    const conflictRes = await agent
      .post('/api/events')
      .send({
        title: 'Overlapping Seminar',
        event_type: 'Seminar',
        date: '2026-12-10',
        start_time: '11:00:00',
        end_time: '14:00:00',
        budget: 15000,
        expected_attendees: 100,
        venue_id: testVenueId
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.success).toBe(false);
    expect(conflictRes.body.message).toMatch(/Venue Conflict/i);

    // Booking for next day (2026-12-11) at same venue should succeed!
    const validNextDayRes = await agent
      .post('/api/events')
      .send({
        title: 'Next Day Seminar',
        event_type: 'Seminar',
        date: '2026-12-11',
        start_time: '09:00:00',
        end_time: '12:00:00',
        budget: 15000,
        expected_attendees: 100,
        venue_id: testVenueId
      });

    expect(validNextDayRes.status).toBe(201);
    // Cleanup second event
    await pool.query('DELETE FROM events WHERE id = $1', [validNextDayRes.body.event.id]);
  });

  // --- 6. RESOURCE RELEASE ON EVENT DELETION ---
  test('6. Resource Release - Automatically restores inventory when event is deleted', async () => {
    // Current available quantity is 10. Deleting testEventId (which had 5 allocated) should restore to 15.
    const delRes = await agent.delete(`/api/events/${testEventId}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const resourceCheck = await agent.get(`/api/resources/${testResourceId}`);
    expect(resourceCheck.status).toBe(200);
    expect(resourceCheck.body.resource.available_quantity).toBe(15);
    testEventId = null; // Mark as deleted
  });

  // --- 7. DASHBOARD ANALYTICS ---
  test('7. Dashboard Stats - Computes real-time analytics from PostgreSQL', async () => {
    const statsRes = await agent.get('/api/dashboard/stats');
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.stats).toBeDefined();
    expect(typeof statsRes.body.stats.totalEvents).toBe('number');
    expect(typeof statsRes.body.stats.upcomingEvents).toBe('number');
    expect(typeof statsRes.body.stats.availableVenues).toBe('number');
    expect(typeof statsRes.body.stats.totalResources).toBe('number');
    expect(Array.isArray(statsRes.body.stats.recentEvents)).toBe(true);
  });
});
