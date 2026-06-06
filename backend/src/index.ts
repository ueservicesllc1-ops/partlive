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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Temporal para desarrollo. En producción, limitar al dominio real de la app.
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081'],
  credentials: true
}));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'PartyLiveApp Backend'
  });
});

app.use('/api/uploads', uploadRoutes);
app.use('/api/livekit', livekitRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

