import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as IAP from 'react-native-iap';
import { CoinPackage } from '../types';
import {
  initIAP,
  endIAP,
  getIapProducts,
  buyProduct,
  setupPurchaseListeners,
} from '../services/iap/iapService';
import { getIapErrorMessage } from '../utils/iapErrors';
import { useAuth } from '../store/AuthContext';

/**
 * Custom hook to manage Google Play Billing operations within the Wallet screen.
 * Maps Firestore coin packages to Google Play real-time localized prices.
 */
export const useInAppPurchases = (coinPackages: CoinPackage[]) => {
  const { refreshWallet, refreshUserProfile } = useAuth();
  
  const [iapProducts, setIapProducts] = useState<Record<string, IAP.Product>>({});
  const [isIapReady, setIsIapReady] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);
  const [iapError, setIapError] = useState<string | null>(null);

  // Purchase succeeded callback from iapService
  const handlePurchaseSuccess = useCallback(
    async (purchase: any, wallet: any) => {
      setPurchasing(false);
      setPurchaseStatus(null);
      
      Alert.alert(
        '¡Compra Completada!',
        `Se han acreditado ${purchase.totalCoins} monedas a tu billetera exitosamente.`
      );

      try {
        await Promise.all([refreshWallet(), refreshUserProfile()]);
      } catch (err) {
        console.error('[IAP Hook] Error refreshing wallet metadata:', err);
      }
    },
    [refreshWallet, refreshUserProfile]
  );

  // Purchase failed callback from iapService
  const handlePurchaseError = useCallback((error: any) => {
    setPurchasing(false);
    setPurchaseStatus(null);
    
    const friendlyMsg = getIapErrorMessage(error);
    setIapError(friendlyMsg);

    // Only show error dialog if the user didn't intentionally cancel
    if (error?.code !== 'E_USER_CANCELLED') {
      Alert.alert('Error de Compra', friendlyMsg);
    } else {
      console.log('[IAP Hook] Purchase cancelled by user.');
    }
  }, []);

  // Initialize Billing and register listeners on mount
  useEffect(() => {
    let active = true;

    const setup = async () => {
      const ready = await initIAP();
      if (!active) return;
      setIsIapReady(ready);

      if (ready) {
        setupPurchaseListeners(
          handlePurchaseSuccess,
          handlePurchaseError,
          (msg) => {
            if (active) setPurchaseStatus(msg);
          }
        );
      }
    };

    setup();

    return () => {
      active = false;
      endIAP();
    };
  }, [handlePurchaseSuccess, handlePurchaseError]);

  // Query details from Google Play Console once Billing connection is active and coin packages load
  useEffect(() => {
    if (!isIapReady || coinPackages.length === 0) return;

    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const skus = coinPackages
          .map((p) => p.googlePlayProductId)
          .filter(Boolean);

        if (skus.length > 0) {
          const products = await getIapProducts(skus);
          const mapped: Record<string, IAP.Product> = {};
          products.forEach((prod) => {
            mapped[prod.id] = prod;
          });
          setIapProducts(mapped);
        }
      } catch (err) {
        console.error('[IAP Hook] Error loading product details:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [isIapReady, coinPackages]);

  // Request purchase of a coin package
  const buyPackage = useCallback(
    async (pkg: CoinPackage) => {
      if (!isIapReady) {
        Alert.alert('Error', 'El servicio de compras no está listo. Reintenta en unos momentos.');
        return;
      }

      setPurchasing(true);
      setIapError(null);
      setPurchaseStatus('Iniciando pago con Google Play...');

      try {
        await buyProduct(pkg.googlePlayProductId);
      } catch (err: any) {
        console.error('[IAP Hook] requestPurchase call threw error:', err);
        handlePurchaseError(err);
      }
    },
    [isIapReady, handlePurchaseError]
  );

  return {
    isReady: isIapReady,
    iapProducts,
    loadingProducts,
    purchasing,
    purchaseStatus,
    iapError,
    buyPackage,
  };
};
export default useInAppPurchases;
