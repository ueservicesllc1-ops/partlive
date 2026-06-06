'use client';
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

// ───────────────────────────── ConfirmDialog ─────────────────────────────
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirmar',
  variant = 'danger', isLoading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <div className="space-y-5">
      <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
        <Button variant={variant} onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button>
      </div>
    </div>
  </Modal>
);

// ───────────────────────────── LoadingState ─────────────────────────────
export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <div className="flex h-64 w-full flex-col items-center justify-center gap-4 text-gray-500">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-500" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

// ───────────────────────────── EmptyState ─────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📭', title, message, action }) => (
  <div className="flex h-64 w-full flex-col items-center justify-center gap-4 text-center px-6">
    <div className="text-5xl">{icon}</div>
    <div>
      <p className="text-base font-bold text-gray-300">{title}</p>
      {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// ───────────────────────────── ErrorState ─────────────────────────────
export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Ocurrió un error al cargar los datos.', onRetry,
}) => (
  <div className="flex h-64 w-full flex-col items-center justify-center gap-4 text-center px-6">
    <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center text-3xl">⚠️</div>
    <div>
      <p className="text-base font-bold text-red-400">Error</p>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
    </div>
    {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Reintentar</Button>}
  </div>
);

// ───────────────────────────── Pagination ─────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3">
      <p className="text-xs text-gray-500">
        Página <span className="font-bold text-white">{currentPage}</span> de{' '}
        <span className="font-bold text-white">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          ← Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Siguiente →
        </Button>
      </div>
    </div>
  );
};
