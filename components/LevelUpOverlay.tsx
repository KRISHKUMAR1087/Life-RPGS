'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Sparkles, ChevronUp } from 'lucide-react';

type LevelUpOverlayProps = {
  level: number | null;
  onClose: () => void;
};

export default function LevelUpOverlay({ level, onClose }: LevelUpOverlayProps) {
  useEffect(() => {
    if (level === null) return;
    const timer = setTimeout(() => onClose(), 3500);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [level, onClose]);

  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="levelup-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm pointer-events-auto" />

          {/* Radiating particles */}
          {[...Array(24)].map((_, i) => {
            const angle = (i / 24) * 2 * Math.PI;
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gold-400 rounded-full pointer-events-none"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: Math.cos(angle) * 300,
                  y: Math.sin(angle) * 300,
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{ duration: 2, delay: 0.1, ease: 'easeOut' }}
              />
            );
          })}

          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative z-10 text-center pointer-events-auto"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.6, repeat: 2 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-gold-300 to-gold-600 shadow-[0_0_60px_rgba(251,191,36,0.5)] mb-6"
            >
              <Sparkles className="w-12 h-12 text-ink-900" strokeWidth={2} />
            </motion.div>

            <motion.h2
              id="levelup-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl font-heading font-bold text-shimmer mb-2"
            >
              LEVEL UP!
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 text-2xl text-ink-300"
            >
              <span className="text-ink-400">Level</span>
              <span className="text-gold-400 font-bold text-4xl">{level}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 inline-flex items-center gap-1 text-sm text-ink-300 bg-ink-800/80 px-4 py-2 rounded-full border border-gold-500/20"
            >
              <ChevronUp className="w-4 h-4 text-gold-400" />
              New challenges await
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
