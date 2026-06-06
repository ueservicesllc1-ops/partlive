'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { listenToAuthState, logoutAdmin } from '../../services/authService';
import { db } from '../../lib/firebase';

interface AdminProfile {
  uid: string;
  email?: string;
  displayName?: string;
  role?: 'user' | 'host' | 'moderator' | 'admin';
  isVerified?: boolean;
  status?: 'active' | 'suspended';
}

interface AdminAuthContextType {
  user: User | null;
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToAuthState(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data() as AdminProfile;
            setAdminProfile({ ...data, uid: firebaseUser.uid });
          } else {
            console.error('User document not found in Firestore');
            setAdminProfile(null);
          }
        } catch (error) {
          console.error('Error fetching admin profile:', error);
          setAdminProfile(null);
        }
      } else {
        setAdminProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    await logoutAdmin();
    setUser(null);
    setAdminProfile(null);
    setLoading(false);
  };

  const isAdmin = adminProfile?.role === 'admin';
  const isModerator = adminProfile?.role === 'moderator' || adminProfile?.role === 'admin';

  return (
    <AdminAuthContext.Provider value={{ user, adminProfile, isAdmin, isModerator, loading, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
