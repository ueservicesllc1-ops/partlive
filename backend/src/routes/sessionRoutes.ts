import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  startUserSession,
  heartbeatUserSession,
  endUserSession
} from '../services/sessionTrackingService';

export const sessionRoutes = Router();

// POST /api/sessions/start - Starts a new user session
sessionRoutes.post('/start', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { platform, appVersion, country, language, deviceId } = req.body;

    if (!platform) {
      res.status(400).json({ error: 'Platform is required.' });
      return;
    }

    const sessionId = await startUserSession(
      userId,
      platform,
      appVersion,
      country,
      language,
      deviceId
    );

    res.status(201).json({ success: true, sessionId });
  } catch (error: any) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/sessions/heartbeat - Heartbeat signal to keep session alive
sessionRoutes.post('/heartbeat', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required.' });
      return;
    }

    await heartbeatUserSession(sessionId as string);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error in session heartbeat:', error);
    res.status(400).json({ error: error.message || 'Error updating heartbeat' });
  }
});

// POST /api/sessions/end - Ends a user session
sessionRoutes.post('/end', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required.' });
      return;
    }

    await endUserSession(sessionId as string);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error ending session:', error);
    res.status(400).json({ error: error.message || 'Error ending session' });
  }
});
