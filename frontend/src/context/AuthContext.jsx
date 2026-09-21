import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = {
  owner: {
    email: 'demo.owner@medstock.local',
    password: 'DemoOwner@2026',
    label: 'Rajesh Kumar (Pharmacy Owner)',
    role: 'owner',
    orgType: 'pharmacy',
  },
  pharmacist: {
    email: 'demo.pharmacist@medstock.local',
    password: 'DemoPharmacist@2026',
    label: 'Priya Sharma (Lead Pharmacist)',
    role: 'pharmacist',
    orgType: 'pharmacy',
  },
  ngo: {
    email: 'demo.ngo@medstock.local',
    password: 'DemoNgo@2026',
    label: 'Sanjay Verma (NGO Director)',
    role: 'owner',
    orgType: 'ngo',
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('medstock_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      await authService.login(email, password);
      const userData = await authService.getMe();
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data) => {
    setLoading(true);
    try {
      await authService.signup(data);
      const userData = await authService.getMe();
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const switchDemoUser = async (roleKey) => {
    const account = DEMO_ACCOUNTS[roleKey];
    if (account) {
      return await login(account.email, account.password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        switchDemoUser,
        refreshUser: fetchUser,
        isPharmacy: user?.org_type === 'pharmacy',
        isNgo: user?.org_type === 'ngo',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
