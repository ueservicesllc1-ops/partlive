export interface Agency {
  id: string; // agencyId
  ownerId: string; // userId of owner
  name: string;
  country: string;
  contactEmail: string;
  contactPhone?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  commissionPercent: number; // commission rate, e.g. 10 meaning 10%
  totalHosts: number;
  totalBeansGenerated: number;
  totalCommissionBeans: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface AgencyHost {
  id: string; // agencyId_hostId
  agencyId: string;
  hostId: string;
  status: 'active' | 'removed';
  joinedAt: any; // Firestore Timestamp
  removedAt?: any; // Firestore Timestamp
}

export interface AgencyCommission {
  id: string;
  agencyId: string;
  hostId: string;
  giftEventId: string;
  beansGenerated: number;
  commissionBeans: number;
  status: 'pending' | 'paid';
  createdAt: any; // Firestore Timestamp
}
