'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Star,
  Coins,
  Flame,
  Trophy,
  Crown,
  CheckCircle2,
  Zap,
  Sparkles,
  Award,
} from 'lucide-react';
import type { Profile, Quest } from '@/lib/supabase';
import {
  CATEGORIES,
  xpForLevel,
  getRankTitle,
  getDifficulty,
  type CategoryConfig,
} from '@/lib/rpg';

type ProgressPageProps = {
  profile: Profile;
  quests: Quest[];
  customCategories?: CategoryConfig[];
};

export default function ProgressPage({
  profile,
  quests,
  customCategories = [],
}: ProgressPageProps) {
  const allCategories = [...CATEGORIES, ...customCategories];

  const xpNeeded = xpForLevel(profile.level);
  const xpPercent = Math.min(100, (profile.xp / xpNeeded) * 100);
  const rankTitle = getRankTitle(profile.level);
  const nextRankTitle = getRankTitle(profile.level + 5);

  const completedQuests = quests.filter((q) => q.status === 'completed');
  const activeQuests = quests.filter((q) => q.status === 'active');
  const totalCompletionRate =
    quests.length > 0 ? Math.round((completedQuests.length / quests.length) * 100) : 0;

  // Calculate category-wise statistics
  const categoryStats = allCategories.map((cat) => {
    const catQuests = quests.filter((q) => q.category === cat.key);
    const catCompleted = catQuests.filter((q) => q.status === 'completed');
    const catActive = catQuests.filter((q) => q.status === 'active');

    // Earned XP in this category
    const earnedXp = catCompleted.reduce(
      (sum, q) => sum + getDifficulty(q.difficulty).xp,
      0
    );

    // Attribute points or skill score
    const points =
      cat.key === 'strength'
        ? profile.strength
        : cat.key === 'intellect'
        ? profile.intellect
        : cat.key === 'vitality'
        ? profile.vitality
        : cat.key === 'charisma'
        ? profile.charisma
        : cat.key === 'dexterity'
        ? profile.dexterity
        : Math.floor(earnedXp / 100);

    // Calculate Category Skill Level (1 level per 5 attribute points or 250 XP)
    const skillLevel = Math.max(1, Math.floor(1 + points / 3));
    const completionPercent =
      catQuests.length > 0 ? Math.round((catCompleted.length / catQuests.length) * 100) : 0;

    return {
      category: cat,
      totalQuests: catQuests.length,
      activeQuests: catActive.length,
      completedQuests: catCompleted.length,
      earnedXp,
      points,
      skillLevel,
      completionPercent,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rpg-card p-6 border border-ink-800 bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 shadow-ios-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h2 className="font-heading text-xl font-bold text-ink-200">Overall Character Progress</h2>
            </div>
            <p className="text-xs text-ink-400">
              Track your lifetime XP, total Gold accumulated, and category skill progression levels.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-bold flex items-center gap-1.5">
              <Crown className="w-4 h-4" /> {rankTitle}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-azure-500/15 border border-azure-500/30 text-azure-400 text-xs font-bold">
              Level {profile.level}
            </span>
          </div>
        </div>
      </div>

      {/* Overall Progress Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Gold */}
        <div className="rpg-card p-5 border border-ink-800 bg-ink-900 shadow-ios-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Total Gold</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-500 tabular-nums">{profile.gold}</p>
          <p className="text-[11px] text-ink-500 mt-1 font-medium">Accumulated rewards currency</p>
        </div>

        {/* Total Lifetime XP */}
        <div className="rpg-card p-5 border border-ink-800 bg-ink-900 shadow-ios-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Lifetime XP</span>
            <div className="w-8 h-8 rounded-xl bg-azure-500/10 border border-azure-500/30 flex items-center justify-center text-azure-400">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-azure-400 tabular-nums">
            {profile.total_xp.toLocaleString()}
          </p>
          <p className="text-[11px] text-ink-500 mt-1 font-medium">Experience gained across all quests</p>
        </div>

        {/* Quest Completion Rate */}
        <div className="rpg-card p-5 border border-ink-800 bg-ink-900 shadow-ios-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Quests Done</span>
            <div className="w-8 h-8 rounded-xl bg-emerald2-500/10 border border-emerald2-500/30 flex items-center justify-center text-emerald2-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald2-400 tabular-nums">
            {completedQuests.length} <span className="text-xs text-ink-400 font-semibold">/ {quests.length}</span>
          </p>
          <p className="text-[11px] text-ink-500 mt-1 font-medium">{totalCompletionRate}% overall completion rate</p>
        </div>

        {/* Active Streak */}
        <div className="rpg-card p-5 border border-ink-800 bg-ink-900 shadow-ios-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Active Streak</span>
            <div className="w-8 h-8 rounded-xl bg-flame-500/10 border border-flame-500/30 flex items-center justify-center text-flame-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-flame-400 tabular-nums">
            {profile.streak} Days
          </p>
          <p className="text-[11px] text-ink-500 mt-1 font-medium">Best: {profile.longest_streak} Days record</p>
        </div>
      </div>

      {/* Main Level Progress Bar Card */}
      <div className="rpg-card p-6 border border-ink-800 bg-ink-900 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-heading text-base font-bold text-ink-200">
              Level {profile.level} Progression
            </h3>
          </div>
          <span className="text-xs text-ink-400 tabular-nums font-semibold">
            {profile.xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </span>
        </div>

        <div className="h-3 bg-ink-850 rounded-full overflow-hidden relative border border-ink-800">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer"
              style={{ backgroundSize: '200% 100%' }}
            />
          </motion.div>
        </div>

        <div className="flex justify-between items-center text-xs text-ink-400 font-medium pt-1">
          <span>Current Rank: <strong className="text-amber-500">{rankTitle}</strong></span>
          <span>Next Rank Unlock: <strong className="text-ink-200">{nextRankTitle}</strong></span>
        </div>
      </div>

      {/* Category-Wise Skill Progress & Levels */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-bold text-ink-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Category-Wise Skill Levels & Progress
          </h3>
          <span className="text-xs text-ink-400">{allCategories.length} Categories</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryStats.map(
            ({ category, totalQuests, activeQuests, completedQuests, earnedXp, points, skillLevel, completionPercent }) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.key}
                  className="rpg-card p-5 border border-ink-800 bg-ink-900 space-y-4 hover:border-ink-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl ${category.bgColor} ${category.borderColor} border flex items-center justify-center`}
                      >
                        <Icon className={`w-5 h-5 ${category.textColor}`} />
                      </div>
                      <div>
                        <h4 className="font-heading text-base font-bold text-ink-200 flex items-center gap-2">
                          {category.label}
                          {category.isCustom && (
                            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500">
                              Custom
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-ink-400 line-clamp-1">{category.description}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-ink-850 border border-ink-800 text-amber-500">
                        Skill Lvl {skillLevel}
                      </span>
                    </div>
                  </div>

                  {/* Category Progress Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-ink-850/50 border border-ink-800/80 text-center">
                    <div>
                      <p className="text-[10px] text-ink-400 uppercase font-semibold">Category XP</p>
                      <p className="text-sm font-extrabold text-azure-400">+{earnedXp}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-400 uppercase font-semibold">Skill Points</p>
                      <p className="text-sm font-extrabold text-amber-500">{points} pts</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-400 uppercase font-semibold">Done Quests</p>
                      <p className="text-sm font-extrabold text-emerald2-400">
                        {completedQuests} / {totalQuests}
                      </p>
                    </div>
                  </div>

                  {/* Category Completion Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-ink-400 font-medium">Category Quest Completion</span>
                      <span className="text-ink-300 font-bold">{completionPercent}%</span>
                    </div>
                    <div className="h-2 bg-ink-850 rounded-full overflow-hidden border border-ink-800">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: category.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercent}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
