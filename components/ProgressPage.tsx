'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Star,
  Coins,
  Flame,
  Crown,
  CheckCircle2,
  Zap,
  Award,
  History,
  Search,
  SlidersHorizontal,
  X,
  Calendar,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { Profile, Quest } from '@/lib/supabase';
import {
  CATEGORIES,
  DIFFICULTIES,
  xpForLevel,
  getRankTitle,
  getCategory,
  getDifficulty,
  calculatePlatformRanks,
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
  const allCategories = useMemo(
    () => [...CATEGORIES, ...customCategories],
    [customCategories]
  );

  // Activity Timeline Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  const xpNeeded = xpForLevel(profile.level);
  const xpPercent = Math.min(100, (profile.xp / xpNeeded) * 100);
  const rankTitle = getRankTitle(profile.level);
  const nextRankTitle = getRankTitle(profile.level + 5);
  const platformRanks = useMemo(() => calculatePlatformRanks(profile), [profile]);

  const completedQuests = useMemo(
    () =>
      quests
        .filter((q) => q.status === 'completed')
        .sort(
          (a, b) =>
            new Date(b.completed_at || b.created_at).getTime() -
            new Date(a.completed_at || a.created_at).getTime()
        ),
    [quests]
  );

  const activeQuests = quests.filter((q) => q.status === 'active');
  const totalCompletionRate =
    quests.length > 0 ? Math.round((completedQuests.length / quests.length) * 100) : 0;

  // Generate 7-day activity map
  const weeklyActivity = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const map: Array<{ day: string; dateStr: string; count: number; isToday: boolean }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = completedQuests.filter((q) => {
        const qDate = (q.completed_at || q.created_at).split('T')[0];
        return qDate === dateStr;
      }).length;

      map.push({
        day: days[d.getDay()],
        dateStr,
        count,
        isToday: i === 0,
      });
    }
    return map;
  }, [completedQuests]);

  const maxDailyCount = Math.max(...weeklyActivity.map((w) => w.count), 1);

  // Filtered Completed Quests for Activity History
  const filteredCompletedQuests = useMemo(() => {
    return completedQuests.filter((q) => {
      if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;

      const qDateStr = (q.completed_at || q.created_at).split('T')[0];
      const qDate = new Date(q.completed_at || q.created_at);

      if (dateRangeFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (qDateStr !== todayStr) return false;
      } else if (dateRangeFilter === '7days') {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        if (qDate < d7) return false;
      } else if (dateRangeFilter === '30days') {
        const d30 = new Date();
        d30.setDate(d30.getDate() - 30);
        if (qDate < d30) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesDesc = (q.description || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [completedQuests, categoryFilter, difficultyFilter, dateRangeFilter, searchQuery]);

  // Calculate category-wise statistics
  const categoryStats = allCategories.map((cat) => {
    const catQuests = quests.filter((q) => q.category === cat.key);
    const catCompleted = catQuests.filter((q) => q.status === 'completed');
    const catActive = catQuests.filter((q) => q.status === 'active');

    const earnedXp = catCompleted.reduce(
      (sum, q) => sum + getDifficulty(q.difficulty).xp,
      0
    );

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
              <h2 className="font-heading text-xl font-bold text-ink-200">Hero Progress & Activity Chronicles</h2>
            </div>
            <p className="text-xs text-ink-400">
              Track your lifetime XP, level progression, category skill levels, and complete activity history log.
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

      {/* Platform & Category Ranks Card */}
      <div className="rpg-card p-6 sm:p-7 border border-amber-500/30 bg-ink-900 rounded-3xl shadow-ios-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink-100 flex items-center gap-2">
                Platform Leaderboard Ranks
              </h2>
              <p className="text-xs text-ink-400">Overall XP position and category-wise attribute standings</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-auto">
            <Trophy className="w-4 h-4" />
            <span>Overall Rank #{platformRanks.overallRank}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {CATEGORIES.map((cat) => {
            const catRankInfo = platformRanks.categoryRanks[cat.key] || { rank: 1, score: 0 };
            return (
              <div
                key={cat.key}
                className="bg-ink-950/70 p-3.5 rounded-2xl border border-ink-800 text-center space-y-1 shadow-ios-sm"
              >
                <div className={`text-xs font-bold ${cat.textColor} truncate`}>{cat.label}</div>
                <div className="text-lg font-extrabold text-amber-400 tabular-nums">Rank #{catRankInfo.rank}</div>
                <div className="text-[10px] text-ink-400 font-medium">{catRankInfo.score} pts</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-Day Activity & Streak Tracker Card */}
      <div className="rpg-card p-6 border border-ink-800 bg-ink-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-flame-400" />
            <h3 className="font-heading text-base font-bold text-ink-200">
              7-Day Activity & Streak Tracker
            </h3>
          </div>
          <span className="text-xs text-flame-400 font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> {profile.streak} Day Streak
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {weeklyActivity.map((w) => {
            const heightPercent = Math.max(15, (w.count / maxDailyCount) * 100);
            return (
              <div key={w.dateStr} className="flex flex-col items-center gap-2">
                <div className="w-full h-24 bg-ink-850 rounded-xl p-1 flex items-end justify-center border border-ink-800 relative">
                  <motion.div
                    className={`w-full rounded-lg transition-all ${
                      w.count > 0
                        ? w.isToday
                          ? 'bg-amber-500 shadow-ios-sm'
                          : 'bg-amber-500/60'
                        : 'bg-ink-800/40'
                    }`}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                  {w.count > 0 && (
                    <span className="absolute bottom-1.5 text-[10px] font-extrabold text-ink-950">
                      {w.count}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    w.isToday ? 'text-amber-400 font-extrabold' : 'text-ink-400'
                  }`}
                >
                  {w.day}
                </span>
              </div>
            );
          })}
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

      {/* Activity Timeline Chronicles & Completion History Log */}
      <div className="space-y-4 pt-4 border-t border-ink-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-heading text-base font-bold text-ink-200 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" /> Completed Quests Activity Log
          </h3>
          <span className="text-xs text-ink-400">
            {filteredCompletedQuests.length} Completed Logs
          </span>
        </div>

        {/* Activity Search & Filter Controls */}
        <div className="rpg-card p-4 border border-ink-800 bg-ink-900 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search completed activity log..."
                className="input-field pl-10 text-xs w-full focus-ring"
                aria-label="Search activity log"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200 focus-ring p-1 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Range Tabs */}
            <div className="flex p-1 bg-ink-850 rounded-xl border border-ink-800 w-full sm:w-auto self-stretch">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'today', label: 'Today' },
                  { id: '7days', label: '7 Days' },
                  { id: '30days', label: '30 Days' },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDateRangeFilter(d.id)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-ring ${
                    dateRangeFilter === d.id
                      ? 'bg-white dark:bg-ink-800 text-amber-500 shadow-ios-sm'
                      : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Tier Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-ink-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-ink-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">Filter:</span>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-ink-850 border border-ink-800 rounded-lg px-2.5 py-1 text-xs text-ink-300 focus-ring cursor-pointer min-w-[120px]"
              >
                <option value="all">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-ink-850 border border-ink-800 rounded-lg px-2.5 py-1 text-xs text-ink-300 focus-ring cursor-pointer min-w-[110px]"
              >
                <option value="all">All Tiers</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        {filteredCompletedQuests.length === 0 ? (
          <div className="rpg-card p-8 text-center border border-ink-800 bg-ink-900/60 space-y-2">
            <Sparkles className="w-8 h-8 text-ink-500 mx-auto" />
            <p className="text-xs font-semibold text-ink-400">No completed activity records found.</p>
            <p className="text-[11px] text-ink-500">Complete active quests to build your activity timeline log!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredCompletedQuests.map((quest) => {
                const catConfig = getCategory(quest.category, customCategories);
                const diffConfig = getDifficulty(quest.difficulty);
                const IconComp = catConfig.icon;
                const completedDate = new Date(quest.completed_at || quest.created_at).toLocaleDateString(
                  undefined,
                  { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                );

                return (
                  <motion.div
                    key={quest.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rpg-card p-4 border border-ink-800 bg-ink-900 hover:border-ink-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${catConfig.bgColor} border ${catConfig.borderColor}`}
                      >
                        <IconComp className={`w-4 h-4 ${catConfig.textColor}`} />
                      </div>

                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-bold text-ink-200 line-through">
                            {quest.title}
                          </h4>
                          <span className="text-xs font-semibold text-amber-400">
                            +{diffConfig.xp} XP • +{diffConfig.gold} G
                          </span>
                          <span className={`text-xs font-semibold ${catConfig.textColor}`}>
                            • {catConfig.label}
                          </span>
                        </div>

                        {quest.description && (
                          <p className="text-[11px] text-ink-400 line-clamp-1">{quest.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-semibold text-emerald2-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {completedDate}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
