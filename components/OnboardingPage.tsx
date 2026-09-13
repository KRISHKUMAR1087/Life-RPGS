'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, User, Globe, Target, Sword, CheckCircle2 } from 'lucide-react';
import { COUNTRIES, formatUsername, CATEGORIES } from '@/lib/rpg';
import { soundManager } from '@/lib/audio';

type OnboardingPageProps = {
  initialUsername?: string;
  initialBio?: string;
  initialCountry?: string;
  onSubmit: (data: { username: string; bio: string; country: string; focusCategory: string }) => Promise<void>;
};

export default function OnboardingPage({
  initialUsername = '',
  initialBio = '',
  initialCountry = 'US',
  onSubmit,
}: OnboardingPageProps) {
  const [username, setUsername] = useState(formatUsername(initialUsername || 'Hero'));
  const [country, setCountry] = useState(initialCountry);
  const [bio, setBio] = useState(initialBio || 'Ready to level up in real life and conquer my daily quests!');
  const [focusCategory, setFocusCategory] = useState('strength');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Hero name cannot be empty.');
      soundManager.playErrorSound();
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    soundManager.playLevelUp();

    try {
      await onSubmit({
        username: username.trim(),
        bio: bio.trim(),
        country,
        focusCategory,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save onboarding details.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 flex flex-col items-center justify-center relative p-4 sm:p-6 md:p-10 select-none overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-400/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl text-center space-y-3 mb-8 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10">
          <Sword className="w-4 h-4 text-amber-400" />
          LIFE RPG — Realm Registration Protocol
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-ink-50 font-serif tracking-wide drop-shadow-md">
          Complete Your Adventurer Profile
        </h1>
        <p className="text-sm sm:text-base text-ink-300 max-w-xl mx-auto">
          Welcome to the realm! Set up your hero identity, country, and primary specialization to unlock your dashboard and begin your epic quest.
        </p>
      </motion.div>

      {/* Form Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative w-full max-w-2xl bg-ink-900/90 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl z-10 overflow-hidden"
      >
        {/* Top Gold Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-flame-500/15 border border-flame-500/40 text-flame-300 text-sm font-semibold text-center shadow-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Identity */}
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-2 pb-2 border-b border-ink-800">
              <User className="w-4 h-4" />
              1. Hero Identity & Origin
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hero Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-200 uppercase tracking-wider flex items-center gap-1.5">
                  Adventurer Name
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Valerius_Titan"
                  className="w-full px-4 py-3 rounded-xl bg-ink-950 border border-ink-700 text-ink-100 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all font-medium"
                />
              </div>

              {/* Country Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-200 uppercase tracking-wider flex items-center gap-1.5">
                  Origin Realm / Nation
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-ink-950 border border-ink-700 text-ink-100 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all cursor-pointer font-medium"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Motto & Bio */}
          <div className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-2 pb-2 border-b border-ink-800">
              <Shield className="w-4 h-4" />
              2. Journey Motto & Bio
            </h2>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink-200 uppercase tracking-wider block">
                Personal Bio / Hero Code
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your epic journey motto or real-life aspirations..."
                className="w-full px-4 py-3 rounded-xl bg-ink-950 border border-ink-700 text-ink-100 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all resize-none font-medium"
              />
            </div>
          </div>

          {/* Section 3: Focus Domain */}
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-2 pb-2 border-b border-ink-800">
              <Target className="w-4 h-4" />
              3. Primary Specialization
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.slice(0, 4).map((cat) => {
                const Icon = cat.icon;
                const isSelected = focusCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setFocusCategory(cat.key)}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all text-center relative ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-lg shadow-amber-500/10'
                        : 'border-ink-800 bg-ink-950/70 text-ink-400 hover:border-ink-700 hover:text-ink-200'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 absolute top-2 right-2" />
                    )}
                    <Icon className="w-6 h-6 shrink-0" style={{ color: cat.color }} />
                    <span className="truncate w-full">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-ink-950 font-black text-sm uppercase tracking-wider hover:from-amber-400 hover:to-amber-300 transition-all shadow-xl shadow-amber-500/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin text-ink-950" />
                  Creating Hero Profile...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-ink-950" />
                  ⚡ Complete Profile & Enter Realm
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
