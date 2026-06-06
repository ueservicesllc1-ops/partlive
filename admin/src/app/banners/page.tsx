'use client';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmptyState } from '@/components/ui/Extras';
export default function BannersPage() {
  return <AdminLayout title="Banners"><div className="space-y-4"><h1 className="text-2xl font-bold text-white">Banners</h1><EmptyState icon="🖼️" title="Banners" message="CRUD de banners en colección 'banners'." /></div></AdminLayout>;
}
