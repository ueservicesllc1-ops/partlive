import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getCountryConfig,
  getActiveMarkets,
  updateCountryConfig,
  isFeatureAllowedInCountry,
} from '../services/regionalConfigService';

export const regionalConfigRoutes = Router();

// GET /api/regional/countries - Get active market countries
regionalConfigRoutes.get('/countries', async (req: Request, res: Response): Promise<void> => {
  try {
    const markets = await getActiveMarkets();
    res.json({ success: true, markets });
  } catch (error: any) {
    console.error('Error fetching regional markets:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/regional/countries/:code - Get single country config
regionalConfigRoutes.get('/countries/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const config = await getCountryConfig(code as string);
    res.json({ success: true, config });
  } catch (error: any) {
    console.error('Error fetching country config:', error);
    res.status(400).json({ error: error.message || 'Error fetching config' });
  }
});

// PUT /api/regional/countries/:code - Update country config (Admin)
regionalConfigRoutes.put('/countries/:code', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { code } = req.params;

    const updated = await updateCountryConfig(code as string, req.body, adminId);
    res.json({ success: true, config: updated });
  } catch (error: any) {
    console.error('Error updating country config:', error);
    res.status(400).json({ error: error.message || 'Error updating country config' });
  }
});

// GET /api/regional/features/check - Check feature availability for country
regionalConfigRoutes.get('/features/check', async (req: Request, res: Response): Promise<void> => {
  try {
    const feature = (req.query.feature as string) || 'all';
    const country = (req.query.country as string) || 'US';

    const allowed = await isFeatureAllowedInCountry(feature, country);
    res.json({ success: true, feature, country, allowed });
  } catch (error: any) {
    console.error('Error checking feature availability:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
