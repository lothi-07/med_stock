import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  CheckCheck,
  Package,
  HeartHandshake,
  ShoppingCart,
  Filter,
} from 'lucide-react';
import { alertService } from '../services/api';

export const AlertsPage = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertService.listAlerts({
        alert_type: filterType === 'all' ? undefined : filterType,
        unread_only: unreadOnly,
      });
      setAlerts(data || []);
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filterType, unreadOnly]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await alertService.generateAlerts();
      await loadAlerts();
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await alertService.markRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertService.markAllRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BellRing className="w-6 h-6 text-amber-400" />
            Alerts & Expiry Monitoring Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time triggers for T-30/14/7 expiry countdowns and minimum stock threshold breaches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning...' : 'Run Inventory Scan'}</span>
          </button>
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <CheckCheck className="w-4 h-4 text-slate-400" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilterType('expiry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'expiry'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Expiry Alerts
          </button>
          <button
            onClick={() => setFilterType('low_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'low_stock'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Low Stock Alerts
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
          />
          <span>Unread alerts only</span>
        </label>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((a) => {
            const isExpiry = a.type === 'expiry';
            const isLowStock = a.type === 'low_stock';

            return (
              <div
                key={a.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !a.is_read
                    ? 'bg-slate-900/80 border-slate-700/80 shadow-md ring-1 ring-emerald-500/10'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                      isExpiry
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : isLowStock
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}
                  >
                    {isExpiry ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {a.type.replace('_', ' ')}
                      </span>
                      {!a.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      )}
                      <span className="text-[11px] text-slate-500">
                        {new Date(a.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-200 leading-snug">
                      {a.message}
                    </p>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {isExpiry && (
                    <>
                      <button
                        onClick={() => navigate('/billing')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Bill with FEFO</span>
                      </button>
                      <button
                        onClick={() => navigate('/donations')}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>Donate Surplus</span>
                      </button>
                    </>
                  )}

                  {isLowStock && (
                    <button
                      onClick={() => navigate('/inventory')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Inward Stock</span>
                    </button>
                  )}

                  {!a.is_read && (
                    <button
                      onClick={() => handleMarkRead(a.id)}
                      className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition"
                      title="Mark as Read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800/80 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-white font-bold text-base">No Alerts Detected</h4>
            <p className="text-slate-400 text-xs">
              All batch expiry countdowns and stock thresholds are in compliance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
