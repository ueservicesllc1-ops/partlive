import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getStoreReadinessChecklist,
  requestAccountDeletion,
  exportPersonalData,
  createSupportTicket,
  getProductionLaunchGateStatus,
  recordReleaseAudit,
} from '../services/appStoreCompliance2Service';

export const appStoreCompliance2Routes = Router();

// GET /api/compliance-2/readiness - Get App Store & Google Play Readiness
appStoreCompliance2Routes.get('/readiness', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const checklist = await getStoreReadinessChecklist();
    res.json({ success: true, checklist });
  } catch (error: any) {
    console.error('Error fetching store readiness checklist:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/compliance-2/account-deletion - Request Account Deletion Flow
appStoreCompliance2Routes.post('/account-deletion', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { justification } = req.body;

    const deletion = await requestAccountDeletion(userId, justification);
    res.status(201).json({ success: true, deletion });
  } catch (error: any) {
    console.error('Error requesting account deletion:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/compliance-2/data-export - Request Personal Data Export
appStoreCompliance2Routes.post('/data-export', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const dataExport = await exportPersonalData(userId);
    res.status(201).json({ success: true, export: dataExport });
  } catch (error: any) {
    console.error('Error generating data export:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/compliance-2/support-ticket - Create Support Ticket
appStoreCompliance2Routes.post('/support-ticket', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { category, subject, description, linkedTransactionId } = req.body;

    if (!category || !subject || !description) {
      res.status(400).json({ error: 'category, subject, and description are required.' });
      return;
    }

    const ticket = await createSupportTicket(userId, category, subject, description, linkedTransactionId);
    res.status(201).json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/compliance-2/launch-gates - Get Production Launch Gate Status
appStoreCompliance2Routes.get('/launch-gates', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const gates = await getProductionLaunchGateStatus();
    res.json({ success: true, gates });
  } catch (error: any) {
    console.error('Error fetching launch gates:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/compliance-2/release-audit - Record Official Release Audit
appStoreCompliance2Routes.post('/release-audit', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const approverId = req.user.uid;
    const { version, buildNumber } = req.body;

    if (!version || !buildNumber) {
      res.status(400).json({ error: 'version and buildNumber are required.' });
      return;
    }

    const audit = await recordReleaseAudit(version, Number(buildNumber), approverId);
    res.status(201).json({ success: true, audit });
  } catch (error: any) {
    console.error('Error recording release audit:', error);
    res.status(400).json({ error: error.message || 'Error recording release audit' });
  }
});
