import { PayoutStatus, PayoutMethodType } from '../types/payout';
import { PAYOUT_CONFIG } from '../constants/payoutConfig';

export const getPayoutStatusLabel = (status: PayoutStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'approved':
      return 'Aprobado';
    case 'paid':
      return 'Pagado';
    case 'rejected':
      return 'Rechazado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return 'Desconocido';
  }
};

export const getPayoutStatusDescription = (status: PayoutStatus): string => {
  switch (status) {
    case 'pending':
      return 'Tu solicitud está siendo revisada por nuestro equipo de administración.';
    case 'approved':
      return 'Tu retiro fue aprobado y está programado para ser enviado a tu cuenta.';
    case 'paid':
      return 'Los fondos han sido transferidos exitosamente a tu cuenta.';
    case 'rejected':
      return 'Tu solicitud fue rechazada. Los diamantes han sido reembolsados a tu billetera.';
    case 'cancelled':
      return 'Cancelaste esta solicitud. Los diamantes han sido devueltos a tu billetera.';
    default:
      return '';
  }
};

export const getPayoutStatusColor = (status: PayoutStatus): string => {
  switch (status) {
    case 'pending':
      return '#E6A23C'; // Amber/Orange
    case 'approved':
      return '#409EFF'; // Blue
    case 'paid':
      return '#67C23A'; // Green
    case 'rejected':
      return '#F56C6C'; // Red
    case 'cancelled':
      return '#909399'; // Gray
    default:
      return '#909399';
  }
};

export const getPayoutMethodTypeLabel = (type: PayoutMethodType): string => {
  switch (type) {
    case 'paypal':
      return 'PayPal';
    case 'bank_transfer':
      return 'Transferencia Bancaria';
    case 'payoneer':
      return 'Payoneer';
    case 'other':
      return 'Otro Método';
    default:
      return 'Método de Pago';
  }
};

export const canCancelPayout = (status: PayoutStatus): boolean => {
  return status === 'pending';
};

export const calculatePayoutPreview = (diamonds: number) => {
  const amountUsd = diamonds * PAYOUT_CONFIG.DIAMONDS_TO_USD_RATE;
  const feeUsd = PAYOUT_CONFIG.PAYOUT_FEE_USD;
  const netAmountUsd = Math.max(0, amountUsd - feeUsd);

  return {
    amountUsd,
    feeUsd,
    netAmountUsd,
  };
};

export const formatPayoutAmountUsd = (amount: number): string => {
  return `$${amount.toFixed(2)} USD`;
};
