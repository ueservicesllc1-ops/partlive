import { useState } from 'react';
import { selectVerificationImage, uploadVerificationFile } from '../services/verification/verificationUploadService';
import { verificationApi } from '../services/api/verificationApi';

export const useVerification = () => {
  const [idDoc, setIdDoc] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [selfie, setSelfie] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pickIdDoc = async () => {
    try {
      setError(null);
      const res = await selectVerificationImage();
      setIdDoc({ uri: res.uri, name: res.fileName, type: res.type });
    } catch (err: any) {
      setError(err.message || 'Error al seleccionar el documento.');
    }
  };

  const pickSelfie = async () => {
    try {
      setError(null);
      const res = await selectVerificationImage();
      setSelfie({ uri: res.uri, name: res.fileName, type: res.type });
    } catch (err: any) {
      setError(err.message || 'Error al seleccionar la selfie.');
    }
  };

  const submit = async (realName: string, docNumber: string, docType: string, role: 'host' | 'agency') => {
    if (!idDoc || !selfie || !realName || !docNumber || !docType) {
      setError('Por favor, completa todos los campos y sube ambas fotos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // 1. Upload ID document
      const idDocUrl = await uploadVerificationFile(idDoc.uri, 'kyc_id_document', idDoc.name, idDoc.type);

      // 2. Upload Selfie
      const selfieUrl = await uploadVerificationFile(selfie.uri, 'kyc_selfie', selfie.name, selfie.type);

      // 3. Submit KYC verification application
      await verificationApi.submit({
        realName,
        documentNumber: docNumber,
        documentType: docType,
        idDocumentUrl: idDocUrl,
        selfieUrl: selfieUrl,
        role,
      });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al enviar la solicitud de verificación.');
    } finally {
      setLoading(false);
    }
  };

  return {
    idDoc,
    selfie,
    pickIdDoc,
    pickSelfie,
    submit,
    loading,
    error,
    success,
    setError,
  };
};
