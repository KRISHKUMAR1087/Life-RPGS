'use client';

import { motion } from 'framer-motion';
import { Coins, Flame, Trophy, Star } from 'lucide-react';
import type { Profile } from '@/lib/supabase';
import { xpForLevel, getRankTitle, CATEGORIES } from '@/lib/rpg';

type CharacterPanelProps = {
  profile: Profile;
};

export default function CharacterPanel({ profile }: CharacterPanelProps) {
  const xpNeeded = xpForLevel(profile.level);
  const xpPercent = Math.min(100, (profile.xp / xpNeeded) * 100);
  const rankTitle = getRankTitle(profile.level);

  const attributes = CATEGORIES.map((cat) => ({
    ...cat,
    value:
      cat.key === 'strength'
        ? profile.strength
        : cat.key === 'intellect'
          ? profile.intellect
          : cat.key === 'vitality'
            ? profile.vitality
            : cat.key === 'charisma'
              ? profile.charisma
              : profile.dexterity,
  }));

  const totalAttributePoints = attributes.reduce((sum, a) => sum + a.value, 0);

  return (
    <div className="rpg-card p-5 sm:p-6 shadow-ios-md">
      {/* iOS Character Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-ios-md">
            <span className="text-2xl font-heading font-extrabold text-white">
              {profile.username.charAt(0).toUpperCase() || 'H'}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-ios-sm">
            {profile.level}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-bold text-ink-200 truncate">
            {profile.username || 'Hero'}
          </h2>
          <p className="text-xs text-amber-500 font-semibold">{rankTitle}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-ink-400 font-medium">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              {profile.total_xp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      {/* iOS XP Progress Bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-ink-300">Level Progression</span>
          <span className="text-xs text-ink-400 tabular-nums font-medium">
            {profile.xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </span>
        </div>
        <div className="h-2.5 bg-ink-850 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </motion.div>
        </div>
      </div>

      {/* iOS Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-ink-850 rounded-2xl p-3 text-center border border-ink-800">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-semibold text-ink-400">Gold</span>
          </div>
          <p className="text-base font-extrabold text-amber-500 tabular-nums">{profile.gold}</p>
        </div>

        <div className="bg-ink-850 rounded-2xl p-3 text-center border border-ink-800">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-flame-500" />
            <span className="text-xs text-ink-400 font-medium">Streak</span>
          </div>
          <p className="text-base font-extrabold text-flame-500 tabular-nums">{profile.streak}</p>
        </div>
        <div className="bg-ink-850/50 rounded-2xl p-3 border border-ink-800">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-4 h-4 text-azure-500" />
            <span className="text-xs text-ink-400 font-medium">Best</span>
          </div>
          <p className="text-base font-extrabold text-azure-500 tabular-nums">{profile.longest_streak}</p>
        </div>
      </div>

      {/* Attributes Grouped List */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider">
            Attribute Progression
          </h3>
          <span className="text-xs text-ink-500 font-medium">{totalAttributePoints} pts</span>
        </div>
        <div className="space-y-2.5">
          {attributes.map((attr) => {
            const Icon = attr.icon;
            const maxAttr = Math.max(...attributes.map((a) => a.value), 10);
            const attrPercent = (attr.value / maxAttr) * 100;
            return (
              <div key={attr.key} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-ink-850 border border-ink-800"
                >
                  <Icon className="w-4 h-4" style={{ color: attr.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-semibold text-ink-200">{attr.label}</span>
                    <span className="text-xs text-ink-400 tabular-nums font-medium">{attr.value}</span>
                  </div>
                  <div className="h-1.5 bg-ink-850 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: attr.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${attrPercent}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
