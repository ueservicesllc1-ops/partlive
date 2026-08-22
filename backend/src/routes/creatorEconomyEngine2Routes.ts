import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getCreatorEarningProfile,
  getCreatorMissionsAndMilestones,
  askCreatorAiAssistant,
  getAgencyEconomicsOverview,
  runEconomySimulation,
  recordEconomyChangeControl,
} from '../services/creatorEconomyEngine2Service';

export const creatorEconomyEngine2Routes = Router();

// GET /api/creator-economy-2/profile - Get Creator Earning Profile & Level
creatorEconomyEngine2Routes.get('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = (req.query.creatorId as string) || req.user.uid;
    const profile = await getCreatorEarningProfile(creatorId);
    res.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error fetching creator earning profile:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/creator-economy-2/missions - Get Creator Missions & Milestones
creatorEconomyEngine2Routes.get('/missions', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = (req.query.creatorId as string) || req.user.uid;
    const missions = await getCreatorMissionsAndMilestones(creatorId);
    res.json({ success: true, ...missions });
  } catch (error: any) {
    console.error('Error fetching creator missions:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/creator-economy-2/ai-assistant - Consult Creator AI Assistant
creatorEconomyEngine2Routes.post('/ai-assistant', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.user.uid;
    const { question } = req.body;

    const advice = await askCreatorAiAssistant(creatorId, question || '¿A qué hora debo transmitir en vivo?');
    res.json({ success: true, advice });
  } catch (error: any) {
    console.error('Error consulting creator AI assistant:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/creator-economy-2/agency-overview - Get Agency Economics Overview
creatorEconomyEngine2Routes.get('/agency-overview', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const agencyId = (req.query.agencyId as string) || 'agency_latam_top';
    const overview = await getAgencyEconomicsOverview(agencyId);
    res.json({ success: true, overview });
  } catch (error: any) {
    console.error('Error fetching agency economics overview:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/creator-economy-2/simulator - Run Platform Economy Simulator
creatorEconomyEngine2Routes.post('/simulator', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { coinPriceUsd, creatorRevenueSharePercent, agencySharePercent, monthlyPurchasersCount, avgSpentPerPurchaserUsd, infrastructureCostUsd } = req.body;

    const simulation = await runEconomySimulation({
      coinPriceUsd: Number(coinPriceUsd || 0.01),
      creatorRevenueSharePercent: Number(creatorRevenueSharePercent || 60),
      agencySharePercent: Number(agencySharePercent || 10),
      monthlyPurchasersCount: Number(monthlyPurchasersCount || 10000),
      avgSpentPerPurchaserUsd: Number(avgSpentPerPurchaserUsd || 15),
      infrastructureCostUsd: Number(infrastructureCostUsd || 12000),
    });

    res.json({ success: true, simulation });
  } catch (error: any) {
    console.error('Error running economy simulation:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/creator-economy-2/change-control - Record Economic Parameter Change
creatorEconomyEngine2Routes.post('/change-control', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { changeType, payload } = req.body;

    if (!changeType) {
      res.status(400).json({ error: 'changeType is required.' });
      return;
    }

    const log = await recordEconomyChangeControl(adminId, changeType, payload);
    res.status(201).json({ success: true, changeLog: log });
  } catch (error: any) {
    console.error('Error recording economy change log:', error);
    res.status(400).json({ error: error.message || 'Error recording economy change log' });
  }
});
