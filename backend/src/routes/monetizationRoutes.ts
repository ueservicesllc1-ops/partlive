import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { getOrCreateWallet } from '../services/monetizationService';
import { db } from '../config/firebase';

export const monetizationRoutes = Router();

// GET /api/monetization/wallet - Get or create user wallet
monetizationRoutes.get('/wallet', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const wallet = await getOrCreateWallet(uid);
    res.json(wallet);
  } catch (error: any) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/monetization/packages - Get all active diamond packages
monetizationRoutes.get('/packages', async (req, res): Promise<void> => {
  try {
    const snapshot = await db.collection('diamondPackages')
      .where('isActive', '==', true)
      .orderBy('priceUsd', 'asc')
      .get();
    
    const packages: any[] = [];
    snapshot.forEach(doc => {
      packages.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(packages);
  } catch (error: any) {
    console.error('Error fetching diamond packages:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
