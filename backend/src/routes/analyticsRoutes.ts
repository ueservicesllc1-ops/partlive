import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { requireAdmin, requireAdminOrModerator } from '../middleware/adminMiddleware';
import {
  getAdminAnalyticsSummary,
  getRevenueAnalytics,
  getCountryAnalyticsSummary,
  getHostAnalyticsSummary,
  getAgencyAnalyticsSummary,
  getGiftAnalyticsSummary,
  rebuildDailyAnalyticsFromEvents
} from '../services/analyticsService';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export const analyticsRoutes = Router();

// GET /api/analytics/summary - Consolidated daily platform statistics
analyticsRoutes.get('/summary', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const summary = await getAdminAnalyticsSummary(days);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch analytics summary' });
  }
});

// GET /api/analytics/revenue - Revenue stats
analyticsRoutes.get('/revenue', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const revenueStats = await getRevenueAnalytics(days);
    res.json(revenueStats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch revenue analytics' });
  }
});

// GET /api/analytics/countries - Country ranking
analyticsRoutes.get('/countries', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const countries = await getCountryAnalyticsSummary(limit);
    res.json(countries);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch country analytics' });
  }
});

// GET /api/analytics/hosts - Host analytics ranking (all or specific)
analyticsRoutes.get('/hosts', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const hostId = req.query.hostId as string;

    if (hostId) {
      // Specific host detail
      const hostStats = await getHostAnalyticsSummary(hostId, limit);
      return res.json(hostStats);
    }

    // All hosts ranking — aggregate from hostAnalytics collection
    const daysAgo = new Date(Date.now() - days * 86400000);
    const periodKey = daysAgo.toISOString().substring(0, 7); // YYYY-MM
    const snap = await db.collection('hostAnalytics')
      .where('period', '>=', periodKey)
      .orderBy('period', 'desc')
      .limit(limit * 3)
      .get();

    // Aggregate by hostId
    const byHost: Record<string, any> = {};
    snap.docs.forEach(doc => {
      const d = doc.data();
      if (!byHost[d.hostId]) {
        byHost[d.hostId] = { hostId: d.hostId, beansGenerated: 0, giftsReceived: 0, liveMinutes: 0, diamondsRequested: 0 };
      }
      byHost[d.hostId].beansGenerated += d.beansGenerated || 0;
      byHost[d.hostId].giftsReceived += d.giftsReceived || 0;
      byHost[d.hostId].liveMinutes += d.liveMinutes || 0;
      byHost[d.hostId].diamondsRequested += d.diamondsRequested || 0;
    });

    const sorted = Object.values(byHost)
      .sort((a: any, b: any) => b.beansGenerated - a.beansGenerated)
      .slice(0, limit);

    res.json({ data: sorted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch host analytics' });
  }
});

// GET /api/analytics/agencies - Agency analytics
analyticsRoutes.get('/agencies', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const agencyId = req.query.agencyId as string;
    if (agencyId) {
      const agencyStats = await getAgencyAnalyticsSummary(agencyId, limit);
      return res.json(agencyStats);
    }
    res.status(400).json({ error: 'agencyId query parameter is required' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch agency analytics' });
  }
});

// GET /api/analytics/gifts - Gift popularity
analyticsRoutes.get('/gifts', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const gifts = await getGiftAnalyticsSummary(limit);
    res.json(gifts);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch gift analytics' });
  }
});

// GET /api/analytics/alerts - Admin system alerts
analyticsRoutes.get('/alerts', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const status = (req.query.status as string) || 'open';
    let snap;
    if (status !== 'all') {
      snap = await db.collection('adminAlerts')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
    } else {
      snap = await db.collection('adminAlerts')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
    }
    const alerts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ alerts });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch alerts' });
  }
});

// POST /api/analytics/alerts/:alertId/resolve - Resolve an alert
analyticsRoutes.post('/alerts/:alertId/resolve', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const alertId = req.params.alertId as string;
    await db.collection('adminAlerts').doc(alertId).update({
      status: 'resolved',
      resolvedBy: req.user.uid,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to resolve alert' });
  }
});

// POST /api/analytics/rebuild - Rebuild from raw events
analyticsRoutes.post('/rebuild', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { periodKey } = req.body;
    if (!periodKey) {
      res.status(400).json({ error: 'periodKey is required' });
      return;
    }
    await rebuildDailyAnalyticsFromEvents(periodKey);
    res.json({ success: true, message: `Rebuild complete for period ${periodKey}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to rebuild analytics' });
  }
});

// GET /api/analytics/host - Current host performance (mobile app)
analyticsRoutes.get('/host', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const stats = await getHostAnalyticsSummary(userId, limit);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch host analytics' });
  }
});

// GET /api/analytics/agencies/:agencyId - Agency analytics for agency owners
analyticsRoutes.get('/agencies/:agencyId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.params.agencyId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const stats = await getAgencyAnalyticsSummary(agencyId, limit);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch agency analytics' });
  }
});
