import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { requireAdminOrModerator } from '../middleware/adminMiddleware';
import * as karaokeService from '../services/karaokeService';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// ==========================================
// USER ENDPOINTS
// ==========================================

router.get('/songs', async (req: AuthRequest, res: Response) => {
  try {
    const genre = req.query.genre as string;
    const language = req.query.language as string;
    const query = req.query.query as string;
    const songs = await karaokeService.getActiveSongs({ genre, language, query });
    res.json(songs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener canciones.' });
  }
});

router.get('/songs/:songId', async (req: AuthRequest, res: Response) => {
  try {
    const songId = req.params.songId as string;
    const song = await karaokeService.getSongById(songId);
    res.json(song);
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Canción no encontrada.' });
  }
});

router.get('/favorites', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const songs = await karaokeService.getFavoriteSongs(userId);
    res.json(songs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener favoritos.' });
  }
});

router.post('/favorites/:songId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const songId = req.params.songId as string;
    await karaokeService.addFavoriteSong(userId, songId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al agregar favorito.' });
  }
});

router.delete('/favorites/:songId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const songId = req.params.songId as string;
    await karaokeService.removeFavoriteSong(userId, songId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al quitar favorito.' });
  }
});

router.post('/sessions/start', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const { targetType, targetId } = req.body;

    if (!targetType || !['room', 'live'].includes(targetType) || !targetId) {
      res.status(400).json({ error: 'Parámetros targetType o targetId inválidos.' });
      return;
    }

    const session = await karaokeService.startKaraokeSession(userId, targetType, targetId);
    res.status(201).json(session);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Error al iniciar sesión de Karaoke.' });
  }
});

router.post('/sessions/:sessionId/end', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const sessionId = req.params.sessionId as string;
    await karaokeService.endKaraokeSession(userId, sessionId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Error al terminar sesión.' });
  }
});

router.get('/sessions/active', async (req: AuthRequest, res: Response) => {
  try {
    const targetType = req.query.targetType as 'room' | 'live';
    const targetId = req.query.targetId as string;

    if (!targetType || !targetId) {
      res.status(400).json({ error: 'Falta targetType o targetId.' });
      return;
    }

    const session = await karaokeService.getActiveKaraokeSession(targetType, targetId);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener sesión activa.' });
  }
});

router.post('/queue/request', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const { targetType, targetId, songId } = req.body;

    if (!targetType || !targetId || !songId) {
      res.status(400).json({ error: 'Parámetros incompletos.' });
      return;
    }

    const item = await karaokeService.requestSong(userId, targetType, targetId, songId);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al pedir canción.' });
  }
});

router.get('/queue/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const queue = await karaokeService.getQueue(sessionId);
    res.json(queue);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener la cola.' });
  }
});

router.post('/queue/:queueItemId/approve', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const queueItemId = req.params.queueItemId as string;
    await karaokeService.approveQueueItem(userId, queueItemId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Error al aprobar turno.' });
  }
});

router.post('/queue/:queueItemId/reject', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const queueItemId = req.params.queueItemId as string;
    const { reason } = req.body;
    await karaokeService.rejectQueueItem(userId, queueItemId, reason || '');
    res.json({ ok: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Error al rechazar turno.' });
  }
});

router.post('/queue/:queueItemId/start', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const queueItemId = req.params.queueItemId as string;
    await karaokeService.startQueueItem(userId, queueItemId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Error al iniciar presentación.' });
  }
});

router.post('/queue/:queueItemId/complete', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const queueItemId = req.params.queueItemId as string;
    await karaokeService.completeQueueItem(userId, queueItemId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Error al completar presentación.' });
  }
});

router.post('/queue/:queueItemId/skip', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const queueItemId = req.params.queueItemId as string;
    await karaokeService.skipQueueItem(userId, queueItemId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Error al saltar turno.' });
  }
});

router.get('/performances/user/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const performances = await karaokeService.getSingerPerformances(userId);
    res.json(performances);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener historial.' });
  }
});

router.post('/battles', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const battle = await karaokeService.createKaraokeBattle(userId, req.body);
    res.status(201).json(battle);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Error al crear batalla.' });
  }
});

router.post('/battles/:battleId/join', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const battleId = req.params.battleId as string;
    await karaokeService.joinKaraokeBattle(userId, battleId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al unirse a batalla.' });
  }
});

router.post('/battles/:battleId/vote', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const battleId = req.params.battleId as string;
    const { participantId } = req.body;

    if (!participantId) {
      res.status(400).json({ error: 'Falta participantId.' });
      return;
    }

    await karaokeService.voteKaraokeBattle(userId, battleId, participantId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al votar.' });
  }
});

router.post('/battles/:battleId/end', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const battleId = req.params.battleId as string;
    const result = await karaokeService.endKaraokeBattle(userId, battleId);
    res.json(result);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Error al terminar batalla.' });
  }
});

// ==========================================
// ADMIN ENDPOINTS (Protected)
// ==========================================

router.post('/admin/songs', requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const song = await karaokeService.createSong(userId, req.body);
    res.status(201).json(song);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al crear canción.' });
  }
});

router.patch('/admin/songs/:songId', requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const songId = req.params.songId as string;
    await karaokeService.updateSong(songId, userId, req.body);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al actualizar canción.' });
  }
});

router.post('/admin/songs/:songId/approve', requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    const songId = req.params.songId as string;
    await karaokeService.approveSong(songId, adminId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al aprobar canción.' });
  }
});

router.post('/admin/songs/:songId/reject', requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    const songId = req.params.songId as string;
    const { reason } = req.body;
    await karaokeService.rejectSong(songId, adminId, reason || '');
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al rechazar canción.' });
  }
});

router.post('/admin/songs/:songId/deactivate', requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const songId = req.params.songId as string;
    await db.collection('karaokeSongs').doc(songId).update({
      status: 'inactive',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al desactivar canción.' });
  }
});

export const karaokeRoutes = router;
export default router;
