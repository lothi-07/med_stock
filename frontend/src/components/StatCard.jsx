import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', trend }) {
  const colorStyles = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bgIcon: 'bg-emerald-500/15 text-emerald-400',
      glow: 'shadow-emerald-500/10',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bgIcon: 'bg-amber-500/15 text-amber-400',
      glow: 'shadow-amber-500/10',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      bgIcon: 'bg-rose-500/15 text-rose-400',
      glow: 'shadow-rose-500/10',
    },
    sky: {
      border: 'border-sky-500/20 hover:border-sky-500/40',
      bgIcon: 'bg-sky-500/15 text-sky-400',
      glow: 'shadow-sky-500/10',
    },
    violet: {
      border: 'border-violet-500/20 hover:border-violet-500/40',
      bgIcon: 'bg-violet-500/15 text-violet-400',
      glow: 'shadow-violet-500/10',
    },
  }[color] || {
    border: 'border-slate-700/60',
    bgIcon: 'bg-slate-800 text-slate-300',
    glow: '',
  };

  return (
    <div className={`p-5 rounded-2xl bg-slate-900/60 border ${colorStyles.border} backdrop-blur-md shadow-lg ${colorStyles.glow} transition-all duration-300 hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${colorStyles.bgIcon}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-extrabold text-white tracking-tight">{value}</h3>
        {trend && (
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
