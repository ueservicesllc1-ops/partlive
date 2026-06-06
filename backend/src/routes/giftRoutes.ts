import { Response, Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { sendRoomGiftWithWallet } from '../services/giftWalletService';

export const giftRoutes = Router();

// POST /api/gifts/room/send
giftRoutes.post('/room/send', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const senderId = req.user.uid;
    const { roomId, receiverId, giftId, quantity } = req.body;

    if (!roomId || !receiverId || !giftId || typeof quantity !== 'number' || quantity <= 0) {
      res.status(400).json({ error: 'Missing or invalid parameters: roomId, receiverId, giftId, quantity' });
      return;
    }

    if (senderId === receiverId) {
      res.status(400).json({ error: 'You cannot send a gift to yourself' });
      return;
    }

    const giftEvent = await sendRoomGiftWithWallet({
      roomId,
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
