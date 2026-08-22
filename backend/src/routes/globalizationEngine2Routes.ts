import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getCountryConfiguration,
  resolveUserLanguage,
  getRegionalPricingProfile,
  formatLocalScheduleTime,
  getRegionalFeeds,
  getMarketOpportunityScore,
  toggleCountryStatus,
} from '../services/globalizationEngine2Service';

export const globalizationEngine2Routes = Router();

// GET /api/globalization-2/country - Get Country Configuration & Feature Flags
globalizationEngine2Routes.get('/country', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const countryCode = (req.query.countryCode as string) || 'CL';
    const config = await getCountryConfiguration(countryCode);
    res.json({ success: true, config });
  } catch (error: any) {
    console.error('Error fetching country config:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/globalization-2/language - Resolve Language Hierarchy & RTL Flag
globalizationEngine2Routes.post('/language', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { userPref, deviceLang, countryCode } = req.body;

    const languageResult = await resolveUserLanguage(userId, userPref, deviceLang, countryCode || 'CL');
    res.json({ success: true, ...languageResult });
  } catch (error: any) {
    console.error('Error resolving user language:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/globalization-2/pricing - Get Regional Pricing Profile
globalizationEngine2Routes.get('/pricing', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const countryCode = (req.query.countryCode as string) || 'CL';
    const pricing = await getRegionalPricingProfile(countryCode);
    res.json({ success: true, pricing });
  } catch (error: any) {
    console.error('Error fetching regional pricing:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/globalization-2/schedule - Format Local Schedule Time
globalizationEngine2Routes.post('/schedule', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { utcTimestamp, targetTimezone } = req.body;
    if (!utcTimestamp) {
      res.status(400).json({ error: 'utcTimestamp is required.' });
      return;
    }

    const schedule = await formatLocalScheduleTime(utcTimestamp, targetTimezone || 'America/Santiago');
    res.json({ success: true, ...schedule });
  } catch (error: any) {
    console.error('Error formatting schedule time:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/globalization-2/feeds - Get Regional Content Feeds
globalizationEngine2Routes.get('/feeds', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const countryCode = (req.query.countryCode as string) || 'CL';
    const languageCode = (req.query.languageCode as string) || 'es';

    const feeds = await getRegionalFeeds(countryCode, languageCode);
    res.json({ success: true, ...feeds });
  } catch (error: any) {
    console.error('Error fetching regional feeds:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/globalization-2/market-score - Get Market Opportunity Score
globalizationEngine2Routes.get('/market-score', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const countryCode = (req.query.countryCode as string) || 'CL';
    const score = await getMarketOpportunityScore(countryCode);
    res.json({ success: true, score });
  } catch (error: any) {
    console.error('Error fetching market opportunity score:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/globalization-2/toggle-country - Toggle Country Rollout Status
globalizationEngine2Routes.post('/toggle-country', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { countryCode, status } = req.body;
    if (!countryCode || !status) {
      res.status(400).json({ error: 'countryCode and status are required.' });
      return;
    }

    const updated = await toggleCountryStatus(countryCode, status);
    res.json({ success: true, country: updated });
  } catch (error: any) {
    console.error('Error toggling country status:', error);
    res.status(400).json({ error: error.message || 'Error toggling country status' });
  }
});
