import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getMasterAuditInventory,
  testFinancialDoubleSpendSecurity,
  verifyEndToEndMoneyFlowTraceability,
  testFirestoreSecurityRulesIntegrity,
  getFinalProductionReadinessScorecard,
  recordMasterAuditSignoff,
} from '../services/masterAuditEngine2Service';

export const masterAuditEngine2Routes = Router();

// GET /api/master-audit-2/inventory - Get 56-Phase Full-System Inventory
masterAuditEngine2Routes.get('/inventory', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inventory = await getMasterAuditInventory();
    res.json({ success: true, count: inventory.length, inventory });
  } catch (error: any) {
    console.error('Error fetching master audit inventory:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/master-audit-2/double-spend-test - Test Financial Double-Spend Security
masterAuditEngine2Routes.post('/double-spend-test', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await testFinancialDoubleSpendSecurity();
    res.json({ success: true, doubleSpendTest: result });
  } catch (error: any) {
    console.error('Error executing double spend test:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/master-audit-2/money-flow-trace - Verify End-to-End Money Flow Traceability
masterAuditEngine2Routes.get('/money-flow-trace', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trace = await verifyEndToEndMoneyFlowTraceability();
    res.json({ success: true, moneyFlowTrace: trace });
  } catch (error: any) {
    console.error('Error verifying money flow traceability:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/master-audit-2/security-test - Test Firestore Security Rules Write Penetration
masterAuditEngine2Routes.get('/security-test', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const securityTest = await testFirestoreSecurityRulesIntegrity();
    res.json({ success: true, securityTest });
  } catch (error: any) {
    console.error('Error executing security rules test:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/master-audit-2/scorecard - Get Final Production Readiness Scorecard
masterAuditEngine2Routes.get('/scorecard', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const scorecard = await getFinalProductionReadinessScorecard();
    res.json({ success: true, scorecard });
  } catch (error: any) {
    console.error('Error fetching production scorecard:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/master-audit-2/signoff - Record Official Master Audit Sign-Off
masterAuditEngine2Routes.post('/signoff', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const signoff = await recordMasterAuditSignoff(adminId);
    res.status(201).json({ success: true, signoff });
  } catch (error: any) {
    console.error('Error recording master audit signoff:', error);
    res.status(400).json({ error: error.message || 'Error recording master audit signoff' });
  }
});
