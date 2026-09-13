import type { Metadata } from 'next';
import { AdminAuthProvider } from '@/context/AdminAuthContext';

export const metadata: Metadata = {
  title: 'LifeQuest Admin Portal — Master Control Center',
  description: 'Administrative management portal for LifeQuest RPG platform.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
