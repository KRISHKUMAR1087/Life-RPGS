'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Sparkles, ChevronUp, Crown, Zap, Gift } from 'lucide-react';
import { soundManager } from '@/lib/audio';
import { getRankTitle } from '@/lib/rpg';
import ParticleEffect from '@/components/ParticleEffect';

type LevelUpOverlayProps = {
  level: number | null;
  onClose: () => void;
};

export default function LevelUpOverlay({ level, onClose }: LevelUpOverlayProps) {
  useEffect(() => {
    if (level === null) return;
    soundManager.playLevelUp();

    const timer = setTimeout(() => onClose(), 4200);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [level, onClose]);

  if (level === null) return null;

  const rankTitle = getRankTitle(level);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="levelup-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md pointer-events-auto" />

        {/* Confetti Explosion Canvas */}
        <ParticleEffect active={true} type="confetti" />

        {/* Radiating Light Rays */}
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-amber-500/20 via-azure-500/20 to-flame-500/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />

        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="relative z-10 text-center pointer-events-auto max-w-sm w-full bg-ink-900/90 border border-amber-500/40 p-6 sm:p-8 rounded-3xl shadow-[0_0_80px_rgba(251,191,36,0.35)]"
        >
          {/* Animated Hero Trophy Icon */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 shadow-[0_0_50px_rgba(251,191,36,0.6)] mb-5"
          >
            <Crown className="w-12 h-12 text-ink-950" strokeWidth={2.5} />
          </motion.div>

          <motion.h2
            id="levelup-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-4xl sm:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 mb-2 tracking-tight"
          >
            LEVEL UP!
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center justify-center gap-2 text-xl font-bold text-ink-300 mb-4"
          >
            <span>Promoted to Level</span>
            <span className="text-amber-400 font-extrabold text-4xl tabular-nums">{level}</span>
          </motion.div>

          {/* Unlocked Rank Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-3 mb-4 text-center"
          >
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block mb-0.5">
              Rank Title Bestowed
            </span>
            <span className="text-base font-heading font-extrabold text-ink-100">{rankTitle}</span>
          </motion.div>

          {/* Stat Boosts Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="grid grid-cols-2 gap-2 text-xs font-semibold text-ink-300 mb-6"
          >
            <div className="bg-ink-850 p-2.5 rounded-xl border border-ink-800 flex items-center justify-center gap-1.5 text-emerald2-400">
              <Zap className="w-3.5 h-3.5" /> +1 Attribute Point
            </div>
            <div className="bg-ink-850 p-2.5 rounded-xl border border-ink-800 flex items-center justify-center gap-1.5 text-amber-400">
              <Gift className="w-3.5 h-3.5" /> +50 Gold Reward
            </div>
          </motion.div>

          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full py-3 text-xs font-extrabold rounded-2xl shadow-ios-md uppercase tracking-wider"
          >
            Claim Glory & Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
