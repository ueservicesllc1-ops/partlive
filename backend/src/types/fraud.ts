export type FraudSignalType =
  | 'multi_account'
  | 'vpn_suspected'
  | 'bot_activity'
  | 'self_gifting'
  | 'circular_gifting'
  | 'suspicious_device'
  | 'suspicious_ip'
  | 'chargeback_risk'
  | 'new_account_high_spend'
  | 'suspicious_gift'
  | 'payout_risk';

export interface FraudSignal {
  id: string;
  userId: string;
  type: FraudSignalType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  metadata?: Record<string, any>;
  status: 'open' | 'reviewing' | 'resolved' | 'ignored';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  reviewedBy?: string;
  reviewedAt?: any; // Firestore Timestamp
  reviewNote?: string;
}

export interface UserRisk {
  id: string; // userId
  userId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signalsCount: number;
  lastSignalAt: any; // Firestore Timestamp
  payoutBlocked: boolean;
  giftBlocked: boolean;
  walletLocked: boolean;
  updatedAt: any; // Firestore Timestamp
}
