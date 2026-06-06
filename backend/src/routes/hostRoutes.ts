import { Router, Response } from 'express';
import { db } from '../config/firebase';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  approveHostApplication,
  rejectHostApplication,
  suspendHost,
  isAdminOrModerator,
} from '../services/hostAdminService';

export const hostRoutes = Router();

const HOST_APPLICATIONS = 'hostApplications';
const HOST_STATS = 'hostStats';
const HOST_ACTIVITIES = 'hostActivities';
const USERS = 'users';

// ─── User Endpoints ───────────────────────────────────────────────────────────

/**
 * GET /api/host/me
 * Returns the current user's host status: isHost, role, and latest application.
 */
hostRoutes.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection(USERS).doc(uid).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const user = userDoc.data()!;

    // Fetch latest application
    const appSnap = await db
      .collection(HOST_APPLICATIONS)
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    const application = appSnap.empty
      ? null
      : { id: appSnap.docs[0].id, ...appSnap.docs[0].data() };

    res.json({
      isHost: user.isHost || false,
      role: user.role || 'user',
      application,
    });
  } catch (err: any) {
    console.error('GET /host/me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/host/stats
 * Returns the authenticated host's stats.
 */
hostRoutes.get('/stats', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const statsDoc = await db.collection(HOST_STATS).doc(uid).get();
    if (!statsDoc.exists) {
      res.json(null);
      return;
    }
    res.json({ id: statsDoc.id, ...statsDoc.data() });
  } catch (err: any) {
    console.error('GET /host/stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/host/activities
 * Returns the authenticated host's recent activity (last 50).
 */
hostRoutes.get('/activities', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const snap = await db
      .collection(HOST_ACTIVITIES)
      .where('hostId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const activities = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(activities);
  } catch (err: any) {
    console.error('GET /host/activities error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/host/apply
 * Submit a new host application.
 * Prevents duplicate pending applications and re-application if already host.
 */
hostRoutes.post('/apply', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const { fullName, displayName, username, email, country, phone, socialLink, experience, whyHost } = req.body;

    if (!fullName || !country) {
      res.status(400).json({ error: 'fullName y country son requeridos.' });
      return;
    }
    if (experience && experience.length < 20) {
      res.status(400).json({ error: 'experience debe tener al menos 20 caracteres.' });
      return;
    }
    if (whyHost && whyHost.length < 20) {
      res.status(400).json({ error: 'whyHost debe tener al menos 20 caracteres.' });
      return;
    }

    // Check user
    const userDoc = await db.collection(USERS).doc(uid).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const user = userDoc.data()!;

    if (user.isHost) {
      res.status(400).json({ error: 'Ya eres host. No necesitas aplicar de nuevo.' });
      return;
    }

    // Check for existing pending application
    const existingSnap = await db
      .collection(HOST_APPLICATIONS)
      .where('userId', '==', uid)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      res.status(400).json({ error: 'Ya tienes una solicitud en revisión.' });
      return;
    }

    const ref = await db.collection(HOST_APPLICATIONS).add({
      userId: uid,
      fullName,
      displayName: displayName || user.displayName || '',
      username: username || user.username || '',
      email: email || user.email || '',
      country,
      phone: phone || '',
      socialLink: socialLink || '',
      experience: experience || '',
      whyHost: whyHost || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({ id: ref.id, message: 'Solicitud enviada correctamente.' });
  } catch (err: any) {
    console.error('POST /host/apply error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

/**
 * Middleware: check that the requesting user is admin or moderator.
 */
const requireAdminOrModerator = async (
  req: AuthRequest,
  res: Response,
  next: Function
): Promise<void> => {
  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const isAdmin = await isAdminOrModerator(uid);
  if (!isAdmin) {
    res.status(403).json({ error: 'Forbidden: admin or moderator role required.' });
    return;
  }
  next();
};

/**
 * GET /api/host/admin/applications
 * List all pending host applications.
 */
hostRoutes.get(
  '/admin/applications',
  requireAuth,
  requireAdminOrModerator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const snap = await db
        .collection(HOST_APPLICATIONS)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();
      const apps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(apps);
    } catch (err: any) {
      console.error('GET /host/admin/applications error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/host/admin/applications/:applicationId/approve
 * Approve a host application.
 */
hostRoutes.post(
  '/admin/applications/:applicationId/approve',
  requireAuth,
  requireAdminOrModerator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const applicationId = String(req.params.applicationId);
      const { note } = req.body;
      await approveHostApplication(applicationId, String(req.user.uid), note);
      res.json({ message: 'Solicitud aprobada exitosamente.' });
    } catch (err: any) {
      console.error('POST /host/admin/approve error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);

/**
 * POST /api/host/admin/applications/:applicationId/reject
 * Reject a host application.
 */
hostRoutes.post(
  '/admin/applications/:applicationId/reject',
  requireAuth,
  requireAdminOrModerator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const applicationId = String(req.params.applicationId);
      const { note } = req.body;
      await rejectHostApplication(applicationId, String(req.user.uid), note);
      res.json({ message: 'Solicitud rechazada.' });
    } catch (err: any) {
      console.error('POST /host/admin/reject error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);

/**
 * POST /api/host/admin/:hostId/suspend
 * Suspend a host account.
 */
hostRoutes.post(
  '/admin/:hostId/suspend',
  requireAuth,
  requireAdminOrModerator,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const hostId = String(req.params.hostId);
      const { reason } = req.body;
      await suspendHost(hostId, String(req.user.uid), reason);
      res.json({ message: 'Host suspendido.' });
    } catch (err: any) {
      console.error('POST /host/admin/suspend error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);
