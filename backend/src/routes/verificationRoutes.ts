import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  submitVerificationRequest,
  reviewVerificationRequest,
  getVerificationDownloadUrl
} from '../services/verificationService';
import { db } from '../config/firebase';

export const verificationRoutes = Router();

// POST /api/verification/submit - Submit a verification application
verificationRoutes.post('/submit', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { realName, documentNumber, documentType, idDocumentUrl, selfieUrl, role } = req.body;

    if (!realName || !documentNumber || !documentType || !idDocumentUrl || !selfieUrl || !role) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }

    const requestId = await submitVerificationRequest(
      userId,
      realName,
      documentNumber,
      documentType,
      idDocumentUrl,
      selfieUrl,
      role
    );

    res.status(201).json({ success: true, requestId });
  } catch (error: any) {
    console.error('Error submitting verification:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/verification/review/:requestId - Review and approve/reject verification application
verificationRoutes.post('/review/:requestId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminUserId = req.user.uid;
    const { requestId } = req.params;
    const { status, notes } = req.body;

    // Verify requesting user is admin
    const adminDoc = await db.collection('users').doc(adminUserId).get();
    if (!adminDoc.exists || adminDoc.data()!.role !== 'admin') {
      res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
      return;
    }

    if (!status || (status !== 'approved' && status !== 'rejected')) {
      res.status(400).json({ error: 'Valid status ("approved" | "rejected") is required.' });
      return;
    }

    await reviewVerificationRequest(requestId as string, adminUserId, status, notes);
    res.json({ success: true, message: `Verification request ${status}.` });
  } catch (error: any) {
    console.error('Error reviewing verification:', error);
    res.status(400).json({ error: error.message || 'Error processing review' });
  }
});

// GET /api/verification/download-url - Fetch a secure signed URL for KYC assets
verificationRoutes.get('/download-url', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user.uid;
    const { fileKey } = req.query;

    if (!fileKey || typeof fileKey !== 'string') {
      res.status(400).json({ error: 'fileKey query parameter is required.' });
      return;
    }

    // Authorization: User must be admin OR the owner of the folder (verification/{requesterId}/)
    const requesterDoc = await db.collection('users').doc(requesterId).get();
    const isAdmin = requesterDoc.exists && requesterDoc.data()!.role === 'admin';
    const isOwner = fileKey.includes(`verification/${requesterId}/`);

    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: 'Access denied. You do not have permission to view this file.' });
      return;
    }

    const downloadUrl = await getVerificationDownloadUrl(fileKey);
    res.json({ success: true, downloadUrl });
  } catch (error: any) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
