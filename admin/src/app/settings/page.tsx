'use client';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { useAdminAuth } from '@/components/auth/AdminAuthProvider';

export default function SettingsPage() {
  const { adminProfile, isAdmin } = useAdminAuth();
  return (
    <AdminLayout title="Configuración">
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Mi Perfil Admin</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Nombre:</span><span className="text-white font-medium">{adminProfile?.displayName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email:</span><span className="text-white font-medium">{adminProfile?.email || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Rol:</span><span className="text-violet-400 font-bold">{adminProfile?.role || '—'}</span></div>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Ambiente</h2>
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-white">Modo:</span>{' '}
            <span className={process.env.NODE_ENV === 'production' ? 'text-emerald-400' : 'text-amber-400'}>
              {process.env.NODE_ENV === 'production' ? '🟢 Producción' : '🟡 Desarrollo'}
            </span>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            <span className="font-semibold text-white">API:</span>{' '}
            <span className="font-mono text-gray-500 text-xs">{process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}</span>
          </p>
        </Card>
      </div>
    </AdminLayout>
  );
}
