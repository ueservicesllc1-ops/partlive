import { Response, Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { validateAndCreditAndroidPurchase, getUserPurchaseHistory } from '../services/purchasesService';

export const purchaseRoutes = Router();

const verifyPurchaseSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  purchaseToken: z.string().min(1, 'purchaseToken is required'),
  packageId: z.string().min(1, 'packageId is required'),
});

// 1. Verify Android purchase and credit coins
purchaseRoutes.post(
  '/android/verify',
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const uid = req.user.uid;
      
      const validation = verifyPurchaseSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'invalid_request',
          message: 'Parámetros inválidos o faltantes',
          details: validation.error.format()
        });
        return;
      }

      const { productId, purchaseToken, packageId } = validation.data;

      console.log(`[IAP] Verifying purchase package: ${packageId}, product: ${productId} for user ${uid}`);

      const result = await validateAndCreditAndroidPurchase(uid, productId, purchaseToken, packageId);

      res.json({
        ok: true,
        purchaseId: result.purchase.id,
        diamondsCredited: result.purchase.totalDiamonds,
        wallet: result.wallet,
      });
    } catch (error: any) {
      console.error('[IAP] Error in purchase verification route:', error);
      
      const message = error.message || 'Verification failed';
      if (message.includes('DUPLICATE_PURCHASE')) {
        res.status(409).json({ error: 'duplicate', message });
      } else if (message.includes('INVALID_PACKAGE')) {
        res.status(400).json({ error: 'invalid_package', message });
      } else if (message.includes('INVALID_PURCHASE_STATE')) {
        res.status(422).json({ error: 'invalid_purchase_state', message });
      } else if (message.includes('WALLET_BLOCKED')) {
        res.status(403).json({ error: 'wallet_blocked', message });
      } else {
        res.status(500).json({ error: 'internal_error', message });
      }
    }
  }
);

// 2. Get purchase history for current user
purchaseRoutes.get(
  '/my',
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const uid = req.user.uid;
      const limitCount = parseInt(req.query.limit as string) || 50;

      const history = await getUserPurchaseHistory(uid, limitCount);
      res.json(history);
    } catch (error: any) {
      console.error('[IAP] Error fetching purchase history:', error);
      res.status(500).json({ error: error?.message || 'Internal server error' });
    }
  }
);
