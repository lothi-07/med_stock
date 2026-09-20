import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  Boxes,
  BellRing,
  HeartHandshake,
  BarChart3,
  LogOut,
  Pill,
  UserCheck,
  Building2,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';

export const Sidebar = ({ unreadCount = 0 }) => {
  const { user, logout, switchDemoUser } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/billing', label: 'FEFO Billing', icon: ReceiptText, badge: 'Counter' },
    { to: '/inventory', label: 'Inventory & Batches', icon: Boxes },
    { to: '/alerts', label: 'Alerts & Expiry', icon: BellRing, unreadBadge: unreadCount },
    { to: '/donations', label: 'Surplus Donations', icon: HeartHandshake },
    { to: '/reports', label: 'Reports & Export', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
          <Pill className="w-5 h-5 rotate-45" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg text-white tracking-tight">MedStock</span>
            <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-500" />
            {user?.org_name || 'HealthPlus Pharmacy'}
          </p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {item.badge}
                </span>
              )}
              {item.unreadBadge > 0 && (
                <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  {item.unreadBadge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Demo Persona Switcher (For Evaluation & Demo) */}
      <div className="p-3 mx-3 mb-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-emerald-400" />
          Switch Demo Persona
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Object.entries(DEMO_ACCOUNTS).map(([key, acc]) => (
            <button
              key={key}
              onClick={() => switchDemoUser(key)}
              title={acc.label}
              className={`py-1 text-[10px] font-medium rounded transition text-center ${
                user?.email === acc.email
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {key === 'owner' ? 'Owner' : key === 'pharmacist' ? 'Pharma' : 'NGO'}
            </button>
          ))}
        </div>
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 capitalize truncate">
              {user?.role} • {user?.org_type}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
