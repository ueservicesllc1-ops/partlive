import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getPerformanceBaseline,
  executeBackgroundJobQueue,
  executeCircuitBreaker,
  getCircuitBreakersState,
  calculateInfrastructureCostModel,
  executeDisasterRecoveryBackupAndRestoreTest,
} from '../services/infrastructurePerformanceService';

export const infrastructurePerformanceRoutes = Router();

// GET /api/infra/baseline - Get Latency Benchmarks & SLO Error Budgets
infrastructurePerformanceRoutes.get('/baseline', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const baseline = await getPerformanceBaseline();
    res.json({ success: true, baseline });
  } catch (error: any) {
    console.error('Error fetching latency baseline:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/infra/jobs - Enqueue Background Job
infrastructurePerformanceRoutes.post('/jobs', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobType, payload, simulateFailure } = req.body;
    if (!jobType) {
      res.status(400).json({ error: 'jobType is required.' });
      return;
    }

    const job = await executeBackgroundJobQueue(jobType, payload || {}, Boolean(simulateFailure));
    res.status(201).json({ success: true, job });
  } catch (error: any) {
    console.error('Error enqueueing job:', error);
    res.status(400).json({ error: error.message || 'Error enqueueing job' });
  }
});

// GET /api/infra/circuit-breakers - Get Circuit Breakers Status
infrastructurePerformanceRoutes.get('/circuit-breakers', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const states = getCircuitBreakersState();
    res.json({ success: true, circuitBreakers: states });
  } catch (error: any) {
    console.error('Error fetching circuit breakers:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/infra/circuit-breakers/test - Test Circuit Breaker Action
infrastructurePerformanceRoutes.post('/circuit-breakers/test', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { serviceName, fail } = req.body;
    const name = serviceName || 'PAYMENT_STRIPE';

    const result = await executeCircuitBreaker(name, async () => {
      if (fail) throw new Error('EXTERNAL_PROVIDER_TIMEOUT');
      return { status: 'OK', providerResponse: 200 };
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/infra/cost-model - Get Cost-per-User & Infrastructure Economics
infrastructurePerformanceRoutes.get('/cost-model', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const model = await calculateInfrastructureCostModel();
    res.json({ success: true, costModel: model });
  } catch (error: any) {
    console.error('Error calculating cost model:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/infra/disaster-recovery - Run Backup & Restore Test
infrastructurePerformanceRoutes.post('/disaster-recovery', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const drTest = await executeDisasterRecoveryBackupAndRestoreTest();
    res.status(201).json({ success: true, drTest });
  } catch (error: any) {
    console.error('Error running DR test:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
