'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  Flame,
  Trophy,
  Star,
  Shield,
  Crown,
  Sparkles,
  Zap,
  Activity,
  ListFilter,
  CheckCircle2,
  Edit2,
  Save,
  Award,
  Layers,
} from 'lucide-react';
import type { Profile, InventoryItem } from '@/lib/supabase';
import { xpForLevel, getRankTitle, CATEGORIES } from '@/lib/rpg';
import StatRadarChart from '@/components/StatRadarChart';
import { saveLocalProfile } from '@/lib/localStore';
import { soundManager } from '@/lib/audio';

type CharacterPanelProps = {
  profile: Profile;
  inventory?: InventoryItem[];
  onProfileUpdate?: (updated: Profile) => void;
};

const PRESTIGE_TIERS = [
  { level: 1, title: 'Novice Wanderer', icon: '🌱', perk: 'Base XP & Gold Earning' },
  { level: 5, title: 'Apprentice Adventurer', icon: '⚔️', perk: '+5% Gold Bonus in Shop' },
  { level: 10, title: 'Seasoned Veteran', icon: '🛡️', perk: 'Realm Boss Damage x1.2' },
  { level: 20, title: 'Realm Master', icon: '🔥', perk: 'Access to Mythic Bounties' },
  { level: 35, title: 'Grandmaster Hero', icon: '👑', perk: 'Exclusive Golden Radar Aura' },
  { level: 50, title: 'Mythic Ascendant', icon: '✨', perk: 'Immortal Prestige Title' },
];

