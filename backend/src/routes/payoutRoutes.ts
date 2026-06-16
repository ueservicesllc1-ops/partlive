import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { isAdminOrModerator } from '../services/hostAdminService';
import * as payoutService from '../services/payoutService';

export const payoutRoutes = Router();

// Middleware to check admin/moderator role
const requireAdminOrModerator = async (
  req: AuthRequest,
  res: Response,
  next: Function
): Promise<void> => {
  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const isAdmin = await isAdminOrModerator(uid);
  if (!isAdmin) {
    res.status(403).json({ error: 'Forbidden: admin or moderator role required.' });
    return;
  }
  next();
};

// ─── Host Endpoints (Payout Methods) ──────────────────────────────────────────

// GET /api/payouts/methods - List my active payment methods
payoutRoutes.get('/methods', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const methods = await payoutService.getPayoutMethods(uid);
    res.json(methods);
  } catch (error: any) {
    console.error('Error fetching payout methods:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/payouts/methods - Add a new payment method
payoutRoutes.post('/methods', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const { type, label, details, isDefault } = req.body;

    if (!type || !details) {
      res.status(400).json({ error: 'type y details son requeridos.' });
      return;
    }

    if (!['paypal', 'bank_transfer', 'payoneer', 'other'].includes(type)) {
      res.status(400).json({ error: 'Tipo de método de pago inválido.' });
      return;
    }

    // Validate details depending on type
    if (type === 'paypal' && !details.email) {
      res.status(400).json({ error: 'El email de PayPal es obligatorio.' });
      return;
    }
    if (type === 'payoneer' && !details.email) {
      res.status(400).json({ error: 'El email de Payoneer es obligatorio.' });
      return;
    }
    if (type === 'bank_transfer' && (!details.accountNumber || !details.bankName || !details.accountHolderName)) {
      res.status(400).json({ error: 'Nombre del titular, banco y número de cuenta son obligatorios.' });
      return;
    }

    const method = await payoutService.createPayoutMethod(uid, {
      type,
      label,
      details,
      isDefault
    });

    res.status(201).json(method);
  } catch (error: any) {
    console.error('Error creating payout method:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// PATCH /api/payouts/methods/:id - Edit payment method details/label/default status
payoutRoutes.patch('/methods/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const methodId = req.params.id;
    const { label, details, isDefault } = req.body;

    const updated = await payoutService.updatePayoutMethod(uid as string, methodId as string, {
      label,
      details,
      isDefault
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating payout method:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/payouts/methods/:id - Soft-delete a payment method
payoutRoutes.delete('/methods/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const methodId = req.params.id;

    await payoutService.deletePayoutMethod(uid as string, methodId as string);
    res.json({ success: true, message: 'Método de pago eliminado.' });
  } catch (error: any) {
    console.error('Error deleting payout method:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ─── Host Endpoints (Payout Requests) ─────────────────────────────────────────

// POST /api/payouts/request - Create a payout request
payoutRoutes.post('/request', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const { beansConverted, payoutMethodId } = req.body;

    if (!beansConverted || !payoutMethodId) {
      res.status(400).json({ error: 'beansConverted y payoutMethodId son requeridos.' });
      return;
    }

    const beansNum = Number(beansConverted);
    if (isNaN(beansNum) || beansNum <= 0) {
      res.status(400).json({ error: 'La cantidad de beans debe ser un número positivo.' });
      return;
    }

    const payout = await payoutService.requestHostPayout(uid, beansNum, payoutMethodId);
    res.status(201).json(payout);
  } catch (error: any) {
    console.error('Error requesting payout:', error);
    res.status(400).json({ error: error.message || 'Error al procesar la solicitud' });
  }
});

// GET /api/payouts/my - List my payout history
payoutRoutes.get('/my', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const payouts = await payoutService.getMyPayouts(uid);
    res.json(payouts);
  } catch (error: any) {
    console.error('Error fetching my payouts:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/payouts/:id/cancel - Cancel my pending payout request
payoutRoutes.post('/:id/cancel', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const payoutId = req.params.id;

    await payoutService.cancelPayout(payoutId as string, uid as string);
    res.json({ success: true, message: 'Solicitud de retiro cancelada.' });
  } catch (error: any) {
    console.error('Error cancelling payout:', error);
    res.status(400).json({ error: error.message || 'Error al cancelar la solicitud' });
  }
});

// ─── Admin Endpoints (Manage Payouts) ──────────────────────────────────────────

// GET /api/payouts/admin/pending - View all pending/approved payouts in the system
payoutRoutes.get(
  '/admin/pending',
  requireAuth,
  requireAdminOrModerator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const payouts = await payoutService.getAdminPendingPayouts();
      res.json(payouts);
    } catch (error: any) {
      console.error('Error fetching pending payouts (admin):', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

// POST /api/payouts/admin/:id/approve - Approve a pending request
payoutRoutes.post(
  '/admin/:id/approve',
  requireAuth,
  requireAdminOrModerator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const adminId = req.user.uid;
      const payoutId = req.params.id;
      const { adminNotes } = req.body;

      const result = await payoutService.approvePayout(payoutId as string, adminId as string, adminNotes);
      res.json({ success: true, message: 'Retiro aprobado.', data: result });
    } catch (error: any) {
      console.error('Error approving payout (admin):', error);
      res.status(400).json({ error: error.message || 'Error al aprobar la solicitud' });
    }
  }
);

// POST /api/payouts/admin/:id/reject - Reject a pending/approved request (refunds diamonds)
payoutRoutes.post(
  '/admin/:id/reject',
  requireAuth,
  requireAdminOrModerator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const adminId = req.user.uid;
      const payoutId = req.params.id;
      const { adminNotes } = req.body;

      const result = await payoutService.rejectPayout(payoutId as string, adminId as string, adminNotes);
      res.json({ success: true, message: 'Retiro rechazado. Beans reembolsados.', data: result });
    } catch (error: any) {
      console.error('Error rejecting payout (admin):', error);
      res.status(400).json({ error: error.message || 'Error al rechazar la solicitud' });
    }
  }
);

// POST /api/payouts/admin/:id/mark-paid - Mark an approved/pending request as paid
payoutRoutes.post(
  '/admin/:id/mark-paid',
  requireAuth,
  requireAdminOrModerator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const adminId = req.user.uid;
      const payoutId = req.params.id;
      const { adminNotes } = req.body;

      const result = await payoutService.markPayoutAsPaid(payoutId as string, adminId as string, adminNotes);
      res.json({ success: true, message: 'Retiro marcado como pagado.', data: result });
    } catch (error: any) {
      console.error('Error marking payout paid (admin):', error);
      res.status(400).json({ error: error.message || 'Error al marcar como pagado' });
    }
  }
);
