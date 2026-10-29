import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/utils/prisma';

describe('Authentication API (/api/auth)', () => {
  const testId = Date.now().toString();
  const testEmail = `auth.test.${testId}@teamflow.test`;
  const testPassword = 'TestPassword123!';
  const testName = 'Automated Test User';

  let authToken = '';
  let authCookie = '';

  beforeAll(async () => {
    // Ensure clean state for auth test suite without affecting any other records
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'auth.test.' } }
    });
  });

  afterAll(async () => {
    // Clean up only test records created by this suite
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'auth.test.' } }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with valid input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: testName,
          email: testEmail,
          password: testPassword,
          jobTitle: 'QA Automation Engineer',
          department: 'Engineering'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.user.name).toBe(testName);
      expect(res.body.data.user.role).toBe('USER');
      expect(res.body.data.token).toBeDefined();

      // Verify passwordHash is never returned
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');

      // Verify HttpOnly cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('teamflow_token=');
      expect(cookies[0].toLowerCase()).toContain('httponly');
    });

    it('should return 400 validation error when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);

      const fields = res.body.error.details.map((d: any) => d.field);
      expect(fields).toContain('name');
      expect(fields).toContain('email');
      expect(fields).toContain('password');
    });

    it('should return 400 validation error for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Password User',
          email: `auth.test.weak.${testId}@teamflow.test`,
          password: 'short' // Less than 8 characters, no numbers
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 conflict when registering with an existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: testEmail, // already registered in first test
          password: testPassword
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should NOT allow self-registration to grant ADMIN privileges', async () => {
      const adminAttemptEmail = `auth.test.admin.${testId}@teamflow.test`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Privilege Escalation Attacker',
          email: adminAttemptEmail,
          password: testPassword,
          role: 'ADMIN' // Client-supplied elevated role
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Hard security rule: self-registration MUST default to USER
      expect(res.body.data.user.role).toBe('USER');
      expect(res.body.data.user.role).not.toBe('ADMIN');

      // Verify in database as well
      const createdUser = await prisma.user.findUnique({
        where: { email: adminAttemptEmail }
      });
      expect(createdUser?.role).toBe('USER');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Save token and cookie for /me tests
      authToken = res.body.data.token;
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      authCookie = cookies[0];
    });

    it('should return 401 unauthorized with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'IncorrectPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid email or password.');
    });

    it('should return 401 unauthorized with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: `nonexistent.${testId}@teamflow.test`,
          password: testPassword
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      // Anti-enumeration: must return identical code and message as wrong password
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid email or password.');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile when authenticated via Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(Array.isArray(res.body.data.user.memberships)).toBe(true);
      expect(Array.isArray(res.body.data.user.ledProjects)).toBe(true);
    });

    it('should return current user profile when authenticated via HttpOnly cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 401 unauthorized when unauthenticated (no token/cookie)', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 unauthorized when provided an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the authentication cookie on logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Logged out successfully.');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      // Verify expired date to clear client cookie
      expect(cookies[0]).toMatch(/teamflow_token=;/);
      expect(cookies[0]).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
    });
  });

  describe('Security invariants', () => {
    it('should never expose password hashes across any auth responses', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hash Exposure Check',
          email: `auth.test.hashcheck.${testId}@teamflow.test`,
          password: testPassword
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: `auth.test.hashcheck.${testId}@teamflow.test`,
          password: testPassword
        });

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`);

      expect(JSON.stringify(registerRes.body)).not.toContain('passwordHash');
      expect(JSON.stringify(loginRes.body)).not.toContain('passwordHash');
      expect(JSON.stringify(meRes.body)).not.toContain('passwordHash');
    });
  });
});
