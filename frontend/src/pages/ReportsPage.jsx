import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { reportService } from '../services/api';

export const ReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [topMovers, setTopMovers] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const [statsData, moversData] = await Promise.all([
          reportService.getDashboardStats(),
          reportService.getTopMovers(30, 10),
        ]);
        setStats(statsData);
        setTopMovers(moversData || []);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleExportInventory = () => {
    reportService.downloadInventoryCsv();
  };

  const handleExportSales = () => {
    reportService.downloadSalesCsv(dateFrom || undefined, dateTo || undefined);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          Analytics & Regulatory Reports
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Export full inventory snapshots, dispense logs, and track zero-waste financial metrics.
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            Waste Prevented (FEFO)
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400">
            ₹{stats?.waste_prevented_value?.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-slate-400">
            Revenue captured from batches that were within 30 days of expiry.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold">
            <TrendingUp className="w-4 h-4" />
            Total Inventory Valuation
          </div>
          <div className="text-3xl font-extrabold font-mono text-teal-400">
            ₹{stats?.total_stock_value?.toLocaleString() || '0.00'}
          </div>
          <p className="text-xs text-slate-400">
            Combined MRP value of all currently active on-hand medicine batches.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Active Managed SKUs
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-400">
            {stats?.total_skus || 0}
          </div>
          <p className="text-xs text-slate-400">
            Medicines monitored under strict real-time expiry and re-order thresholds.
          </p>
        </div>
      </div>

      {/* CSV Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory Export */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Full Inventory Snapshot CSV</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export all medicines, batch numbers, remaining quantities, expiry dates, purchase rates, and MRPs for stock audits or tax filings.
            </p>
          </div>

          <button
            onClick={handleExportInventory}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Inventory CSV</span>
          </button>
        </div>

        {/* Sales Export */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 w-fit">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Sales & Dispense History CSV</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export complete transaction bills with itemized batch provenance, customer names, discounts, and bill numbers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>
          </div>

          <button
            onClick={handleExportSales}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Sales CSV</span>
          </button>
        </div>
      </div>

      {/* Top Movers Leaderboard */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <h3 className="text-base font-bold text-white">Top 10 High-Velocity Medicines (Past 30 Days)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Rank</th>
                <th className="px-6 py-3.5">Medicine Name</th>
                <th className="px-6 py-3.5 text-center">Total Units Sold</th>
                <th className="px-6 py-3.5 text-right">Total Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topMovers.length > 0 ? (
                topMovers.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="px-6 py-4 font-semibold text-white">{m.medicine_name}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-200">{m.total_sold}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                      ₹{m.total_revenue?.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-slate-500">
                    No sales recorded yet.
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
