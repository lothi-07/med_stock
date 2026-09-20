import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Bell, Search, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ unreadAlertsCount = 0 }) {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Executive Overview';
      case '/billing': return 'FEFO Smart Billing Counter';
      case '/inventory': return 'Inventory & Batch Management';
      case '/alerts': return 'Safety & Expiry Alerts';
      case '/donations': return 'Surplus Donation Exchange';
      case '/reports': return 'Reports & Analytics';
      default: return 'MedStock';
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-white tracking-tight">{getPageTitle()}</h1>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">
          <Calendar className="h-3.5 w-3.5 text-emerald-400" />
          <span>{today}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick New Bill Action Button */}
        {location.pathname !== '/billing' && (
          <Link
            to="/billing"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Bill (FEFO)</span>
          </Link>
        )}

        {/* Alerts Notification Bell */}
        <Link
          to="/alerts"
          className="relative p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-colors"
          title="View Alerts"
        >
          <Bell className="h-4 w-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse">
              {unreadAlertsCount}
            </span>
          )}
        </Link>

        {/* Org Tag */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-medium text-slate-300 capitalize">
            {user?.org_type || 'Retail Pharmacy'}
          </span>
        </div>
      </div>
    </header>
  );
}
