import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  publishLegalDocument,
  recordTermsAcceptance,
  updateUserConsent,
  submitPrivacyRequest,
  processPrivacyRequest,
} from '../services/legalComplianceService';
import { db } from '../config/firebase';

export const legalComplianceRoutes = Router();

// POST /api/legal/documents - Publish new legal document version (Admin)
legalComplianceRoutes.post('/documents', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { documentType, title, content, version } = req.body;

    if (!documentType || !title || !content || !version) {
      res.status(400).json({ error: 'documentType, title, content, and version are required.' });
      return;
    }

    const docItem = await publishLegalDocument(documentType, title, content, version, adminId);
    res.status(201).json({ success: true, document: docItem });
  } catch (error: any) {
    console.error('Error publishing legal document:', error);
    res.status(400).json({ error: error.message || 'Error publishing document' });
  }
});

// POST /api/legal/accept - Record user terms acceptance
legalComplianceRoutes.post('/accept', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { documentType, version, country, platform } = req.body;

    if (!documentType || !version) {
      res.status(400).json({ error: 'documentType and version are required.' });
      return;
    }

    const acceptance = await recordTermsAcceptance(userId, documentType, version, country, platform);
    res.json({ success: true, acceptance });
  } catch (error: any) {
    console.error('Error recording terms acceptance:', error);
    res.status(400).json({ error: error.message || 'Error recording acceptance' });
  }
});

// POST /api/legal/consent - Update granular privacy consent
legalComplianceRoutes.post('/consent', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { consentType, granted } = req.body;

    if (!consentType || typeof granted !== 'boolean') {
      res.status(400).json({ error: 'consentType and granted boolean are required.' });
      return;
    }

    const consent = await updateUserConsent(userId, consentType, granted);
    res.json({ success: true, consent });
  } catch (error: any) {
    console.error('Error updating consent:', error);
    res.status(400).json({ error: error.message || 'Error updating consent' });
  }
});

// POST /api/legal/privacy-requests - Submit privacy request (Data Export / Delete Account)
legalComplianceRoutes.post('/privacy-requests', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { requestType, justification } = req.body;

    if (!requestType) {
      res.status(400).json({ error: 'requestType is required.' });
      return;
    }

    const request = await submitPrivacyRequest(userId, requestType, justification);
    res.status(201).json({ success: true, request });
  } catch (error: any) {
    console.error('Error submitting privacy request:', error);
    res.status(400).json({ error: error.message || 'Error submitting request' });
  }
});

// GET /api/legal/privacy-requests - Get privacy requests (Admin)
legalComplianceRoutes.get('/privacy-requests', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const snap = await db.collection('privacyRequests').limit(100).get();
    const requests = snap.docs.map((d) => d.data());
    res.json({ success: true, requests });
  } catch (error: any) {
    console.error('Error fetching privacy requests:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/legal/privacy-requests/:id/process - Process privacy request (Admin)
legalComplianceRoutes.post('/privacy-requests/:id/process', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!status) {
      res.status(400).json({ error: 'status is required.' });
      return;
    }

    const request = await processPrivacyRequest(id as string, status, resolutionNotes || '', adminId);
    res.json({ success: true, request });
  } catch (error: any) {
    console.error('Error processing privacy request:', error);
    res.status(400).json({ error: error.message || 'Error processing request' });
  }
});
