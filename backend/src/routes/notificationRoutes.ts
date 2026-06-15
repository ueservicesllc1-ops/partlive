import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import * as notifService from '../services/notificationService';

const router = Router();

// Retrieve user notifications (in-app list)
router.get('/', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    const limitCount = parseInt(req.query.limit as string) || 50;

    const snapshot = await db
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    const notifications: any[] = [];
    snapshot.forEach((doc) => {
      notifications.push(doc.data());
    });

    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve unread notifications count
router.get('/unread-count', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db
      .collection('notifications')
      .where('userId', '==', userId)
      .where('status', '==', 'unread')
      .get();

    res.json({ count: snapshot.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark single notification as read
router.post('/:notificationId/read', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    const { notificationId } = req.params;
    await notifService.markNotificationRead(userId, notificationId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.post('/read-all', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    await notifService.markAllNotificationsRead(userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user notification settings
router.get('/settings', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    const settings = await notifService.getUserNotificationSettings(userId);
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.patch('/settings', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    const settings = await notifService.updateUserNotificationSettings(userId, req.body);
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN ENDPOINTS ---

// Send push to single user
router.post('/admin/send-user', requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const { userId, title, body, type, actionType, actionValue, imageUrl, sendPush } = req.body;

    if (!userId || !title || !body) {
      res.status(400).json({ error: 'userId, title, and body are required fields' });
      return;
    }

    const channel = sendPush ? 'both' : 'in_app';
    const notif = await notifService.createNotificationAndPush({
      userId,
      type: type || 'system',
      channel,
      title,
      body,
      imageUrl,
      actionType: actionType || 'none',
      actionValue,
    });

    res.json({ success: true, notification: notif });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send broadcast to all devices
router.post('/admin/send-broadcast', requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const { title, body, imageUrl, actionType, actionValue } = req.body;

    if (!title || !body) {
      res.status(400).json({ error: 'title and body are required fields' });
      return;
    }

    // Deliver push to everyone
    await notifService.sendBroadcastPush({
      title,
      body,
      imageUrl,
      data: {
        type: 'system',
        actionType: actionType || 'none',
        actionValue: actionValue || '',
      },
    });

    // Also populate in-app notifications for active users
    const usersSnapshot = await db.collection('users').limit(100).get(); // Limit inside sanity checks
    const batch = db.batch();
    
    usersSnapshot.forEach((uDoc) => {
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        id: notifRef.id,
        userId: uDoc.id,
        type: 'system',
        channel: 'both',
        title,
        body,
        imageUrl: imageUrl || null,
        actionType: actionType || 'none',
        actionValue: actionValue || null,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    
    await batch.commit();
    res.json({ success: true, message: 'Broadcast queued and dispatched.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
