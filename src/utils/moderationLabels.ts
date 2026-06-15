import { ReportReason, ReportStatus, ModerationActionType, UserStatus } from '../types';
import { REPORT_REASONS, REPORT_TARGET_TYPES, USER_STATUS_LABELS, MODERATION_ACTION_LABELS } from '../constants/moderation';

export const getReportReasonLabel = (reason: ReportReason | string): string => {
  const found = REPORT_REASONS.find((r) => r.value === reason);
  return found ? found.label : 'Motivo desconocido';
};

export const getReportTargetTypeLabel = (type: string): string => {
  return (REPORT_TARGET_TYPES as any)[type] || 'Desconocido';
};

export const getReportStatusLabel = (status: ReportStatus | string): string => {
  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    reviewing: 'En Revisión',
    resolved: 'Resuelto',
    rejected: 'Rechazado',
    duplicate: 'Duplicado',
  };
  return statusLabels[status] || 'Desconocido';
};

export const getModerationActionLabel = (action: ModerationActionType | string): string => {
  return (MODERATION_ACTION_LABELS as any)[action] || action;
};

export const getUserStatusLabel = (status: UserStatus | string): string => {
  return (USER_STATUS_LABELS as any)[status] || 'Desconocido';
};
