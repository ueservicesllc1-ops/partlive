import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { b2Client } from '../config/b2';
import { VerificationRequest } from '../types/verification';

const VERIFICATIONS = 'verifications';
const USERS = 'users';

export const submitVerificationRequest = async (
  userId: string,
  realName: string,
  docNumber: string,
  docType: string,
  idDocUrl: string,
  selfieUrl: string,
  role: 'host' | 'agency'
): Promise<string> => {
  const requestRef = db.collection(VERIFICATIONS).doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const request: VerificationRequest = {
    id: requestRef.id,
    userId,
    userRole: role,
    realName,
    documentNumber: docNumber,
    documentType: docType,
    idDocumentUrl: idDocUrl,
    selfieUrl: selfieUrl,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await requestRef.set(request);

  // Mark user verificationStatus as pending
  await db.collection(USERS).doc(userId).update({
    kycStatus: 'pending',
    updatedAt: now,
  });

  return requestRef.id;
};

export const reviewVerificationRequest = async (
  requestId: string,
  adminUserId: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<void> => {
  const requestRef = db.collection(VERIFICATIONS).doc(requestId);
  const requestSnap = await requestRef.get();
  if (!requestSnap.exists) throw new Error('Verification request not found');
  const request = requestSnap.data() as VerificationRequest;

  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.update(requestRef, {
      status,
      adminNotes: notes || null,
      reviewedBy: adminUserId,
      reviewedAt: now,
      updatedAt: now,
    });

    const userRef = db.collection(USERS).doc(request.userId);
    
    if (status === 'approved') {
      transaction.update(userRef, {
        kycStatus: 'approved',
        isKycVerified: true,
        // Upgrade role if host approved
        role: request.userRole === 'host' ? 'host' : request.userRole === 'agency' ? 'agency' : 'listener',
        updatedAt: now,
      });
    } else {
      transaction.update(userRef, {
        kycStatus: 'rejected',
        isKycVerified: false,
        updatedAt: now,
      });
    }
  });
};

export const getVerificationDownloadUrl = async (fileKey: string): Promise<string> => {
  let cleanKey = fileKey;
  if (fileKey.includes('/verification/')) {
    cleanKey = fileKey.substring(fileKey.indexOf('verification/'));
  }

  const command = new GetObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME || '',
    Key: cleanKey,
  });

  // 1-hour expiration
  return await getSignedUrl(b2Client, command, { expiresIn: 3600 });
};
