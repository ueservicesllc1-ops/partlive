import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  submitHostApplication,
  reviewHostApplication,
  getCreatorProfile,
} from '../services/creatorGrowthService';
import { db } from '../config/firebase';

export const creatorGrowthRoutes = Router();

// POST /api/creators/apply - Submit host application
creatorGrowthRoutes.post('/apply', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { displayName, category, bio, country } = req.body;

    if (!displayName || !category) {
      res.status(400).json({ error: 'displayName and category are required.' });
      return;
    }

    const application = await submitHostApplication(userId, { displayName, category, bio: bio || '', country: country || 'US' });
    res.status(201).json({ success: true, application });
  } catch (error: any) {
    console.error('Error submitting host application:', error);
    res.status(400).json({ error: error.message || 'Error submitting application' });
  }
});

// GET /api/creators/applications - Get pending applications (Admin)
creatorGrowthRoutes.get('/applications', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('hostApplications')
      .where('status', '==', 'PENDING_REVIEW')
      .limit(50)
      .get();

    const applications = snap.docs.map((d) => d.data());
    res.json({ success: true, applications });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/creators/applications/:id/review - Review host application (Admin)
creatorGrowthRoutes.post('/applications/:id/review', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { id } = req.params;
    const { approve } = req.body;

    if (typeof approve !== 'boolean') {
      res.status(400).json({ error: 'approve boolean is required.' });
      return;
    }

    const application = await reviewHostApplication(id as string, approve, adminId);
    res.json({ success: true, application });
  } catch (error: any) {
    console.error('Error reviewing host application:', error);
    res.status(400).json({ error: error.message || 'Error reviewing application' });
  }
});

// GET /api/creators/profile - Get my creator profile
creatorGrowthRoutes.get('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const profile = await getCreatorProfile(userId);
    res.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error fetching creator profile:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
