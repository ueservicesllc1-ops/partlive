import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  startLiveActivity,
  submitTriviaAnswer,
  castPollVote,
  submitWordGuess,
  endLiveActivity,
} from '../services/liveActivityService';

export const liveActivityRoutes = Router();

// POST /api/activities/start - Start a live activity (Trivia, Poll, Word Game, Karaoke)
liveActivityRoutes.post('/start', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { liveId, type, title, configuration } = req.body;

    if (!liveId || !type || !title) {
      res.status(400).json({ error: 'liveId, type, and title are required.' });
      return;
    }

    const activity = await startLiveActivity(hostId, liveId, type, title, configuration);
    res.status(201).json({ success: true, activity });
  } catch (error: any) {
    console.error('Error starting live activity:', error);
    res.status(400).json({ error: error.message || 'Error starting activity' });
  }
});

// POST /api/activities/trivia-answer - Submit trivia answer
liveActivityRoutes.post('/trivia-answer', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { activityId, questionIndex, optionIndex } = req.body;

    const result = await submitTriviaAnswer(userId, activityId, questionIndex, optionIndex);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error submitting trivia answer:', error);
    res.status(400).json({ error: error.message || 'Error submitting answer' });
  }
});

// POST /api/activities/poll-vote - Cast poll vote
liveActivityRoutes.post('/poll-vote', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { activityId, optionIndex } = req.body;

    await castPollVote(userId, activityId, optionIndex);
    res.json({ success: true, message: 'Voto registrado.' });
  } catch (error: any) {
    console.error('Error casting poll vote:', error);
    res.status(400).json({ error: error.message || 'Error casting vote' });
  }
});

// POST /api/activities/word-guess - Submit word guess
liveActivityRoutes.post('/word-guess', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { activityId, guess } = req.body;

    const result = await submitWordGuess(userId, activityId, guess);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error submitting word guess:', error);
    res.status(400).json({ error: error.message || 'Error submitting guess' });
  }
});

// POST /api/activities/end - End live activity
liveActivityRoutes.post('/end', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { activityId } = req.body;

    await endLiveActivity(hostId, activityId);
    res.json({ success: true, message: 'Actividad finalizada.' });
  } catch (error: any) {
    console.error('Error ending live activity:', error);
    res.status(400).json({ error: error.message || 'Error ending activity' });
  }
});
