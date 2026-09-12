'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  Flame,
  Trophy,
  Star,
  Crown,
  Sparkles,
  Zap,
  Activity,
  ListFilter,
} from 'lucide-react';
import type { Profile, InventoryItem } from '@/lib/supabase';
import { xpForLevel, getRankTitle, CATEGORIES } from '@/lib/rpg';
import StatRadarChart from '@/components/StatRadarChart';

type CharacterPanelProps = {
  profile: Profile;
  inventory?: InventoryItem[];
  variant?: 'vertical' | 'horizontal';
};

export default function CharacterPanel({
  profile,
  inventory = [],
  variant = 'vertical',
}: CharacterPanelProps) {
  const [viewMode, setViewMode] = useState<'radar' | 'bars'>('radar');

  const xpNeeded = xpForLevel(profile.level);
  const xpPercent = Math.min(100, (profile.xp / xpNeeded) * 100);
  const rankTitle = getRankTitle(profile.level);
  const nextRankTitle = getRankTitle(profile.level + 5);

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

  // Check equipped items
  const equippedItems = inventory.filter((i) => i.equipped && i.shop_items);
  const equippedFrame = equippedItems.find((i) => i.shop_items?.type === 'avatar_frame');
  const equippedTitle = equippedItems.find((i) => i.shop_items?.type === 'title');
  const equippedBadge = equippedItems.find((i) => i.shop_items?.type === 'badge');

  // Avatar border style based on equipped frame
  const frameBorderClass = equippedFrame?.shop_items?.name.includes('Golden')
    ? 'ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.4)]'
    : equippedFrame?.shop_items?.name.includes('Mythic')
    ? 'ring-4 ring-violet2-400 shadow-[0_0_25px_rgba(167,139,250,0.4)]'
    : equippedFrame?.shop_items?.name.includes('Iron')
    ? 'ring-4 ring-ink-500'
    : 'border-2 border-white/20';

  if (variant === 'horizontal') {
    return (
      <div className="rpg-card p-5 sm:p-6 shadow-ios-md border border-ink-800 bg-ink-900 space-y-6">
        {/* Horizontal Row 1: Profile + XP Progress + Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Col 1: Hero Info */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-ios-md transition-all ${frameBorderClass}`}
              >
                <span className="text-2xl font-heading font-extrabold text-white select-none">
                  {profile.username.charAt(0).toUpperCase() || 'H'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white dark:border-ink-950 shadow-ios-sm">
                {profile.level}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading text-lg font-bold text-ink-200 truncate">
                  {profile.username || 'Hero'}
                </h2>
                {equippedBadge && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> {equippedBadge.shop_items?.name}
                  </span>
                )}
              </div>

              <p className="text-xs text-amber-500 font-semibold flex items-center gap-1 mt-0.5">
                <Crown className="w-3.5 h-3.5" />
                {equippedTitle?.shop_items?.name ? equippedTitle.shop_items.name : rankTitle}
              </p>

              <div className="flex items-center gap-3 mt-1 text-xs text-ink-400 font-medium">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  {profile.total_xp.toLocaleString()} Total XP
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: XP Progression Bar */}
          <div className="bg-ink-850/60 p-3.5 rounded-2xl border border-ink-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-ink-300">Level {profile.level} Progression</span>
              <span className="text-xs text-ink-400 tabular-nums font-medium">
                {profile.xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2.5 bg-ink-900 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                  style={{ backgroundSize: '200% 100%' }}
                />
              </motion.div>
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[10px] text-ink-500 font-medium">
              <span>Current: {rankTitle}</span>
              <span>Next: {nextRankTitle}</span>
            </div>
          </div>

          {/* Col 3: Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-ink-850 rounded-2xl p-3 text-center border border-ink-800 shadow-ios-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-semibold text-ink-400">Gold</span>
              </div>
              <p className="text-base font-extrabold text-amber-500 tabular-nums">{profile.gold}</p>
            </div>

            <div className="bg-ink-850 rounded-2xl p-3 text-center border border-ink-800 shadow-ios-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Flame className="w-4 h-4 text-flame-500" />
                <span className="text-[11px] font-semibold text-ink-400">Streak</span>
              </div>
              <p className="text-base font-extrabold text-flame-500 tabular-nums">{profile.streak} Days</p>
            </div>

            <div className="bg-ink-850 rounded-2xl p-3 text-center border border-ink-800 shadow-ios-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Trophy className="w-4 h-4 text-azure-500" />
                <span className="text-[11px] font-semibold text-ink-400">Best</span>
              </div>
              <p className="text-base font-extrabold text-azure-500 tabular-nums">{profile.longest_streak} Days</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rpg-card p-5 sm:p-6 shadow-ios-md border border-ink-800 bg-ink-900 space-y-5">
      {/* Character Header */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-ios-md transition-all ${frameBorderClass}`}
          >
            <span className="text-2xl font-heading font-extrabold text-white select-none">
              {profile.username.charAt(0).toUpperCase() || 'H'}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white dark:border-ink-950 shadow-ios-sm">
            {profile.level}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-ink-200 truncate">
              {profile.username || 'Hero'}
            </h2>
            {equippedBadge && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> {equippedBadge.shop_items?.name}
              </span>
            )}
          </div>

          <p className="text-xs text-amber-500 font-semibold flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" />
            {equippedTitle?.shop_items?.name ? equippedTitle.shop_items.name : rankTitle}
          </p>

          <div className="flex items-center gap-3 mt-1 text-xs text-ink-400 font-medium">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              {profile.total_xp.toLocaleString()} Total XP
            </span>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="bg-ink-850/60 p-3.5 rounded-2xl border border-ink-800">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-ink-300">Level {profile.level} Progression</span>
          <span className="text-xs text-ink-400 tabular-nums font-medium">
            {profile.xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </span>
        </div>
        <div className="h-2.5 bg-ink-900 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{ backgroundSize: '200% 100%' }}
            />
          </motion.div>
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[10px] text-ink-500 font-medium">
          <span>Current: {rankTitle}</span>
          <span>Next Rank Unlock: {nextRankTitle}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-ink-850 rounded-2xl p-3 text-center border border-ink-800 shadow-ios-sm">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-semibold text-ink-400">Gold</span>
          </div>
          <p className="text-base font-extrabold text-amber-500 tabular-nums">{profile.gold}</p>
        </div>

        <div className="bg-ink-850 rounded-2xl p-3 text-center border border-ink-800 shadow-ios-sm">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-flame-500" />
            <span className="text-[11px] font-semibold text-ink-400">Streak</span>
          </div>
          <p className="text-base font-extrabold text-flame-500 tabular-nums">{profile.streak} Days</p>
        </div>

        <div className="bg-ink-850 rounded-2xl p-3 text-center border border-ink-800 shadow-ios-sm">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy className="w-4 h-4 text-azure-500" />
            <span className="text-[11px] font-semibold text-ink-400">Best</span>
          </div>
          <p className="text-base font-extrabold text-azure-500 tabular-nums">{profile.longest_streak} Days</p>
        </div>
      </div>

      {/* Attributes Section with View Switcher */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Attribute Matrix
          </h3>

          <div className="flex items-center gap-1 bg-ink-850 p-0.5 rounded-xl border border-ink-800">
            <button
              type="button"
              onClick={() => setViewMode('radar')}
              className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all focus-ring ${
                viewMode === 'radar'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
              aria-label="Display attribute radar chart"
            >
              <Activity className="w-3 h-3 inline mr-1" /> Radar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bars')}
              className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all focus-ring ${
                viewMode === 'bars'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
              aria-label="Display attribute stat bars"
            >
              <ListFilter className="w-3 h-3 inline mr-1" /> Bars
            </button>
          </div>
        </div>

        {viewMode === 'radar' ? (
          <div className="bg-ink-850/50 rounded-2xl p-2 border border-ink-800 flex flex-col items-center justify-center">
            <StatRadarChart
              stats={{
                strength: profile.strength,
                intellect: profile.intellect,
                vitality: profile.vitality,
                charisma: profile.charisma,
                dexterity: profile.dexterity,
              }}
              size={240}
            />
          </div>
        ) : (
          <div className="space-y-2.5">
            {attributes.map((attr) => {
              const Icon = attr.icon;
              const maxAttr = Math.max(...attributes.map((a) => a.value), 10);
              const attrPercent = (attr.value / maxAttr) * 100;
              return (
                <div key={attr.key} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-ink-850 border border-ink-800">
                    <Icon className="w-4 h-4" style={{ color: attr.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-semibold text-ink-200">{attr.label}</span>
                      <span className="text-xs text-ink-400 tabular-nums font-medium">{attr.value} pts</span>
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
        )}
      </div>
    </div>
  );
}
