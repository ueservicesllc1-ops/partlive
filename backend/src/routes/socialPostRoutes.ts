import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  createPost,
  likePost,
  commentPost,
  getSocialFeed,
} from '../services/socialPostService';

export const socialPostRoutes = Router();

// POST /api/social/posts - Create a new social post
socialPostRoutes.post('/posts', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authorId = req.user.uid;
    const { text, mediaUrl, visibility, contentType } = req.body;

    if (!text) {
      res.status(400).json({ error: 'text is required.' });
      return;
    }

    const post = await createPost(authorId, text, mediaUrl, visibility, contentType);
    res.status(201).json({ success: true, post });
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(400).json({ error: error.message || 'Error creating post' });
  }
});

// POST /api/social/posts/:id/like - Like or unlike post
socialPostRoutes.post('/posts/:id/like', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const isLiked = await likePost(userId, id as string);
    res.json({ success: true, isLiked });
  } catch (error: any) {
    console.error('Error liking post:', error);
    res.status(400).json({ error: error.message || 'Error liking post' });
  }
});

// POST /api/social/posts/:id/comment - Comment on post
socialPostRoutes.post('/posts/:id/comment', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      res.status(400).json({ error: 'text is required.' });
      return;
    }

    const comment = await commentPost(userId, id as string, text);
    res.status(201).json({ success: true, comment });
  } catch (error: any) {
    console.error('Error commenting on post:', error);
    res.status(400).json({ error: error.message || 'Error commenting' });
  }
});

// GET /api/social/feed - Get social feed
socialPostRoutes.get('/feed', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { type } = req.query;

    const posts = await getSocialFeed(userId, (type as any) || 'FOR_YOU');
    res.json({ success: true, posts });
  } catch (error: any) {
    console.error('Error fetching social feed:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
