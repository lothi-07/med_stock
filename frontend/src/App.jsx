import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BillingPage } from './pages/BillingPage';
import { InventoryPage } from './pages/InventoryPage';
import { AlertsPage } from './pages/AlertsPage';
import { DonationPage } from './pages/DonationPage';
import { ReportsPage } from './pages/ReportsPage';
import { alertService } from './services/api';

const PAGE_META = {
  '/': { title: 'Pharmacy Operations Dashboard', subtitle: 'Real-time overview of inventory health, FEFO dispensing, and revenue' },
  '/billing': { title: 'FEFO Billing & Point of Sale', subtitle: 'First-Expiry-First-Out auto-selected counter dispensing' },
  '/inventory': { title: 'Inventory & Batch Management', subtitle: 'Medicine catalog, re-order levels, and inward stock tracking' },
  '/alerts': { title: 'Alerts & Expiry Monitoring', subtitle: 'T-30/14/7 expiry countdowns and minimum stock threshold warnings' },
  '/donations': { title: 'Surplus NGO Marketplace', subtitle: 'Zero-waste medicine donation network for community relief' },
  '/reports': { title: 'Analytics & Compliance Reports', subtitle: 'Stock audit exports, financial metrics, and waste prevention data' },
};

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (!user) return;
    try {
      const res = await alertService.getUnreadCount();
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // sync every 15s
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold uppercase tracking-wider">Loading MedStock...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const currentMeta = PAGE_META[location.pathname] || {
    title: 'MedStock Pharmacy System',
    subtitle: '',
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      <Sidebar unreadCount={unreadCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/donations" element={<DonationPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
