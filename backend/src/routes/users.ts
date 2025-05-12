import express, { Request } from 'express';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth';
import { query } from '../db/db';

interface AuthRequest extends Request {
  user?: { id: number };
  file?: Express.Multer.File;
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'uploads/profile_pics/');
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // @ts-ignore
    const ext = path.extname(file.originalname);
    // @ts-ignore
    cb(null, `user_${req.user.id}${ext}`);
  }
});
const upload = multer({ storage });

// Update user profile
router.put('/me', authenticateToken, upload.single('profilePic'), async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { email, username, password } = req.body;
  let profilePicPath;

  console.log('Profile update request:', {
    userId,
    email,
    username,
    password,
    file: req.file
  });

  if (req.file) {
    profilePicPath = `/uploads/profile_pics/${req.file.filename}`;
  }

  // Build update query dynamically
  const updates = [];
  const values = [];
  let idx = 1;

  if (email) {
    updates.push(`email = $${idx++}`);
    values.push(email);
  }
  if (username) {
    updates.push(`username = $${idx++}`);
    values.push(username);
  }
  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    updates.push(`password_hash = $${idx++}`);
    values.push(hashedPassword);
  }
  if (profilePicPath) {
    updates.push(`profile_pic = $${idx++}`);
    values.push(profilePicPath);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(userId);
  const queryStr = `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, username, profile_pic`;

  try {
    console.log('Executing query:', queryStr, values);
    const result = await query(queryStr, values);
    res.json({ user: result.rows[0] });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get all users (for tagging)
router.get('/all', async (req, res) => {
  try {
    const result = await query('SELECT id, username FROM users ORDER BY username ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router; 