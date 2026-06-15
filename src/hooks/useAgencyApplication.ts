import { useState } from 'react';
import { agencyApi, AgencyApplyRequest } from '../services/api/agencyApi';

export const useAgencyApplication = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const apply = async (data: AgencyApplyRequest) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (!data.name || !data.country || !data.email) {
        throw new Error('Por favor, completa todos los campos obligatorios.');
      }

      await agencyApi.apply(data);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return {
    apply,
    loading,
    error,
    success,
    setError,
  };
};
