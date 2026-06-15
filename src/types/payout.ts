export type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';

export type PayoutMethodType = 'paypal' | 'bank_transfer' | 'payoneer' | 'binance' | 'payphone' | 'manual' | 'other';

export interface HostPayoutMethod {
  id: string;
  hostId: string;
  type: PayoutMethodType;
  label: string;
  details: {
    email?: string;
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    swiftCode?: string;
    binanceId?: string;
    payphonePhone?: string;
    extraInfo?: string;
  };
  maskedDetails: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface HostPayout {
  id: string;
  hostId: string;
  amountBeans: number; // number of beans requested
  conversionRate: number; // e.g. 0.003
  amountUsd: number; // in USD
  feeUsd: number; // in USD
  netAmountUsd: number; // in USD
  status: PayoutStatus;
  fraudReviewStatus: 'pending' | 'passed' | 'failed';
  payoutMethodId: string;
  payoutMethodType: PayoutMethodType;
  payoutMethodLabel: string;
  payoutDetailsMasked: string;
  adminNote?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  processedAt?: any; // Firestore Timestamp
  paidAt?: any; // Firestore Timestamp
  rejectedAt?: any; // Firestore Timestamp
  cancelledAt?: any; // Firestore Timestamp
}
