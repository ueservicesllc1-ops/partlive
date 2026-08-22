import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  recordDoubleEntryLedger,
  getFinancialOverview,
  simulateFinancialScenario,
  calculateBreakEven,
} from '../services/cfoFinancialService';

export const cfoFinancialRoutes = Router();

// GET /api/cfo/overview - Get Real-Time CFO Financial Overview (Admin)
cfoFinancialRoutes.get('/overview', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const overview = await getFinancialOverview();
    res.json({ success: true, overview });
  } catch (error: any) {
    console.error('Error fetching CFO financial overview:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/cfo/ledger - Record Double-Entry Financial Ledger Entry (Admin)
cfoFinancialRoutes.post('/ledger', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { type, source, amountCents, debitAccount, creditAccount, creatorId } = req.body;

    if (!type || !source || !amountCents || !debitAccount || !creditAccount) {
      res.status(400).json({ error: 'type, source, amountCents, debitAccount, and creditAccount are required.' });
      return;
    }

    const record = await recordDoubleEntryLedger(
      type,
      source,
      userId,
      amountCents,
      debitAccount,
      creditAccount,
      creatorId
    );
    res.status(201).json({ success: true, record });
  } catch (error: any) {
    console.error('Error recording ledger entry:', error);
    res.status(400).json({ error: error.message || 'Error recording ledger entry' });
  }
});

// POST /api/cfo/simulate - Run Financial Scenario Simulator (Admin)
cfoFinancialRoutes.post('/simulate', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dauCount, payingPercent, arppuUsd, creatorSharePercent } = req.body;
    if (!dauCount) {
      res.status(400).json({ error: 'dauCount is required.' });
      return;
    }

    const simulation = simulateFinancialScenario(
      Number(dauCount),
      payingPercent ? Number(payingPercent) : 3.5,
      arppuUsd ? Number(arppuUsd) : 25.0,
      creatorSharePercent ? Number(creatorSharePercent) : 50.0
    );

    res.json({ success: true, simulation });
  } catch (error: any) {
    console.error('Error running financial simulation:', error);
    res.status(400).json({ error: error.message || 'Error running simulation' });
  }
});

// GET /api/cfo/breakeven - Get Break-Even Analysis (Admin)
cfoFinancialRoutes.get('/breakeven', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fixedCosts = req.query.fixedCosts ? Number(req.query.fixedCosts) : 5000;
    const breakeven = calculateBreakEven(fixedCosts);
    res.json({ success: true, breakeven });
  } catch (error: any) {
    console.error('Error calculating breakeven:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
