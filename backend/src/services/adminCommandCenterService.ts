import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'FINANCE_ADMIN'
  | 'MODERATION_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'AGENCY_ADMIN'
  | 'GROWTH_ADMIN'
  | 'ANALYTICS_ADMIN'
  | 'CONTENT_ADMIN'
  | 'TECH_ADMIN';

export interface AdminSessionRecord {
  sessionId: string;
  adminId: string;
  email: string;
  role: AdminRole;
  ipAddress: string;
  is2FAVerified: boolean;
  status: 'ACTIVE' | 'REVOKED';
  createdAt: any;
}

export interface AdminAuditLogRecord {
  id: string;
  adminId: string;
  role: AdminRole;
  action: string;
  target: string;
  changes?: any;
  reason?: string;
  timestamp: any;
}

export interface MaintenanceStatus {
  enabled: boolean;
  title: string;
  message: string;
  estimatedDurationMinutes: number;
  updatedBy: string;
  updatedAt: string;
}

const mockAdmins: Record<string, { role: AdminRole; passHash: string }> = {
  'superadmin@partylive.app': { role: 'SUPER_ADMIN', passHash: 'SuperAdmin#2026!' },
  'opsadmin@partylive.app': { role: 'OPERATIONS_ADMIN', passHash: 'OpsAdmin#2026!' },
  'financeadmin@partylive.app': { role: 'FINANCE_ADMIN', passHash: 'FinanceAdmin#2026!' },
  'modadmin@partylive.app': { role: 'MODERATION_ADMIN', passHash: 'ModAdmin#2026!' },
  'supportadmin@partylive.app': { role: 'SUPPORT_ADMIN', passHash: 'SupportAdmin#2026!' },
  'agencyadmin@partylive.app': { role: 'AGENCY_ADMIN', passHash: 'AgencyAdmin#2026!' },
  'growthadmin@partylive.app': { role: 'GROWTH_ADMIN', passHash: 'GrowthAdmin#2026!' },
  'analyticsadmin@partylive.app': { role: 'ANALYTICS_ADMIN', passHash: 'AnalyticsAdmin#2026!' },
  'contentadmin@partylive.app': { role: 'CONTENT_ADMIN', passHash: 'ContentAdmin#2026!' },
  'techadmin@partylive.app': { role: 'TECH_ADMIN', passHash: 'TechAdmin#2026!' },
};

let globalMaintenance: MaintenanceStatus = {
  enabled: false,
  title: 'Mantenimiento Programado',
  message: 'PartyLive se encuentra actualmente en mantenimiento de la plataforma. Regresaremos en breve.',
  estimatedDurationMinutes: 30,
  updatedBy: 'SYSTEM',
  updatedAt: new Date().toISOString(),
};

export const authenticateAdminSession = async (
  email: string,
  pass: string,
  code2FA: string = '123456',
  ipAddress: string = '127.0.0.1'
): Promise<AdminSessionRecord> => {
  const account = mockAdmins[email.toLowerCase()];
  if (!account || account.passHash !== pass) {
    throw new Error('AUTH_FAILED: Credenciales administrativas inválidas.');
  }

  if (code2FA !== '123456') {
    throw new Error('INVALID_2FA: Código de autenticación de dos factores incorrecto.');
  }

  const ref = db.collection('adminSessions').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const session: AdminSessionRecord = {
    sessionId: ref.id,
    adminId: `admin_${email.split('@')[0]}`,
    email,
    role: account.role,
    ipAddress,
    is2FAVerified: true,
    status: 'ACTIVE',
    createdAt: timestamp,
  };

  await ref.set(session);
  return session;
};

export const revokeAdminSession = async (sessionId: string): Promise<boolean> => {
  const ref = db.collection('adminSessions').doc(sessionId);
  await ref.update({ status: 'REVOKED' });
  return true;
};

export const logAdminAction = async (
  adminId: string,
  role: AdminRole,
  action: string,
  target: string,
  changes?: any,
  reason?: string
): Promise<AdminAuditLogRecord> => {
  const ref = db.collection('adminAuditLogs').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const record: AdminAuditLogRecord = {
    id: ref.id,
    adminId,
    role,
    action,
    target,
    changes: changes || {},
    reason: reason || 'Acción administrativa estándar',
    timestamp,
  };

  await ref.set(record);
  return record;
};

export const getAdminCommandCenterOverview = async () => {
  return {
    kpis: {
      dau: 12450,
      mau: 84200,
      activeLives: 42,
      concurrentViewers: 1580,
      revenueTodayUsd: 3450.75,
      openTickets: 8,
      safetyCasesOpen: 3,
    },
    servicesHealth: {
      api: 'HEALTHY',
      firebase: 'HEALTHY',
      livekit: 'HEALTHY',
      payments: 'HEALTHY',
      storage: 'HEALTHY',
      notifications: 'HEALTHY',
    },
    maintenance: globalMaintenance,
    timestamp: new Date().toISOString(),
  };
};

export const setMaintenanceMode = async (
  enabled: boolean,
  title?: string,
  message?: string,
  estDurationMinutes: number = 30,
  adminId: string = 'SUPER_ADMIN'
): Promise<MaintenanceStatus> => {
  globalMaintenance = {
    enabled,
    title: title || globalMaintenance.title,
    message: message || globalMaintenance.message,
    estimatedDurationMinutes: estDurationMinutes,
    updatedBy: adminId,
    updatedAt: new Date().toISOString(),
  };

  await db.collection('systemMaintenance').doc('current').set(globalMaintenance);
  return globalMaintenance;
};
