import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { Mission } from '../types/mission';
import * as missionService from '../services/missionService';

const router = Router();

// List all missions (admin)
router.get('/', requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const snapshot = await db.collection('missions').orderBy('sortOrder', 'asc').get();
    const missions: Mission[] = [];
    snapshot.forEach((doc) => {
      missions.push(doc.data() as Mission);
    });
    res.json(missions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new mission (admin)
router.post('/', requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const missionData = req.body;
    const docRef = db.collection('missions').doc();
    const newMission = {
      ...missionData,
      id: docRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await docRef.set(newMission);
    res.json({ success: true, mission: newMission });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update mission details (admin)
router.patch('/:missionId', requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const { missionId } = req.params;
    const updates = req.body;
    const docRef = db.collection('missions').doc(missionId);
    
    await docRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    res.json({ success: true, message: 'Mission updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Activate mission
router.post('/:missionId/activate', requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const { missionId } = req.params;
    await db.collection('missions').doc(missionId).update({
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true, message: 'Mission activated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Deactivate mission
router.post('/:missionId/deactivate', requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const { missionId } = req.params;
    await db.collection('missions').doc(missionId).update({
      status: 'inactive',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true, message: 'Mission deactivated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all mission rewards history (admin)
router.get('/rewards', requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const snapshot = await db.collection('missionRewards').orderBy('createdAt', 'desc').limit(100).get();
    const rewards: any[] = [];
    snapshot.forEach((doc) => {
      rewards.push(doc.data());
    });
    res.json(rewards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Revert/Reverse a claimed reward (admin)
router.post('/rewards/:rewardId/reverse', requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const { rewardId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.uid;

    if (!reason) {
      res.status(400).json({ error: 'Reason for reversal is required' });
      return;
    }

    await missionService.reverseMissionReward(rewardId, adminId, reason);
    res.json({ success: true, message: 'Reward successfully reversed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Run Seeder Endpoint
router.post('/seed', requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    await missionService.seedDefaultMissions();
    res.json({ success: true, message: 'Missions seeded successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
