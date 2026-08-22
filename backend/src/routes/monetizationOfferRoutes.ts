import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getCoinPackages,
  getEligibleOffersForUser,
  calculateNextBestOffer,
  claimSmartOffer,
  toggleGlobalMonetizationKillSwitch,
} from '../services/monetizationOfferService';

export const monetizationOfferRoutes = Router();

// GET /api/monetization-offers/coin-packages - Get Coin Packages (Base + Bonus)
monetizationOfferRoutes.get('/coin-packages', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const packages = await getCoinPackages();
    res.json({ success: true, packages });
  } catch (error: any) {
    console.error('Error fetching coin packages:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/monetization-offers/eligible - Get Targeted Smart Offers
monetizationOfferRoutes.get('/eligible', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { placement } = req.query;

    const offers = await getEligibleOffersForUser(userId, (placement as any) || 'WALLET');
    res.json({ success: true, offers });
  } catch (error: any) {
    console.error('Error fetching eligible offers:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/monetization-offers/next-best - Get Next Best Offer AI & Experiment Variant
monetizationOfferRoutes.get('/next-best', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const nbo = await calculateNextBestOffer(userId);
    res.json({ success: true, ...nbo });
  } catch (error: any) {
    console.error('Error calculating next best offer:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/monetization-offers/claim - Claim Smart Offer (Receipt verification & Single-use)
monetizationOfferRoutes.post('/claim', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { offerId, receiptToken } = req.body;

    if (!offerId) {
      res.status(400).json({ error: 'offerId is required.' });
      return;
    }

    const claim = await claimSmartOffer(userId, offerId, receiptToken || 'receipt_valid_token_123');
    if (claim.isDuplicateClaim) {
      res.status(400).json({ error: 'OFFER_ALREADY_CLAIMED: Esta oferta ya fue reclamada previamente por el usuario.' });
      return;
    }

    res.status(201).json({ success: true, ...claim });
  } catch (error: any) {
    console.error('Error claiming offer:', error);
    res.status(400).json({ error: error.message || 'Offer claim failed' });
  }
});

// POST /api/monetization-offers/kill-switch - Toggle Global Monetization Kill Switch
monetizationOfferRoutes.post('/kill-switch', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { enabled, reason } = req.body;

    const killSwitch = await toggleGlobalMonetizationKillSwitch(Boolean(enabled), reason, adminId);
    res.json({ success: true, killSwitch });
  } catch (error: any) {
    console.error('Error toggling monetization kill switch:', error);
    res.status(400).json({ error: error.message || 'Error toggling kill switch' });
  }
});
