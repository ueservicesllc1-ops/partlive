'use client';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmptyState } from '@/components/ui/Extras';
export default function MissionsPage() {
  return <AdminLayout title="Misiones"><div className="space-y-4"><h1 className="text-2xl font-bold text-white">Misiones</h1><EmptyState icon="🎯" title="Misiones" message="CRUD de misiones en colección 'missions'." /></div></AdminLayout>;
}
