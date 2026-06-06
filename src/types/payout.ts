export type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';

export type PayoutMethodType = 'paypal' | 'bank_transfer' | 'payoneer' | 'other';

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
  amount: number; // in USD
  diamondsConverted: number; // number of diamonds
  status: PayoutStatus;
  payoutMethodId: string;
  payoutMethodType: PayoutMethodType;
  payoutMethodLabel: string;
  payoutDetailsMasked: string;
  fee: number; // in USD
  netAmount: number; // in USD (amount - fee)
  adminNotes?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  processedAt?: any; // Firestore Timestamp
  paidAt?: any; // Firestore Timestamp
  rejectedAt?: any; // Firestore Timestamp
  cancelledAt?: any; // Firestore Timestamp
}
