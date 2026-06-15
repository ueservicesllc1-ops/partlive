import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { HostPayout, HostPayoutMethod } from '../types/payout';
import * as payoutApi from '../services/api/payoutApi';
import {
  listenToMyPayouts,
  listenToMyPayoutMethods,
  listenToAdminPendingPayouts,
} from '../services/firebase/firestore/payoutsService';

export const usePayouts = () => {
  const { user, refreshWallet, refreshUserProfile } = useAuth();
  const [payouts, setPayouts] = useState<HostPayout[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<HostPayoutMethod[]>([]);
  const [adminPayouts, setAdminPayouts] = useState<HostPayout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Listen to active payout methods & payout history
  useEffect(() => {
    if (!user || user.uid === 'guest_user') {
      setPayoutMethods([]);
      setPayouts([]);
      return;
    }

    const unsubscribeMethods = listenToMyPayoutMethods(user.uid, (methods) => {
      setPayoutMethods(methods);
    });

    const unsubscribePayouts = listenToMyPayouts(user.uid, (history) => {
      setPayouts(history);
    });

    return () => {
      unsubscribeMethods();
      unsubscribePayouts();
    };
  }, [user]);

  // 2. Admin listeners - optional activation
  const [isAdminListening, setIsAdminListening] = useState(false);
  useEffect(() => {
    if (!isAdminListening || !user || user.uid === 'guest_user') return;

    const unsubscribe = listenToAdminPendingPayouts((pending) => {
      setAdminPayouts(pending);
    });

    return () => unsubscribe();
  }, [isAdminListening, user]);

  const enableAdminListening = useCallback(() => {
    setIsAdminListening(true);
  }, []);

  // 3. User operations
  const createMethod = useCallback(async (data: {
    type: string;
    label?: string;
    details: any;
    isDefault?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const newMethod = await payoutApi.createPayoutMethod(data);
      return newMethod;
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el método de pago');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMethod = useCallback(async (
    id: string,
    data: {
      label?: string;
      details?: any;
      isDefault?: boolean;
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await payoutApi.updatePayoutMethod(id, data);
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar el método de pago');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMethod = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await payoutApi.deletePayoutMethod(id);
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar el método de pago');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestWithdrawal = useCallback(async (beansConverted: number, payoutMethodId: string) => {
    setLoading(true);
    setError(null);
    try {
      const payout = await payoutApi.requestPayout({ beansConverted, payoutMethodId });
      // Refresh user profiles to update available / locked beans immediately
      await Promise.all([refreshWallet(), refreshUserProfile()]);
      return payout;
    } catch (err: any) {
      setError(err?.message || 'Error al solicitar el retiro');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshWallet, refreshUserProfile]);

  const cancelWithdrawal = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await payoutApi.cancelPayout(id);
      await Promise.all([refreshWallet(), refreshUserProfile()]);
    } catch (err: any) {
      setError(err?.message || 'Error al cancelar el retiro');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshWallet, refreshUserProfile]);

  // 4. Admin operations
  const adminApprove = useCallback(async (id: string, notes?: string) => {
    setLoading(true);
    setError(null);
    try {
      await payoutApi.approvePayout(id, notes);
    } catch (err: any) {
      setError(err?.message || 'Error al aprobar el retiro');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const adminReject = useCallback(async (id: string, notes?: string) => {
    setLoading(true);
    setError(null);
    try {
      await payoutApi.rejectPayout(id, notes);
    } catch (err: any) {
      setError(err?.message || 'Error al rechazar el retiro');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const adminMarkPaid = useCallback(async (id: string, notes?: string) => {
    setLoading(true);
    setError(null);
    try {
      await payoutApi.markPayoutAsPaid(id, notes);
    } catch (err: any) {
      setError(err?.message || 'Error al marcar retiro como pagado');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    payouts,
    payoutMethods,
    adminPayouts,
    loading,
    error,
    createMethod,
    updateMethod,
    deleteMethod,
    requestWithdrawal,
    cancelWithdrawal,
    adminApprove,
    adminReject,
    adminMarkPaid,
    enableAdminListening,
  };
};
