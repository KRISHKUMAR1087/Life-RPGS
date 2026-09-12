'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Zap,
  Sparkles,
  Award,
  Shield,
  Star,
  User,
  CheckCircle2,
  TrendingUp,
  Layers,
} from 'lucide-react';
import type { Profile, Quest } from '@/lib/supabase';
import {
  CATEGORIES,
  calculateCategoryLevel,
  getRankTitle,
  getDifficulty,
  formatUsername,
  getCountry,
  type CategoryConfig,
} from '@/lib/rpg';
import { getDemoCompetitors, type RealmCompetitor } from '@/lib/localStore';

type LeaderboardProps = {
  profile: Profile;
  quests: Quest[];
};

export default function Leaderboard({ profile, quests }: LeaderboardProps) {
  // Mode tab: 'global' | 'category'
  const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'category'>('global');
  // Domain category filter key (restricted to Platform Categories only as per requirements)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('strength');
  // Dynamic Realm Competitors state loaded from storage
  const [realmCompetitors, setRealmCompetitors] = useState<RealmCompetitor[]>([]);

  useEffect(() => {
    setRealmCompetitors(getDemoCompetitors());
  }, []);

  // Compute User's completed XP per platform category
  const userCategoryXps = useMemo(() => {
    const xpMap: Record<string, number> = {};
    // Initialize platform categories
    CATEGORIES.forEach((cat) => {
      xpMap[cat.key] = 0;
    });

    quests.forEach((q) => {
      if (q.status === 'completed' && q.category) {
        const questXp = getDifficulty(q.difficulty).xp;
        xpMap[q.category] = (xpMap[q.category] || 0) + (questXp || 0);
      }
    });

    return xpMap;
  }, [quests]);

  // Selected Category Config object
  const activeCategoryConfig = useMemo(() => {
    return CATEGORIES.find((c) => c.key === selectedCategoryKey) || CATEGORIES[0];
  }, [selectedCategoryKey]);

  // Combined Global Leaderboard Standings
  const globalStandings = useMemo(() => {
    const userEntry = {
      id: profile.id || 'user-current',
      username: profile.username ? formatUsername(profile.username) : 'You (Hero)',
      avatar: profile.avatar_url || '⚔️',
      country: profile.country || 'US',
      level: profile.level,
      xp: profile.xp,
      streak: profile.streak,
      title: getRankTitle(profile.level),
      isUser: true,
    };

    const competitors = realmCompetitors.map((hero, idx) => {
      const defaultCountries = ['US', 'IN', 'GB', 'CA', 'DE', 'JP', 'AU', 'FR'];
      return {
        id: hero.id,
        username: hero.username,
        avatar: hero.avatar,
        country: hero.country || defaultCountries[idx % defaultCountries.length],
        level: hero.baseLevel,
        xp: hero.baseXp,
        streak: hero.streak,
        title: getRankTitle(hero.baseLevel),
        isUser: false,
      };
    });

    const all = [userEntry, ...competitors];
    all.sort((a, b) => b.level - a.level || b.xp - a.xp);

    return all.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [profile, realmCompetitors]);

  // Combined Domain Leaderboard Standings (Platform Categories only)
  const domainStandings = useMemo(() => {
    const userDomainXp = userCategoryXps[selectedCategoryKey] || 0;
    const userCategoryInfo = calculateCategoryLevel(userDomainXp);

    const userEntry = {
      id: profile.id || 'user-current',
      username: profile.username ? formatUsername(profile.username) : 'You (Hero)',
      avatar: profile.avatar_url || '⚔️',
      country: profile.country || 'US',
      domainLevel: userCategoryInfo.level,
      domainXp: userDomainXp,
      domainTitle: userCategoryInfo.title,
      overallLevel: profile.level,
      streak: profile.streak,
      isUser: true,
    };

    const competitors = realmCompetitors.map((hero, idx) => {
      const defaultCountries = ['US', 'IN', 'GB', 'CA', 'DE', 'JP', 'AU', 'FR'];
      const xp = hero.categoryXps[selectedCategoryKey] || 0;
      const catInfo = calculateCategoryLevel(xp);
      return {
        id: hero.id,
        username: hero.username,
        avatar: hero.avatar,
        country: hero.country || defaultCountries[idx % defaultCountries.length],
        domainLevel: catInfo.level,
        domainXp: xp,
        domainTitle: catInfo.title,
        overallLevel: hero.baseLevel,
        streak: hero.streak,
        isUser: false,
      };
    });

    const all = [userEntry, ...competitors];
    all.sort((a, b) => b.domainLevel - a.domainLevel || b.domainXp - a.domainXp);

    return all.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [selectedCategoryKey, userCategoryXps, profile, realmCompetitors]);

  // Current User's Global & Domain Rank
  const currentUserGlobalRank = globalStandings.find((s) => s.isUser)?.rank || 1;
  const currentUserDomainRank = domainStandings.find((s) => s.isUser)?.rank || 1;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-ink-700/60 bg-gradient-to-r from-ink-900 via-ink-900/90 to-purple-950/40 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/30">
              <Trophy className="w-3.5 h-3.5" />
              Hall of Champions
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink-50 font-serif tracking-wide">
              Realm Standings & Domain Rankings
            </h1>
            <p className="text-sm text-ink-300 max-w-xl">
              Compare your heroic achievements across the realm. Rise through global standings or claim domain mastery in platform categories!
            </p>
          </div>

          {/* User Rank Callout Card */}
          <div className="flex items-center gap-4 bg-ink-800/80 backdrop-blur-md p-4 rounded-xl border border-ink-700/80 shadow-lg shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-ink-400 font-medium">Your Current Rank</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gold-300">
                  #{leaderboardTab === 'global' ? currentUserGlobalRank : currentUserDomainRank}
                </span>
                <span className="text-xs text-ink-300">
                  {leaderboardTab === 'global' ? 'Global Standings' : `${activeCategoryConfig.label} Domain`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Controls: Global vs Domain Leaderboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-700/60 pb-4">
        <div className="flex items-center gap-2 bg-ink-900/80 p-1.5 rounded-xl border border-ink-800 self-start">
          <button
            onClick={() => setLeaderboardTab('global')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              leaderboardTab === 'global'
                ? 'bg-gold-500 text-ink-950 font-bold shadow-md shadow-gold-500/20'
                : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Global Standings
          </button>
          <button
            onClick={() => setLeaderboardTab('category')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              leaderboardTab === 'category'
                ? 'bg-gold-500 text-ink-950 font-bold shadow-md shadow-gold-500/20'
                : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            Platform Domain Leaderboards
          </button>
        </div>

        {leaderboardTab === 'category' && (
          <div className="text-xs text-ink-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            Domain rankings are generated exclusively for Platform Categories
          </div>
        )}
      </div>

      {/* Platform Category Selector Pills (Only visible when Domain tab is active) */}
      {leaderboardTab === 'category' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <label className="text-xs font-semibold text-ink-400 uppercase tracking-wider block">
            Select Platform Category Domain:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-ink-700">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategoryKey === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategoryKey(cat.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
                    isSelected
                      ? 'border-gold-500/60 bg-gold-500/15 text-gold-300 shadow-sm'
                      : 'border-ink-800 bg-ink-900/60 text-ink-400 hover:border-ink-700 hover:text-ink-200'
                  }`}
                  style={{
                    borderColor: isSelected ? cat.color : undefined,
                    color: isSelected ? cat.color : undefined,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: cat.color }} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {leaderboardTab === 'global' ? (
          <>
            {/* Rank #2 Podium */}
            {globalStandings[1] && (
              <PodiumCard
                entry={globalStandings[1]}
                position="second"
                subtitle={`Lvl ${globalStandings[1].level} ${globalStandings[1].title}`}
                metric={`${globalStandings[1].xp.toLocaleString()} XP`}
              />
            )}
            {/* Rank #1 Podium */}
            {globalStandings[0] && (
              <PodiumCard
                entry={globalStandings[0]}
                position="first"
                subtitle={`Lvl ${globalStandings[0].level} ${globalStandings[0].title}`}
                metric={`${globalStandings[0].xp.toLocaleString()} XP`}
              />
            )}
            {/* Rank #3 Podium */}
            {globalStandings[2] && (
              <PodiumCard
                entry={globalStandings[2]}
                position="third"
                subtitle={`Lvl ${globalStandings[2].level} ${globalStandings[2].title}`}
                metric={`${globalStandings[2].xp.toLocaleString()} XP`}
              />
            )}
          </>
        ) : (
          <>
            {/* Rank #2 Podium Domain */}
            {domainStandings[1] && (
              <PodiumCard
                entry={domainStandings[1]}
                position="second"
                subtitle={`Lvl ${domainStandings[1].domainLevel} ${domainStandings[1].domainTitle}`}
                metric={`${domainStandings[1].domainXp.toLocaleString()} Domain XP`}
                categoryColor={activeCategoryConfig.color}
              />
            )}
            {/* Rank #1 Podium Domain */}
            {domainStandings[0] && (
              <PodiumCard
                entry={domainStandings[0]}
                position="first"
                subtitle={`Lvl ${domainStandings[0].domainLevel} ${domainStandings[0].domainTitle}`}
                metric={`${domainStandings[0].domainXp.toLocaleString()} Domain XP`}
                categoryColor={activeCategoryConfig.color}
              />
            )}
            {/* Rank #3 Podium Domain */}
            {domainStandings[2] && (
              <PodiumCard
                entry={domainStandings[2]}
                position="third"
                subtitle={`Lvl ${domainStandings[2].domainLevel} ${domainStandings[2].domainTitle}`}
                metric={`${domainStandings[2].domainXp.toLocaleString()} Domain XP`}
                categoryColor={activeCategoryConfig.color}
              />
            )}
          </>
        )}
      </div>

      {/* Complete Rankings List Table */}
      <div className="bg-ink-900/90 rounded-2xl border border-ink-800 overflow-hidden shadow-xl">
        <div className="p-4 md:p-5 border-b border-ink-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-gold-400" />
            <h2 className="text-base font-bold text-ink-100">
              {leaderboardTab === 'global'
                ? 'All Realm Hero Standings'
                : `${activeCategoryConfig.label} Domain Standings`}
            </h2>
          </div>
          <span className="text-xs text-ink-400 font-medium">
            {leaderboardTab === 'global' ? globalStandings.length : domainStandings.length} Competitors
          </span>
        </div>

        <div className="divide-y divide-ink-800/60">
          {leaderboardTab === 'global'
            ? globalStandings.map((hero) => (
                <div
                  key={hero.id}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    hero.isUser
                      ? 'bg-gold-500/10 hover:bg-gold-500/15 border-l-4 border-l-gold-500'
                      : 'hover:bg-ink-800/40'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <RankBadge rank={hero.rank} />
                    <div className="w-10 h-10 rounded-xl bg-ink-800 border border-ink-700 flex items-center justify-center text-xl shrink-0">
                      {hero.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getCountry(hero.country).flag}</span>
                        <span className="font-semibold text-ink-100 truncate">{hero.username}</span>
                        {hero.isUser && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-gold-500/20 text-gold-300 border border-gold-500/40">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink-400 truncate">
                        Lvl {hero.level} • {hero.title}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-flame-400 bg-flame-500/10 px-2.5 py-1 rounded-lg border border-flame-500/20">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{hero.streak}d streak</span>
                    </div>
                    <div className="text-sm font-bold text-gold-400">
                      {hero.xp.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-ink-400">XP</span>
                    </div>
                  </div>
                </div>
              ))
            : domainStandings.map((hero) => (
                <div
                  key={hero.id}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    hero.isUser
                      ? 'bg-gold-500/10 hover:bg-gold-500/15 border-l-4 border-l-gold-500'
                      : 'hover:bg-ink-800/40'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <RankBadge rank={hero.rank} />
                    <div className="w-10 h-10 rounded-xl bg-ink-800 border border-ink-700 flex items-center justify-center text-xl shrink-0">
                      {hero.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getCountry(hero.country).flag}</span>
                        <span className="font-semibold text-ink-100 truncate">{hero.username}</span>
                        {hero.isUser && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-gold-500/20 text-gold-300 border border-gold-500/40">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink-400 truncate">
                        Domain Lvl {hero.domainLevel} • {hero.domainTitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div className="text-sm font-bold" style={{ color: activeCategoryConfig.color }}>
                      {hero.domainXp.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-ink-400">Domain XP</span>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

// Podium component for top 3 positions
function PodiumCard({
  entry,
  position,
  subtitle,
  metric,
  categoryColor,
}: {
  entry: any;
  position: 'first' | 'second' | 'third';
  subtitle: string;
  metric: string;
  categoryColor?: string;
}) {
  const isFirst = position === 'first';
  const isSecond = position === 'second';

  const orderClass = isFirst ? 'order-1 md:order-2' : isSecond ? 'order-2 md:order-1' : 'order-3';
  const badgeColor = isFirst
    ? 'bg-gold-500/20 text-gold-300 border-gold-500/50'
    : isSecond
    ? 'bg-slate-400/20 text-slate-300 border-slate-400/50'
    : 'bg-amber-700/20 text-amber-400 border-amber-600/50';

  const Icon = isFirst ? Crown : Medal;

  return (
    <div
      className={`relative rounded-2xl p-5 border transition-all flex flex-col items-center text-center ${orderClass} ${
        entry.isUser
          ? 'bg-gold-500/10 border-gold-500/60 shadow-lg shadow-gold-500/10'
          : 'bg-ink-900/80 border-ink-800'
      } ${isFirst ? 'md:-translate-y-2 border-gold-500/40 shadow-xl' : ''}`}
    >
      <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 mb-3 ${badgeColor}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>Rank #{entry.rank}</span>
      </div>

      <div className="w-16 h-16 rounded-2xl bg-ink-800 border border-ink-700 flex items-center justify-center text-3xl mb-3 shadow-inner">
        {entry.avatar}
      </div>

      <div className="font-bold text-ink-100 text-base truncate max-w-full flex items-center gap-1.5">
        <span>{entry.username}</span>
        {entry.isUser && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-500 text-ink-950 font-extrabold">
            YOU
          </span>
        )}
      </div>

      <div className="text-xs text-ink-400 mt-0.5">{subtitle}</div>

      <div
        className="mt-3 text-sm font-extrabold"
        style={{ color: categoryColor || '#fbbf24' }}
      >
        {metric}
      </div>
    </div>
  );
}

// Simple rank number badge
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return (
    <span className="w-6 text-center text-sm font-bold text-ink-400 font-mono">
      #{rank}
    </span>
  );
}
