'use client';

import { motion } from 'framer-motion';
import {
  Coins,
  Flame,
  Trophy,
  Star,
  Crown,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import type { Profile, InventoryItem } from '@/lib/supabase';
import { xpForLevel, getRankTitle } from '@/lib/rpg';
import { soundManager } from '@/lib/audio';

type HeroOverviewCardProps = {
  profile: Profile;
  inventory?: InventoryItem[];
  onOpenHeroSheet: () => void;
};

export default function HeroOverviewCard({
  profile,
  inventory = [],
  onOpenHeroSheet,
}: HeroOverviewCardProps) {
  const xpNeeded = xpForLevel(profile.level);
  const xpPercent = Math.min(100, (profile.xp / xpNeeded) * 100);
  const rankTitle = getRankTitle(profile.level);

  // Equipped items
  const equippedItems = inventory.filter((i) => i.equipped && i.shop_items);
  const equippedFrame = equippedItems.find((i) => i.shop_items?.type === 'avatar_frame');
  const equippedTitle = equippedItems.find((i) => i.shop_items?.type === 'title');
  const equippedBadge = equippedItems.find((i) => i.shop_items?.type === 'badge');

  const frameBorderClass = equippedFrame?.shop_items?.name.includes('Golden')
    ? 'ring-4 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
    : equippedFrame?.shop_items?.name.includes('Mythic')
    ? 'ring-4 ring-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.4)]'
    : equippedFrame?.shop_items?.name.includes('Iron')
    ? 'ring-4 ring-zinc-400'
    : 'border-2 border-white/20';

  return (
    <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-5 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[70px] pointer-events-none" />

      {/* Header Profile Section */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-ios-md transition-all ${frameBorderClass}`}
          >
            <span className="text-2xl font-heading font-black text-ink-950 select-none">
              {profile.username.charAt(0).toUpperCase() || 'H'}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-ink-950 text-xs font-black rounded-full px-2 py-0.5 border-2 border-ink-900 shadow-ios-sm">
            LVL {profile.level}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-ink-100 truncate">
              {profile.username || 'Hero'}
            </h2>
            {equippedBadge && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                {equippedBadge.shop_items?.name}
              </span>
            )}
          </div>

          <p className="text-xs text-amber-400 font-bold flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" />
            {equippedTitle?.shop_items?.name || rankTitle}
          </p>

          <p className="text-[11px] text-ink-400 line-clamp-1 italic">
            &quot;{profile.motto || 'Aspiring adventurer forging their destiny'}&quot;
          </p>
        </div>
      </div>

      {/* XP Level Progression */}
      <div className="space-y-1.5 bg-ink-900/60 p-3 rounded-2xl border border-white/5">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-ink-300 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Level {profile.level}
          </span>
          <span className="text-amber-400 tabular-nums font-mono text-[11px]">
            {profile.xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP ({Math.round(xpPercent)}%)
          </span>
        </div>
        <div className="h-2 bg-ink-950 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-ink-850/70 rounded-2xl p-2.5 text-center border border-white/10 shadow-ios-sm">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-ink-400 uppercase">Gold</span>
          </div>
          <p className="text-sm font-black text-amber-400 tabular-nums">{profile.gold}</p>
        </div>

        <div className="bg-ink-850/70 rounded-2xl p-2.5 text-center border border-white/10 shadow-ios-sm">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Flame className="w-3.5 h-3.5 text-flame-400" />
            <span className="text-[10px] font-bold text-ink-400 uppercase">Streak</span>
          </div>
          <p className="text-sm font-black text-flame-400 tabular-nums">{profile.streak}d</p>
        </div>

        <div className="bg-ink-850/70 rounded-2xl p-2.5 text-center border border-white/10 shadow-ios-sm">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Trophy className="w-3.5 h-3.5 text-azure-400" />
            <span className="text-[10px] font-bold text-ink-400 uppercase">Best</span>
          </div>
          <p className="text-sm font-black text-azure-400 tabular-nums">{profile.longest_streak}d</p>
        </div>
      </div>

      {/* Link to Full Hero Sheet & Radar */}
      <button
        type="button"
        onClick={() => {
          soundManager.playClick();
          onOpenHeroSheet();
        }}
        className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all group"
      >
        <span>View Full Hero Sheet & Radar</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}
