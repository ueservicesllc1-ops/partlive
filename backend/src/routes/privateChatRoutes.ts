import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import * as privateChatService from '../services/privateChatService';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * GET /api/private-chat/conversations
 * Retrieve all conversations of the authenticated user.
 */
router.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const conversations = await privateChatService.getUserConversations(userId, limit);
    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener las conversaciones.' });
  }
});

/**
 * GET /api/private-chat/conversations/:conversationId
 * Retrieve a specific conversation.
 */
router.get('/conversations/:conversationId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const conversationId = req.params.conversationId as string;
    const conversation = await privateChatService.getConversation(userId, conversationId);
    res.json(conversation);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Sin acceso a la conversación.' });
  }
});

/**
 * POST /api/private-chat/messages/send
 * Send a new private message.
 */
router.post('/messages/send', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const { targetUserId, type, text, emoji } = req.body;

    if (!targetUserId) {
      res.status(400).json({ error: 'Falta el ID del destinatario (targetUserId).' });
      return;
    }

    if (!type || !['text', 'emoji'].includes(type)) {
      res.status(400).json({ error: 'Tipo de mensaje inválido.' });
      return;
    }

    const message = await privateChatService.sendPrivateMessage(userId, targetUserId, {
      type,
      text,
      emoji,
    });

    res.status(201).json(message);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al enviar el mensaje.' });
  }
});

/**
 * POST /api/private-chat/conversations/:conversationId/read
 * Mark all messages in a conversation as read.
 */
router.post('/conversations/:conversationId/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const conversationId = req.params.conversationId as string;
    await privateChatService.markConversationRead(userId, conversationId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al marcar la conversación como leída.' });
  }
});

/**
 * POST /api/private-chat/conversations/:conversationId/accept
 * Accept a pending message request.
 */
router.post('/conversations/:conversationId/accept', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const conversationId = req.params.conversationId as string;
    await privateChatService.acceptMessageRequest(userId, conversationId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al aceptar la solicitud.' });
  }
});

/**
 * POST /api/private-chat/conversations/:conversationId/reject
 * Reject a pending message request.
 */
router.post('/conversations/:conversationId/reject', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const conversationId = req.params.conversationId as string;
    await privateChatService.rejectMessageRequest(userId, conversationId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al rechazar la solicitud.' });
  }
});

/**
 * POST /api/private-chat/conversations/:conversationId/archive
 * Archive a conversation for the user.
 */
router.post('/conversations/:conversationId/archive', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const conversationId = req.params.conversationId as string;
    await privateChatService.archiveConversation(userId, conversationId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al archivar la conversación.' });
  }
});

/**
 * POST /api/private-chat/conversations/:conversationId/mute
 * Mute notifications for a conversation.
 */
router.post('/conversations/:conversationId/mute', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const conversationId = req.params.conversationId as string;
    await privateChatService.muteConversation(userId, conversationId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al silenciar la conversación.' });
  }
});

/**
 * POST /api/private-chat/conversations/:conversationId/unmute
 * Unmute notifications for a conversation.
 */
router.post('/conversations/:conversationId/unmute', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const conversationId = req.params.conversationId as string;
    await privateChatService.unmuteConversation(userId, conversationId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al desactivar el silencio.' });
  }
});

/**
 * POST /api/private-chat/conversations/:conversationId/block
 * Block user from the conversation.
 */
router.post('/conversations/:conversationId/block', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const conversationId = req.params.conversationId as string;
    await privateChatService.blockFromConversation(userId, conversationId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al bloquear al usuario.' });
  }
});

/**
 * POST /api/private-chat/messages/:messageId/delete-for-me
 * Delete a message only for the caller.
 */
router.post('/messages/:messageId/delete-for-me', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const messageId = req.params.messageId as string;
    const { conversationId } = req.body;

    if (!conversationId) {
      res.status(400).json({ error: 'Falta conversationId en el cuerpo de la petición.' });
      return;
    }

    await privateChatService.deleteMessageForMe(userId, conversationId, messageId);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al eliminar el mensaje.' });
  }
});

/**
 * POST /api/private-chat/messages/:messageId/report
 * Report a private message.
 */
router.post('/messages/:messageId/report', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const messageId = req.params.messageId as string;
    const { conversationId, reason, description } = req.body;

    if (!conversationId || !reason) {
      res.status(400).json({ error: 'Falta conversationId o reason en el cuerpo de la petición.' });
      return;
    }

    await privateChatService.reportPrivateMessage(userId, conversationId, messageId, reason, description);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al reportar el mensaje.' });
  }
});

export const privateChatRoutes = router;
