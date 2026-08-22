import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { uploadRoutes } from './routes/uploadRoutes';
import { livekitRoutes } from './routes/livekitRoutes';
import { walletRoutes } from './routes/walletRoutes';
import { giftRoutes } from './routes/giftRoutes';
import { purchaseRoutes } from './routes/purchaseRoutes';
import { hostRoutes } from './routes/hostRoutes';
import { payoutRoutes } from './routes/payoutRoutes';
import adminRoutes from './routes/adminRoutes';
import moderationRoutes from './routes/moderationRoutes';
import { gameMatchmakingRoutes } from './routes/gameMatchmakingRoutes';
import { monetizationRoutes } from './routes/monetizationRoutes';
import { agencyRoutes } from './routes/agencyRoutes';
import { vipRoutes } from './routes/vipRoutes';
import { adminMonetizationRoutes } from './routes/adminMonetizationRoutes';
import missionRoutes from './routes/missionRoutes';
import adminMissionRoutes from './routes/adminMissionRoutes';
import { searchRoutes } from './routes/searchRoutes';
import { socialRoutes } from './routes/socialRoutes';
import notificationRoutes from './routes/notificationRoutes';
import deviceTokenRoutes from './routes/deviceTokenRoutes';
import { privateChatRoutes } from './routes/privateChatRoutes';
import { karaokeRoutes } from './routes/karaokeRoutes';
import { pkBattleRoutes } from './routes/pkBattleRoutes';
import { verificationRoutes } from './routes/verificationRoutes';
import { sessionRoutes } from './routes/sessionRoutes';
import { analyticsRoutes } from './routes/analyticsRoutes';
import { roomAccessRoutes } from './routes/roomAccessRoutes';
import { clubRoutes } from './routes/clubRoutes';
import { liveActivityRoutes } from './routes/liveActivityRoutes';
import { eventRoutes } from './routes/eventRoutes';
import { discoveryRoutes } from './routes/discoveryRoutes';
import { clipRoutes } from './routes/clipRoutes';
import { revenueRoutes } from './routes/revenueRoutes';
import { hostSubscriptionRoutes } from './routes/hostSubscriptionRoutes';
import { aiRoutes } from './routes/aiRoutes';
import { productionSecurityRoutes } from './routes/productionSecurityRoutes';
import { growthAttributionRoutes } from './routes/growthAttributionRoutes';
import { referralRoutes } from './routes/referralRoutes';
import { affiliateRoutes } from './routes/affiliateRoutes';
import { adminControlRoutes } from './routes/adminControlRoutes';
import { socialPostRoutes } from './routes/socialPostRoutes';
import { storyRoutes } from './routes/storyRoutes';
import { creatorStudioRoutes } from './routes/creatorStudioRoutes';
import { tapLikeRoutes } from './routes/tapLikeRoutes';
import { webhookRoutes } from './routes/webhookRoutes';
import { musicCatalogRoutes } from './routes/musicCatalogRoutes';
import { copyrightRoutes } from './routes/copyrightRoutes';
import { legalRoutes } from './routes/legalRoutes';
import { trustSafetyRoutes } from './routes/trustSafetyRoutes';
import { reEngagementRoutes } from './routes/reEngagementRoutes';
import { notificationCampaignRoutes } from './routes/notificationCampaignRoutes';
import { helpCenterRoutes } from './routes/helpCenterRoutes';
import { supportTicketRoutes } from './routes/supportTicketRoutes';
import { regionalConfigRoutes } from './routes/regionalConfigRoutes';
import { monetizationRoutes } from './routes/monetizationRoutes';
import { creatorGrowthRoutes } from './routes/creatorGrowthRoutes';
import { discoveryRoutes } from './routes/discoveryRoutes';
import { viralShareRoutes } from './routes/viralShareRoutes';
import { tapEngineRoutes } from './routes/tapEngineRoutes';
import { gamificationRoutes } from './routes/gamificationRoutes';
import { platformSafetyRoutes } from './routes/platformSafetyRoutes';
import { superAdminRoutes } from './routes/superAdminRoutes';
import { legalComplianceRoutes } from './routes/legalComplianceRoutes';
import { productionReliabilityRoutes } from './routes/productionReliabilityRoutes';
import { performanceOptimizationRoutes } from './routes/performanceOptimizationRoutes';
import { qaAuditRoutes } from './routes/qaAuditRoutes';
import { betaRolloutRoutes } from './routes/betaRolloutRoutes';
import { growthEngineRoutes } from './routes/growthEngineRoutes';
import { cfoFinancialRoutes } from './routes/cfoFinancialRoutes';
import { globalExpansionRoutes } from './routes/globalExpansionRoutes';
import { aiIntelligenceRoutes } from './routes/aiIntelligenceRoutes';
import { creatorStudioProRoutes } from './routes/creatorStudioProRoutes';
import { advancedMonetizationRoutes } from './routes/advancedMonetizationRoutes';
import { liveEngagementEngineRoutes } from './routes/liveEngagementEngineRoutes';
import { viralGrowthEngineRoutes } from './routes/viralGrowthEngineRoutes';
import { trustSafetyEngineRoutes } from './routes/trustSafetyEngineRoutes';
import { adminCommandCenterRoutes } from './routes/adminCommandCenterRoutes';
import { infrastructurePerformanceRoutes } from './routes/infrastructurePerformanceRoutes';
import { dataIntelligenceEngineRoutes } from './routes/dataIntelligenceEngineRoutes';
import { creatorStudioSuccessRoutes } from './routes/creatorStudioSuccessRoutes';
import { subscriptionEngineRoutes } from './routes/subscriptionEngineRoutes';
import { monetizationOfferRoutes } from './routes/monetizationOfferRoutes';
import { growthAcquisitionEngineRoutes } from './routes/growthAcquisitionEngineRoutes';
import { trustSafetyEngine2Routes } from './routes/trustSafetyEngine2Routes';
import { globalizationEngine2Routes } from './routes/globalizationEngine2Routes';
import { scalabilityPerformanceEngine2Routes } from './routes/scalabilityPerformanceEngine2Routes';
import { appStoreCompliance2Routes } from './routes/appStoreCompliance2Routes';
import { uxConversionEngine2Routes } from './routes/uxConversionEngine2Routes';
import { masterAuditEngine2Routes } from './routes/masterAuditEngine2Routes';
import { liveOperationsEngine2Routes } from './routes/liveOperationsEngine2Routes';
import { creatorEconomyEngine2Routes } from './routes/creatorEconomyEngine2Routes';
import { cleanupAbandonedSessions } from './services/sessionTrackingService';
import {
  generalLimiter,
  purchaseLimiter,
  payoutLimiter,
  giftLimiter,
  sessionStartLimiter,
  heartbeatLimiter,
} from './middleware/rateLimitMiddleware';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// React Native apps do NOT send an Origin header, so strict origin filtering
// would reject all mobile requests. We allow any origin here since auth is
// handled via Firebase ID tokens (not session cookies).
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    // or any origin for now (admin panel, web clients)
    callback(null, true);
  },
  credentials: true,
}));

