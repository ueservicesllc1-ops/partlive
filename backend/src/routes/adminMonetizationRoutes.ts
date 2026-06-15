import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { requireAdmin, requireAdminOrModerator } from '../middleware/adminMiddleware';
import { getRevenueSummary } from '../services/revenueService';
import { approveAgency, rejectAgency } from '../services/agencyService';
import { updateUserRiskScore } from '../services/fraudService';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export const adminMonetizationRoutes = Router();

// GET /api/admin/monetization/revenue - Get revenue summary
adminMonetizationRoutes.get(
  '/revenue',
  requireAuth,
  requireAdminOrModerator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const summary = await getRevenueSummary(limit);
      res.json(summary);
    } catch (error: any) {
      console.error('Error getting revenue summary:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

// GET /api/admin/monetization/fraud-signals - List all fraud signals
adminMonetizationRoutes.get(
  '/fraud-signals',
  requireAuth,
  requireAdminOrModerator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const snap = await db.collection('fraudSignals')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const signals: any[] = [];
      snap.forEach(doc => {
        signals.push({ id: doc.id, ...doc.data() });
      });

      res.json(signals);
    } catch (error: any) {
      console.error('Error getting fraud signals:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

// POST /api/admin/monetization/fraud-signals/:id/resolve - Resolve a fraud signal
adminMonetizationRoutes.post(
  '/fraud-signals/:id/resolve',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const signalId = req.params.id as string;
      const signalRef = db.collection('fraudSignals').doc(signalId);
      const signalSnap = await signalRef.get();

      if (!signalSnap.exists) {
        res.status(404).json({ error: 'Fraud signal not found' });
        return;
      }

      const signal = signalSnap.data()!;
      await signalRef.update({
        status: 'resolved',
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Recalculate user risk score
      const updatedRisk = await updateUserRiskScore(signal.userId);

      res.json({ success: true, updatedRisk });
    } catch (error: any) {
      console.error('Error resolving fraud signal:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

// GET /api/admin/monetization/agencies - List all agencies (pending and approved)
adminMonetizationRoutes.get(
  '/agencies',
  requireAuth,
  requireAdminOrModerator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const snap = await db.collection('agencies')
        .orderBy('createdAt', 'desc')
        .get();

      const agencies: any[] = [];
      snap.forEach(doc => {
        agencies.push({ id: doc.id, ...doc.data() });
      });

      res.json(agencies);
    } catch (error: any) {
      console.error('Error getting agencies list:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

// POST /api/admin/monetization/agencies/:id/approve - Approve an agency application
adminMonetizationRoutes.post(
  '/agencies/:id/approve',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const agencyId = req.params.id as string;
      const { commissionPercent } = req.body;

      await approveAgency(agencyId, commissionPercent ? Number(commissionPercent) : undefined);
      res.json({ success: true, message: 'Agency approved successfully' });
    } catch (error: any) {
      console.error('Error approving agency:', error);
      res.status(400).json({ error: error.message || 'Error approving agency' });
    }
  }
);

// POST /api/admin/monetization/agencies/:id/reject - Reject an agency application
adminMonetizationRoutes.post(
  '/agencies/:id/reject',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const agencyId = req.params.id as string;
      await rejectAgency(agencyId);
      res.json({ success: true, message: 'Agency rejected successfully' });
    } catch (error: any) {
      console.error('Error rejecting agency:', error);
      res.status(400).json({ error: error.message || 'Error rejecting agency' });
    }
  }
);
