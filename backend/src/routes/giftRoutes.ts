import { Response, Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { sendGiftWithWallet } from '../services/giftWalletService';

export const giftRoutes = Router();

// POST /api/gifts/send
giftRoutes.post('/send', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const senderId = req.user.uid;
    const { targetType, targetId, receiverId, giftId, quantity } = req.body;

    if (!targetType || !targetId || !receiverId || !giftId || typeof quantity !== 'number' || quantity <= 0) {
      res.status(400).json({ error: 'Faltan parámetros requeridos o son inválidos: targetType, targetId, receiverId, giftId, quantity' });
      return;
    }

    if (senderId === receiverId) {
      res.status(400).json({ error: 'No puedes enviarte un regalo a ti mismo.' });
      return;
    }

    const giftEvent = await sendGiftWithWallet({
      targetType,
      targetId,
      senderId,
      receiverId,
      giftId,
      quantity,
    });

    res.json({
      success: true,
      giftEvent,
    });
  } catch (error: any) {
    console.error('Error sending gift:', error);
    res.status(400).json({ error: error?.message || 'Error processing gift transaction' });
  }
});
