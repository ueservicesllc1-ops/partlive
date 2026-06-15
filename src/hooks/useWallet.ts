import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { DiamondPackage, WalletTransaction } from '../types';
import {
  listenToActiveDiamondPackages,
} from '../services/firebase/firestore/diamondPackagesService';
import {
  listenToUserWalletTransactions,
  devCreditDiamonds as apiDevCreditDiamonds,
  devCreditBeans as apiDevCreditBeans,
} from '../services/firebase/firestore/walletService';

export const useWallet = () => {
  const { user, userWallet, refreshUserProfile, refreshWallet } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [diamondPackages, setDiamondPackages] = useState<DiamondPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Listen to active packages
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToActiveDiamondPackages((packages) => {
      setDiamondPackages(packages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen to user transactions
  useEffect(() => {
    if (!user || user.uid === 'guest_user') {
      setTransactions([]);
      return;
    }

    const unsubscribe = listenToUserWalletTransactions(user.uid, (txs) => {
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Refresh wallets and caches manually
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshUserProfile(), refreshWallet()]);
    } catch (err: any) {
      console.error('Error refreshing wallet:', err);
      setError(err?.message || 'Error al actualizar billetera');
    } finally {
      setLoading(false);
    }
  }, [refreshUserProfile, refreshWallet]);

  // 4. Dev credits calling backend routes
  const devCreditDiamonds = useCallback(async (amount: number, description: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await apiDevCreditDiamonds(amount, description);
      await refresh();
    } catch (err: any) {
      console.error('Error crediting diamonds:', err);
      setError(err?.message || 'Error al acreditar diamantes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, refresh]);

  const devCreditBeans = useCallback(async (amount: number, description: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await apiDevCreditBeans(amount, description);
      await refresh();
    } catch (err: any) {
      console.error('Error crediting beans:', err);
      setError(err?.message || 'Error al acreditar beans');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, refresh]);

  return {
    wallet: userWallet,
    transactions,
    diamondPackages,
    loading,
    error,
    refresh,
    devCreditDiamonds,
    devCreditBeans,
  };
};
