import express, { Request } from 'express';
import { query } from '../db/db';
import { authenticateToken } from '../middleware/auth';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

const router = express.Router();

// Get all stories
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        s.id, s.title, s.content, s.created_at,
        u.username as author_name
      FROM stories s
      JOIN users u ON s.author_id = u.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Create a new story
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user?.id;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await query(
      'INSERT INTO stories (title, content, author_id) VALUES ($1, $2, $3) RETURNING id',
      [title, content, userId]
    );

    res.status(201).json({
      id: result.rows[0].id,
      title,
      content,
      author_id: userId
    });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
});

// Get a single story with blocks
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching story with ID:', id);
    
    // Get story details
    const storyResult = await query(`
      SELECT 
        s.id, s.title, s.content, s.created_at,
        s.last_edited_at, s.last_edited_by,
        u.username as author_name,
        u2.username as last_edited_by_name
      FROM stories s
      JOIN users u ON s.author_id = u.id
      LEFT JOIN users u2 ON s.last_edited_by = u2.id
      WHERE s.id = $1
    `, [id]);

    console.log('Story result:', storyResult.rows);

    if (storyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Get story blocks with error handling
    let blocks = [];
    try {
      console.log('Attempting to fetch story blocks...');
      const blocksResult = await query(`
        SELECT 
          id, content, block_order as "order",
          locked_by as "lockedBy",
          locked_at as "lockedAt",
          last_edited_by as "lastEditedBy",
          last_edited_at as "lastEditedAt"
        FROM story_blocks
        WHERE story_id = $1
        ORDER BY block_order
      `, [id]);
      console.log('Blocks result:', blocksResult.rows);
      blocks = blocksResult.rows;
    } catch (error) {
      console.error('Error fetching story blocks:', error);
      // If blocks table doesn't exist or has different structure,
      // create a single block from the story content
      console.log('Creating temporary block from story content');
      blocks = [{
        id: 'temp-' + id,
        content: storyResult.rows[0].content,
        order: 1,
        lockedBy: null,
        lockedAt: null,
        lastEditedBy: null,
        lastEditedAt: null
      }];
    }

    // Combine story and blocks
    const story = {
      ...storyResult.rows[0],
      blocks: blocks
    };

    console.log('Sending response:', story);
    res.json(story);
  } catch (error) {
    console.error('Error in story fetch endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch story',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get stories for a specific user
router.get('/user/:userId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;

    // Verify that the requesting user is accessing their own stories
    if (req.user?.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized access to other user\'s stories' });
    }

    const result = await query(
      `SELECT 
        s.id, s.title, s.content, s.created_at,
        u.username as author_name
       FROM stories s
       JOIN users u ON s.author_id = u.id
       WHERE s.author_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user stories:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a story
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if the story exists and belongs to the user
    const checkResult = await query(
      'SELECT author_id FROM stories WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (checkResult.rows[0].author_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own stories' });
    }

    await query('DELETE FROM stories WHERE id = $1', [id]);
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comments for a story
router.get('/:storyId/comments', async (req, res) => {
  try {
    const { storyId } = req.params;
    const result = await query(
      `SELECT 
        c.id, c.content, c.created_at,
        u.id as author_id, u.username as author_name
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.story_id = $1
       ORDER BY c.created_at DESC`,
      [storyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a comment to a story
router.post('/:storyId/comments', authenticateToken, async (req: any, res) => {
  try {
    const { storyId } = req.params;
    const { content } = req.body;
    const author_id = req.user?.id;

    console.log('Add comment:', { storyId, content, author_id });

    // Validate required fields
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    if (!author_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Create comment
    const result = await query(
      'INSERT INTO comments (content, story_id, author_id) VALUES ($1, $2, $3) RETURNING id, content, created_at',
      [content, storyId, author_id]
    );

    // Get author details
    const authorResult = await query(
      'SELECT username FROM users WHERE id = $1',
      [author_id]
    );

    const response = {
      ...result.rows[0],
      author_name: authorResult.rows[0]?.username || 'Unknown'
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get comments for a block
router.get('/blocks/:blockId/comments', async (req, res) => {
  try {
    const { blockId } = req.params;
    const result = await query(`
      SELECT 
        c.id, c.content, c.created_at,
        u.username as author_name
      FROM block_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.block_id = $1
      ORDER BY c.created_at DESC
    `, [blockId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment to a block
router.post('/blocks/:blockId/comments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { blockId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const result = await query(
      'INSERT INTO block_comments (block_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, content, created_at',
      [blockId, userId, content]
    );

    // Get the username for the response
    const userResult = await query(
      'SELECT username FROM users WHERE id = $1',
      [userId]
    );

    res.status(201).json({
      ...result.rows[0],
      author_name: userResult.rows[0].username
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get version history for a block
router.get('/blocks/:blockId/versions', async (req, res) => {
  try {
    const { blockId } = req.params;
    const result = await query(`
      SELECT 
        v.id, v.content, v.created_at,
        u.username as edited_by_name
      FROM block_versions v
      JOIN users u ON v.edited_by = u.id
      WHERE v.block_id = $1
      ORDER BY v.created_at DESC
    `, [blockId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching version history:', error);
    res.status(500).json({ error: 'Failed to fetch version history' });
  }
});

// Get blocks for a story
router.get('/:storyId/blocks', async (req, res) => {
  try {
    const { storyId } = req.params;
    const result = await query(`
      SELECT 
        sb.id, sb.content, sb.block_order,
        sb.locked_by, sb.locked_at,
        u1.username as locked_by_name,
        u2.username as last_edited_by_name,
        sb.last_edited_at
      FROM story_blocks sb
      LEFT JOIN users u1 ON sb.locked_by = u1.id
      LEFT JOIN users u2 ON sb.last_edited_by = u2.id
      WHERE sb.story_id = $1
      ORDER BY sb.block_order ASC
    `, [storyId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching story blocks:', error);
    res.status(500).json({ error: 'Failed to fetch story blocks' });
  }
});

// Create a new block
router.post('/:storyId/blocks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { storyId } = req.params;
    const { content, blockOrder } = req.body;
    const userId = req.user?.id;

    if (!content || blockOrder === undefined) {
      return res.status(400).json({ error: 'Content and block order are required' });
    }

    const result = await query(
      'INSERT INTO story_blocks (story_id, content, block_order, last_edited_by) VALUES ($1, $2, $3, $4) RETURNING id',
      [storyId, content, blockOrder, userId]
    );

    res.status(201).json({
      id: result.rows[0].id,
      content,
      block_order: blockOrder,
      last_edited_by: userId
    });
  } catch (error) {
    console.error('Error creating story block:', error);
    res.status(500).json({ error: 'Failed to create story block' });
  }
});

// Update a block's content
router.put('/blocks/:blockId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { blockId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Check if the block is locked by this user
    const checkLock = await query(
      'SELECT locked_by FROM story_blocks WHERE id = $1',
      [blockId]
    );

    if (checkLock.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }

    if (checkLock.rows[0].locked_by !== userId) {
      return res.status(403).json({ error: 'Block is not locked by you' });
    }

    // Save the current version
    await query(
      'INSERT INTO block_versions (block_id, content, edited_by) VALUES ($1, (SELECT content FROM story_blocks WHERE id = $1), $2)',
      [blockId, userId]
    );

    // Update the block
    const result = await query(
      'UPDATE story_blocks SET content = $1, last_edited_by = $2, last_edited_at = NOW() WHERE id = $3 RETURNING *',
      [content, userId, blockId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating story block:', error);
    res.status(500).json({ error: 'Failed to update story block' });
  }
});

export default router; 