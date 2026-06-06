'use client';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmptyState } from '@/components/ui/Extras';
export default function EventsPage() {
  return <AdminLayout title="Eventos"><div className="space-y-4"><h1 className="text-2xl font-bold text-white">Eventos</h1><EmptyState icon="🎉" title="Eventos" message="CRUD de eventos en colección 'events'." /></div></AdminLayout>;
}
