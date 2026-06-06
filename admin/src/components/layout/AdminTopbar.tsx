'use client';

import React from 'react';
import { useAdminAuth } from '../auth/AdminAuthProvider';
import { Button } from '../ui/Button';

interface AdminTopbarProps {
  title?: string;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({ title }) => {
  const { adminProfile, isAdmin, logout } = useAdminAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800/80 bg-gray-950/60 px-6 backdrop-blur-xl">
      {/* Left: page title */}
      <div className="flex items-center gap-3">
        {title && (
          <h2 className="text-base font-bold text-white">{title}</h2>
        )}
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-4">
        {/* Role badge */}
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
          isAdmin 
            ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20' 
            : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
        }`}>
          {isAdmin ? '🔑 Admin' : '🛡️ Moderator'}
        </span>

        {/* User info */}
        <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-sm font-bold text-white shadow-lg">
            {(adminProfile?.displayName || adminProfile?.email || 'A')[0].toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white leading-none">
              {adminProfile?.displayName || 'Admin'}
            </p>
            <p className="text-xs text-gray-500 leading-none mt-0.5">
              {adminProfile?.email || ''}
            </p>
          </div>
        </div>

        {/* Logout */}
        <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          <span className="hidden sm:block">Salir</span>
        </Button>
      </div>
    </header>
  );
};
