import { app, pool } from './server.ts';
import request from 'supertest';
import { expect } from '@jest/globals';

// Test client for database transactions
let testClient;

beforeAll(async () => {
  testClient = await pool.connect();
});

afterEach(async () => {
  await testClient.query('ROLLBACK');
});

afterAll(async () => {
  await testClient.release();
});

describe('Authentication', () => {
  it('should create a new user successfully', async () => {
    const response = await request(app)
     .post('/auth/signup')
     .send({
        email: 'test@example.com',
        password_hash: 'password123',
        name: 'Test User',
        user_type: 'individual',
        location: 'Test City',
        eco_interests: { interests: ['recycling'] }
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('auth_token');
    expect(response.body.user).toHaveProperty('id');
  });

  it('should fail with missing email', async () => {
    const response = await request(app)
     .post('/auth/signup')
     .send({ password_hash: 'password123', name: 'Test' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should fail with duplicate email', async () => {
    await request(app)
     .post('/auth/signup')
     .send({ email: 'dup@example.com', password_hash: 'pass', name: 'Dup' });
    
    const response = await request(app)
     .post('/auth/signup')
     .send({ email: 'dup@example.com', password_hash: 'pass', name: 'Dup' });
    
    expect(response.status).toBe(409);
  });

  it('should authenticate valid user', async () => {
    const response = await request(app)
     .post('/auth/login')
     .send({ email: 'test@example.com', password_hash: 'password123' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('auth_token');
  });

  it('should fail with invalid credentials', async () => {
    const response = await request(app)
     .post('/auth/login')
     .send({ email: 'wrong@example.com', password_hash: 'wrongpass' });
    
    expect(response.status).toBe(401);
  });
});

describe('User Endpoints', () => {
  let token;
  
  beforeEach(async () => {
    const { body } = await request(app)
     .post('/auth/signup')
     .send({ email: 'user@example.com', password_hash: 'pass', name: 'User' });
    token = body.auth_token;
  });

  it('should retrieve user profile', async () => {
    const response = await request(app)
     .get('/users/user1')
     .set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('email');
  });

  it('should fail without authentication', async () => {
    const response = await request(app)
     .get('/users/user1');
    
    expect(response.status).toBe(401);
  });

  it('should update user profile successfully', async () => {
    const response = await request(app)
     .put('/users/user1')
     .set("Authorization", `Bearer ${token}`)
     .send({ name: 'Updated Name', location: 'New City' });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Name');
  });
});

describe('Transportation Logs', () => {
  let token;
  
  beforeEach(async () => {
    const { body } = await request(app)
     .post('/auth/signup')
     .send({ email: 'loguser@example.com', password_hash: 'pass', name: 'Log User' });
    token = body.auth_token;
  });

  it('should create transportation log', async () => {
    const response = await request(app)
     .post('/transportation_logs')
     .set("Authorization", `Bearer ${token}`)
     .send({
        user_id: 'loguser@example.com',
        mode: 'bike',
        distance: 10.5,
        date: '2023-10-05'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('should fail with negative distance', async () => {
    const response = await request(app)
     .post('/transportation_logs')
     .set("Authorization", `Bearer ${token}`)
     .send({
        user_id: 'loguser@example.com',
        mode: 'car',
        distance: -5,
        date: '2023-10-05'
      });
    
    expect(response.status).toBe(400);
  });

  it('should retrieve logs for user', async () => {
    // Create test log
    await request(app)
     .post('/transportation_logs')
     .set("Authorization", `Bearer ${token}`)
     .send({
        user_id: 'loguser@example.com',
        mode: 'walk',
        distance: 2.5,
        date: '2023-10-05'
      });
    
    const response = await request(app)
     .get('/transportation_logs')
     .set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(1);
  });
});

describe('Database Operations', () => {
  it('should perform CRUD on goals', async () => {
    // Create
    const createResult = await testClient.query(
      'INSERT INTO goals (id, user_id, title, target_value, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      ['goal1', 'user1', 'Test Goal', 100, '2023-01-01', '2023-12-31']
    );
    expect(createResult.rows).toHaveLength(1);
    
    // Read
    const readResult = await testClient.query(
      'SELECT * FROM goals WHERE id = $1',
      ['goal1']
    );
    expect(readResult.rows).toHaveLength(1);
    
    // Update
    await testClient.query(
      'UPDATE goals SET title = $1 WHERE id = $2',
      ['Updated Goal', 'goal1']
    );
    
    // Verify update
    const updatedResult = await testClient.query(
      'SELECT title FROM goals WHERE id = $1',
      ['goal1']
    );
    expect(updatedResult.rows[0].title).toBe('Updated Goal');
    
    // Delete
    await testClient.query('DELETE FROM goals WHERE id = $1', ['goal1']);
    
    // Verify deletion
    const deleteResult = await testClient.query(
      'SELECT * FROM goals WHERE id = $1',
      ['goal1']
    );
    expect(deleteResult.rows).toHaveLength(0);
  });

  it('should enforce foreign key constraints', async () => {
    await expect(testClient.query(
      'INSERT INTO transportation_logs (id, user_id, mode, distance, date) VALUES ($1, $2, $3, $4, $5)',
      ['tl1', 'nonexistent-user', 'bike', 5.5, '2023-10-05']
    )).rejects.toThrow();
  });
});

describe('Error Handling', () => {
  it('should handle invalid UUID format', async () => {
    const response = await request(app)
     .get('/users/invalid-id');
    
    expect(response.status).toBe(404);
  });

  it('should validate date formats', async () => {
    const response = await request(app)
     .post('/transportation_logs')
     .send({
        user_id: 'user1',
        mode: 'bike',
        distance: 10,
        date: 'invalid-date'
      });
    
    expect(response.status).toBe(400);
  });
});