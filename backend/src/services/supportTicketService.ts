import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { createNotificationAndPush } from './notificationService';

export interface SupportTicket {
  id: string;
  userId: string;
  category: 'ACCOUNT' | 'PAYMENT' | 'COINS' | 'GIFTS' | 'DIAMONDS' | 'PAYOUT' | 'SUBSCRIPTION' | 'VIP' | 'SAFETY' | 'COPYRIGHT' | 'TECHNICAL' | 'OTHER';
  subject: string;
  description: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'WAITING_FOR_INTERNAL_REVIEW' | 'RESOLVED' | 'CLOSED';
  assignedTeam: 'GENERAL' | 'FINANCE' | 'CREATOR' | 'SAFETY' | 'COPYRIGHT' | 'TECHNICAL';
  assignedTo?: string;
  relatedTransactionId?: string;
  csatRating?: number;
  createdAt: any;
  updatedAt: any;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'USER' | 'AGENT' | 'SYSTEM';
  message: string;
  isInternalNote: boolean;
  createdAt: any;
}

export const createSupportTicket = async (
  userId: string,
  data: {
    category: SupportTicket['category'];
    subject: string;
    description: string;
    relatedTransactionId?: string;
  }
): Promise<SupportTicket> => {
  const ticketRef = db.collection('supportTickets').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  // Auto-priority calculation
  let priority: SupportTicket['priority'] = 'NORMAL';
  const subLower = data.subject.toLowerCase() + ' ' + data.description.toLowerCase();

  if (subLower.includes('hack') || subLower.includes('stolen') || subLower.includes('chargeback')) {
    priority = 'CRITICAL';
  } else if (data.category === 'PAYMENT' || data.category === 'PAYOUT' || data.category === 'SAFETY') {
    priority = 'HIGH';
  } else if (subLower.includes('how to') || subLower.includes('profile')) {
    priority = 'LOW';
  }

  // Auto-routing team
  let assignedTeam: SupportTicket['assignedTeam'] = 'GENERAL';
  if (['PAYMENT', 'COINS', 'DIAMONDS', 'PAYOUT'].includes(data.category)) {
    assignedTeam = 'FINANCE';
  } else if (data.category === 'SAFETY') {
    assignedTeam = 'SAFETY';
  } else if (data.category === 'COPYRIGHT') {
    assignedTeam = 'COPYRIGHT';
  } else if (data.category === 'TECHNICAL') {
    assignedTeam = 'TECHNICAL';
  }

  const ticket: SupportTicket = {
    id: ticketRef.id,
    userId,
    category: data.category,
    subject: data.subject,
    description: data.description,
    priority,
    status: 'OPEN',
    assignedTeam,
    relatedTransactionId: data.relatedTransactionId || '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await ticketRef.set(ticket);

  // Add initial message
  const msgRef = db.collection('ticketMessages').doc();
  await msgRef.set({
    id: msgRef.id,
    ticketId: ticketRef.id,
    senderId: userId,
    senderRole: 'USER',
    message: data.description,
    isInternalNote: false,
    createdAt: timestamp,
  });

  return ticket;
};

export const addTicketMessage = async (
  ticketId: string,
  senderId: string,
  senderRole: TicketMessage['senderRole'],
  message: string,
  isInternalNote: boolean = false
): Promise<TicketMessage> => {
  const ticketRef = db.collection('supportTickets').doc(ticketId);
  const snap = await ticketRef.get();
  if (!snap.exists) throw new Error(`TICKET_NOT_FOUND: ${ticketId}`);

  const ticket = snap.data() as SupportTicket;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const msgRef = db.collection('ticketMessages').doc();

  const msg: TicketMessage = {
    id: msgRef.id,
    ticketId,
    senderId,
    senderRole,
    message,
    isInternalNote,
    createdAt: timestamp,
  };

  await msgRef.set(msg);

  // Update ticket status
  const newStatus = senderRole === 'USER' ? 'IN_PROGRESS' : (isInternalNote ? ticket.status : 'WAITING_FOR_USER');
  await ticketRef.update({
    status: newStatus,
    updatedAt: timestamp,
  });

  // Notify user if agent replied publicly
  if (senderRole === 'AGENT' && !isInternalNote) {
    try {
      await createNotificationAndPush({
        userId: ticket.userId,
        type: 'system',
        channel: 'both',
        title: '💬 Respuesta de Soporte PartyLive',
        body: `El equipo de soporte respondió a tu ticket: ${ticket.subject}`,
        actionType: 'open_url',
        actionValue: `partylive://support/ticket/${ticketId}`,
      });
    } catch (err) {
      console.warn('[Support] Failed notification:', err);
    }
  }

  return msg;
};

export const getUserTickets = async (userId: string): Promise<SupportTicket[]> => {
  const snap = await db.collection('supportTickets')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return snap.docs.map((d) => d.data() as SupportTicket);
};

export const getTicketMessagesForUser = async (userId: string, ticketId: string): Promise<TicketMessage[]> => {
  const ticketSnap = await db.collection('supportTickets').doc(ticketId).get();
  if (!ticketSnap.exists) throw new Error('Ticket not found.');
  if (ticketSnap.data()?.userId !== userId) throw new Error('UNAUTHORIZED: Ticket belongs to another user.');

  // Exclude internal notes from user view in memory to avoid composite index requirement
  const snap = await db.collection('ticketMessages')
    .where('ticketId', '==', ticketId)
    .get();

  const messages = snap.docs
    .map((d) => d.data() as TicketMessage)
    .filter((m) => !m.isInternalNote);

  messages.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
    return aTime - bTime;
  });

  return messages;
};

export const getAdminTicketQueue = async (
  assignedTeam?: string,
  statusFilter: string = 'OPEN'
): Promise<SupportTicket[]> => {
  let query: admin.firestore.Query = db.collection('supportTickets');

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.where('status', '==', statusFilter);
  }

  const snap = await query.limit(100).get();
  let tickets = snap.docs.map((d) => d.data() as SupportTicket);

  if (assignedTeam) {
    tickets = tickets.filter((t) => t.assignedTeam === assignedTeam);
  }

  const prioRank: Record<string, number> = { CRITICAL: 5, URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
  tickets.sort((a, b) => (prioRank[b.priority] || 0) - (prioRank[a.priority] || 0));

  return tickets;
};

export const resolveTicket = async (
  ticketId: string,
  resolutionNotes: string,
  adminId: string
): Promise<SupportTicket> => {
  const ticketRef = db.collection('supportTickets').doc(ticketId);
  const snap = await ticketRef.get();
  if (!snap.exists) throw new Error(`TICKET_NOT_FOUND: ${ticketId}`);

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.update(ticketRef, {
      status: 'RESOLVED',
      assignedTo: adminId,
      resolutionNotes,
      updatedAt: timestamp,
    });

    // Audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      actor: adminId,
      action: 'SUPPORT_TICKET_RESOLVED',
      transactionId: ticketId,
      timestamp,
    });
  });

  const updated = await ticketRef.get();
  return updated.data() as SupportTicket;
};
