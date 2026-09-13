'use client';

import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, Sparkles, Play, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

import MusicPlayer from '@/components/MusicPlayer';

type AuthScreenProps = {
  onBackToLanding?: () => void;
};

export default function AuthScreen({ onBackToLanding }: AuthScreenProps = {}) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && !username.trim()) {
      setError('Please choose a hero name.');
      return;
    }

    setSubmitting(true);
    const result =
      mode === 'signup'
        ? await signUp(email.trim(), password, username.trim())
        : await signIn(email.trim(), password);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }



  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden bg-ink-950">
      {/* Top Left Back to Landing Button */}
      {onBackToLanding && (
        <div className="absolute top-5 left-5 z-20">
          <button
            type="button"
            onClick={onBackToLanding}
            className="px-3.5 py-2 rounded-2xl bg-ink-900 border border-ink-800 text-ink-300 hover:text-ink-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-ios-sm focus-ring"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Landing Page</span>
          </button>
        </div>
      )}

      {/* Top right Music Player & Theme Toggle */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-3">
        <MusicPlayer />
        <ThemeToggle />
      </div>


      {/* iOS Ambient Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* iOS Header & App Icon */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 140, damping: 12 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 mb-4 shadow-ios-lg"
          >
            <Sword className="w-10 h-10 text-white" strokeWidth={2.2} />
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-ink-200 tracking-tight">
            XpWin
          </h1>
          <p className="text-ink-400 text-sm mt-1.5 font-normal max-w-xs mx-auto">
            Turn your daily routines into epic adventures, earn XP, level up & build streaks.
          </p>
        </div>

        {/* iOS Frosted Glass Form Card */}
        <div className="ios-glass p-6 sm:p-8 rounded-3xl shadow-ios-lg border border-white/60 dark:border-white/10">
          {/* iOS Segmented Control Tab Switcher */}
          <div className="flex p-1 bg-ink-850 rounded-2xl mb-6 relative">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 z-10 ${
                mode === 'signup'
                  ? 'bg-white dark:bg-ink-800 text-ink-200 shadow-ios-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Create Hero
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 z-10 ${
                mode === 'login'
                  ? 'bg-white dark:bg-ink-800 text-ink-200 shadow-ios-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-1.5"
                >
                  <label htmlFor="username" className="block text-xs font-semibold text-ink-300 ml-1">
                    Hero Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field pl-10 text-sm font-medium"
                      placeholder="e.g. Aragorn"
                      autoComplete="username"
                      disabled={submitting}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-ink-300 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 text-sm font-medium"
                  placeholder="hero@realm.com"
                  autoComplete="email"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-ink-300 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10 text-sm font-medium"
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 text-xs font-medium text-flame-500 bg-flame-500/10 border border-flame-500/20 rounded-xl p-3"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-ios-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'signup' ? 'Creating Hero Profile...' : 'Entering Realm...'}
                </>
              ) : (
                <>{mode === 'signup' ? 'Begin Adventure' : 'Enter the Realm'}</>
              )}
            </button>
          </form>

          {/* Social Auth Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-ink-900 px-3 text-ink-400 font-medium">or continue with</span>
            </div>
          </div>

          {/* Sign In With Google OAuth Button */}
          <button
            type="button"
            onClick={async () => {
              setError(null);
              setSubmitting(true);
              const res = await signInWithGoogle();
              if (res?.error) {
                setError(res.error);
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-ink-850 hover:bg-ink-800 text-ink-200 border border-ink-700/60 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-ios-sm group focus-ring"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-center text-ink-400 text-xs mt-6">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald2-500" />
          <span>Local storage enabled & Supabase sync ready</span>
        </div>
      </motion.div>
    </div>
  );
}

