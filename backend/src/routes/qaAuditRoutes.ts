import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getQAInventory,
  runFullPlatformAudit,
  evaluateProductionGate,
  verifyFinancialConcurrency,
} from '../services/qaAuditService';

export const qaAuditRoutes = Router();

// GET /api/qa/inventory - Get Master QA Inventory for all 31 phases
qaAuditRoutes.get('/inventory', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inventory = await getQAInventory();
    res.json({ success: true, inventory });
  } catch (error: any) {
    console.error('Error fetching QA inventory:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/qa/audit/run - Trigger Full Platform Audit
qaAuditRoutes.post('/audit/run', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await runFullPlatformAudit();
    res.json({ success: true, report });
  } catch (error: any) {
    console.error('Error running full platform audit:', error);
    res.status(500).json({ error: error.message || 'Error running audit' });
  }
});

// GET /api/qa/gate - Get Production Gate GO / NO-GO Decision
qaAuditRoutes.get('/gate', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const decision = await evaluateProductionGate();
    res.json({ success: true, decision });
  } catch (error: any) {
    console.error('Error evaluating production gate:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/qa/concurrency-test - Test financial concurrency lock
qaAuditRoutes.post('/concurrency-test', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const result = await verifyFinancialConcurrency(userId, 80);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error testing financial concurrency:', error);
    res.status(400).json({ error: error.message || 'Error testing concurrency' });
  }
});
