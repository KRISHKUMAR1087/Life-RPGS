'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Star,
  Coins,
  Flame,
  History,
  Award,
  Search,
  SlidersHorizontal,
  X,
  TrendingUp,
  Zap,
  Info,
  ChevronDown,
  Target,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import {
  CATEGORIES,
  DIFFICULTIES,
  getCategory,
  getDifficulty,
  xpForLevel,
  type CategoryConfig,
} from '@/lib/rpg';
import type { Quest, Profile } from '@/lib/supabase';

type ActivityTimelineProps = {
  quests: Quest[];
  profile: Profile;
  customCategories?: CategoryConfig[];
};

export default function ActivityTimeline({
  quests,
  profile,
  customCategories = [],
}: ActivityTimelineProps) {
  const allCategories = useMemo(
    () => [...CATEGORIES, ...customCategories],
    [customCategories]
  );

  // Filter States with localStorage persistence
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStreakRules, setShowStreakRules] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('life_rpg_chronicles_filter');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.categoryFilter) setCategoryFilter(parsed.categoryFilter);
          if (parsed.difficultyFilter) setDifficultyFilter(parsed.difficultyFilter);
          if (parsed.dateRangeFilter) setDateRangeFilter(parsed.dateRangeFilter);
        }
      } catch (err) {
        console.error('Failed to load saved chronicles filter:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'life_rpg_chronicles_filter',
          JSON.stringify({ categoryFilter, difficultyFilter, dateRangeFilter })
        );
      } catch (err) {
        console.error('Failed to save chronicles filter:', err);
      }
    }
  }, [categoryFilter, difficultyFilter, dateRangeFilter]);

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

  // Compute Stats Summary Analytics
  const statsSummary = useMemo(() => {
    const totalCompleted = completedQuests.length;
    const totalQuests = quests.length;
    const completionRate = totalQuests > 0 ? Math.round((totalCompleted / totalQuests) * 100) : 0;

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const thisWeekQuests = completedQuests.filter((q) => {
      const qDate = new Date(q.completed_at || q.created_at);
      return qDate >= sevenDaysAgo;
    });

    const lastWeekQuests = completedQuests.filter((q) => {
      const qDate = new Date(q.completed_at || q.created_at);
      return qDate >= fourteenDaysAgo && qDate < sevenDaysAgo;
    });

    const thisWeekCount = thisWeekQuests.length;
    const lastWeekCount = lastWeekQuests.length;
    const weekDelta = thisWeekCount - lastWeekCount;

    // Most trained attribute/category
    const catCounts: Record<string, number> = {};
    completedQuests.forEach((q) => {
      catCounts[q.category] = (catCounts[q.category] || 0) + 1;
    });

    let topCatKey = 'strength';
    let topCatCount = 0;
    Object.entries(catCounts).forEach(([catKey, count]) => {
      if (count > topCatCount) {
        topCatCount = count;
        topCatKey = catKey;
      }
    });

    const topCategory = getCategory(topCatKey);

    // Current pace & level projection
    const last7DaysXp = thisWeekQuests.reduce(
      (sum, q) => sum + getDifficulty(q.difficulty).xp,
      0
    );
    const avgXpPerDay = Math.round(last7DaysXp / 7);
    const xpNeededForNext = xpForLevel(profile.level) - profile.xp;
    const daysToNextLevel =
      avgXpPerDay > 0 ? Math.ceil(xpNeededForNext / avgXpPerDay) : null;

    return {
      totalCompleted,
      completionRate,
      thisWeekCount,
      weekDelta,
      topCategory,
      topCatCount,
      avgXpPerDay,
      daysToNextLevel,
    };
  }, [completedQuests, quests, profile]);

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

  const todayActivity = weeklyActivity.find((w) => w.isToday);
  const isStreakAtRisk = (todayActivity?.count ?? 0) === 0 && profile.streak > 0;

  // Filter Completed History
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
      } else if (dateRangeFilter === 'custom') {
        if (startDate && qDateStr < startDate) return false;
        if (endDate && qDateStr > endDate) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesDesc = (q.description || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [
    completedQuests,
    categoryFilter,
    difficultyFilter,
    dateRangeFilter,
    startDate,
    endDate,
    searchQuery,
  ]);

  const isFilterActive =
    categoryFilter !== 'all' ||
    difficultyFilter !== 'all' ||
    dateRangeFilter !== 'all' ||
    searchQuery.trim() !== '';

  function resetFilters() {
    setSearchQuery('');
    setCategoryFilter('all');
    setDifficultyFilter('all');
    setDateRangeFilter('all');
    setStartDate('');
    setEndDate('');
  }

  return (
    <div className="rpg-card p-5 sm:p-6 shadow-ios-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-azure-500/10 border border-azure-500/30 flex items-center justify-center shadow-ios-sm">
            <History className="w-5 h-5 text-azure-500" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-ink-200">Chronicles of Valor</h2>
            <p className="text-xs text-ink-400 font-medium">Historical logs, streak journey & analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowStreakRules(!showStreakRules)}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-ink-200 bg-ink-850 border border-ink-800 rounded-xl px-2.5 py-1.5 focus-ring"
            aria-label="Toggle streak calculation rules explanation"
          >
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden xs:inline">Streak Info</span>
          </button>

          <div
            className={`flex items-center gap-1.5 border rounded-2xl px-3 py-1.5 shadow-ios-sm ${
              isStreakAtRisk
                ? 'bg-flame-500/20 border-flame-500/50 animate-glow-pulse'
                : 'bg-flame-500/10 border-flame-500/30'
            }`}
          >
            <Flame className="w-4 h-4 text-flame-500" />
            <span className="text-xs font-bold text-flame-500 tabular-nums">
              {profile.streak} Day Streak
            </span>
          </div>
        </div>
      </div>

      {/* Streak-at-Risk Alert Banner */}
      {isStreakAtRisk && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-flame-500/15 border border-flame-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-flame-400 flex-shrink-0 animate-bounce" />
            <div>
              <p className="font-bold text-flame-300">Streak at Risk!</p>
              <p className="text-ink-300 font-medium">
                You haven&apos;t completed any quests today. Complete 1 quest before midnight to keep your {profile.streak}-day streak alive!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Streak Rules Explanation Accordion */}
      <AnimatePresence>
        {showStreakRules && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-ink-850 rounded-2xl p-4 border border-amber-500/30 text-xs text-ink-300 space-y-2"
          >
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> How Streaks Work in Life RPG
              </span>
              <button
                type="button"
                onClick={() => setShowStreakRules(false)}
                className="text-ink-400 hover:text-ink-200 focus-ring"
                aria-label="Close streak rules information"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="list-disc list-inside space-y-1 text-ink-400 font-medium leading-relaxed">
              <li>
                <strong className="text-ink-200">Incrementing:</strong> Complete at least 1 quest each day to extend your daily streak count.
              </li>
              <li>
                <strong className="text-ink-200">Resetting:</strong> If a full 24-hour day passes without completing a quest, your current streak resets back to 0.
              </li>
              <li>
                <strong className="text-ink-200">Longest Streak:</strong> Your historical peak streak ({profile.longest_streak} days) is preserved forever in your Hero Record.
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Computed Stats Summary Panel */}
      <div className="bg-ink-850/80 rounded-2xl p-4 border border-ink-800 space-y-3">
        <div className="flex items-center justify-between border-b border-ink-800 pb-2">
          <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" /> Realm Performance Analytics
          </h3>
          <span className="text-[11px] font-semibold text-azure-400 tabular-nums">
            {statsSummary.completionRate}% Completion Rate
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Quests */}
          <div className="bg-ink-900/70 p-3 rounded-xl border border-ink-800/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-ink-400">Total Completed</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-ink-200 tabular-nums">
                {statsSummary.totalCompleted}
              </span>
              <span className="text-[10px] text-ink-500 font-medium">quests</span>
            </div>
          </div>

          {/* This Week */}
          <div className="bg-ink-900/70 p-3 rounded-xl border border-ink-800/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-ink-400">This Week</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-emerald2-400 tabular-nums">
                {statsSummary.thisWeekCount}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  statsSummary.weekDelta >= 0
                    ? 'bg-emerald2-500/20 text-emerald2-400'
                    : 'bg-flame-500/20 text-flame-400'
                }`}
              >
                {statsSummary.weekDelta >= 0 ? `+${statsSummary.weekDelta}` : statsSummary.weekDelta} vs last wk
              </span>
            </div>
          </div>

          {/* Top Attribute */}
          <div className="bg-ink-900/70 p-3 rounded-xl border border-ink-800/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-ink-400">Most Trained Domain</span>
            <div className="mt-1 flex items-center gap-1.5">
              {(() => {
                const Icon = statsSummary.topCategory.icon;
                return <Icon className="w-4 h-4" style={{ color: statsSummary.topCategory.color }} />;
              })()}
              <span className="text-sm font-extrabold text-ink-200 truncate">
                {statsSummary.topCategory.label}
              </span>
            </div>
          </div>

          {/* Pace & Level Projection */}
          <div className="bg-ink-900/70 p-3 rounded-xl border border-ink-800/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-ink-400">Current Pace</span>
            <div className="mt-1">
              <p className="text-xs font-bold text-azure-400 tabular-nums">
                ~{statsSummary.avgXpPerDay} XP / day
              </p>
              <p className="text-[10px] text-ink-400 font-medium">
                {statsSummary.daysToNextLevel
                  ? `Level ${profile.level + 1} in ~${statsSummary.daysToNextLevel} days`
                  : 'Level up ready!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Activity Grid */}
      <div className="bg-ink-850 rounded-2xl p-4 border border-ink-800">
        <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-azure-400" /> 7-Day Realm Activity
        </h3>

        <div className="grid grid-cols-7 gap-2">
          {weeklyActivity.map((item) => (
            <div
              key={item.dateStr}
              className={`rounded-xl p-2.5 text-center flex flex-col items-center justify-between border transition-all ${
                item.isToday
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-ink-800 bg-ink-900/60'
              }`}
            >
              <span className="text-[10px] font-semibold text-ink-400 uppercase">{item.day}</span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center my-1 font-extrabold text-xs transition-colors ${
                  item.count > 0
                    ? 'bg-gradient-to-br from-emerald2-500 to-emerald2-600 text-ink-950 shadow-ios-sm'
                    : 'bg-ink-800 text-ink-500'
                }`}
              >
                {item.count > 0 ? item.count : '0'}
              </div>
              <span className="text-[9px] text-ink-500 font-medium">
                {item.count === 1 ? 'quest' : 'quests'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar for Chronicles */}
      <div className="bg-ink-850 p-4 rounded-2xl border border-ink-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by title..."
              className="input-field pl-10 text-xs focus-ring"
              aria-label="Search quest history"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200 focus-ring"
                aria-label="Clear search text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <div className="flex-1 sm:flex-initial min-w-[130px]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field py-2 text-xs font-medium focus-ring cursor-pointer"
                aria-label="Filter history by category"
              >
                <option value="all">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Select */}
            <div className="flex-1 sm:flex-initial min-w-[130px]">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="input-field py-2 text-xs font-medium focus-ring cursor-pointer"
                aria-label="Filter history by difficulty"
              >
                <option value="all">All Difficulties</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Select */}
            <div className="flex-1 sm:flex-initial min-w-[120px]">
              <select
                value={dateRangeFilter}
                onChange={(e) =>
                  setDateRangeFilter(e.target.value as 'all' | 'today' | '7days' | '30days' | 'custom')
                }
                className="input-field py-2 text-xs font-medium focus-ring cursor-pointer"
                aria-label="Filter history by date range"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>

            {isFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="btn-ghost py-2 px-3 text-xs flex items-center gap-1 hover:text-flame-400 focus-ring"
                aria-label="Clear all history filters"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Picker inputs */}
        {dateRangeFilter === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-3 pt-2 border-t border-ink-800 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="text-ink-400 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field py-1 px-2.5 text-xs focus-ring"
                aria-label="Start date filter"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ink-400 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field py-1 px-2.5 text-xs focus-ring"
                aria-label="End date filter"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Chronological List of Completed Quests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" /> Completed Quests History ({filteredCompletedQuests.length})
          </h3>
          {isFilterActive && (
            <span className="text-[11px] text-amber-400 font-semibold">
              Filtered from {completedQuests.length} total
            </span>
          )}
        </div>

        {filteredCompletedQuests.length === 0 ? (
          <div className="text-center py-10 bg-ink-850/50 rounded-2xl border border-ink-800">
            <CheckCircle2 className="w-10 h-10 text-ink-600 mx-auto mb-2" />
            {completedQuests.length === 0 ? (
              <>
                <p className="text-sm font-semibold text-ink-300">No quests recorded in your chronicle yet.</p>
                <p className="text-xs text-ink-500 mt-1 font-medium">
                  Complete active quests on the Quest Board to forge your history!
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-ink-300">No completed quests match your current filters.</p>
                <p className="text-xs text-ink-500 mt-1 font-medium mb-3">
                  Try broadening your search keywords or clearing date/category filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-ghost py-1.5 px-4 text-xs inline-flex items-center gap-1 focus-ring"
                >
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredCompletedQuests.map((quest) => {
              const category = getCategory(quest.category);
              const difficulty = getDifficulty(quest.difficulty);
              const Icon = category.icon;
              const dateDisplay = new Date(quest.completed_at || quest.created_at).toLocaleDateString(
                undefined,
                { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
              );

              return (
                <div
                  key={quest.id}
                  className="bg-ink-850 rounded-2xl p-3.5 border border-ink-800 flex items-center justify-between gap-3 shadow-ios-sm hover:border-ink-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-ink-900 border border-ink-800"
                    >
                      <Icon className="w-5 h-5" style={{ color: category.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-ink-200 truncate">{quest.title}</h4>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${difficulty.badge}`}>
                          {difficulty.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-400 font-medium">{dateDisplay}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs font-extrabold text-azure-400">
                      <Star className="w-3 h-3 text-azure-400" /> +{difficulty.xp} XP
                    </span>
                    <span className="flex items-center gap-1 text-xs font-extrabold text-amber-500">
                      <Coins className="w-3 h-3 text-amber-500" /> +{difficulty.gold} G
                    </span>
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
