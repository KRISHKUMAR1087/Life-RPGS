'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  ShieldAlert,
  Swords,
  Trophy,
  Gift,
  Sparkles,
  Zap,
  CheckCircle2,
  Skull,
} from 'lucide-react';
import { soundManager } from '@/lib/audio';
import type { Quest, Profile } from '@/lib/supabase';

type BossBattleProps = {
  quests: Quest[];
  profile: Profile;
  onClaimVictoryBonus?: (bonus: { xp: number; gold: number }) => void;
};

type BossInfo = {
  name: string;
  title: string;
  maxHp: number;
  avatar: string;
  quote: string;
  lootXp: number;
  lootGold: number;
};

const DAILY_BOSS: BossInfo = {
  name: 'Malakor the Sloth Wyrm',
  title: 'Bane of Procrastination & Lord of Delay',
  maxHp: 500,
  avatar: '🐉',
  quote: '"You will never conquer your daily scrolls of fate..."',
  lootXp: 150,
  lootGold: 50,
};

export default function BossBattle({ quests, profile, onClaimVictoryBonus }: BossBattleProps) {
  const completedToday = quests.filter((q) => q.status === 'completed');
  const activeToday = quests.filter((q) => q.status === 'active');
  const totalQuests = quests.length;

  // Calculate damage dealt: each easy=100, medium=150, hard=250, epic=500
  const damageDealt = completedToday.reduce((sum, q) => {
    switch (q.difficulty) {
      case 'easy':
        return sum + 100;
      case 'medium':
        return sum + 150;
      case 'hard':
        return sum + 250;
      case 'epic':
        return sum + 500;
      default:
        return sum + 125;
    }
  }, 0);

  const currentHp = Math.max(0, DAILY_BOSS.maxHp - damageDealt);
  const hpPercent = Math.min(100, Math.max(0, (currentHp / DAILY_BOSS.maxHp) * 100));
  const isDefeated = currentHp <= 0;

  const [hasClaimedLoot, setHasClaimedLoot] = useState(false);
  const [showSlash, setShowSlash] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const claimStorageKey = `life_rpg_boss_claimed_${profile.id}_${todayStr}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const claimed = localStorage.getItem(claimStorageKey) === 'true';
      setHasClaimedLoot(claimed);
    }
  }, [claimStorageKey]);

  function handleClaimLoot() {
    if (hasClaimedLoot || !isDefeated) return;
    soundManager.playVictory();
    soundManager.playCoinSound();
    setHasClaimedLoot(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(claimStorageKey, 'true');
    }
    if (onClaimVictoryBonus) {
      onClaimVictoryBonus({ xp: DAILY_BOSS.lootXp, gold: DAILY_BOSS.lootGold });
    }
  }

  return (
    <div className="rpg-card p-5 sm:p-6 shadow-ios-lg relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-flame-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-flame-500 to-amber-600 flex items-center justify-center text-2xl shadow-ios-md">
            {DAILY_BOSS.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-ink-200">{DAILY_BOSS.name}</h2>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-flame-500/20 text-flame-400 border border-flame-500/30">
                Daily Raid
              </span>
            </div>
            <p className="text-xs text-ink-400 font-medium">{DAILY_BOSS.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink-850 border border-ink-800 text-xs font-semibold text-ink-300">
            <Swords className="w-4 h-4 text-amber-500" />
            <span>
              {completedToday.length} / {totalQuests || 1} Strikes Dealt
            </span>
          </div>
        </div>
      </div>

      {/* Boss Stage Arena */}
      <div className="relative z-10 bg-gradient-to-b from-ink-900/80 to-ink-950/80 rounded-3xl p-6 border border-ink-800 text-center mb-6 overflow-hidden">
        {/* Boss Creature Visual with spring animation */}
        <motion.div
          animate={
            isDefeated
              ? { scale: [1, 0.9, 0.85], rotate: [0, 5, -5, 0], opacity: 0.6 }
              : { y: [0, -6, 0] }
          }
          transition={{
            repeat: isDefeated ? 0 : Infinity,
            duration: 3,
            ease: 'easeInOut',
          }}
          className="inline-block relative mb-4"
        >
          <div
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center text-6xl select-none mx-auto transition-all ${
              isDefeated
                ? 'bg-ink-850 border border-ink-700 grayscale'
                : 'bg-gradient-to-b from-flame-500/20 to-amber-500/10 border-2 border-flame-500/40 shadow-[0_0_35px_rgba(244,63,94,0.3)]'
            }`}
          >
            {DAILY_BOSS.avatar}
          </div>

          {/* Status Badge on Creature */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            {isDefeated ? (
              <span className="px-3 py-0.5 bg-emerald2-500 text-ink-950 text-[11px] font-extrabold rounded-full shadow-ios-sm">
                DEFEATED
              </span>
            ) : (
              <span className="px-3 py-0.5 bg-flame-600 text-white text-[11px] font-extrabold rounded-full shadow-ios-sm flex items-center gap-1">
                <Flame className="w-3 h-3 animate-pulse" />
                ENRAGED
              </span>
            )}
          </div>
        </motion.div>

        {/* Boss Quote */}
        <p className="text-xs italic text-ink-400 max-w-sm mx-auto mb-4 font-normal">
          {isDefeated ? '"Ugh... your productivity vanquished my slumber..."' : DAILY_BOSS.quote}
        </p>

        {/* HP Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
            <span className="text-flame-400 flex items-center gap-1 font-bold">
              <Skull className="w-3.5 h-3.5" /> Boss Health Pool
            </span>
            <span className="text-ink-300 tabular-nums">
              {currentHp} / {DAILY_BOSS.maxHp} HP ({Math.round(hpPercent)}%)
            </span>
          </div>
          <div className="h-4 bg-ink-850 rounded-full overflow-hidden p-0.5 border border-ink-800">
            <motion.div
              className={`h-full rounded-full transition-all duration-500 ${
                isDefeated
                  ? 'bg-emerald2-500'
                  : hpPercent < 30
                  ? 'bg-gradient-to-r from-flame-600 to-flame-400'
                  : 'bg-gradient-to-r from-amber-500 to-flame-500'
              }`}
              style={{ width: `${hpPercent}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mechanics Info & Victory Chest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <div className="bg-ink-850 rounded-2xl p-4 border border-ink-800">
          <h4 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" /> How Daily Raids Work
          </h4>
          <p className="text-xs text-ink-400 leading-relaxed font-normal">
            Every quest completed in your realm delivers a crushing blow to the realm boss. Complete
            all your daily missions to deplete its HP and claim bonus spoils of war!
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-ink-850 rounded-2xl p-4 border border-amber-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" /> Victory Spoils
            </h4>
            <span className="text-xs font-bold text-amber-400">
              +{DAILY_BOSS.lootXp} XP / +{DAILY_BOSS.lootGold} Gold
            </span>
          </div>

          {isDefeated ? (
            hasClaimedLoot ? (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald2-400 py-2 bg-emerald2-500/15 border border-emerald2-500/30 rounded-xl">
                <CheckCircle2 className="w-4 h-4" /> Spoils Claimed Today!
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaimLoot}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all animate-bounce"
              >
                <Gift className="w-4 h-4" /> Open Daily Victory Chest!
              </button>
            )
          ) : (
            <p className="text-xs text-ink-500 italic text-center py-2 font-medium">
              Vanquish the boss by finishing your quests to claim this chest.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
