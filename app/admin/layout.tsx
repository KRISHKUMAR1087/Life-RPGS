import type { Metadata } from 'next';
import { AdminAuthProvider } from '@/context/AdminAuthContext';

export const metadata: Metadata = {
  title: 'LifeQuest Admin Portal — Master Control Center',
  description: 'Administrative management portal for LifeQuest RPG platform.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      {/* Demo Mode transparency banner */}
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/95 text-ink-950 text-xs font-bold shadow-sm">
        <span>⚠️ Demo Mode</span>
        <span className="font-normal opacity-80">—</span>
        <span className="font-normal opacity-80">
          This portal manages local demo data only. Connect a real Supabase project for production database management.
        </span>
      </div>
      {children}
    </AdminAuthProvider>
  );
}
