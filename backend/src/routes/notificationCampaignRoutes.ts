import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { createNotificationCampaign, executeNotificationCampaign } from '../services/notificationCampaignService';

export const notificationCampaignRoutes = Router();

// POST /api/notifications/campaigns - Create a notification campaign (Admin)
notificationCampaignRoutes.post('/campaigns', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { title, body, targetSegment, deepLinkTarget, deepLinkId } = req.body;

    if (!title || !body || !targetSegment || !deepLinkTarget) {
      res.status(400).json({ error: 'title, body, targetSegment, and deepLinkTarget are required.' });
      return;
    }

    const campaign = await createNotificationCampaign({
      title,
      body,
      targetSegment,
      deepLinkTarget,
      deepLinkId,
      createdBy: adminId,
    });

    res.status(201).json({ success: true, campaign });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(400).json({ error: error.message || 'Error creating campaign' });
  }
});

// POST /api/notifications/campaigns/:id/execute - Execute campaign dispatch (Admin)
notificationCampaignRoutes.post('/campaigns/:id/execute', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { id } = req.params;

    const result = await executeNotificationCampaign(id as string, adminId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error executing campaign:', error);
    res.status(400).json({ error: error.message || 'Error executing campaign' });
  }
});
