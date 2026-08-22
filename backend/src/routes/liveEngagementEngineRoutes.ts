import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  recordLiveEngagementEvent,
  calculateLiveEngagementScore,
  processTapBatch,
  createLivePoll,
  voteLivePoll,
  createLiveSeries,
  getLiveMomentTimeline,
} from '../services/liveEngagementEngineService';

export const liveEngagementEngineRoutes = Router();

// POST /api/engagement/event - Log Engagement Interaction Event
liveEngagementEngineRoutes.post('/event', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user ? req.user.uid : 'anon_viewer';
    const { liveId, eventType, metadata } = req.body;

    if (!liveId || !eventType) {
      res.status(400).json({ error: 'liveId and eventType are required.' });
      return;
    }

    const event = await recordLiveEngagementEvent(liveId, userId, eventType, metadata);
    res.status(201).json({ success: true, event });
  } catch (error: any) {
    console.error('Error recording engagement event:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/engagement/score/:liveId - Get Real-Time Live Energy Score
liveEngagementEngineRoutes.get('/score/:liveId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const liveId = req.params.liveId;
    const score = await calculateLiveEngagementScore(liveId);
    res.json({ success: true, score });
  } catch (error: any) {
    console.error('Error calculating engagement score:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/engagement/taps/batch - Flush Tap 👍 Batch & Get Combos
liveEngagementEngineRoutes.post('/taps/batch', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user ? req.user.uid : 'anon_tapper';
    const { liveId, tapCount } = req.body;

    if (!liveId || !tapCount) {
      res.status(400).json({ error: 'liveId and tapCount are required.' });
      return;
    }

    const result = await processTapBatch(liveId, userId, Number(tapCount));
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error processing tap batch:', error);
    res.status(400).json({ error: error.message || 'Error processing taps' });
  }
});

// POST /api/engagement/polls - Create Live Poll
liveEngagementEngineRoutes.post('/polls', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { liveId, question, options } = req.body;

    if (!liveId || !question || !options || !Array.isArray(options)) {
      res.status(400).json({ error: 'liveId, question, and options array are required.' });
      return;
    }

    const poll = await createLivePoll(liveId, question, options);
    res.status(201).json({ success: true, poll });
  } catch (error: any) {
    console.error('Error creating live poll:', error);
    res.status(400).json({ error: error.message || 'Error creating poll' });
  }
});

// POST /api/engagement/polls/vote - Vote on Live Poll
liveEngagementEngineRoutes.post('/polls/vote', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user ? req.user.uid : 'anon_voter';
    const { pollId, optionIndex } = req.body;

    if (!pollId || optionIndex === undefined) {
      res.status(400).json({ error: 'pollId and optionIndex are required.' });
      return;
    }

    const poll = await voteLivePoll(pollId, userId, Number(optionIndex));
    res.json({ success: true, poll });
  } catch (error: any) {
    console.error('Error voting on poll:', error);
    res.status(400).json({ error: error.message || 'Error voting on poll' });
  }
});

// POST /api/engagement/series - Create Live Series
liveEngagementEngineRoutes.post('/series', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { title, frequencyDays } = req.body;

    if (!title) {
      res.status(400).json({ error: 'title is required.' });
      return;
    }

    const series = await createLiveSeries(hostId, title, frequencyDays ? Number(frequencyDays) : 7);
    res.status(201).json({ success: true, series });
  } catch (error: any) {
    console.error('Error creating live series:', error);
    res.status(400).json({ error: error.message || 'Error creating series' });
  }
});

// GET /api/engagement/timeline/:liveId - Get Live Moment Timeline
liveEngagementEngineRoutes.get('/timeline/:liveId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const liveId = req.params.liveId;
    const timeline = await getLiveMomentTimeline(liveId);
    res.json({ success: true, timeline });
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
