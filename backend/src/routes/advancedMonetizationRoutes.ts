import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getMonetizationProducts,
  purchaseVIPMembership,
  purchaseEventTicket,
  createCreatorBoost,
  createSponsorshipCampaign,
  verifyPriceIntegrity,
  getMonetizationProfitabilityReport,
} from '../services/advancedMonetizationService';

export const advancedMonetizationRoutes = Router();

// GET /api/monetization/products - Catalog Query
advancedMonetizationRoutes.get('/products', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const type = req.query.type as any;
    const products = await getMonetizationProducts(type);
    res.json({ success: true, products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/monetization/vip/purchase - Purchase VIP Membership
advancedMonetizationRoutes.post('/vip/purchase', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { vipLevel, clientPriceCents, productId } = req.body;

    if (productId && clientPriceCents) {
      const valid = verifyPriceIntegrity(productId, Number(clientPriceCents));
      if (!valid) {
        res.status(400).json({ error: 'DENIED_PRICE_MANIPULATION: Client price does not match catalog.' });
        return;
      }
    }

    const vip = await purchaseVIPMembership(userId, vipLevel ? Number(vipLevel) : 1);
    res.json({ success: true, vip });
  } catch (error: any) {
    console.error('Error purchasing VIP membership:', error);
    res.status(400).json({ error: error.message || 'Error purchasing VIP' });
  }
});

// POST /api/monetization/tickets/purchase - Purchase Event Ticket
advancedMonetizationRoutes.post('/tickets/purchase', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { eventId, productId } = req.body;

    if (!eventId) {
      res.status(400).json({ error: 'eventId is required.' });
      return;
    }

    const ticket = await purchaseEventTicket(userId, eventId, productId || 'EVENT_TICKET_KARAOKE');
    res.status(201).json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error purchasing ticket:', error);
    res.status(400).json({ error: error.message || 'Error purchasing ticket' });
  }
});

// POST /api/monetization/boosts - Create Creator Boost
advancedMonetizationRoutes.post('/boosts', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { targetType, targetId, budgetUsd, durationHours } = req.body;

    if (!targetType || !targetId) {
      res.status(400).json({ error: 'targetType and targetId are required.' });
      return;
    }

    const boost = await createCreatorBoost(hostId, targetType, targetId, Number(budgetUsd || 10.0), Number(durationHours || 2));
    res.status(201).json({ success: true, boost });
  } catch (error: any) {
    console.error('Error creating boost:', error);
    res.status(400).json({ error: error.message || 'Error creating boost' });
  }
});

// POST /api/monetization/sponsorships - Create Sponsorship Campaign
advancedMonetizationRoutes.post('/sponsorships', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sponsorId = req.user.uid;
    const { creatorId, budgetUsd, deliverables } = req.body;

    if (!creatorId || !budgetUsd || !deliverables) {
      res.status(400).json({ error: 'creatorId, budgetUsd, and deliverables are required.' });
      return;
    }

    const campaign = await createSponsorshipCampaign(sponsorId, creatorId, Number(budgetUsd), deliverables);
    res.status(201).json({ success: true, campaign });
  } catch (error: any) {
    console.error('Error creating sponsorship campaign:', error);
    res.status(400).json({ error: error.message || 'Error creating sponsorship' });
  }
});

// GET /api/monetization/profitability - Product Profitability Report (Admin)
advancedMonetizationRoutes.get('/profitability', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await getMonetizationProfitabilityReport();
    res.json({ success: true, report });
  } catch (error: any) {
    console.error('Error fetching profitability report:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
