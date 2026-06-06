'use client';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmptyState } from '@/components/ui/Extras';
export default function RankingsPage() {
  return <AdminLayout title="Rankings"><div className="space-y-4"><h1 className="text-2xl font-bold text-white">Rankings</h1><EmptyState icon="🏆" title="Rankings" message="Ver y recalcular rankings de la plataforma. Usa POST /api/rankings/recalculate para recalcular." /></div></AdminLayout>;
}
