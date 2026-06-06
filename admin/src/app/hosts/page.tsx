'use client';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmptyState } from '@/components/ui/Extras';

export default function HostsPage() {
  return (
    <AdminLayout title="Hosts">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Hosts Aprobados</h1>
        <p className="text-sm text-gray-500">Lista de hosts activos en la plataforma</p>
        <EmptyState icon="🎙️" title="Hosts" message="Lista de hosts aprobados disponible a través de Firestore colección 'hostStats'." />
      </div>
    </AdminLayout>
  );
}
