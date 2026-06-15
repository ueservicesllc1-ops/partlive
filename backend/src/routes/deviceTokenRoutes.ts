import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import * as deviceTokenService from '../services/deviceTokenService';

const router = Router();

// Register a token
router.post('/register', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    const { token, platform, deviceId, deviceName, appVersion } = req.body;

    if (!token || !platform) {
      res.status(400).json({ error: 'Token and Platform are required fields' });
      return;
    }

    const deviceToken = await deviceTokenService.registerDeviceToken(userId, {
      token,
      platform,
      deviceId,
      deviceName,
      appVersion,
    });

    res.json({ success: true, deviceToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Deactivate a token
router.post('/deactivate', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    await deviceTokenService.deactivateDeviceToken(userId, token);
    res.json({ success: true, message: 'Token deactivated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's registered tokens
router.get('/my', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    const tokens = await deviceTokenService.getActiveDeviceTokens(userId);
    res.json(tokens);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
