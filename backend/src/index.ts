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
import { cleanupAbandonedSessions } from './services/sessionTrackingService';
import {
  generalLimiter,
  purchaseLimiter,
  payoutLimiter,
  giftLimiter,
  sessionStartLimiter,
  heartbeatLimiter,
} from './middleware/rateLimitMiddleware';

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
