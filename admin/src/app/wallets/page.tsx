'use client';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmptyState } from '@/components/ui/Extras';
export default function WalletsPage() {
  return <AdminLayout title="Wallets"><div className="space-y-4"><h1 className="text-2xl font-bold text-white">Wallets</h1><p className="text-sm text-gray-500">Balances de usuarios</p><EmptyState icon="💰" title="Wallets" message="Busca usuarios en la sección Usuarios para ver y ajustar sus wallets individualmente." /></div></AdminLayout>;
}
