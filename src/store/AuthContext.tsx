import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import * as authService from '../services/firebase/authService';
import { UserProfile, Wallet } from '../types';
import { ensureUserProfile, getUserProfile, ensureUserWallet, listenToUserWallet } from '../services/firebase/firestore';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  userProfile: UserProfile | null;
  userWallet: Wallet | null;
  initializing: boolean;
  isAuthenticated: boolean;
  loginWithEmail: typeof authService.signInWithEmail;
  loginWithGoogle: typeof authService.signInWithGoogle;
  registerWithEmail: typeof authService.signUpWithEmail;
  registerWithWizard: (email: string, pass: string, data: Partial<UserProfile>) => Promise<void>;
  logout: typeof authService.signOut;
  loginAsGuest: () => void;
  refreshUserProfile: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  sendPasswordReset: typeof authService.sendPasswordReset;
  completeProfile: (data: Partial<UserProfile>) => Promise<void>;
  isProfileCompleted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userWallet, setUserWallet] = useState<Wallet | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Sync wallet based on authenticated user
  useEffect(() => {
    if (!user) {
      setUserWallet(null);
      return;
    }

    if (user.uid === 'guest_user') {
      setUserWallet({
        id: 'guest_user',
        userId: 'guest_user',
        coins: 0,
        diamonds: 0,
        lifetimeCoinsPurchased: 0,
        lifetimeCoinsSpent: 0,
        lifetimeDiamondsEarned: 0,
        lifetimeDiamondsWithdrawn: 0,
        pendingDiamonds: 0,
        lockedDiamonds: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const setupWallet = async () => {
      try {
        await ensureUserWallet(user.uid);
        unsubscribe = listenToUserWallet(user.uid, (wallet) => {
          setUserWallet(wallet);
        });
      } catch (err) {
        console.error('Error ensuring or listening to user wallet:', err);
      }
    };

    setupWallet();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const fetchProfile = async (firebaseUser: FirebaseAuthTypes.User) => {
    try {
      const profile = await ensureUserProfile(firebaseUser);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const refreshUserProfile = async () => {
    if (user && user.uid !== 'guest_user') {
      const profile = await getUserProfile(user.uid);
      if (profile) setUserProfile(profile);
    }
  };

  // Handle user state changes
  async function onAuthStateChanged(usr: FirebaseAuthTypes.User | null) {
    // If we are currently a guest user, keep the guest session instead of wiping it
    if (user && user.uid === 'guest_user') {
      return;
    }
    setUser(usr);
    if (usr) {
      await fetchProfile(usr);
    } else {
      setUserProfile(null);
    }
    
    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    const subscriber = authService.onAuthStateChangedListener(onAuthStateChanged);
    
    // Safety fallback: if Firebase initialization delays, unlock the UI
    const safetyTimeout = setTimeout(() => {
      setInitializing(false);
    }, 3000);

    return () => {
      subscriber();
      clearTimeout(safetyTimeout);
    };
  }, [user]);

  const loginWithEmail = async (email: string, password: string) => {
    return await authService.signInWithEmail(email, password);
  };

  const loginWithGoogle = async () => {
    return await authService.signInWithGoogle();
  };

  const registerWithEmail = async (email: string, password: string) => {
    return await authService.signUpWithEmail(email, password);
  };

  const registerWithWizard = async (email: string, password: string, data: Partial<UserProfile>) => {
    const cred = await authService.signUpWithEmail(email, password);
    // ensureUserProfile in the listener might have created a basic profile, so we just update it
    await ensureUserProfile(cred.user);
    const { updateUserProfile } = await import('../services/firebase/firestore/usersService');
    await updateUserProfile(cred.user.uid, {
      ...data,
      displayName: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : cred.user.displayName || email.split('@')[0],
    });
    await refreshUserProfile();
  };

  const sendPasswordReset = async (email: string) => {
    return await authService.sendPasswordReset(email);
  };

  const completeProfile = async (data: Partial<UserProfile>) => {
    if (user) {
      const { completeUserProfile } = await import('../services/firebase/firestore/usersService');
      await completeUserProfile(user.uid, data);
      await refreshUserProfile();
    }
  };

  const refreshWallet = async () => {
    if (user && user.uid !== 'guest_user') {
      const wallet = await ensureUserWallet(user.uid);
      setUserWallet(wallet);
    }
  };

  const logout = async () => {
    if (user?.uid === 'guest_user') {
      setUser(null);
      setUserProfile(null);
      setUserWallet(null);
      return;
    }
    setUserProfile(null);
    setUserWallet(null);
    return await authService.signOut();
  };

  const loginAsGuest = () => {
    setUser({
      uid: 'guest_user',
      email: 'invitado@partylive.app',
      displayName: 'Invitado Temporal',
      isAnonymous: true,
    } as any);
    setUserProfile({
      uid: 'guest_user',
      displayName: 'Invitado Temporal',
      username: 'invitado',
      level: 1,
      xp: 0,
      coins: 0,
      diamonds: 0,
      followersCount: 0,
      followingCount: 0,
      isHost: false,
      isVerified: false,
      role: 'user',
      profileCompleted: true,
      authProvider: 'guest',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    });
    setUserWallet({
      id: 'guest_user',
      userId: 'guest_user',
      coins: 0,
      diamonds: 0,
      lifetimeCoinsPurchased: 0,
      lifetimeCoinsSpent: 0,
      lifetimeDiamondsEarned: 0,
      lifetimeDiamondsWithdrawn: 0,
      pendingDiamonds: 0,
      lockedDiamonds: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const value: AuthContextType = {
    user,
    userProfile,
    userWallet,
    initializing,
    isAuthenticated: !!user,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    registerWithWizard,
    logout,
    loginAsGuest,
    refreshUserProfile,
    refreshWallet,
    sendPasswordReset,
    completeProfile,
    isProfileCompleted: !!userProfile?.profileCompleted,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
