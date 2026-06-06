'use client';

import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { ProtectedAdminRoute } from '../auth/ProtectedAdminRoute';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  return (
    <ProtectedAdminRoute>
      <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-white">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopbar title={title} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
};
