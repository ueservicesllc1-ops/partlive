import { Response, Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  ensureUserWallet,
  executeWalletTransaction,
} from '../services/walletAdminService';
import { db } from '../config/firebase';

export const walletRoutes = Router();

// 1. Get current user's wallet
walletRoutes.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const wallet = await ensureUserWallet(uid);
    res.json(wallet);
  } catch (error: any) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// 2. Get current user's wallet transactions
walletRoutes.get('/transactions', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const limitCount = parseInt(req.query.limit as string) || 50;

    const snapshot = await db
      .collection('walletTransactions')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(transactions);
  } catch (error: any) {
    console.error('Error fetching wallet transactions:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// Helper for development credit routes
const handleDevCredit = async (
  req: AuthRequest,
  res: Response,
  currencyType: 'coins' | 'diamonds'
): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Forbidden: Development route not allowed in production environment' });
    return;
  }

  try {
    const uid = req.user.uid;
    const { amount, description } = req.body;

    if (typeof amount !== 'number' || amount <= 0 || amount > 100000) {
      res.status(400).json({ error: 'Invalid amount: Must be a number between 1 and 100,000' });
      return;
    }

    const updatedWallet = await executeWalletTransaction({
      userId: uid,
      amount,
      type: 'adjustment',
      direction: 'credit',
      currencyType,
      description: description || `Credit dev ${currencyType}`,
    });

    res.json({
      success: true,
      wallet: updatedWallet,
    });
  } catch (error: any) {
    console.error(`Error executing dev credit for ${currencyType}:`, error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
};

// 3. POST dev credit coins
walletRoutes.post('/dev/credit-coins', requireAuth, async (req: AuthRequest, res: Response) => {
  await handleDevCredit(req, res, 'coins');
});

// 4. POST dev credit diamonds
walletRoutes.post('/dev/credit-diamonds', requireAuth, async (req: AuthRequest, res: Response) => {
  await handleDevCredit(req, res, 'diamonds');
});
