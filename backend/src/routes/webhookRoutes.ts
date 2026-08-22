import { Router, Request, Response } from 'express';
import {
  processAppleServerNotification,
  processGoogleServerNotification,
} from '../services/subscriptionWebhookService';
import { recordChargeback } from '../services/paymentLedgerService';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';

export const webhookRoutes = Router();

// POST /api/webhooks/apple — Apple App Store Server Notifications
webhookRoutes.post('/apple', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = JSON.stringify(req.body);
    const signatureHeader = req.headers['x-apple-jws-signature'] as string || '';

    await processAppleServerNotification(req.body, rawBody, signatureHeader);
    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[Apple Webhook Error]:', err.message);
    // Always return 200 to Apple — never let webhook retry indefinitely
    res.status(200).json({ ok: false, error: err.message });
  }
});

// POST /api/webhooks/google — Google Play Real-Time Developer Notifications
webhookRoutes.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const message = req.body?.message;
    if (!message?.data) {
      res.status(200).json({ ok: false, error: 'NO_MESSAGE_DATA' });
      return;
    }

    const pubSubToken = (req.query.token as string) || '';
    await processGoogleServerNotification(message.data, pubSubToken);
    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[Google Webhook Error]:', err.message);
    res.status(200).json({ ok: false, error: err.message });
  }
});

// POST /api/webhooks/chargeback — Admin chargeback recording
webhookRoutes.post('/chargeback', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, reason, amountUsd } = req.body;

    if (!orderId || !reason || !amountUsd) {
      res.status(400).json({ error: 'orderId, reason, and amountUsd are required.' });
      return;
    }

    await recordChargeback(orderId, reason, Number(amountUsd));
    res.json({ success: true, message: 'Chargeback registrado y wallet bloqueada.' });
  } catch (err: any) {
    console.error('[Chargeback Error]:', err.message);
    res.status(400).json({ error: err.message });
  }
});
