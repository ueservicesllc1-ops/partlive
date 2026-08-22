import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  evaluateRiskScore,
  enforceIdempotencyKey,
  detectAccountTakeover,
  verifyPayoutSecurity,
  toggleSecurityKillSwitch,
  getSecurityKillSwitchesState,
} from '../services/trustSafetyEngineService';

export const trustSafetyEngineRoutes = Router();

// POST /api/trust/risk-score - Evaluate Risk Score
trustSafetyEngineRoutes.post('/risk-score', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entityId, entityType, context } = req.body;
    if (!entityId || !entityType) {
      res.status(400).json({ error: 'entityId and entityType are required.' });
      return;
    }

    const evaluation = await evaluateRiskScore(entityId, entityType, context);
    res.json({ success: true, evaluation });
  } catch (error: any) {
    console.error('Error evaluating risk score:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/trust/idempotency - Execute Idempotent Transaction
trustSafetyEngineRoutes.post('/idempotency', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { idempotencyKey, amountCents } = req.body;

    if (!idempotencyKey) {
      res.status(400).json({ error: 'idempotencyKey is required.' });
      return;
    }

    const result = await enforceIdempotencyKey(userId, idempotencyKey, async () => {
      return {
        transactionId: 'tx_safe_' + Date.now(),
        amountCents: amountCents || 1000,
        status: 'SUCCESS',
        processedAt: new Date().toISOString(),
      };
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error enforcing idempotency:', error);
    res.status(400).json({ error: error.message || 'Error executing transaction' });
  }
});

// POST /api/trust/takeover-check - Account Takeover Security Check
trustSafetyEngineRoutes.post('/takeover-check', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { deviceId, ipAddress, action } = req.body;

    const result = await detectAccountTakeover(userId, deviceId || 'unknown_device', ipAddress || '127.0.0.1', action || 'LOGIN');
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error checking account takeover:', error);
    res.status(400).json({ error: error.message || 'Error checking takeover' });
  }
});

// POST /api/trust/payout/verify - Verify Payout Security
trustSafetyEngineRoutes.post('/payout/verify', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { amountCents } = req.body;

    const result = await verifyPayoutSecurity(userId, Number(amountCents || 10000));
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error verifying payout security:', error);
    res.status(400).json({ error: error.message || 'Error verifying payout' });
  }
});

// POST /api/trust/kill-switch - Toggle Emergency Kill Switch (Admin)
trustSafetyEngineRoutes.post('/kill-switch', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { target, status } = req.body;

    if (!target || !status) {
      res.status(400).json({ error: 'target and status are required.' });
      return;
    }

    const updated = await toggleSecurityKillSwitch(target, status, adminId);
    res.json({ success: true, killSwitch: updated });
  } catch (error: any) {
    console.error('Error toggling kill switch:', error);
    res.status(400).json({ error: error.message || 'Error toggling kill switch' });
  }
});

// GET /api/trust/kill-switches - Get All Security Kill Switches State
trustSafetyEngineRoutes.get('/kill-switches', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const states = getSecurityKillSwitchesState();
    res.json({ success: true, killSwitches: states });
  } catch (error: any) {
    console.error('Error fetching kill switches:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
