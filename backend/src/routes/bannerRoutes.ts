import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { requireAdminOrModerator } from '../middleware/adminMiddleware';
import * as bannerService from '../services/bannerService';
import { BannerPlacement } from '../types/banner';

const router = Router();

// --- USER ENDPOINTS ---

// Fetch banners filtered by placement
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const placement = req.query.placement as BannerPlacement;
    if (!placement) {
      res.status(400).json({ error: 'placement parameter is required' });
      return;
    }

    const banners = await bannerService.getActiveBanners(placement, {
      isVip: req.query.isVip === 'true',
      isHost: req.query.isHost === 'true',
      country: req.query.country as string,
      language: req.query.language as string,
    });

    res.json(banners);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN / MODERATOR ENDPOINTS ---

// Fetch all banners
router.get('/admin/list', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const snap = await require('firebase-admin').firestore().collection('banners').get();
    const list: any[] = [];
    snap.forEach((doc: any) => list.push(doc.data()));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create banner
router.post('/admin/create', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    const banner = await bannerService.createBanner(adminId, req.body);
    res.json({ success: true, banner });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update banner details
router.patch('/admin/:bannerId', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    const banner = await bannerService.updateBanner(req.params.bannerId as string, adminId, req.body);
    res.json({ success: true, banner });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Activate banner
router.post('/admin/:bannerId/activate', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    await bannerService.activateBanner(req.params.bannerId as string, adminId);
    res.json({ success: true, message: 'Banner activated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Deactivate banner
router.post('/admin/:bannerId/deactivate', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    await bannerService.deactivateBanner(req.params.bannerId as string, adminId);
    res.json({ success: true, message: 'Banner deactivated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
