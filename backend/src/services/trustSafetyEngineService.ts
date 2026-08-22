import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskAction = 'ALLOW' | 'MONITOR' | 'VERIFY' | 'LIMIT' | 'HOLD' | 'REVIEW' | 'BLOCK';

export interface RiskEvaluationResult {
  entityId: string;
  entityType: 'USER' | 'CREATOR' | 'TRANSACTION' | 'PAYOUT' | 'REFERRAL';
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  recommendedAction: RiskAction;
  signals: string[];
  evaluatedAt: string;
}

export interface IdempotencyRecord {
  idempotencyKey: string;
  userId: string;
  responsePayload: any;
  createdAt: any;
}

export interface SecurityKillSwitchStatus {
  target: 'PAYOUTS' | 'REFERRALS' | 'PURCHASES' | 'GIFTS';
  status: 'ACTIVE' | 'PAUSED';
  updatedBy: string;
  reason?: string;
  updatedAt: string;
}

const killSwitchesState: Record<string, SecurityKillSwitchStatus> = {
  PAYOUTS: { target: 'PAYOUTS', status: 'ACTIVE', updatedBy: 'SYSTEM', updatedAt: new Date().toISOString() },
  REFERRALS: { target: 'REFERRALS', status: 'ACTIVE', updatedBy: 'SYSTEM', updatedAt: new Date().toISOString() },
  PURCHASES: { target: 'PURCHASES', status: 'ACTIVE', updatedBy: 'SYSTEM', updatedAt: new Date().toISOString() },
  GIFTS: { target: 'GIFTS', status: 'ACTIVE', updatedBy: 'SYSTEM', updatedAt: new Date().toISOString() },
};

export const evaluateRiskScore = async (
  entityId: string,
  entityType: 'USER' | 'CREATOR' | 'TRANSACTION' | 'PAYOUT' | 'REFERRAL',
  context?: any
): Promise<RiskEvaluationResult> => {
  let riskScore = 15; // Base low risk
  const signals: string[] = [];

  if (context?.isNewDevice) {
    riskScore += 20;
    signals.push('DISPOSITIVO_NUEVO_DETECTADO');
  }
  if (context?.amountCents && context.amountCents > 100000) { // > $1,000 USD
    riskScore += 35;
    signals.push('MONTO_ELEVADO_PAYOUT');
  }
  if (context?.giftLoopDetected) {
    riskScore += 45;
    signals.push('PATRON_BUCLE_REGALOS_DETECTADO');
  }

  let riskLevel: RiskLevel = 'LOW';
  let recommendedAction: RiskAction = 'ALLOW';

  if (riskScore >= 80) {
    riskLevel = 'CRITICAL';
    recommendedAction = 'BLOCK';
  } else if (riskScore >= 60) {
    riskLevel = 'HIGH';
    recommendedAction = 'HOLD';
  } else if (riskScore >= 35) {
    riskLevel = 'MEDIUM';
    recommendedAction = 'VERIFY';
  }

  return {
    entityId,
    entityType,
    riskScore,
    riskLevel,
    recommendedAction,
    signals,
    evaluatedAt: new Date().toISOString(),
  };
};

export const enforceIdempotencyKey = async (
  userId: string,
  idempotencyKey: string,
  payloadProducer: () => Promise<any>
): Promise<{ cached: boolean; data: any }> => {
  const ref = db.collection('idempotencyKeys').doc(`${userId}_${idempotencyKey}`);
  const snap = await ref.get();

  if (snap.exists) {
    const record = snap.data() as IdempotencyRecord;
    return { cached: true, data: record.responsePayload };
  }

  const result = await payloadProducer();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await ref.set({
    idempotencyKey,
    userId,
    responsePayload: result,
    createdAt: timestamp,
  });

  return { cached: false, data: result };
};

export const detectAccountTakeover = async (
  userId: string,
  deviceId: string,
  ipAddress: string,
  action: 'CREDENTIAL_UPDATE' | 'PAYOUT_METHOD_UPDATE' | 'LOGIN'
): Promise<{ status: 'SECURE' | 'SECURITY_HOLD'; holdReason?: string }> => {
  if (action === 'PAYOUT_METHOD_UPDATE' || action === 'CREDENTIAL_UPDATE') {
    await db.collection('users').doc(userId).set(
      {
        securityHoldUntil: new Date(Date.now() + 48 * 3600000).toISOString(),
        lastSecurityEvent: action,
      },
      { merge: true }
    );

    return {
      status: 'SECURITY_HOLD',
      holdReason: `Bloqueo preventivo de 48h activado tras la acción de seguridad: ${action}`,
    };
  }

  return { status: 'SECURE' };
};

export const verifyPayoutSecurity = async (
  userId: string,
  amountCents: number
): Promise<{ status: 'APPROVED' | 'PENDING_REVIEW'; reviewReason?: string }> => {
  if (killSwitchesState.PAYOUTS.status === 'PAUSED') {
    throw new Error('KILL_SWITCH_ACTIVE: La función de Payouts se encuentra pausada temporalmente por seguridad.');
  }

  if (amountCents > 50000) { // > $500 USD
    return {
      status: 'PENDING_REVIEW',
      reviewReason: 'El monto excede el umbral de aprobación automática ($500 USD). Revisa manual requerida.',
    };
  }

  return { status: 'APPROVED' };
};

export const toggleSecurityKillSwitch = async (
  target: 'PAYOUTS' | 'REFERRALS' | 'PURCHASES' | 'GIFTS',
  status: 'ACTIVE' | 'PAUSED',
  adminId: string = 'SUPER_ADMIN'
): Promise<SecurityKillSwitchStatus> => {
  killSwitchesState[target] = {
    target,
    status,
    updatedBy: adminId,
    updatedAt: new Date().toISOString(),
  };

  await db.collection('securityKillSwitches').doc(target).set(killSwitchesState[target]);
  return killSwitchesState[target];
};

export const getSecurityKillSwitchesState = (): Record<string, SecurityKillSwitchStatus> => {
  return killSwitchesState;
};
