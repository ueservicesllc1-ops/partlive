'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navSections = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', icon: '📊', href: '/dashboard' },
    ],
  },
  {
    title: 'Usuarios',
    items: [
      { label: 'Usuarios', icon: '👥', href: '/users' },
      { label: 'Hosts', icon: '🎙️', href: '/hosts' },
      { label: 'Aplicaciones', icon: '📋', href: '/hosts/applications' },
    ],
  },
  {
    title: 'Streams',
    items: [
      { label: 'Salas', icon: '🏠', href: '/rooms' },
      { label: 'Lives', icon: '🔴', href: '/lives' },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { label: 'Wallets', icon: '💰', href: '/wallets' },
      { label: 'Compras', icon: '🛒', href: '/purchases' },
      { label: 'Payouts', icon: '💸', href: '/payouts' },
    ],
  },
  {
    title: 'Contenido',
    items: [
      { label: 'Regalos', icon: '🎁', href: '/gifts' },
      { label: 'Banners', icon: '🖼️', href: '/banners' },
      { label: 'Eventos', icon: '🎉', href: '/events' },
      { label: 'Misiones', icon: '🎯', href: '/missions' },
      { label: 'Rankings', icon: '🏆', href: '/rankings' },
    ],
  },
  {
    title: 'Moderación',
    items: [
      { label: 'Reportes', icon: '🚨', href: '/reports' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Configuración', icon: '⚙️', href: '/settings' },
    ],
  },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-gray-800/80 bg-gray-950/90 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-800/80 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 text-sm shadow-lg shadow-violet-600/30">
          🎉
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">PartyLive</h1>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-500">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="mb-1 px-3 text-[9px] font-bold uppercase tracking-widest text-gray-600">
              {section.title}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-violet-600/15 text-violet-400 shadow-sm'
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                  }`}
                >
                  <span className={`text-base leading-none transition ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                    {item.icon}
                  </span>
                  <span className="leading-none">{item.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800/80 px-3 py-3">
        <div className="rounded-xl bg-gray-900/60 px-3 py-2 text-center">
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
            {process.env.NODE_ENV === 'production' ? '🟢 Producción' : '🟡 Desarrollo'}
          </span>
        </div>
      </div>
    </aside>
  );
};
