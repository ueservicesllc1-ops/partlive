import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  applyForAgency,
  addHostToAgency,
  removeHostFromAgency,
  getAgencyDashboard
} from '../services/agencyService';
import { db } from '../config/firebase';

export const agencyRoutes = Router();

// Helper to get active agency by owner ID
const getAgencyByOwner = async (ownerId: string) => {
  const snap = await db.collection('agencies')
    .where('ownerId', '==', ownerId)
    .where('status', '==', 'approved')
    .limit(1)
    .get();
  
  if (snap.empty) return null;
  return snap.docs[0].data();
};

// POST /api/agencies/apply - Apply for agency status
agencyRoutes.post('/apply', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user.uid;
    const { name, country, email, phone } = req.body;

    if (!name || !country || !email) {
      res.status(400).json({ error: 'Name, country, and email are required fields.' });
      return;
    }

    // Check if user already owns an agency
    const existingSnap = await db.collection('agencies')
      .where('ownerId', '==', ownerId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      res.status(400).json({ error: 'You have already applied for or own an agency.' });
      return;
    }

    const agencyId = await applyForAgency(ownerId, name, country, email, phone);
    res.status(201).json({ success: true, agencyId });
  } catch (error: any) {
    console.error('Error applying for agency:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/agencies/dashboard - Get agency dashboard if approved owner
agencyRoutes.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user.uid;
    const agency = await getAgencyByOwner(ownerId);
    
    if (!agency) {
      res.status(403).json({ error: 'No approved agency found for this user.' });
      return;
    }

    const dashboard = await getAgencyDashboard(agency.id);
    res.json(dashboard);
  } catch (error: any) {
    console.error('Error fetching agency dashboard:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/agencies/hosts - Add host to agency
agencyRoutes.post('/hosts', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user.uid;
    const { hostId } = req.body;

    if (!hostId) {
      res.status(400).json({ error: 'hostId is required.' });
      return;
    }

    const agency = await getAgencyByOwner(ownerId);
    if (!agency) {
      res.status(403).json({ error: 'Only approved agency owners can add hosts.' });
      return;
    }

    // Verify if host is not already in an agency
    const existingLink = await db.collection('agencyHosts')
      .where('hostId', '==', hostId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!existingLink.empty) {
      res.status(400).json({ error: 'This host is already active in another agency.' });
      return;
    }

    await addHostToAgency(agency.id, hostId);
    res.json({ success: true, message: 'Host added to agency.' });
  } catch (error: any) {
    console.error('Error adding host to agency:', error);
    res.status(400).json({ error: error.message || 'Error adding host' });
  }
});

// POST /api/agencies/invite - Send recruitment invitation
agencyRoutes.post('/invite', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user.uid;
    const { userId } = req.body;

    const agency = await getAgencyByOwner(ownerId);
    if (!agency) {
      res.status(403).json({ error: 'Solo propietarios de agencia pueden enviar invitaciones.' });
      return;
    }

    const { inviteUserToAgency } = await import('../services/agencyService');
    const inviteId = await inviteUserToAgency(agency.id, userId);
    res.status(201).json({ success: true, inviteId });
  } catch (error: any) {
    console.error('Error inviting host:', error);
    res.status(400).json({ error: error.message || 'Error inviting host' });
  }
});

// POST /api/agencies/respond-invite - Accept or reject agency invitation
agencyRoutes.post('/respond-invite', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { inviteId, accept } = req.body;

    const { respondToAgencyInvite } = await import('../services/agencyService');
    await respondToAgencyInvite(inviteId, userId, !!accept);
    res.json({ success: true, message: 'Respuesta registrada.' });
  } catch (error: any) {
    console.error('Error responding to agency invite:', error);
    res.status(400).json({ error: error.message || 'Error responding to invite' });
  }
});
