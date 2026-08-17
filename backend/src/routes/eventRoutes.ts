import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  createScheduledEvent,
  toggleEventReminder,
  getUpcomingEvents,
} from '../services/eventService';

export const eventRoutes = Router();

// POST /api/events/create - Host schedules new event
eventRoutes.post('/create', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { title, description, category, startTime, coverUrl } = req.body;

    if (!title || !category || !startTime) {
      res.status(400).json({ error: 'Title, category, and startTime are required.' });
      return;
    }

    const event = await createScheduledEvent(hostId, title, description || '', category, startTime, coverUrl);
    res.status(201).json({ success: true, event });
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(400).json({ error: error.message || 'Error creating event' });
  }
});

// POST /api/events/reminder - Toggle reminder subscription for event
eventRoutes.post('/reminder', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { eventId } = req.body;

    if (!eventId) {
      res.status(400).json({ error: 'eventId is required.' });
      return;
    }

    const result = await toggleEventReminder(userId, eventId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error toggling event reminder:', error);
    res.status(400).json({ error: error.message || 'Error toggling reminder' });
  }
});

// GET /api/events/upcoming - Get list of upcoming scheduled events
eventRoutes.get('/upcoming', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    const events = await getUpcomingEvents(category as string);
    res.json({ success: true, events });
  } catch (error: any) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
