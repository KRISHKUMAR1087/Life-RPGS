'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export type FloatingReward = {
  id: string;
  text: string;
  icon: string;
  color: string;
};

type FloatingRewardsProps = {
  rewards: FloatingReward[];
  onClear: () => void;
};

export default function FloatingRewards({ rewards, onClear }: FloatingRewardsProps) {
  useEffect(() => {
    if (rewards.length === 0) return;
    const timer = setTimeout(onClear, 2000);
    return () => clearTimeout(timer);
  }, [rewards, onClear]);

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {rewards.map((reward, idx) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, x: 50, scale: 0.8, rotate: -4 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotate: [0, 3, -2, 0] }}
            exit={{ opacity: 0, y: -30 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: idx * 0.15,
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl bg-ink-900/95 border ${reward.color} shadow-ios-lg backdrop-blur-md`}
          >
            <span className="text-lg">{reward.icon}</span>
            <span className={`text-sm font-bold ${reward.color.includes('gold') ? 'text-amber-400' : 'text-azure-400'}`}>
              {reward.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
