import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/db';

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  console.log('=== Registration Request Received ===');
  console.log('Request headers:', req.headers);
  console.log('Request body:', { ...req.body, password: '***' });

  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      console.log('Missing required fields:', { username: !!username, email: !!email, password: !!password });
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    console.log('Checking if user exists...');
    const userExists = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    console.log('User exists query result:', {
      found: userExists.rows.length > 0,
      email: userExists.rows[0]?.email,
      username: userExists.rows[0]?.username
    });

    if (userExists.rows.length > 0) {
      console.log('User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hashed successfully');

    // Create user
    console.log('Creating new user...');
    const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, profile_pic',
      [username, email, hashedPassword]
    );

    console.log('User created successfully:', {
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email
    });

    // Generate JWT
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: result.rows[0].id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1000d' }
    );
    console.log('JWT token generated successfully');

    console.log('Sending successful response');
    res.status(201).json({
      token,
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        profile_pic: result.rows[0].profile_pic || null
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      detail: (error as any).detail,
      table: (error as any).table,
      constraint: (error as any).constraint
    });
    res.status(500).json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  console.log('=== Login Request Received ===');
  console.log('Request headers:', req.headers);
  console.log('Request body:', { ...req.body, password: '***' });

  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    console.log('Checking if user exists...');
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    console.log('User query result:', {
      found: result.rows.length > 0,
      email: result.rows[0]?.email,
      username: result.rows[0]?.username
    });

    if (result.rows.length === 0) {
      console.log('User not found');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    console.log('Verifying password...');
    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password verification result:', validPassword);
    
    if (!validPassword) {
      console.log('Invalid password');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    console.log('JWT token generated successfully');

    console.log('Sending successful response');
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_pic: user.profile_pic || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      detail: (error as any).detail,
      table: (error as any).table,
      constraint: (error as any).constraint
    });
    res.status(500).json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 