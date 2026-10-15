import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { pool } from '../src/config/db.js';
import { seedAdmin } from '../src/scripts/seedAdmin.js';

describe('EventSphere Authentication & Login Test Suite', () => {
  const adminEmail = 'test_admin@eventsphere.com';
  const organizerEmail = 'test_organizer@eventsphere.com';
  const disabledEmail = 'test_disabled@eventsphere.com';
  const defaultPassword = 'TestPassword123!';

  beforeAll(async () => {
    // Clean up any previous test data
    await pool.query('DELETE FROM users WHERE email LIKE \'test_%@eventsphere.com\'');

    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Seed test users: Admin, Organizer, Disabled Attendee
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES 
       ($1, $2, $3, 'ADMIN', true),
       ($4, $5, $6, 'ORGANIZER', true),
       ($7, $8, $9, 'ATTENDEE', false)`,
      [
        'Test Admin', adminEmail, passwordHash,
        'Test Organizer', organizerEmail, passwordHash,
        'Test Disabled', disabledEmail, passwordHash
      ]
    );
  });

  afterAll(async () => {
    // Clean up test users and close database pool
    await pool.query('DELETE FROM users WHERE email LIKE \'test_%@eventsphere.com\'');
    await pool.end();
  });

  // 1. Successful login
  test('1. Successful login returns 200, user data, and HTTP-only session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: defaultPassword,
        rememberMe: true
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(adminEmail);
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.body.user.password_hash).toBeUndefined();

    // Verify session cookie was set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.includes('eventsphere.sid'))).toBe(true);
    expect(cookies.some(c => c.includes('HttpOnly'))).toBe(true);
  });

  // 2. Incorrect password
  test('2. Incorrect password returns generic 401 invalid credentials error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
    expect(res.body.user).toBeUndefined();
  });

  // 3. Unknown email
  test('3. Unknown email returns generic 401 invalid credentials error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unknown_person_999@eventsphere.com',
        password: defaultPassword
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
    expect(res.body.user).toBeUndefined();
  });

  // 4. Missing fields
  test('4. Missing email or password returns 400 validation error', async () => {
    const resMissingEmail = await request(app)
      .post('/api/auth/login')
      .send({
        password: defaultPassword
      });

    expect(resMissingEmail.status).toBe(400);
    expect(resMissingEmail.body.success).toBe(false);
    expect(resMissingEmail.body.errors).toBeDefined();
    expect(resMissingEmail.body.errors.email).toBeDefined();

    const resMissingPassword = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail
      });

    expect(resMissingPassword.status).toBe(400);
    expect(resMissingPassword.body.success).toBe(false);
    expect(resMissingPassword.body.errors).toBeDefined();
    expect(resMissingPassword.body.errors.password).toBeDefined();
  });

  // 5. Disabled accounts
  test('5. Deactivated/disabled accounts return 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: disabledEmail,
        password: defaultPassword
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  // 6. Unauthenticated access to /api/auth/me
  test('6. Unauthenticated access to /api/auth/me returns 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/authentication required/i);
  });

  // 7. Authenticated session retrieval
  test('7. Authenticated session retrieval with cookie returns current user profile', async () => {
    const agent = request.agent(app);

    // Login first to establish cookie in agent
    const loginRes = await agent
      .post('/api/auth/login')
      .send({
        email: organizerEmail,
        password: defaultPassword
      });

    expect(loginRes.status).toBe(200);

    // Now request /api/auth/me with session
    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user).toBeDefined();
    expect(meRes.body.user.email).toBe(organizerEmail);
    expect(meRes.body.user.role).toBe('ORGANIZER');
  });

  // 8. Logout and session invalidation
  test('8. Logout invalidates session and subsequent /api/auth/me returns 401', async () => {
    const agent = request.agent(app);

    // Login
    await agent
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: defaultPassword
      });

    // Logout
    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Invalidate check
    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(401);
    expect(meRes.body.success).toBe(false);
  });

  // 9. Unauthorized role access
  test('9. Unauthorized role access to protected endpoints returns 403 Forbidden', async () => {
    const agent = request.agent(app);

    // Login as ORGANIZER
    await agent
      .post('/api/auth/login')
      .send({
        email: organizerEmail,
        password: defaultPassword
      });

    // Attempt to access Admin-only route
    const adminRouteRes = await agent.get('/api/admin/overview');
    expect(adminRouteRes.status).toBe(403);
    expect(adminRouteRes.body.success).toBe(false);
    expect(adminRouteRes.body.message).toMatch(/forbidden/i);

    // Allowed Organizer route succeeds
    const organizerRouteRes = await agent.get('/api/organizer/overview');
    expect(organizerRouteRes.status).toBe(200);
    expect(organizerRouteRes.body.success).toBe(true);
  });

  // 10. Duplicate email prevention during administrator provisioning
  test('10. Duplicate email prevention during administrator provisioning maintains integrity', async () => {
    // Set environment for test admin seed
    process.env.ADMIN_NAME = 'Provision Test Admin';
    process.env.ADMIN_EMAIL = 'test_provision_admin@eventsphere.com';
    process.env.ADMIN_PASSWORD = 'StrongAdminPass123!';

    // First provisioning
    const firstAdmin = await seedAdmin();
    expect(firstAdmin).toBeDefined();
    expect(firstAdmin.email).toBe('test_provision_admin@eventsphere.com');

    // Second provisioning with identical email
    const duplicateAttempt = await seedAdmin();
    expect(duplicateAttempt).toBeDefined();
    expect(duplicateAttempt.id).toBe(firstAdmin.id);

    // Verify count in database is exactly 1
    const countRes = await pool.query(
      'SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER($1)',
      ['test_provision_admin@eventsphere.com']
    );
    expect(parseInt(countRes.rows[0].count, 10)).toBe(1);

    // Clean up provision test user
    await pool.query('DELETE FROM users WHERE email = $1', ['test_provision_admin@eventsphere.com']);
  });
});
