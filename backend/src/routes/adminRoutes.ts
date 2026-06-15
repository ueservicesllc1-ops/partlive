import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { requireAdmin, requireAdminOrModerator } from '../middleware/adminMiddleware';
import { getAdminSummary } from '../services/adminStatsService';
import { createAdminLog } from '../services/adminLogService';
import { executeWalletTransaction } from '../services/walletAdminService';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

const router = Router();

// 1. Dashboard summary stats
router.get('/summary', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const summary = await getAdminSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching admin summary:', error);
    res.status(500).json({ error: 'Failed to fetch admin summary' });
  }
});

// 2. Manual Wallet Adjustment
router.post('/users/:userId/wallet-adjustment', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { currencyType, amount, direction, reason } = req.body;

    if (!['coins', 'diamonds'].includes(currencyType)) {
      res.status(400).json({ error: 'Invalid currencyType. Must be coins or diamonds' });
      return;
    }
    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }
    if (!['credit', 'debit'].includes(direction)) {
      res.status(400).json({ error: 'Invalid direction. Must be credit or debit' });
      return;
    }

    const updatedWallet = await executeWalletTransaction({
      userId,
      amount,
      type: 'adjustment',
      direction: direction as 'credit' | 'debit',
      currencyType: currencyType as 'coins' | 'diamonds',
      description: (reason as string) || 'Manual adjustment by administrator',
    });

    // Write audit log
    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'wallet_adjustment',
      targetType: 'user',
      targetId: userId,
      description: `Adjusted user wallet. Currency: ${currencyType}, Amount: ${amount}, Direction: ${direction}. Reason: ${reason || 'None provided'}`,
      metadata: { currencyType, amount, direction, reason },
    });

    res.json({ success: true, wallet: updatedWallet });
  } catch (error: any) {
    console.error('Error adjusting wallet:', error);
    res.status(500).json({ error: error.message || 'Failed to adjust user wallet' });
  }
});

// 3. User operations: Suspend / Reactivate / Verify / Change Role
router.post('/users/:userId/suspend', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { reason } = req.body;

    await db.collection('users').doc(userId).update({
      status: 'suspended',
      suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
      suspendReason: reason || '',
    });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'suspend_user',
      targetType: 'user',
      targetId: userId,
      description: `Suspended user. Reason: ${reason || 'None provided'}`,
      metadata: { reason },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

router.post('/users/:userId/reactivate', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;

    await db.collection('users').doc(userId).update({
      status: 'active',
      suspendedAt: admin.firestore.FieldValue.delete(),
      suspendReason: admin.firestore.FieldValue.delete(),
    });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'reactivate_user',
      targetType: 'user',
      targetId: userId,
      description: 'Reactivated suspended user',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error reactivating user:', error);
    res.status(500).json({ error: 'Failed to reactivate user' });
  }
});

router.post('/users/:userId/verify', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;

    await db.collection('users').doc(userId).update({
      isVerified: true,
    });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'verify_user',
      targetType: 'user',
      targetId: userId,
      description: 'Marked user as verified',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

router.post('/users/:userId/unverify', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;

    await db.collection('users').doc(userId).update({
      isVerified: false,
    });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'unverify_user',
      targetType: 'user',
      targetId: userId,
      description: 'Removed verified status from user',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error unverifying user:', error);
    res.status(500).json({ error: 'Failed to unverify user' });
  }
});

router.post('/users/:userId/role', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { role } = req.body;

    if (!['user', 'host', 'moderator', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    await db.collection('users').doc(userId).update({ role });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'change_user_role',
      targetType: 'user',
      targetId: userId,
      description: `Changed user role to ${role}`,
      metadata: { role },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({ error: 'Failed to change user role' });
  }
});

// 4. Rooms Close / Suspend
router.post('/rooms/:roomId/close', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = req.params.roomId as string;

    await db.collection('rooms').doc(roomId).update({
      status: 'inactive',
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'close_room',
      targetType: 'room',
      targetId: roomId,
      description: 'Closed audio room',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error closing room:', error);
    res.status(500).json({ error: 'Failed to close room' });
  }
});

