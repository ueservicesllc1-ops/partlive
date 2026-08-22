import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getCountryConfig,
  updateCountryConfig,
  convertCurrency,
  isFeatureEnabledForCountry,
  simulateCountryExpansion,
} from '../services/globalExpansionService';

export const globalExpansionRoutes = Router();

// GET /api/expansion/countries/:code - Get Country Configuration
globalExpansionRoutes.get('/countries/:code', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const code = req.params.code || 'US';
    const config = await getCountryConfig(code);
    res.json({ success: true, config });
  } catch (error: any) {
    console.error('Error fetching country config:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/expansion/countries/:code - Update Country Configuration (Admin)
globalExpansionRoutes.post('/countries/:code', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const code = req.params.code;
    const updates = req.body;
    const config = await updateCountryConfig(code, updates);
    res.json({ success: true, config });
  } catch (error: any) {
    console.error('Error updating country config:', error);
    res.status(400).json({ error: error.message || 'Error updating country config' });
  }
});

// POST /api/expansion/fx/convert - Convert Currency
globalExpansionRoutes.post('/fx/convert', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    if (amount === undefined || !fromCurrency || !toCurrency) {
      res.status(400).json({ error: 'amount, fromCurrency, and toCurrency are required.' });
      return;
    }

    const result = convertCurrency(Number(amount), fromCurrency, toCurrency);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error converting currency:', error);
    res.status(400).json({ error: error.message || 'Error converting currency' });
  }
});

// GET /api/expansion/features - Check Feature Availability for Country
globalExpansionRoutes.get('/features', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const country = (req.query.country as string) || 'US';
    const feature = (req.query.feature as any) || 'payouts';

    const enabled = await isFeatureEnabledForCountry(country, feature);
    res.json({ success: true, country, feature, enabled });
  } catch (error: any) {
    console.error('Error checking feature availability:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/expansion/simulate - Simulate Country Expansion (Admin)
globalExpansionRoutes.post('/simulate', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { countryCode, targetDau, arppuUsd, paymentFeePercent } = req.body;
    if (!countryCode || !targetDau) {
      res.status(400).json({ error: 'countryCode and targetDau are required.' });
      return;
    }

    const simulation = simulateCountryExpansion(
      countryCode,
      Number(targetDau),
      arppuUsd ? Number(arppuUsd) : 18.0,
      paymentFeePercent ? Number(paymentFeePercent) : 3.0
    );

    res.json({ success: true, simulation });
  } catch (error: any) {
    console.error('Error simulating expansion:', error);
    res.status(400).json({ error: error.message || 'Error simulating expansion' });
  }
});
