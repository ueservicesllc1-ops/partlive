import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full appearance-none rounded-xl border bg-gray-950/60 px-4 py-3 pr-10 text-sm text-white outline-none transition duration-200 focus:bg-gray-950 focus:ring-2 focus:ring-violet-500/50 ${
              error ? 'border-red-500/60 focus:ring-red-500/30' : 'border-gray-800 focus:border-violet-500/50'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
        {error ? <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p> : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