router.post('/rooms/:roomId/suspend', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = req.params.roomId as string;
    const { reason } = req.body;

    await db.collection('rooms').doc(roomId).update({
      status: 'suspended',
      suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
      suspendReason: reason || '',
    });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'suspend_room',
      targetType: 'room',
      targetId: roomId,
      description: `Suspended audio room. Reason: ${reason || 'None'}`,
      metadata: { reason },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error suspending room:', error);
    res.status(500).json({ error: 'Failed to suspend room' });
  }
});

// 5. Lives End / Suspend
router.post('/lives/:liveId/end', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const liveId = req.params.liveId as string;

    await db.collection('lives').doc(liveId).update({
      status: 'ended',
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'end_live',
      targetType: 'live',
      targetId: liveId,
      description: 'Ended live stream',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending live:', error);
    res.status(500).json({ error: 'Failed to end live' });
  }
});

router.post('/lives/:liveId/suspend', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const liveId = req.params.liveId as string;
    const { reason } = req.body;

    await db.collection('lives').doc(liveId).update({
      status: 'suspended',
      suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
      suspendReason: reason || '',
    });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'suspend_live',
      targetType: 'live',
      targetId: liveId,
      description: `Suspended live stream. Reason: ${reason || 'None'}`,
      metadata: { reason },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error suspending live:', error);
    res.status(500).json({ error: 'Failed to suspend live' });
  }
});

// 6. Reports Endpoints
router.get('/reports', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const reportsSnap = await db.collection('reports').orderBy('createdAt', 'desc').get();
    const reports: any[] = [];
    reportsSnap.forEach(doc => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    res.json(reports);
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

router.post('/reports/:reportId/status', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const reportId = req.params.reportId as string;
    const { status, resolutionNotes } = req.body;

    if (!['pending', 'reviewing', 'resolved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid report status' });
      return;
    }

    await db.collection('reports').doc(reportId).update({
      status,
      resolutionNotes: resolutionNotes || '',
      resolvedAt: status === 'resolved' || status === 'rejected' ? admin.firestore.FieldValue.serverTimestamp() : null,
      resolvedBy: req.user.uid,
    });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'update_report_status',
      targetType: 'report',
      targetId: reportId,
      description: `Updated report status to ${status}. Notes: ${resolutionNotes || 'None'}`,
      metadata: { status, resolutionNotes },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// 7. Gifts Endpoints (CRUD)
router.get('/gifts', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const giftsSnap = await db.collection('gifts').orderBy('sortOrder', 'asc').get();
    const gifts: any[] = [];
    giftsSnap.forEach(doc => {
      gifts.push({ id: doc.id, ...doc.data() });
    });
    res.json(gifts);
  } catch (error) {
    console.error('Error listing gifts:', error);
    res.status(500).json({ error: 'Failed to list gifts' });
  }
});

router.post('/gifts', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const giftData = req.body;
    const giftRef = db.collection('gifts').doc();
    const newGift = {
      id: giftRef.id,
      ...giftData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await giftRef.set(newGift);

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'create_gift',
      targetType: 'gift',
      targetId: giftRef.id,
      description: `Created gift: ${giftData.name}`,
      metadata: giftData,
    });

    res.json(newGift);
  } catch (error) {
    console.error('Error creating gift:', error);
    res.status(500).json({ error: 'Failed to create gift' });
  }
});

router.patch('/gifts/:giftId', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const giftId = req.params.giftId as string;
    const updates = req.body;

    await db.collection('gifts').doc(giftId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'update_gift',
      targetType: 'gift',
      targetId: giftId,
      description: `Updated gift: ${updates.name || giftId}`,
      metadata: updates,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating gift:', error);
    res.status(500).json({ error: 'Failed to update gift' });
  }
});

