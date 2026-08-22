import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  trackStandardizedEvent,
  calculateRetentionCohorts,
  calculateUnitEconomics,
  generateRevenueForecast,
  getAIExecutionRecommendations,
  queryNaturalLanguageBI,
} from '../services/dataIntelligenceEngineService';

export const dataIntelligenceEngineRoutes = Router();

// POST /api/bi/event - Track Standardized BI Event
dataIntelligenceEngineRoutes.post('/event', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user ? req.user.uid : 'anon_viewer';
    const { eventId, eventType, metadata } = req.body;

    if (!eventId || !eventType) {
      res.status(400).json({ error: 'eventId and eventType are required.' });
      return;
    }

    const result = await trackStandardizedEvent(eventId, userId, eventType, metadata);
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error tracking BI event:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/bi/cohorts - Get Retention Cohorts (D1-D90)
dataIntelligenceEngineRoutes.get('/cohorts', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cohorts = await calculateRetentionCohorts();
    res.json({ success: true, cohorts });
  } catch (error: any) {
    console.error('Error fetching cohorts:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/bi/unit-economics - Get Unit Economics (ARPU, ARPPU, LTV, Take Rate)
dataIntelligenceEngineRoutes.get('/unit-economics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const economics = await calculateUnitEconomics();
    res.json({ success: true, economics });
  } catch (error: any) {
    console.error('Error fetching unit economics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/bi/forecast - Generate Revenue Forecast & Scenario Simulator
dataIntelligenceEngineRoutes.post('/forecast', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scenario, forecastPeriodDays } = req.body;
    const forecast = await generateRevenueForecast(
      scenario || 'BASE',
      forecastPeriodDays ? Number(forecastPeriodDays) : 30
    );
    res.json({ success: true, forecast });
  } catch (error: any) {
    console.error('Error generating forecast:', error);
    res.status(400).json({ error: error.message || 'Error generating forecast' });
  }
});

// GET /api/bi/recommendations - Get AI Execution Recommendations
dataIntelligenceEngineRoutes.get('/recommendations', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recommendations = await getAIExecutionRecommendations();
    res.json({ success: true, recommendations });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/bi/query - Natural Language BI Query Processor
dataIntelligenceEngineRoutes.post('/query', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { queryPrompt } = req.body;
    if (!queryPrompt) {
      res.status(400).json({ error: 'queryPrompt is required.' });
      return;
    }

    const answer = await queryNaturalLanguageBI(queryPrompt);
    res.json({ success: true, ...answer });
  } catch (error: any) {
    console.error('Error processing BI query:', error);
    res.status(400).json({ error: error.message || 'Error processing query' });
  }
});
