import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getPerformanceBaseline,
  bufferAnalyticsEvent,
  calculateUnitEconomics,
  invalidateCacheKey,
} from '../services/performanceOptimizationService';

export const performanceOptimizationRoutes = Router();

// GET /api/performance/baseline - Get Performance Baselines & Latency Budgets
performanceOptimizationRoutes.get('/baseline', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const baseline = await getPerformanceBaseline();
    res.json({ success: true, baseline });
  } catch (error: any) {
    console.error('Error fetching performance baseline:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/performance/events/buffer - Buffer client non-financial analytics event
performanceOptimizationRoutes.post('/events/buffer', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { eventName, payload } = req.body;

    if (!eventName) {
      res.status(400).json({ error: 'eventName is required.' });
      return;
    }

    const result = bufferAnalyticsEvent(userId, eventName, payload || {});
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error buffering event:', error);
    res.status(400).json({ error: error.message || 'Error buffering event' });
  }
});

// GET /api/performance/economics - Get Unit Economics & Contribution Margins (Admin)
performanceOptimizationRoutes.get('/economics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await calculateUnitEconomics();
    res.json({ success: true, report });
  } catch (error: any) {
    console.error('Error calculating unit economics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/performance/cache/invalidate - Invalidate in-memory cache key (Admin)
performanceOptimizationRoutes.post('/cache/invalidate', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.body;
    if (!key) {
      res.status(400).json({ error: 'key is required.' });
      return;
    }

    invalidateCacheKey(key);
    res.json({ success: true, key });
  } catch (error: any) {
    console.error('Error invalidating cache:', error);
    res.status(400).json({ error: error.message || 'Error invalidating cache' });
  }
});
