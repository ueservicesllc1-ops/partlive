import { ReportReason, ReportTargetType, UserStatus, ModerationActionType } from '../types';

export const REPORT_REASONS: { label: string; value: ReportReason }[] = [
  { label: 'Spam', value: 'spam' },
  { label: 'Acoso o intimidación', value: 'harassment' },
  { label: 'Incitación al odio', value: 'hate_speech' },
  { label: 'Contenido sexual explícito', value: 'sexual_content' },
  { label: 'Violencia explícita', value: 'violence' },
  { label: 'Fraude o estafa', value: 'scam' },
  { label: 'Suplantación de identidad', value: 'impersonation' },
  { label: 'Menor de edad', value: 'underage' },
  { label: 'Actividad ilegal', value: 'illegal_activity' },
  { label: 'Autolesiones', value: 'self_harm' },
  { label: 'Violación de privacidad', value: 'privacy' },
  { label: 'Otro', value: 'other' },
];

export const REPORT_TARGET_TYPES: Record<ReportTargetType, string> = {
  user: 'Usuario',
  message: 'Mensaje',
  room: 'Sala',
  live: 'Live',
  gift: 'Regalo',
  host: 'Host',
  payout: 'Retiro',
  other: 'Otro',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Activo',
  warning: 'Advertido',
  suspended: 'Suspendido',
  banned: 'Baneado',
  deleted: 'Eliminado',
};

export const MODERATION_ACTION_LABELS: Record<ModerationActionType, string> = {
  warn_user: 'Advertir Usuario',
  hide_message: 'Ocultar Mensaje',
  delete_message: 'Eliminar Mensaje',
  kick_from_room: 'Expulsar de Sala',
  ban_from_room: 'Banear de Sala',
  kick_from_live: 'Expulsar de Live',
  ban_from_live: 'Banear de Live',
  suspend_user: 'Suspender Usuario',
  unsuspend_user: 'Des-suspender Usuario',
  ban_user: 'Banear Usuario',
  unban_user: 'Desbanear Usuario',
  close_room: 'Cerrar Sala',
  suspend_room: 'Suspender Sala',
  end_live: 'Terminar Live',
  suspend_live: 'Suspender Live',
  resolve_report: 'Resolver Reporte',
  reject_report: 'Rechazar Reporte',
  lock_wallet: 'Bloquear Wallet',
  unlock_wallet: 'Desbloquear Wallet',
};

export const DEFAULT_REPORT_PRIORITY = 'normal';
export const MAX_REPORT_DESCRIPTION_LENGTH = 500;
