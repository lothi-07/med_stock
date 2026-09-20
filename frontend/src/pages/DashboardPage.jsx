import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Clock,
  AlertTriangle,
  ReceiptText,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  HeartHandshake,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { reportService, batchService, alertService } from '../services/api';
import { ExpiryBadge, StockBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_skus: 0,
    expiring_soon_30: 0,
    expiring_soon_14: 0,
    expiring_soon_7: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    today_sales_count: 0,
    today_sales_amount: 0,
    waste_prevented_value: 0,
    total_stock_value: 0,
  });
  const [salesTrend, setSalesTrend] = useState([]);
  const [expiringBatches, setExpiringBatches] = useState([]);
  const [topMovers, setTopMovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, trendData, expiringData, moversData] = await Promise.all([
        reportService.getDashboardStats(),
        reportService.getSalesTrend(7).catch(() => []),
        batchService.getExpiring(30).catch(() => []),
        reportService.getTopMovers(7, 5).catch(() => []),
      ]);

      setStats(statsData);
      setSalesTrend(trendData || []);
      setExpiringBatches(expiringData || []);
      setTopMovers(moversData || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScanAlerts = async () => {
    setScanning(true);
    try {
      await alertService.generateAlerts();
      await loadData();
    } catch (err) {
      console.error('Failed to run alert scan:', err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {user?.name || 'Pharmacist'}!
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {user?.org_name}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            FEFO is actively prioritizing near-expiry batches across all active counters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleScanAlerts}
            disabled={scanning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning...' : 'Run Expiry Scan'}</span>
          </button>
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open FEFO Billing</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total SKUs */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Total Medicines</span>
            <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{stats.total_skus}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Valuation: <span className="font-mono text-slate-300">₹{stats.total_stock_value?.toLocaleString()}</span>
          </div>
        </div>

        {/* Expiring ≤30d */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Expiring in 30 Days</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{stats.expiring_soon_30}</div>
          <div className="flex items-center gap-1.5 text-[11px] mt-1 text-slate-400">
            <span className="text-rose-400 font-bold">{stats.expiring_soon_7} critical (≤7d)</span>
            <span>•</span>
            <span className="text-amber-300">{stats.expiring_soon_14} warn (≤14d)</span>
          </div>
        </div>

        {/* Low Stock */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-rose-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Low Stock Items</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{stats.low_stock_count}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.out_of_stock_count > 0 ? (
              <span className="text-rose-400 font-bold">{stats.out_of_stock_count} completely out of stock</span>
            ) : (
              <span>All minimum thresholds tracked</span>
            )}
          </div>
        </div>

        {/* Today's Sales */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-teal-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Today's Revenue</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-400 font-mono">
            ₹{stats.today_sales_amount?.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.today_sales_count} bills dispensed today
          </div>
        </div>

        {/* Waste Prevented */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/30 transition bg-gradient-to-b from-slate-900/60 to-emerald-950/20">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium text-emerald-300">Waste Prevented</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            ₹{stats.waste_prevented_value?.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">
            Saved via FEFO prioritization
          </div>
        </div>
      </div>

      {/* Main Charts & Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Sales Trend */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                7-Day Sales Trend
              </h3>
              <p className="text-xs text-slate-400">Daily revenue and transaction volume</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              View Full Analytics
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Top Movers */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Top Selling SKUs</h3>
              <span className="text-[11px] text-slate-400">Past 7 Days</span>
            </div>

            <div className="space-y-3">
              {topMovers.length > 0 ? (
                topMovers.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{m.medicine_name}</div>
                      <div className="text-[11px] text-slate-400">{m.total_sold} units sold</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-emerald-400">
                        ₹{m.total_revenue?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No sales data yet for this period
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => navigate('/donations')}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <HeartHandshake className="w-4 h-4 text-indigo-400" />
              <span>Surplus NGO Marketplace</span>
            </button>
          </div>
        </div>
      </div>

      {/* Near Expiry Priority Table (FEFO Action List) */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Near-Expiry Batches (FEFO Action Required)
            </h3>
            <p className="text-xs text-slate-400">
              Batches expiring within 30 days — prioritize at counter or donate to NGO
            </p>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            Manage All Batches
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Medicine</th>
                <th className="px-6 py-3 font-semibold">Batch No</th>
                <th className="px-6 py-3 font-semibold">Expiry Date</th>
                <th className="px-6 py-3 font-semibold">Urgency</th>
                <th className="px-6 py-3 font-semibold text-center">Available Stock</th>
                <th className="px-6 py-3 font-semibold text-right">MRP</th>
                <th className="px-6 py-3 font-semibold text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {expiringBatches.length > 0 ? (
                expiringBatches.slice(0, 6).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-3.5 font-semibold text-white">
                      {b.medicine_name}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-400">
                      {b.batch_no}
                    </td>
                    <td className="px-6 py-3.5 text-slate-300">
                      {b.expiry_date}
                    </td>
                    <td className="px-6 py-3.5">
                      <ExpiryBadge days={b.days_to_expiry} status={b.expiry_status} />
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold text-slate-200">
                      {b.qty_on_hand}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-300">
                      ₹{b.mrp?.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('/billing')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition"
                        >
                          Bill (FEFO)
                        </button>
                        <button
                          onClick={() => navigate('/donations')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition"
                        >
                          Donate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    No batches currently expiring within 30 days! All stock is healthy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
