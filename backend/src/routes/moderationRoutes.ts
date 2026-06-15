import { Router } from 'express';
import { z } from 'zod';
import { requireAdminOrModerator } from '../middleware/adminMiddleware';
import * as moderationService from '../services/moderationService';

const router = Router();

// Todas las rutas de moderación requieren rol admin o moderator
router.use(requireAdminOrModerator);

// --- Reports ---

router.get('/reports', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      targetType: req.query.targetType as string,
      reason: req.query.reason as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    };
    const reports = await moderationService.getReports(filters);
    res.json({ reports });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports/:reportId', async (req, res) => {
  try {
    const report = await moderationService.getReportById(req.params.reportId);
    res.json({ report });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/reports/:reportId/reviewing', async (req, res) => {
  try {
    await moderationService.updateReportStatus(req.params.reportId, (req as any).user.uid, 'reviewing');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reports/:reportId/resolve', async (req, res) => {
  try {
    const schema = z.object({
      actionTaken: z.string(),
      note: z.string().optional(),
    });
    const { actionTaken, note } = schema.parse(req.body);
    await moderationService.resolveReport(req.params.reportId, (req as any).user.uid, actionTaken, note);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/reports/:reportId/reject', async (req, res) => {
  try {
    const schema = z.object({
      note: z.string().optional(),
    });
    const { note } = schema.parse(req.body);
    await moderationService.rejectReport(req.params.reportId, (req as any).user.uid, note);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- User Actions ---

router.post('/users/:userId/warn', async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string(),
      reportId: z.string().optional(),
    });
    const { reason, reportId } = schema.parse(req.body);
    await moderationService.warnUser(req.params.userId, (req as any).user.uid, reason, reportId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/users/:userId/suspend', async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string(),
      durationHours: z.number().optional().default(24),
      reportId: z.string().optional(),
    });
    const { reason, durationHours, reportId } = schema.parse(req.body);
    await moderationService.suspendUser(req.params.userId, (req as any).user.uid, reason, durationHours, reportId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/users/:userId/unsuspend', async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string().optional(),
    });
    const { reason } = schema.parse(req.body);
    await moderationService.unsuspendUser(req.params.userId, (req as any).user.uid, reason);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/users/:userId/ban', async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string(),
      reportId: z.string().optional(),
    });
    const { reason, reportId } = schema.parse(req.body);
    await moderationService.banUser(req.params.userId, (req as any).user.uid, reason, reportId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/users/:userId/unban', async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string().optional(),
    });
    const { reason } = schema.parse(req.body);
    await moderationService.unbanUser(req.params.userId, (req as any).user.uid, reason);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- Content Actions ---

router.post('/messages/hide', async (req, res) => {
  try {
    const schema = z.object({
      targetType: z.enum(['room', 'live']),
      parentId: z.string(),
      messageId: z.string(),
      reason: z.string(),
      reportId: z.string().optional(),
    });
    const { targetType, parentId, messageId, reason, reportId } = schema.parse(req.body);
    await moderationService.hideMessage(targetType, parentId, messageId, (req as any).user.uid, reason, reportId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/rooms/:roomId/close', async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string(),
      reportId: z.string().optional(),
    });
    const { reason, reportId } = schema.parse(req.body);
    await moderationService.closeRoom(req.params.roomId, (req as any).user.uid, reason, reportId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/rooms/:roomId/suspend', async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string(),
      reportId: z.string().optional(),
    });
    const { reason, reportId } = schema.parse(req.body);
    await moderationService.suspendRoom(req.params.roomId, (req as any).user.uid, reason, reportId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/lives/:liveId/end', async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string(),
      reportId: z.string().optional(),
    });
    const { reason, reportId } = schema.parse(req.body);
    await moderationService.endLive(req.params.liveId, (req as any).user.uid, reason, reportId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- Wallet Actions ---

router.post('/wallets/:userId/lock', async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string(),
      reportId: z.string().optional(),
    });
    const { reason, reportId } = schema.parse(req.body);
    await moderationService.lockWallet(req.params.userId, (req as any).user.uid, reason, reportId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/wallets/:userId/unlock', async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string().optional(),
    });
    const { reason } = schema.parse(req.body);
    await moderationService.unlockWallet(req.params.userId, (req as any).user.uid, reason);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const logs = await moderationService.getModerationLogs(limit);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
