'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/components/auth/AdminAuthProvider';
import { loginAdmin } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { user, isModerator, loading } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user && isModerator) {
      router.push('/dashboard');
    }
  }, [user, isModerator, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await loginAdmin(email, password);
      // Auth provider will handle redirection via useEffect
    } catch (err: any) {
      const code = err.code as string;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Credenciales inválidas. Verifica tu email y contraseña.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Por favor, espera unos minutos.');
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-950 px-4">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-violet-800/5 blur-2xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-gray-800/80 bg-gray-900/50 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 text-3xl shadow-lg shadow-violet-600/30">
              🎉
            </div>
            <h1 className="text-2xl font-bold text-white">PartyLive Admin</h1>
            <p className="mt-1 text-sm text-gray-500">Panel de Administración</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="admin@partylive.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              id="password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <p className="text-sm font-medium text-red-400">{error}</p>
              </div>
            )}

            <Button
              id="login-button"
              type="submit"
              variant="primary"
              className="w-full py-3"
              isLoading={isLoading}
              size="lg"
            >
              Iniciar Sesión
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-600">
            Solo usuarios con rol{' '}
            <span className="font-semibold text-violet-500">admin</span> o{' '}
            <span className="font-semibold text-violet-500">moderator</span> pueden acceder.
          </p>
        </div>
      </div>
    </div>
  );
}
