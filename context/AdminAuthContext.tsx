'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type AdminUser = {
  id: string;
  email: string;
  role: 'super_admin' | 'moderator';
  name: string;
  loggedInAt: string;
};

type AdminAuthContextType = {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  loading: boolean;
  loginAdmin: (email: string, passkey: string) => Promise<{ error: string | null }>;
  logoutAdmin: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'life_rpg_admin_session';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAdminUser(parsed);
        } catch {
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        }
      }
      setLoading(false);
    }
  }, []);

  async function loginAdmin(email: string, passkey: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = passkey.trim();

    // Default admin credentials check: admin@lifequest.realm / admin123 or secret key "admin"
    if (
      (cleanEmail === 'admin@lifequest.realm' && cleanPass === 'admin123') ||
      cleanPass === 'admin' ||
      cleanPass === 'admin123' ||
      cleanPass === 'superadmin'
    ) {
      const user: AdminUser = {
        id: 'admin-master',
        email: cleanEmail || 'admin@lifequest.realm',
        role: 'super_admin',
        name: 'Master Realm Architect',
        loggedInAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
      }
      setAdminUser(user);
      return { error: null };
    }

    return { error: 'Invalid admin email or passkey. Access denied.' };
  }

  function logoutAdmin() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
    setAdminUser(null);
  }

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdminAuthenticated: !!adminUser,
        loading,
        loginAdmin,
        logoutAdmin,
      }}
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
