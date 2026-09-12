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
    <div className="rpg-card p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ink-700 to-ink-800 border-2 border-gold-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.1)]">
            <span className="text-2xl font-heading font-bold text-gold-400">
              {profile.username.charAt(0).toUpperCase() || 'H'}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-gold-500 text-ink-900 text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-ink-900 shadow-lg">
            {profile.level}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-bold text-ink-200 truncate">
            {profile.username || 'Hero'}
          </h2>
          <p className="text-xs text-gold-400 font-medium">{rankTitle}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-300">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-gold-400" />
              {profile.total_xp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-ink-300">Experience</span>
          <span className="text-xs text-ink-400 tabular-nums">
            {profile.xp.toLocaleString()} / {xpNeeded.toLocaleString()}
          </span>
        </div>
        <div className="h-3 bg-ink-900 rounded-full overflow-hidden border border-ink-700 relative">
          <motion.div
            className="h-full bg-gradient-to-r from-gold-500 to-gold-300 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </motion.div>
        </div>
      </div>

      {/* Currency & Streak */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-ink-900/60 rounded-xl p-3 border border-ink-700 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Coins className="w-4 h-4 text-gold-400" />
            <span className="text-xs text-ink-300">Gold</span>
          </div>
          <p className="text-lg font-bold text-gold-400 tabular-nums">{profile.gold}</p>
        </div>
        <div className="bg-ink-900/60 rounded-xl p-3 border border-ink-700 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-flame-500" />
            <span className="text-xs text-ink-300">Streak</span>
          </div>
          <p className="text-lg font-bold text-flame-400 tabular-nums">{profile.streak}</p>
        </div>
        <div className="bg-ink-900/60 rounded-xl p-3 border border-ink-700 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy className="w-4 h-4 text-azure-400" />
            <span className="text-xs text-ink-300">Best</span>
          </div>
          <p className="text-lg font-bold text-azure-400 tabular-nums">{profile.longest_streak}</p>
        </div>
      </div>

      {/* Attributes */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-heading font-semibold text-ink-300 uppercase tracking-wider">
            Attributes
          </h3>
          <span className="text-xs text-ink-400">{totalAttributePoints} pts</span>
        </div>
        <div className="space-y-2.5">
          {attributes.map((attr) => {
            const Icon = attr.icon;
            const maxAttr = Math.max(...attributes.map((a) => a.value), 10);
            const attrPercent = (attr.value / maxAttr) * 100;
            return (
              <div key={attr.key} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${attr.bgColor} border ${attr.borderColor}`}
                >
                  <Icon className="w-4 h-4" style={{ color: attr.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-medium text-ink-200">{attr.label}</span>
                    <span className="text-xs text-ink-400 tabular-nums">{attr.value}</span>
                  </div>
                  <div className="h-1.5 bg-ink-900 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: attr.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${attrPercent}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
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
