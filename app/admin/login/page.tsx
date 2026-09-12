'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Swords,
  ArrowLeft,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAdminAuthenticated, loginAdmin, loading } = useAdminAuth();

  const [email, setEmail] = useState('admin@lifequest.realm');
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdminAuthenticated) {
      router.push('/admin');
    }
  }, [isAdminAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passkey.trim()) {
      setError('Please enter the admin passkey.');
      return;
    }

    setSubmitting(true);
    const res = await loginAdmin(email, passkey);
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push('/admin');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center text-ink-400 text-sm">
        Loading Admin Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-4 relative font-sans">
      {/* Ambient background glows */}
      <div className="fixed inset-0 bg-radial-fade pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Back to User Site Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs text-ink-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors focus-ring px-3 py-1.5 rounded-xl bg-ink-900 border border-ink-800 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Main Realm
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="rpg-card p-6 sm:p-8 border border-amber-500/30 bg-ink-900/90 backdrop-blur-xl rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Admin Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-ios-md">
              <ShieldAlert className="w-7 h-7 text-ink-950" strokeWidth={2.2} />
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-ink-100">
              Admin Control Center
            </h1>
            <p className="text-xs text-ink-400">
              Separate administrative login portal for platform architects
            </p>
          </div>

          {/* Access Instructions Box */}
          <div className="bg-ink-800/60 border border-ink-700 p-3.5 rounded-2xl text-xs text-ink-400 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-500/70 shrink-0 mt-0.5" />
            <span>
              Enter your admin email and the passkey configured in your server environment.
              Contact the realm administrator for access credentials.
            </span>
          </div>

          {/* Error alert */}
          {error && (
            <div className="p-3 rounded-2xl bg-flame-500/15 border border-flame-500/30 text-flame-300 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-flame-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-300 mb-1">
                Admin Email / Handle
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lifequest.realm"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100 text-sm focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
                <Mail className="w-4 h-4 text-ink-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-300 mb-1">
                Admin Passkey / Secret Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter admin passkey"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100 text-sm focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
                <Lock className="w-4 h-4 text-ink-500 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-ink-400 hover:text-ink-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 font-bold text-sm transition-all focus-ring shadow-ios-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {submitting ? 'Authenticating Admin...' : 'Authenticate & Enter Admin Portal'}
            </button>
          </form>

          {/* Footer note */}
          <div className="text-center text-[11px] text-ink-500 pt-2 border-t border-ink-800/80">
            Protected Admin Route &bull; LifeQuest Management Systems
          </div>
        </div>
      </motion.div>
    </div>
  );
}
