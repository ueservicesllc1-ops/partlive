'use client';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmptyState } from '@/components/ui/Extras';

// ────── LIVES ──────
export default function LivesPage() {
  return (
    <AdminLayout title="Lives">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Lives</h1>
        <p className="text-sm text-gray-500">Monitoreo de transmisiones en vivo</p>
        <EmptyState icon="🔴" title="Lives" message="Implementación completa próximamente. Los lives se listan desde Firestore colección 'lives'." />
      </div>
    </AdminLayout>
  );
}
