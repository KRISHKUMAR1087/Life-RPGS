'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type AdminUser = {
  id: string;
  role: 'super_admin' | 'moderator';
  name: string;
};

type AdminAuthContextType = {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  loading: boolean;
  loginAdmin: (email: string, passkey: string) => Promise<{ error: string | null }>;
  logoutAdmin: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshSession() {
    try {
      const res = await fetch('/api/admin/session', { credentials: 'include' });
      const data = await res.json();
      setAdminUser(data.authenticated ? data.admin : null);
    } catch {
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSession();
  }, []);

  async function loginAdmin(email: string, passkey: string) {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, passkey }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Login failed.' };
      setAdminUser(data.admin);
      return { error: null };
    } catch {
      return { error: 'Could not reach the server. Try again.' };
    }
  }

  async function logoutAdmin() {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setAdminUser(null);
    }
  }

  return (
    <AdminAuthContext.Provider
      value={{ adminUser, isAdminAuthenticated: !!adminUser, loading, loginAdmin, logoutAdmin }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
