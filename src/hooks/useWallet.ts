import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { CoinPackage, WalletTransaction } from '../types';
import {
  listenToActiveCoinPackages,
} from '../services/firebase/firestore/coinPackagesService';
import {
  listenToUserWalletTransactions,
  devCreditCoins as apiDevCreditCoins,
  devCreditDiamonds as apiDevCreditDiamonds,
} from '../services/firebase/firestore/walletService';

export const useWallet = () => {
  const { user, userWallet, refreshUserProfile, refreshWallet } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Listen to active packages
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToActiveCoinPackages((packages) => {
      setCoinPackages(packages);
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
  const devCreditCoins = useCallback(async (amount: number, description: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await apiDevCreditCoins(amount, description);
      await refresh();
    } catch (err: any) {
      console.error('Error crediting coins:', err);
      setError(err?.message || 'Error al acreditar monedas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, refresh]);

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

  return {
    wallet: userWallet,
    transactions,
    coinPackages,
    loading,
    error,
    refresh,
    devCreditCoins,
    devCreditDiamonds,
  };
};
