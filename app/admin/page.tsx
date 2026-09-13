import AdminDashboard from '@/components/AdminDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Realm Master Admin | LifeQuest RPG',
  description: 'Administrative command center for LifeQuest RPG realm management.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