// Apply general rate limit to all API routes
app.use('/api', generalLimiter);

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'PartyLiveApp Backend'
  });
});

app.use('/api/uploads', uploadRoutes);
app.use('/api/livekit', livekitRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/gifts', giftLimiter, giftRoutes);
app.use('/api/purchases', purchaseLimiter, purchaseRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/payouts', payoutLimiter, payoutRoutes);
app.use('/api/admin/monetization', adminMonetizationRoutes);
app.use('/api/admin/missions', adminMissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/games', gameMatchmakingRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/device-tokens', deviceTokenRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/private-chat', privateChatRoutes);
app.use('/api/karaoke', karaokeRoutes);
app.use('/api/pk', pkBattleRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/sessions/start', sessionStartLimiter);
app.use('/api/sessions/heartbeat', heartbeatLimiter);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/rooms', roomAccessRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/activities', liveActivityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/clips', clipRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/host-subscriptions', hostSubscriptionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/security', productionSecurityRoutes);
app.use('/api/growth', growthAttributionRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/admin-control', adminControlRoutes);
app.use('/api/social/posts-api', socialPostRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/creator', creatorStudioRoutes);
app.use('/api/lives', tapLikeRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/music', musicCatalogRoutes);
app.use('/api/copyright', copyrightRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/trust-safety', trustSafetyRoutes);
app.use('/api/re-engagement', reEngagementRoutes);
app.use('/api/notifications/campaigns-api', notificationCampaignRoutes);
app.use('/api/help', helpCenterRoutes);
app.use('/api/support', supportTicketRoutes);
app.use('/api/regional', regionalConfigRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/creators', creatorGrowthRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/viral', viralShareRoutes);
app.use('/api/taps', tapEngineRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/safety', platformSafetyRoutes);
app.use('/api/admin/super', superAdminRoutes);
app.use('/api/legal', legalComplianceRoutes);
app.use('/api/production', productionReliabilityRoutes);
app.use('/api/performance', performanceOptimizationRoutes);
app.use('/api/qa', qaAuditRoutes);
app.use('/api/beta', betaRolloutRoutes);
app.use('/api/growth', growthEngineRoutes);
app.use('/api/cfo', cfoFinancialRoutes);
app.use('/api/expansion', globalExpansionRoutes);
app.use('/api/ai', aiIntelligenceRoutes);
app.use('/api/creator-pro', creatorStudioProRoutes);
app.use('/api/monetization', advancedMonetizationRoutes);
app.use('/api/engagement', liveEngagementEngineRoutes);
app.use('/api/viral', viralGrowthEngineRoutes);
app.use('/api/trust', trustSafetyEngineRoutes);
app.use('/api/admin-center', adminCommandCenterRoutes);
app.use('/api/infra', infrastructurePerformanceRoutes);
app.use('/api/bi', dataIntelligenceEngineRoutes);
app.use('/api/creator-studio', creatorStudioSuccessRoutes);
app.use('/api/subscriptions', subscriptionEngineRoutes);
app.use('/api/monetization-offers', monetizationOfferRoutes);
app.use('/api/growth-acq', growthAcquisitionEngineRoutes);
app.use('/api/trust-safety-2', trustSafetyEngine2Routes);
app.use('/api/globalization-2', globalizationEngine2Routes);
app.use('/api/scalability-2', scalabilityPerformanceEngine2Routes);
app.use('/api/compliance-2', appStoreCompliance2Routes);
app.use('/api/ux-conversion-2', uxConversionEngine2Routes);
app.use('/api/master-audit-2', masterAuditEngine2Routes);
app.use('/api/live-ops-2', liveOperationsEngine2Routes);
app.use('/api/creator-economy-2', creatorEconomyEngine2Routes);

// ─── 404 & Global Error Handlers (must be last) ──────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  
  // Start the background cleanup job for abandoned user sessions
  // Run once immediately on startup, then every 15 minutes
  cleanupAbandonedSessions()
    .then(() => console.log('🧹 Initial session cleanup completed successfully'))
    .catch((err) => console.error('❌ Error in initial session cleanup:', err));
    
  setInterval(() => {
    console.log('🧹 Running periodic abandoned session cleanup...');
    cleanupAbandonedSessions()
      .then(() => console.log('🧹 Periodic session cleanup completed successfully'))
      .catch((err) => console.error('❌ Error in periodic session cleanup:', err));
  }, 15 * 60 * 1000);
});
