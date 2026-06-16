import { Response, Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  createPurchaseOrder,
  verifyGooglePlayPurchase,
  markOrderFailed,
  adminRefundPurchase,
  adminDisputePurchase,
  getUserPurchaseHistory
} from '../services/purchasesService';

export const purchaseRoutes = Router();

// Zod schemas
const createOrderSchema = z.object({
  packageId: z.string().min(1, 'packageId is required'),
  provider: z.enum(['google_play', 'app_store', 'stripe', 'manual', 'local_gateway']),
});

const verifyPurchaseSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  purchaseToken: z.string().min(1, 'purchaseToken is required'),
  productId: z.string().min(1, 'productId is required'),
});

const markFailedSchema = z.object({
  failureReason: z.string().optional(),
});

const adminRefundSchema = z.object({
  refundReason: z.string().min(1, 'refundReason is required'),
});

// 1. Create a purchase order
purchaseRoutes.post(
  '/orders/create',
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const uid = req.user.uid;
      const validation = createOrderSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'invalid_request',
          message: 'Parámetros inválidos',
          details: validation.error.format()
        });
        return;
      }

      const { packageId, provider } = validation.data;
      const order = await createPurchaseOrder(uid, packageId, provider);

      res.status(201).json({
        orderId: order.id,
        googlePlayProductId: order.googlePlayProductId,
        status: order.status,
      });
    } catch (error: any) {
      console.error('[IAP] Error creating purchase order:', error);
      res.status(500).json({ error: 'internal_error', message: error.message });
    }
  }
);

// 2. Verify Google Play purchase
purchaseRoutes.post(
  '/google-play/verify',
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const uid = req.user.uid;
      const validation = verifyPurchaseSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'invalid_request',
          message: 'Parámetros inválidos',
          details: validation.error.format()
        });
        return;
      }

      const { orderId, purchaseToken, productId } = validation.data;
      const result = await verifyGooglePlayPurchase(uid, orderId, purchaseToken, productId);

      res.json(result);
    } catch (error: any) {
      console.error('[IAP] Error verifying Google Play purchase:', error);
      const message = error.message || 'Verification failed';
      if (message.includes('DUPLICATE_PURCHASE')) {
        res.status(499).json({ error: 'duplicate', message });
      } else if (message.includes('ORDER_NOT_FOUND')) {
        res.status(404).json({ error: 'not_found', message });
      } else if (message.includes('WALLET_BLOCKED')) {
        res.status(403).json({ error: 'wallet_blocked', message });
      } else {
        res.status(500).json({ error: 'internal_error', message });
      }
    }
  }
);

// 3. Mark purchase order as failed
purchaseRoutes.post(
  '/orders/:orderId/mark-failed',
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const uid = req.user.uid;
      const orderId = req.params.orderId as string;
      const validation = markFailedSchema.safeParse(req.body);
      const failureReason = validation.success ? validation.data.failureReason || 'Cancelled by user' : 'Cancelled by user';

      await markOrderFailed(uid, orderId, failureReason);
      res.json({ ok: true });
    } catch (error: any) {
      console.error('[IAP] Error marking order failed:', error);
      res.status(500).json({ error: 'internal_error', message: error.message });
    }
  }
);

// 4. Admin Refund Purchase Order
purchaseRoutes.post(
  '/admin/orders/:orderId/refund',
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Basic check for admin token (in a real app, checking role == admin)
      if (req.user.role !== 'admin') {
        res.status(403).json({ error: 'forbidden', message: 'Admin role required' });
        return;
      }

      const orderId = req.params.orderId as string;
      const validation = adminRefundSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ error: 'invalid_request', message: 'Se requiere motivo de reembolso (refundReason)' });
        return;
      }

      const wallet = await adminRefundPurchase(orderId, validation.data.refundReason);
      res.json({ ok: true, wallet });
    } catch (error: any) {
      console.error('[IAP Admin] Error refunding purchase:', error);
      res.status(500).json({ error: 'internal_error', message: error.message });
    }
  }
);

// 5. Admin Dispute Purchase Order
purchaseRoutes.post(
  '/admin/orders/:orderId/dispute',
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (req.user.role !== 'admin') {
        res.status(403).json({ error: 'forbidden', message: 'Admin role required' });
        return;
      }

      const orderId = req.params.orderId as string;
      const wallet = await adminDisputePurchase(orderId);
      res.json({ ok: true, wallet });
    } catch (error: any) {
      console.error('[IAP Admin] Error disputing purchase:', error);
      res.status(500).json({ error: 'internal_error', message: error.message });
    }
  }
);

// 6. Get purchase history
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
