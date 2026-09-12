import { Loader2, Sword } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center animate-glow-pulse shadow-[0_0_30px_rgba(251,191,36,0.3)]">
          <Sword className="w-7 h-7 text-ink-900" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-2 text-ink-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading your adventure...
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