export default function CharacterPanel({
  profile,
  inventory = [],
  onProfileUpdate,
}: CharacterPanelProps) {
  const [viewMode, setViewMode] = useState<'radar' | 'bars'>('radar');
  const [editingMotto, setEditingMotto] = useState(false);
  const [mottoText, setMottoText] = useState(profile.motto || 'Aspiring adventurer forging their destiny');

  const xpNeeded = xpForLevel(profile.level);
  const xpPercent = Math.min(100, (profile.xp / xpNeeded) * 100);
  const rankTitle = getRankTitle(profile.level);
  const nextRankTier = PRESTIGE_TIERS.find((t) => t.level > profile.level) || PRESTIGE_TIERS[PRESTIGE_TIERS.length - 1];

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

  // Equipped Cosmetics
  const equippedItems = inventory.filter((i) => i.equipped && i.shop_items);
  const equippedFrame = equippedItems.find((i) => i.shop_items?.type === 'avatar_frame');
  const equippedTitle = equippedItems.find((i) => i.shop_items?.type === 'title');
  const equippedBadge = equippedItems.find((i) => i.shop_items?.type === 'badge');
  const equippedTheme = equippedItems.find((i) => i.shop_items?.type === 'theme');

  const frameBorderClass = equippedFrame?.shop_items?.name.includes('Golden')
    ? 'ring-4 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
    : equippedFrame?.shop_items?.name.includes('Mythic')
    ? 'ring-4 ring-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.5)]'
    : equippedFrame?.shop_items?.name.includes('Iron')
    ? 'ring-4 ring-zinc-400 shadow-ios-md'
    : 'border-2 border-white/20';

  function handleSaveMotto() {
    soundManager.playClick();
    const updated: Profile = {
      ...profile,
      motto: mottoText.slice(0, 75),
    };
    saveLocalProfile(updated);
    if (onProfileUpdate) onProfileUpdate(updated);
    setEditingMotto(false);
  }

  return (
    <div className="space-y-6">
      {/* Hero Showcase Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          {/* Avatar and Identity */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-ios-lg transition-all ${frameBorderClass}`}
              >
                <span className="text-3xl sm:text-4xl font-heading font-black text-ink-950 select-none">
                  {profile.username.charAt(0).toUpperCase() || 'H'}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-ink-950 text-xs font-black rounded-full px-2.5 py-1 flex items-center justify-center border-2 border-ink-900 shadow-ios-md">
                LVL {profile.level}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-heading font-black text-ink-100">
                  {profile.username || 'Hero'}
                </h1>
                {equippedBadge && (
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center gap-1 shadow-ios-sm">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    {equippedBadge.shop_items?.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Crown className="w-4 h-4" />
                <span>{equippedTitle?.shop_items?.name ? equippedTitle.shop_items.name : rankTitle}</span>
              </div>

              {/* Motto Editor */}
              <div className="pt-1 flex items-center gap-2 text-xs text-ink-400">
                {editingMotto ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={75}
                      value={mottoText}
                      onChange={(e) => setMottoText(e.target.value)}
                      className="input-field text-xs py-1 px-2.5 max-w-xs"
                      placeholder="Your heroic motto (max 75 chars)..."
                    />
                    <button
                      type="button"
                      onClick={handleSaveMotto}
                      className="p-1.5 rounded-lg bg-amber-500 text-ink-950 hover:bg-amber-400 font-bold text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingMotto(true)}
                    className="cursor-pointer group flex items-center gap-1.5 hover:text-amber-300 transition-colors italic"
                  >
                    <span>&quot;{profile.motto || mottoText}&quot;</span>
                    <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Lifetime Summary Chips */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs font-semibold text-ink-300">
            <div className="flex items-center gap-1.5 bg-ink-850/80 px-3.5 py-1.5 rounded-xl border border-white/10">
              <Star className="w-4 h-4 text-amber-400" />
              <span>{profile.total_xp.toLocaleString()} Total XP</span>
            </div>
            <div className="flex items-center gap-1.5 bg-ink-850/80 px-3.5 py-1.5 rounded-xl border border-white/10">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{profile.gold.toLocaleString()} Gold</span>
            </div>
          </div>
        </div>

        {/* XP Level Progression Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-ink-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Level {profile.level} Progression
            </span>
            <span className="text-amber-400 tabular-nums">
              {profile.xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP ({Math.round(xpPercent)}%)
            </span>
          </div>

          <div className="h-3 bg-ink-950/80 rounded-full overflow-hidden p-0.5 border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full relative shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-ink-400 font-medium">
            <span>Rank: {rankTitle}</span>
            <span>Next Milestone: Level {nextRankTier.level} ({nextRankTier.title})</span>
          </div>
        </div>
      </div>

      {/* Equipped Cosmetics Vault Grid */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          Equipped Loadout & Cosmetic Vault
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Avatar Frame Slot */}
          <div className="bg-ink-850/70 p-3.5 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-ink-400">Avatar Frame</span>
            <div className="w-10 h-10 rounded-xl bg-ink-900 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-ios-sm">
              <Shield className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-ink-200">
              {equippedFrame?.shop_items?.name || 'Default Border'}
            </p>
          </div>

          {/* Title Slot */}
          <div className="bg-ink-850/70 p-3.5 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-ink-400">Hero Title</span>
            <div className="w-10 h-10 rounded-xl bg-ink-900 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-ios-sm">
              <Crown className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-ink-200">
              {equippedTitle?.shop_items?.name || rankTitle}
            </p>
          </div>

          {/* Emblem Badge Slot */}
          <div className="bg-ink-850/70 p-3.5 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-ink-400">Emblem Badge</span>
            <div className="w-10 h-10 rounded-xl bg-ink-900 border border-emerald2-500/30 flex items-center justify-center text-emerald2-400 shadow-ios-sm">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-ink-200">
              {equippedBadge?.shop_items?.name || 'Challenger'}
            </p>
          </div>

          {/* Realm Theme Slot */}
          <div className="bg-ink-850/70 p-3.5 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-ink-400">Cosmic Theme</span>
            <div className="w-10 h-10 rounded-xl bg-ink-900 border border-azure-500/30 flex items-center justify-center text-azure-400 shadow-ios-sm">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-ink-200">
              {equippedTheme?.shop_items?.name || 'Dark Glass RPG'}
            </p>
          </div>
        </div>
      </div>

      {/* Attribute Matrix & Radar Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Radar Visualizer */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Hero Attribute Pentagon
              </h3>
              <p className="text-xs text-ink-400 font-medium">Interactive balance across life dimensions</p>
            </div>

            <div className="flex items-center gap-1 bg-ink-850/90 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('radar')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'radar'
                    ? 'bg-amber-500 text-ink-950 shadow-ios-sm'
                    : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                Radar
              </button>
              <button
                type="button"
                onClick={() => setViewMode('bars')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'bars'
                    ? 'bg-amber-500 text-ink-950 shadow-ios-sm'
                    : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                Bars
              </button>
            </div>
          </div>

          {viewMode === 'radar' ? (
            <div className="flex flex-col items-center justify-center py-2">
              <StatRadarChart
                stats={{
                  strength: profile.strength,
                  intellect: profile.intellect,
                  vitality: profile.vitality,
                  charisma: profile.charisma,
                  dexterity: profile.dexterity,
                }}
                size={260}
              />
              <span className="text-xs text-ink-400 font-mono mt-3">
                Total Stat Points: <strong className="text-amber-400">{totalAttributePoints}</strong>
              </span>
            </div>
          ) : (
            <div className="space-y-3.5 py-2">
              {attributes.map((attr) => {
                const Icon = attr.icon;
                const maxAttr = Math.max(...attributes.map((a) => a.value), 10);
                const attrPercent = (attr.value / maxAttr) * 100;
                return (
                  <div key={attr.key} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-ink-850 border border-white/10 shadow-ios-sm">
                      <Icon className="w-5 h-5" style={{ color: attr.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-bold text-ink-100">{attr.label}</span>
                        <span className="text-xs text-amber-400 tabular-nums font-extrabold">{attr.value} pts</span>
                      </div>
                      <div className="h-2 bg-ink-950 rounded-full overflow-hidden border border-white/5">
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

        {/* Right: Prestige Road & Rank Hierarchy */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              Prestige Milestone Roadmap
            </h3>
            <p className="text-xs text-ink-400 font-medium mb-4">Ascend tiers to unlock realm perks</p>

            <div className="space-y-3">
              {PRESTIGE_TIERS.map((tier, idx) => {
                const isUnlocked = profile.level >= tier.level;
                const isCurrent =
                  profile.level >= tier.level &&
                  (idx === PRESTIGE_TIERS.length - 1 || profile.level < PRESTIGE_TIERS[idx + 1].level);

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                        : isUnlocked
                        ? 'bg-ink-850/60 border-white/10 text-ink-300'
                        : 'bg-ink-950/40 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">{tier.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-ink-100 truncate">{tier.title}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-ink-900 border border-white/10 font-bold text-amber-300 flex-shrink-0">
                            LVL {tier.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-400 font-normal truncate">{tier.perk}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-2">
                      {isCurrent ? (
                        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-amber-500 text-ink-950 whitespace-nowrap shadow-ios-sm">
                          Active Rank
                        </span>
                      ) : isUnlocked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald2-400" />
                      ) : (
                        <span className="text-[10px] text-ink-500 font-mono">Locked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
