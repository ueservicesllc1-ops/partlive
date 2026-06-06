'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from './AdminAuthProvider';

export const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isModerator, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-400">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (!isModerator) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950 px-6 text-center text-white">
        <div className="max-w-md rounded-2xl border border-red-900/50 bg-gray-900/80 p-8 shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-950/50 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-400 mb-2">Acceso Denegado</h1>
          <p className="text-sm text-gray-400 mb-6">
            No tienes permiso para acceder al panel de administración. Requiere rol de administrador o moderador.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full rounded-xl bg-gray-800 py-3 text-sm font-semibold hover:bg-gray-700 transition"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
