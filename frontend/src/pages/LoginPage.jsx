import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, ShieldCheck, Sparkles, AlertCircle, ArrowRight, Building2, User } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo.owner@medstock.local');
  const [password, setPassword] = useState('DemoOwner@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (key) => {
    const acc = DEMO_ACCOUNTS[key];
    if (!acc) return;
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setLoading(true);
    try {
      await login(acc.email, acc.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow gradient backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center z-10">
        {/* Left Side: Product Showcase */}
        <div className="space-y-6 hidden md:block">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            Zero-Waste Healthcare Inventory
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Smart Pharmacy Inventory with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                FEFO & Alerts
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Eliminate medicine wastage, safeguard patient safety with First-Expiry-First-Out dispensing, and donate surplus inventory to verified NGOs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-emerald-400 font-bold text-xl">100% FEFO</div>
              <p className="text-xs text-slate-400 mt-1">Automatic near-expiry batch prioritization</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-teal-400 font-bold text-xl">T-30 Alerts</div>
              <p className="text-xs text-slate-400 mt-1">Real-time low stock and expiry tracking</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800 relative">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 mb-3">
              <Pill className="w-6 h-6 rotate-45" />
            </div>
            <h2 className="text-xl font-bold text-white">Sign In to MedStock</h2>
            <p className="text-xs text-slate-400 mt-1">Select a demo role or enter your credentials</p>
          </div>

          {/* Quick Demo Logins */}
          <div className="mb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              ⚡ Instant Demo Logins
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-950/40 hover:border-emerald-500/40 border border-slate-700/80 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                      Rajesh Kumar (Owner)
                    </div>
                    <div className="text-[10px] text-slate-400">HealthPlus Pharmacy • Full Control</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('pharmacist')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-950/40 hover:border-emerald-500/40 border border-slate-700/80 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-teal-300">
                      Priya Sharma (Pharmacist)
                    </div>
                    <div className="text-[10px] text-slate-400">HealthPlus Pharmacy • Billing & POS</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ngo')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/40 hover:border-indigo-500/40 border border-slate-700/80 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                      Sanjay Verma (NGO Director)
                    </div>
                    <div className="text-[10px] text-slate-400">MedAid Foundation • Claim Donations</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-500">Or Manual</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
