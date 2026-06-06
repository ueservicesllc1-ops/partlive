'use client';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmptyState } from '@/components/ui/Extras';
export default function PurchasesPage() {
  return <AdminLayout title="Compras"><div className="space-y-4"><h1 className="text-2xl font-bold text-white">Compras In-App</h1><p className="text-sm text-gray-500">Historial de compras de coins</p><EmptyState icon="🛒" title="Compras" message="Las compras se almacenan en Firestore colección 'purchases'." /></div></AdminLayout>;
}