// 8. Private Chat Admin Monitoring
router.get('/private-chat/summary', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const conversationsSnap = await db.collection('privateConversations').get();
    const activeConvs = conversationsSnap.docs.filter(doc => doc.data().status === 'active').length;
    const pendingConvs = conversationsSnap.docs.filter(doc => doc.data().status === 'pending').length;

    const reportsSnap = await db.collection('reports')
      .where('targetType', '==', 'private_message')
      .get();
    const totalReported = reportsSnap.size;

    // Aggregate users with most reports
    const userReportCounts: Record<string, number> = {};
    reportsSnap.forEach(doc => {
      const data = doc.data();
      if (data.reportedUserId) {
        userReportCounts[data.reportedUserId] = (userReportCounts[data.reportedUserId] || 0) + 1;
      }
    });

    const topReportedUsers = Object.keys(userReportCounts)
      .map(userId => ({ userId, count: userReportCounts[userId] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Fetch user details for top reported users
    const topReportedUsersWithDetails = await Promise.all(
      topReportedUsers.map(async item => {
        const uSnap = await db.collection('users').doc(item.userId).get();
        const uData = uSnap.exists ? uSnap.data()! : {};
        return {
          userId: item.userId,
          count: item.count,
          username: uData.username || 'unknown',
          displayName: uData.displayName || 'Unknown User',
          photoURL: uData.photoURL || '',
          status: uData.status || 'active',
        };
      })
    );

    res.json({
      summary: {
        activeConversations: activeConvs,
        pendingRequests: pendingConvs,
        totalReportedMessages: totalReported,
      },
      topReportedUsers: topReportedUsersWithDetails,
    });
  } catch (error: any) {
    console.error('Error fetching private chat summary:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch private chat summary.' });
  }
});

router.get('/private-chat/reported-message/:messageId/context', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const messageId = req.params.messageId as string;

    // Find the report to get context (like conversationId)
    const reportSnap = await db.collection('reports')
      .where('targetType', '==', 'private_message')
      .where('targetId', '==', messageId)
      .limit(1)
      .get();

    if (reportSnap.empty) {
      res.status(404).json({ error: 'Reporte no encontrado para este mensaje.' });
      return;
    }

    const reportData = reportSnap.docs[0].data();
    const conversationId = reportData.conversationId as string;

    if (!conversationId) {
      res.status(400).json({ error: 'El reporte no contiene conversationId.' });
      return;
    }

    // Retrieve the target message
    const msgRef = db.collection('privateConversations').doc(conversationId).collection('messages').doc(messageId);
    const msgSnap = await msgRef.get();
    if (!msgSnap.exists) {
      res.status(404).json({ error: 'El mensaje reportado ya no existe.' });
      return;
    }

    const targetMsg = msgSnap.data() as any;
    const targetMsgCreatedAt = targetMsg.createdAt;

    // Fetch 5 messages before
    const beforeSnap = await db.collection('privateConversations')
      .doc(conversationId)
      .collection('messages')
      .where('createdAt', '<', targetMsgCreatedAt)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const beforeMsgs = beforeSnap.docs.map(doc => doc.data()).reverse();

    // Fetch 5 messages after
    const afterSnap = await db.collection('privateConversations')
      .doc(conversationId)
      .collection('messages')
      .where('createdAt', '>', targetMsgCreatedAt)
      .orderBy('createdAt', 'asc')
      .limit(5)
      .get();

    const afterMsgs = afterSnap.docs.map(doc => doc.data());

    // Combine
    const contextMessages = [...beforeMsgs, targetMsg, ...afterMsgs];

    res.json({
      report: { id: reportSnap.docs[0].id, ...reportData },
      targetMessage: targetMsg,
      context: contextMessages,
    });
  } catch (error: any) {
    console.error('Error fetching message context:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch reported message context.' });
  }
});

router.post('/private-chat/messages/:messageId/hide', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const messageId = req.params.messageId as string;
    const conversationId = req.body.conversationId as string;

    if (!conversationId) {
      res.status(400).json({ error: 'Falta el conversationId en el cuerpo de la petición.' });
      return;
    }

    const msgRef = db.collection('privateConversations').doc(conversationId).collection('messages').doc(messageId);
    const msgSnap = await msgRef.get();
    if (!msgSnap.exists) {
      res.status(404).json({ error: 'Mensaje no encontrado.' });
      return;
    }

    await msgRef.update({
      hiddenByAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await createAdminLog({
      adminId: req.user.uid as string,
      action: 'hide_private_message',
      targetType: 'private_message',
      targetId: messageId,
      description: `Moderator hid reported private message in conversation ${conversationId}`,
      metadata: { conversationId },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error hiding private message:', error);
    res.status(500).json({ error: error.message || 'Failed to hide message.' });
  }
});

export default router;
