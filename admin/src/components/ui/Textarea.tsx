import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          className={`w-full rounded-xl border bg-gray-950/60 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:bg-gray-950 focus:ring-2 focus:ring-violet-500/50 ${
            error ? 'border-red-500/60 focus:ring-red-500/30' : 'border-gray-800 focus:border-violet-500/50'
          } ${className}`}
          {...props}
        />
        {error ? <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p> : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
