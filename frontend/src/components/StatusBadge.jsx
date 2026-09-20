import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, XCircle, Sparkles, Package } from 'lucide-react';

export const StockBadge = ({ status, totalStock, unit = 'units' }) => {
  switch (status) {
    case 'out_of_stock':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          Out of Stock (0)
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Low Stock ({totalStock} {unit})
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Package className="w-3.5 h-3.5 text-sky-400" />
          Moderate ({totalStock} {unit})
        </span>
      );
    case 'ok':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          In Stock ({totalStock} {unit})
        </span>
      );
  }
};

export const ExpiryBadge = ({ days, status }) => {
  if (days < 0 || status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        EXPIRED
      </span>
    );
  }
  if (days <= 7 || status === 'critical') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)] animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        {days}d left (CRITICAL)
      </span>
    );
  }
  if (days <= 14 || status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        {days}d left (T-14)
      </span>
    );
  }
  if (days <= 30 || status === 'caution') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-300 border border-yellow-500/25">
        <Clock className="w-3.5 h-3.5 text-yellow-400" />
        {days}d left (T-30)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      {days}d left
    </span>
  );
};

export const FEFOBadge = ({ isRecommended = false }) => {
  if (!isRecommended) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
      <Sparkles className="w-3 h-3 text-emerald-400" />
      FEFO RECOMMENDATION
    </span>
  );
};

export const DonationStatusBadge = ({ status }) => {
  const styles = {
    listed: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    claimed: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    picked: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  };
  const labels = {
    listed: 'Listed for Donation',
    claimed: 'Claimed by NGO',
    picked: 'Out for Pickup',
    completed: 'Delivered / Distributed',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.listed}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {labels[status] || status}
    </span>
  );
};
