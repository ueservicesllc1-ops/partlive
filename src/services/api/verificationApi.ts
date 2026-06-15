import { apiFetch } from './apiClient';

export interface VerificationSubmitData {
  realName: string;
  documentNumber: string;
  documentType: string;
  idDocumentUrl: string;
  selfieUrl: string;
  role: 'host' | 'agency';
}

export const verificationApi = {
  submit: async (data: VerificationSubmitData): Promise<{ success: boolean; requestId: string }> => {
    return apiFetch('/verification/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getDownloadUrl: async (fileKey: string): Promise<string> => {
    const res = await apiFetch(`/verification/download-url?fileKey=${encodeURIComponent(fileKey)}`);
    return res.downloadUrl;
  },

  review: async (
    requestId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiFetch(`/verification/review/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    });
  },
};
