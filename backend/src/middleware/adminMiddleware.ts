import { Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { AuthRequest } from './authMiddleware';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.uid) {
      res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      return;
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      res.status(403).json({ error: 'Forbidden: Admin profile not found' });
      return;
    }

    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin role required' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error verifying admin permissions:', error);
    res.status(500).json({ error: 'Internal Server Error verifying role' });
  }
};

export const requireAdminOrModerator = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.uid) {
      res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      return;
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      res.status(403).json({ error: 'Forbidden: User profile not found' });
      return;
    }

    const userData = userDoc.data();
    const role = userData?.role;
    if (role !== 'admin' && role !== 'moderator') {
      res.status(403).json({ error: 'Forbidden: Admin or Moderator role required' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error verifying admin/moderator permissions:', error);
    res.status(500).json({ error: 'Internal Server Error verifying role' });
  }
};
