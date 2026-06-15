export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationRequest {
  id: string;
  userId: string;
  userRole: 'host' | 'agency';
  realName: string;
  documentNumber: string;
  documentType: string;
  idDocumentUrl: string;
  selfieUrl: string;
  status: VerificationStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: any;
  createdAt: any;
  updatedAt: any;
}
