import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface LegalDocument {
  id: string;
  documentType: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES' | 'CREATOR_AGREEMENT' | 'AGENCY_AGREEMENT' | 'REFUND_POLICY';
  title: string;
  content: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  legalReviewRequired: boolean;
  publishedAt: any;
  createdBy: string;
}

export interface TermsAcceptance {
  id: string;
  userId: string;
  documentType: string;
  version: string;
  acceptedAt: any;
  country: string;
  platform: string;
}

export interface UserConsent {
  userId: string;
  marketing: boolean;
  notifications: boolean;
  location: boolean;
  personalization: boolean;
  updatedAt: any;
}

export interface PrivacyRequest {
  id: string;
  userId: string;
  requestType: 'DOWNLOAD_DATA' | 'DELETE_ACCOUNT' | 'CORRECT_DATA';
  status: 'SUBMITTED' | 'IN_REVIEW' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  justification?: string;
  resolutionNotes?: string;
  reviewerId?: string;
  createdAt: any;
  updatedAt: any;
}

export const publishLegalDocument = async (
  documentType: LegalDocument['documentType'],
  title: string,
  content: string,
  version: string,
  adminId: string
): Promise<LegalDocument> => {
  const docRef = db.collection('legalDocuments').doc(`${documentType}_v${version}`);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const document: LegalDocument = {
    id: docRef.id,
    documentType,
    title,
    content,
    version,
    status: 'PUBLISHED',
    legalReviewRequired: true, // Marked for attorney review
    publishedAt: timestamp,
    createdBy: adminId,
  };

  await docRef.set(document);
  return document;
};

export const recordTermsAcceptance = async (
  userId: string,
  documentType: string,
  version: string,
  country: string = 'US',
  platform: string = 'iOS'
): Promise<TermsAcceptance> => {
  const ref = db.collection('termsAcceptances').doc(`${userId}_${documentType}_${version}`);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const acceptance: TermsAcceptance = {
    id: ref.id,
    userId,
    documentType,
    version,
    acceptedAt: timestamp,
    country,
    platform,
  };

  await ref.set(acceptance);
  return acceptance;
};

export const updateUserConsent = async (
  userId: string,
  consentType: 'marketing' | 'notifications' | 'location' | 'personalization',
  granted: boolean
): Promise<UserConsent> => {
  const ref = db.collection('userConsents').doc(userId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await ref.set({
    userId,
    [consentType]: granted,
    updatedAt: timestamp,
  }, { merge: true });

  const updated = await ref.get();
  return updated.data() as UserConsent;
};

export const submitPrivacyRequest = async (
  userId: string,
  requestType: PrivacyRequest['requestType'],
  justification?: string
): Promise<PrivacyRequest> => {
  const ref = db.collection('privacyRequests').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const req: PrivacyRequest = {
    id: ref.id,
    userId,
    requestType,
    status: 'SUBMITTED',
    justification: justification || '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await ref.set(req);

  // If Account Deletion requested, flag user profile as PENDING_DELETION
  if (requestType === 'DELETE_ACCOUNT') {
    await db.collection('users').doc(userId).update({
      deletionStatus: 'PENDING_DELETION',
      deletionRequestedAt: timestamp,
    });
  }

  return req;
};

export const processPrivacyRequest = async (
  requestId: string,
  status: PrivacyRequest['status'],
  resolutionNotes: string,
  adminId: string
): Promise<PrivacyRequest> => {
  const ref = db.collection('privacyRequests').doc(requestId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`REQUEST_NOT_FOUND: ${requestId}`);

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await ref.update({
    status,
    resolutionNotes,
    reviewerId: adminId,
    updatedAt: timestamp,
  });

  const updated = await ref.get();
  return updated.data() as PrivacyRequest;
};
