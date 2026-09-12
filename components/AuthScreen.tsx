'use client';

import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, Sparkles, Play } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function AuthScreen() {
  const { signIn, signUp, loginDemo } = useAuth();
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

  function handleQuickPlay() {
    loginDemo(username.trim() || 'Hero');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden bg-ink-950">
      {/* Top right iOS Theme Toggle */}
      <div className="absolute top-5 right-5 z-20">
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
            LifeQuest
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
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-flame-500 bg-flame-500/10 border border-flame-500/20 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickPlay}
                    className="w-full py-2 px-3 text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-500 rounded-xl hover:bg-amber-500/25 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Play in Instant Local Mode Instead
                  </button>
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

          {/* Quick Play Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-ink-900 px-3 text-ink-400 font-medium">or play offline</span>
            </div>
          </div>

          {/* Quick Play Demo Button */}
          <button
            type="button"
            onClick={handleQuickPlay}
            className="w-full py-2.5 px-4 bg-ink-850 hover:bg-ink-800 text-ink-200 border border-ink-700/60 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-ios-sm group"
          >
            <Play className="w-4 h-4 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
            <span>Instant Quick Play (Local Hero)</span>
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

