import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getProductionHealth,
  runFinancialReconciliation,
  createIncidentRecord,
  verifyIdempotencyKey,
} from '../services/productionReliabilityService';
import { db } from '../config/firebase';

export const productionReliabilityRoutes = Router();

// GET /api/production/health - Get System Health & Component Latencies
productionReliabilityRoutes.get('/health', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const health = await getProductionHealth();
    res.json({ success: true, health });
  } catch (error: any) {
    console.error('Error fetching production health:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/production/reconciliation - Trigger Financial Reconciliation Audit (Admin)
productionReliabilityRoutes.post('/reconciliation', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await runFinancialReconciliation();
    res.json({ success: true, report });
  } catch (error: any) {
    console.error('Error running financial reconciliation:', error);
    res.status(500).json({ error: error.message || 'Error running reconciliation' });
  }
});

// POST /api/production/idempotency/verify - Verify idempotency key
productionReliabilityRoutes.post('/idempotency/verify', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key, actionType } = req.body;
    if (!key || !actionType) {
      res.status(400).json({ error: 'key and actionType are required.' });
      return;
    }

    const result = await verifyIdempotencyKey(key, actionType);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error verifying idempotency key:', error);
    res.status(400).json({ error: error.message || 'Error verifying idempotency key' });
  }
});

// POST /api/production/incidents - Create Production Incident
productionReliabilityRoutes.post('/incidents', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { service, severity, impact, description } = req.body;
    if (!service || !severity || !impact || !description) {
      res.status(400).json({ error: 'service, severity, impact, and description are required.' });
      return;
    }

    const incident = await createIncidentRecord(service, severity, impact, description);
    res.status(201).json({ success: true, incident });
  } catch (error: any) {
    console.error('Error creating incident:', error);
    res.status(400).json({ error: error.message || 'Error creating incident' });
  }
});

// GET /api/production/incidents - Get active production incidents
productionReliabilityRoutes.get('/incidents', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('productionIncidents').limit(50).get();
    const incidents = snap.docs.map((d) => d.data());
    res.json({ success: true, incidents });
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
