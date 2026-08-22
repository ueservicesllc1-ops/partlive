import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  aggregateShardedTaps,
  processRealtimePresence,
  runLoadTestingSimulation,
  executeDisasterRecoveryFailoverTest,
  getInfrastructureObservabilityMetrics,
  toggleAutoScaling,
} from '../services/scalabilityPerformanceEngine2Service';

export const scalabilityPerformanceEngine2Routes = Router();

// POST /api/scalability-2/sharded-taps - Aggregate High-Frequency Taps
scalabilityPerformanceEngine2Routes.post('/sharded-taps', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { liveId, rawTapBatch } = req.body;
    if (!liveId) {
      res.status(400).json({ error: 'liveId is required.' });
      return;
    }

    const result = await aggregateShardedTaps(liveId, Number(rawTapBatch || 500));
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error aggregating sharded taps:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/scalability-2/presence - Process Ephemeral Presence
scalabilityPerformanceEngine2Routes.post('/presence', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { liveId, status } = req.body;

    if (!liveId) {
      res.status(400).json({ error: 'liveId is required.' });
      return;
    }

    const result = await processRealtimePresence(userId, liveId, status);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error processing presence:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/scalability-2/load-test - Execute Load Testing Simulation
scalabilityPerformanceEngine2Routes.post('/load-test', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { concurrentUsers, concurrentLives } = req.body;
    const result = await runLoadTestingSimulation(Number(concurrentUsers || 100000), Number(concurrentLives || 1000));
    res.status(201).json({ success: true, simulation: result });
  } catch (error: any) {
    console.error('Error running load test simulation:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/scalability-2/dr-failover - Execute Disaster Recovery Failover Test
scalabilityPerformanceEngine2Routes.post('/dr-failover', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await executeDisasterRecoveryFailoverTest();
    res.status(201).json({ success: true, failover: result });
  } catch (error: any) {
    console.error('Error executing DR failover test:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/scalability-2/metrics - Get Observability Metrics
scalabilityPerformanceEngine2Routes.get('/metrics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const metrics = await getInfrastructureObservabilityMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    console.error('Error fetching observability metrics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/scalability-2/auto-scaling - Toggle Auto-Scaling
scalabilityPerformanceEngine2Routes.post('/auto-scaling', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { enabled } = req.body;
    const result = await toggleAutoScaling(Boolean(enabled));
    res.json({ success: true, autoScaling: result });
  } catch (error: any) {
    console.error('Error toggling auto-scaling:', error);
    res.status(400).json({ error: error.message || 'Error toggling auto-scaling' });
  }
});
