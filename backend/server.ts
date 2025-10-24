import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

// Import zod schemas
import {
  userEntitySchema,
  createUserInputSchema,
  updateUserInputSchema,
  searchUsersInputSchema,
  userImpactEntitySchema,
  createUserImpactInputSchema,
  updateUserImpactInputSchema,
  searchUserImpactInputSchema
} from './schema.js';

dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error response utility
interface ErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  details?: any;
  timestamp: string;
}

function createErrorResponse(
  message: string,
  error?: any,
  errorCode?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

const { 
  DATABASE_URL, 
  PGHOST, 
  PGDATABASE, 
  PGUSER, 
  PGPASSWORD, 
  PGPORT = 5432, 
  JWT_SECRET = 'your-secret-key',
  PORT = 3000 
} = process.env;

const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(morgan('combined'));

/*
  Auth middleware to protect routes that require authentication
  Verifies JWT token and attaches user data to request object
*/
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_MISSING'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const client = await pool.connect();
    const result = await client.query('SELECT id, email, name, user_type, location, eco_interests, created_at FROM users WHERE id = $1', [decoded.user_id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid token', null, 'AUTH_TOKEN_INVALID'));
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

/*
  User signup endpoint - creates new user account
  Validates input data, checks for existing users, stores password in plain text for development
  Returns JWT token and user data on successful registration
*/
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password_hash, name, user_type = 'individual', location, eco_interests } = req.body;

    // Validation
    if (!email || !password_hash || !name) {
      return res.status(400).json(createErrorResponse('Email, password, and name are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    if (password_hash.length < 6) {
      return res.status(400).json(createErrorResponse('Password must be at least 6 characters long', null, 'PASSWORD_TOO_SHORT'));
    }

    const client = await pool.connect();
    
    // Check if user exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      client.release();
      return res.status(400).json(createErrorResponse('User with this email already exists', null, 'USER_ALREADY_EXISTS'));
    }

    // Create user (NO HASHING - store password directly for development)
    const userId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const result = await client.query(
      'INSERT INTO users (id, email, password_hash, name, user_type, location, eco_interests, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, email.toLowerCase().trim(), password_hash, name.trim(), user_type, location, eco_interests ? JSON.stringify(eco_interests) : null, createdAt]
    );
    client.release();

    const user = result.rows[0];

    // Generate JWT
    const auth_token = jwt.sign(
      { user_id: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      auth_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        location: user.location,
        eco_interests: user.eco_interests,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  User login endpoint - authenticates existing user
  Validates credentials, compares password directly (no hashing for development)
  Returns JWT token and user data on successful login
*/
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password_hash } = req.body;

    // Validation
    if (!email || !password_hash) {
      return res.status(400).json(createErrorResponse('Email and password are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    // Find user (NO HASHING - direct password comparison for development)
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    const user = result.rows[0];

    // Check password (direct comparison for development)
    if (password_hash !== user.password_hash) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    // Generate JWT
    const auth_token = jwt.sign(
      { user_id: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      auth_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        location: user.location,
        eco_interests: user.eco_interests,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Search users endpoint - returns paginated list of users with filtering and sorting
  Supports query search, pagination, and sorting by various fields
*/
app.get('/api/users', async (req, res) => {
  try {
    const { 
      query = '', 
      limit = 10, 
      offset = 0, 
      sort_by = 'created_at', 
      sort_order = 'desc' 
    } = req.query;

    const client = await pool.connect();
    
    let sql = 'SELECT id, email, name, user_type, location, eco_interests, created_at FROM users';
    const params = [];
    
    if (query) {
      sql += ' WHERE name ILIKE $1 OR email ILIKE $1';
      params.push(`%${query}%`);
    }
    
    sql += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));
    
    const result = await client.query(sql, params);
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get user profile endpoint - returns specific user data by user_id
  Fetches complete user profile information
*/
app.get('/api/users/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const client = await pool.connect();
    const result = await client.query(
      'SELECT id, email, name, user_type, location, eco_interests, created_at FROM users WHERE id = $1', 
      [user_id]
    );
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update user profile endpoint - updates user information
  Allows updating name, location, eco_interests, and other user fields
*/
app.put('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const updateData = req.body;

    // Check if user is updating their own profile or has admin rights
    if (req.user.id !== user_id) {
      return res.status(403).json(createErrorResponse('Cannot update another user\'s profile', null, 'FORBIDDEN'));
    }

    const client = await pool.connect();
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updateData.name.trim());
    }
    if (updateData.location !== undefined) {
      fields.push(`location = $${paramCount++}`);
      values.push(updateData.location);
    }
    if (updateData.eco_interests !== undefined) {
      fields.push(`eco_interests = $${paramCount++}`);
      values.push(updateData.eco_interests ? JSON.stringify(updateData.eco_interests) : null);
    }
    if (updateData.user_type) {
      fields.push(`user_type = $${paramCount++}`);
      values.push(updateData.user_type);
    }

    if (fields.length === 0) {
      client.release();
      return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    values.push(user_id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, user_type, location, eco_interests, created_at`;
    
    const result = await client.query(sql, values);
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete user account endpoint - removes user and associated data
  Cascading deletes handle related records due to foreign key constraints
*/
app.delete('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    // Check if user is deleting their own account
    if (req.user.id !== user_id) {
      return res.status(403).json(createErrorResponse('Cannot delete another user\'s account', null, 'FORBIDDEN'));
    }

    const client = await pool.connect();
    const result = await client.query('DELETE FROM users WHERE id = $1', [user_id]);
    client.release();

    if (result.rowCount === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get user impact data endpoint - retrieves carbon footprint metrics
  Returns daily, weekly, monthly scores and category breakdowns for dashboard display
*/
app.get('/api/user_impact', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json(createErrorResponse('User ID is required', null, 'MISSING_USER_ID'));
    }

    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM user_impact WHERE user_id = $1 ORDER BY date DESC LIMIT 1', 
      [user_id]
    );
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User impact data not found', null, 'IMPACT_DATA_NOT_FOUND'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user impact error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create user impact entry endpoint - stores new carbon footprint calculation
  Calculates and stores daily, weekly, monthly scores with category breakdown
*/
app.post('/api/user_impact', authenticateToken, async (req, res) => {
  try {
    const { user_id, date, daily_score, weekly_score, monthly_score, category_breakdown } = req.body;

    if (!user_id || !date || daily_score === undefined || weekly_score === undefined || monthly_score === undefined || !category_breakdown) {
      return res.status(400).json(createErrorResponse('All impact fields are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    const impactId = uuidv4();
    
    const result = await client.query(
      'INSERT INTO user_impact (id, user_id, date, daily_score, weekly_score, monthly_score, category_breakdown) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [impactId, user_id, date, daily_score, weekly_score, monthly_score, JSON.stringify(category_breakdown)]
    );
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create user impact error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create transportation log endpoint - logs transportation activities
  Tracks mode of transport, distance, locations for carbon footprint calculation
*/
app.post('/api/transportation_logs', authenticateToken, async (req, res) => {
  try {
    const { user_id, mode, distance, date, start_location, end_location } = req.body;

    if (!user_id || !mode || distance === undefined || !date) {
      return res.status(400).json(createErrorResponse('User ID, mode, distance, and date are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    const logId = uuidv4();
    
    const result = await client.query(
      'INSERT INTO transportation_logs (id, user_id, mode, distance, date, start_location, end_location) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [logId, user_id, mode, distance, date, start_location, end_location]
    );
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create transportation log error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get transportation logs endpoint - retrieves user's transportation history
  Returns paginated list of transportation activities for tracking display
*/
app.get('/api/transportation_logs', async (req, res) => {
  try {
    const { user_id, limit = 10, offset = 0 } = req.query;

    if (!user_id) {
      return res.status(400).json(createErrorResponse('User ID is required', null, 'MISSING_USER_ID'));
    }

    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM transportation_logs WHERE user_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3',
      [user_id, Number(limit), Number(offset)]
    );
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Get transportation logs error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update transportation log endpoint - modifies existing transportation record
  Allows editing of mode, distance, locations for transportation activities
*/
app.put('/api/transportation_logs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const client = await pool.connect();
    
    // Verify ownership
    const ownerCheck = await client.query('SELECT user_id FROM transportation_logs WHERE id = $1', [id]);
    if (ownerCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Transportation log not found', null, 'LOG_NOT_FOUND'));
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      client.release();
      return res.status(403).json(createErrorResponse('Cannot update another user\'s log', null, 'FORBIDDEN'));
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.mode) {
      fields.push(`mode = $${paramCount++}`);
      values.push(updateData.mode);
    }
    if (updateData.distance !== undefined) {
      fields.push(`distance = $${paramCount++}`);
      values.push(updateData.distance);
    }
    if (updateData.date) {
      fields.push(`date = $${paramCount++}`);
      values.push(updateData.date);
    }
    if (updateData.start_location !== undefined) {
      fields.push(`start_location = $${paramCount++}`);
      values.push(updateData.start_location);
    }
    if (updateData.end_location !== undefined) {
      fields.push(`end_location = $${paramCount++}`);
      values.push(updateData.end_location);
    }

    if (fields.length === 0) {
      client.release();
      return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    values.push(id);
    const sql = `UPDATE transportation_logs SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await client.query(sql, values);
    client.release();

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update transportation log error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete transportation log endpoint - removes transportation record
  Allows users to delete their own transportation logs
*/
app.delete('/api/transportation_logs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const client = await pool.connect();
    
    // Verify ownership
    const ownerCheck = await client.query('SELECT user_id FROM transportation_logs WHERE id = $1', [id]);
    if (ownerCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Transportation log not found', null, 'LOG_NOT_FOUND'));
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      client.release();
      return res.status(403).json(createErrorResponse('Cannot delete another user\'s log', null, 'FORBIDDEN'));
    }

    await client.query('DELETE FROM transportation_logs WHERE id = $1', [id]);
    client.release();

    res.status(204).send();
  } catch (error) {
    console.error('Delete transportation log error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create goal endpoint - creates new sustainability goal for user
  Stores goal with target value, timeframe, and tracks progress
*/
app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { user_id, title, target_value, start_date, end_date, progress = 0, status = 'active' } = req.body;

    if (!user_id || !title || target_value === undefined || !start_date || !end_date) {
      return res.status(400).json(createErrorResponse('User ID, title, target value, start date, and end date are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    const goalId = uuidv4();
    
    const result = await client.query(
      'INSERT INTO goals (id, user_id, title, target_value, start_date, end_date, progress, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [goalId, user_id, title, target_value, start_date, end_date, progress, status]
    );
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get user goals endpoint - retrieves all goals for a specific user
  Returns list of active and completed goals with progress tracking
*/
app.get('/api/goals', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json(createErrorResponse('User ID is required', null, 'MISSING_USER_ID'));
    }

    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY start_date DESC',
      [user_id]
    );
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update goal endpoint - modifies existing goal data
  Allows updating title, target value, dates, progress, and status
*/
app.put('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const client = await pool.connect();
    
    // Verify ownership
    const ownerCheck = await client.query('SELECT user_id FROM goals WHERE id = $1', [id]);
    if (ownerCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Goal not found', null, 'GOAL_NOT_FOUND'));
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      client.release();
      return res.status(403).json(createErrorResponse('Cannot update another user\'s goal', null, 'FORBIDDEN'));
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.title) {
      fields.push(`title = $${paramCount++}`);
      values.push(updateData.title);
    }
    if (updateData.target_value !== undefined) {
      fields.push(`target_value = $${paramCount++}`);
      values.push(updateData.target_value);
    }
    if (updateData.start_date) {
      fields.push(`start_date = $${paramCount++}`);
      values.push(updateData.start_date);
    }
    if (updateData.end_date) {
      fields.push(`end_date = $${paramCount++}`);
      values.push(updateData.end_date);
    }
    if (updateData.progress !== undefined) {
      fields.push(`progress = $${paramCount++}`);
      values.push(updateData.progress);
    }
    if (updateData.status) {
      fields.push(`status = $${paramCount++}`);
      values.push(updateData.status);
    }

    if (fields.length === 0) {
      client.release();
      return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    values.push(id);
    const sql = `UPDATE goals SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await client.query(sql, values);
    client.release();

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete goal endpoint - removes user's goal
  Allows users to delete their own sustainability goals
*/
app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const client = await pool.connect();
    
    // Verify ownership
    const ownerCheck = await client.query('SELECT user_id FROM goals WHERE id = $1', [id]);
    if (ownerCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Goal not found', null, 'GOAL_NOT_FOUND'));
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      client.release();
      return res.status(403).json(createErrorResponse('Cannot delete another user\'s goal', null, 'FORBIDDEN'));
    }

    await client.query('DELETE FROM goals WHERE id = $1', [id]);
    client.release();

    res.status(204).send();
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  List challenges endpoint - returns available community challenges
  Shows all active challenges that users can join for group sustainability goals
*/
app.get('/api/challenges', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM challenges ORDER BY start_date DESC'
    );
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('List challenges error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Join challenge endpoint - enrolls user in community challenge
  Creates user_challenge record to track participation and progress
*/
app.post('/api/challenges', authenticateToken, async (req, res) => {
  try {
    const { user_id, challenge_id, join_date } = req.body;

    if (!user_id || !challenge_id) {
      return res.status(400).json(createErrorResponse('User ID and challenge ID are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    
    // Check if challenge exists
    const challengeCheck = await client.query('SELECT id FROM challenges WHERE id = $1', [challenge_id]);
    if (challengeCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Challenge not found', null, 'CHALLENGE_NOT_FOUND'));
    }

    // Check if user already joined
    const existingJoin = await client.query('SELECT id FROM user_challenges WHERE user_id = $1 AND challenge_id = $2', [user_id, challenge_id]);
    if (existingJoin.rows.length > 0) {
      client.release();
      return res.status(400).json(createErrorResponse('User already joined this challenge', null, 'ALREADY_JOINED'));
    }

    const userChallengeId = uuidv4();
    const currentDate = join_date || new Date().toISOString().split('T')[0];
    
    const result = await client.query(
      'INSERT INTO user_challenges (id, user_id, challenge_id, join_date, progress) VALUES ($1, $2, $3, $4, $5) RETURNING progress',
      [userChallengeId, user_id, challenge_id, currentDate, 0]
    );
    client.release();

    res.status(201).json({
      progress: result.rows[0].progress
    });
  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  List tips endpoint - returns educational sustainability tips
  Supports filtering by category for targeted advice (energy, waste, transportation, etc.)
*/
app.get('/api/tips', async (req, res) => {
  try {
    const { category } = req.query;

    const client = await pool.connect();
    let sql = 'SELECT * FROM tips';
    const params = [];
    
    if (category) {
      sql += ' WHERE category = $1';
      params.push(category);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const result = await client.query(sql, params);
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('List tips error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  List forums endpoint - returns discussion forums
  Supports filtering by category for focused sustainability discussions
*/
app.get('/api/forums', async (req, res) => {
  try {
    const { category } = req.query;

    const client = await pool.connect();
    let sql = 'SELECT * FROM forums';
    const params = [];
    
    if (category) {
      sql += ' WHERE category = $1';
      params.push(category);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const result = await client.query(sql, params);
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('List forums error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create forum endpoint - creates new discussion forum
  Allows users to start new topics for community sustainability discussions
*/
app.post('/api/forums', authenticateToken, async (req, res) => {
  try {
    const { category, title, content, user_id } = req.body;

    if (!category || !title || !content || !user_id) {
      return res.status(400).json(createErrorResponse('Category, title, content, and user ID are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    const forumId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const result = await client.query(
      'INSERT INTO forums (id, category, title, content, user_id, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [forumId, category, title, content, user_id, createdAt]
    );
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create forum error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create forum post endpoint - adds reply to existing forum discussion
  Allows users to participate in forum conversations with replies
*/
app.post('/api/forums/:forum_id/posts', authenticateToken, async (req, res) => {
  try {
    const { forum_id } = req.params;
    const { user_id, content } = req.body;

    if (!user_id || !content) {
      return res.status(400).json(createErrorResponse('User ID and content are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    
    // Check if forum exists
    const forumCheck = await client.query('SELECT id FROM forums WHERE id = $1', [forum_id]);
    if (forumCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Forum not found', null, 'FORUM_NOT_FOUND'));
    }

    const postId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const result = await client.query(
      'INSERT INTO forum_posts (id, forum_id, user_id, content, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at',
      [postId, forum_id, user_id, content, createdAt]
    );
    client.release();

    res.status(201).json({
      id: result.rows[0].id,
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Create forum post error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get business profile endpoint - retrieves business sustainability profile
  Returns company information and sustainability metrics for business users
*/
app.get('/api/business_profiles', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json(createErrorResponse('User ID is required', null, 'MISSING_USER_ID'));
    }

    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM business_profiles WHERE user_id = $1',
      [user_id]
    );
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Business profile not found', null, 'BUSINESS_PROFILE_NOT_FOUND'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create business profile endpoint - creates new business sustainability profile
  Stores company information for business users to track organizational impact
*/
app.post('/api/business_profiles', authenticateToken, async (req, res) => {
  try {
    const { user_id, company_name, industry } = req.body;

    if (!user_id || !company_name || !industry) {
      return res.status(400).json(createErrorResponse('User ID, company name, and industry are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    
    // Check if business profile already exists for this user
    const existingProfile = await client.query('SELECT id FROM business_profiles WHERE user_id = $1', [user_id]);
    if (existingProfile.rows.length > 0) {
      client.release();
      return res.status(400).json(createErrorResponse('Business profile already exists for this user', null, 'BUSINESS_PROFILE_EXISTS'));
    }

    const profileId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const result = await client.query(
      'INSERT INTO business_profiles (id, user_id, company_name, industry, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [profileId, user_id, company_name, industry, createdAt]
    );
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create business profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Log supply chain sustainability endpoint - tracks supplier sustainability ratings
  Allows businesses to monitor and record their supply chain environmental impact
*/
app.post('/api/supply_chain_logs', authenticateToken, async (req, res) => {
  try {
    const { business_profile_id, supplier_name, sustainability_rating, log_date } = req.body;

    if (!business_profile_id || !supplier_name || !sustainability_rating || !log_date) {
      return res.status(400).json(createErrorResponse('Business profile ID, supplier name, sustainability rating, and log date are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    
    // Verify business profile exists and belongs to user
    const profileCheck = await client.query('SELECT user_id FROM business_profiles WHERE id = $1', [business_profile_id]);
    if (profileCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Business profile not found', null, 'BUSINESS_PROFILE_NOT_FOUND'));
    }

    if (profileCheck.rows[0].user_id !== req.user.id) {
      client.release();
      return res.status(403).json(createErrorResponse('Cannot log supply chain for another user\'s business', null, 'FORBIDDEN'));
    }

    const logId = uuidv4();
    
    const result = await client.query(
      'INSERT INTO supply_chain_logs (id, business_profile_id, supplier_name, sustainability_rating, log_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [logId, business_profile_id, supplier_name, sustainability_rating, log_date]
    );
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Log supply chain error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create reminder endpoint - sets up user reminders for sustainability activities
  Stores reminder schedule in JSON format for flexible recurring reminder patterns
*/
app.post('/api/reminders', authenticateToken, async (req, res) => {
  try {
    const { user_id, reminder_type, schedule, is_active = true } = req.body;

    if (!user_id || !reminder_type || !schedule) {
      return res.status(400).json(createErrorResponse('User ID, reminder type, and schedule are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    const reminderId = uuidv4();
    
    const result = await client.query(
      'INSERT INTO reminders (id, user_id, reminder_type, schedule, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [reminderId, user_id, reminder_type, JSON.stringify(schedule), is_active]
    );
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create bookmark endpoint - allows users to save tips and educational content
  Stores references to tips or impact explanations for later access
*/
app.post('/api/user_bookmarks', authenticateToken, async (req, res) => {
  try {
    const { user_id, tip_id, impact_explanation_id } = req.body;

    if (!user_id) {
      return res.status(400).json(createErrorResponse('User ID is required', null, 'MISSING_USER_ID'));
    }

    if (!tip_id && !impact_explanation_id) {
      return res.status(400).json(createErrorResponse('Either tip ID or impact explanation ID is required', null, 'MISSING_CONTENT_ID'));
    }

    const client = await pool.connect();
    const bookmarkId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const result = await client.query(
      'INSERT INTO user_bookmarks (id, user_id, tip_id, impact_explanation_id, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [bookmarkId, user_id, tip_id || null, impact_explanation_id || null, createdAt]
    );
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create bookmark error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route for SPA routing (serves frontend for non-API routes)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export { app, pool };

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and listening on 0.0.0.0`);
});