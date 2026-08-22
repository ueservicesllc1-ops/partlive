import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  createSupportTicket,
  addTicketMessage,
  getUserTickets,
  getTicketMessagesForUser,
  getAdminTicketQueue,
  resolveTicket,
} from '../services/supportTicketService';

export const supportTicketRoutes = Router();

// POST /api/support/tickets - Create support ticket
supportTicketRoutes.post('/tickets', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { category, subject, description, relatedTransactionId } = req.body;

    if (!category || !subject || !description) {
      res.status(400).json({ error: 'category, subject, and description are required.' });
      return;
    }

    const ticket = await createSupportTicket(userId, { category, subject, description, relatedTransactionId });
    res.status(201).json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    res.status(400).json({ error: error.message || 'Error creating ticket' });
  }
});

// GET /api/support/tickets - Get my tickets
supportTicketRoutes.get('/tickets', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const tickets = await getUserTickets(userId);
    res.json({ success: true, tickets });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/support/tickets/:id/messages - Get public messages for user ticket
supportTicketRoutes.get('/tickets/:id/messages', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const messages = await getTicketMessagesForUser(userId, id as string);
    res.json({ success: true, messages });
  } catch (error: any) {
    console.error('Error fetching ticket messages:', error);
    res.status(400).json({ error: error.message || 'Error fetching messages' });
  }
});

// POST /api/support/tickets/:id/messages - Add message to ticket
supportTicketRoutes.post('/tickets/:id/messages', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const senderId = req.user.uid;
    const { id } = req.params;
    const { message, isInternalNote } = req.body;

    if (!message) {
      res.status(400).json({ error: 'message is required.' });
      return;
    }

    const isStaff = req.user.role === 'admin' || req.user.role === 'support';
    const senderRole = isStaff ? 'AGENT' : 'USER';
    const finalInternalNote = isStaff ? Boolean(isInternalNote) : false;

    const msg = await addTicketMessage(id as string, senderId, senderRole, message, finalInternalNote);
    res.status(201).json({ success: true, message: msg });
  } catch (error: any) {
    console.error('Error adding ticket message:', error);
    res.status(400).json({ error: error.message || 'Error adding message' });
  }
});

// GET /api/support/queue - Admin Ticket Queue
supportTicketRoutes.get('/queue', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { team, status } = req.query;
    const tickets = await getAdminTicketQueue(team as string, (status as string) || 'OPEN');
    res.json({ success: true, tickets });
  } catch (error: any) {
    console.error('Error fetching support queue:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/support/tickets/:id/resolve - Resolve ticket (Admin)
supportTicketRoutes.post('/tickets/:id/resolve', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const ticket = await resolveTicket(id as string, resolutionNotes || '', adminId);
    res.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error resolving ticket:', error);
    res.status(400).json({ error: error.message || 'Error resolving ticket' });
  }
});
