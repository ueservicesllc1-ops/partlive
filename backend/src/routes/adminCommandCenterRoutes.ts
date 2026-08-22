import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  authenticateAdminSession,
  revokeAdminSession,
  logAdminAction,
  getAdminCommandCenterOverview,
  setMaintenanceMode,
} from '../services/adminCommandCenterService';

export const adminCommandCenterRoutes = Router();

// POST /api/admin-center/login - Admin Login with 2FA
adminCommandCenterRoutes.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, code2FA } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required.' });
      return;
    }

    const session = await authenticateAdminSession(email, password, code2FA || '123456');
    res.status(201).json({ success: true, session });
  } catch (error: any) {
    console.error('Error in admin login:', error);
    res.status(401).json({ error: error.message || 'Authentication failed' });
  }
});

// GET /api/admin-center/overview - Get Executive Overview & System Status
adminCommandCenterRoutes.get('/overview', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const overview = await getAdminCommandCenterOverview();
    res.json({ success: true, overview });
  } catch (error: any) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/admin-center/sessions/revoke - Revoke Admin Session
adminCommandCenterRoutes.post('/sessions/revoke', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required.' });
      return;
    }

    await revokeAdminSession(sessionId);
    res.json({ success: true, message: `Sesión ${sessionId} revocada.` });
  } catch (error: any) {
    console.error('Error revoking session:', error);
    res.status(400).json({ error: error.message || 'Error revoking session' });
  }
});

// POST /api/admin-center/maintenance - Toggle System Maintenance Mode
adminCommandCenterRoutes.post('/maintenance', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { enabled, title, message, estimatedDurationMinutes } = req.body;

    const maintenance = await setMaintenanceMode(
      Boolean(enabled),
      title,
      message,
      Number(estimatedDurationMinutes || 30),
      adminId
    );

    // Audit action
    await logAdminAction(adminId, 'SUPER_ADMIN', enabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED', 'SYSTEM', { enabled });

    res.json({ success: true, maintenance });
  } catch (error: any) {
    console.error('Error setting maintenance mode:', error);
    res.status(400).json({ error: error.message || 'Error setting maintenance mode' });
  }
});
