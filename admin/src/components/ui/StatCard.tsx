import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  subText?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'violet' | 'emerald' | 'amber' | 'blue' | 'red' | 'pink';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subText,
  trend,
  color = 'violet',
}) => {
  const colorMap = {
    violet: {
      bg: 'from-violet-600/10 to-violet-600/5',
      border: 'border-violet-600/20',
      iconBg: 'bg-violet-500/10 text-violet-400',
      glow: 'shadow-violet-600/5',
    },
    emerald: {
      bg: 'from-emerald-600/10 to-emerald-600/5',
      border: 'border-emerald-600/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'shadow-emerald-600/5',
    },
    amber: {
      bg: 'from-amber-600/10 to-amber-600/5',
      border: 'border-amber-600/20',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'shadow-amber-600/5',
    },
    blue: {
      bg: 'from-blue-600/10 to-blue-600/5',
      border: 'border-blue-600/20',
      iconBg: 'bg-blue-500/10 text-blue-400',
      glow: 'shadow-blue-600/5',
    },
    red: {
      bg: 'from-red-600/10 to-red-600/5',
      border: 'border-red-600/20',
      iconBg: 'bg-red-500/10 text-red-400',
      glow: 'shadow-red-600/5',
    },
    pink: {
      bg: 'from-pink-600/10 to-pink-600/5',
      border: 'border-pink-600/20',
      iconBg: 'bg-pink-500/10 text-pink-400',
      glow: 'shadow-pink-600/5',
    },
  };

  const c = colorMap[color];

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} p-6 shadow-xl ${c.glow} backdrop-blur-md transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value.toLocaleString()}</p>
          {subText && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-gray-500">
              {trend === 'up' && <span className="text-emerald-400">↑</span>}
              {trend === 'down' && <span className="text-red-400">↓</span>}
              {subText}
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${c.iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
