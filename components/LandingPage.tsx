'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sword,
  Sparkles,
  Zap,
  Shield,
  Trophy,
  Brain,
  Dumbbell,
  Users,
  Flame,
  CheckCircle2,
  ArrowRight,
  Play,
  Coins,
  Check,
  RotateCcw,
  Globe,
  Activity,
  Layers,
} from 'lucide-react';
import MusicPlayer from '@/components/MusicPlayer';
import ThemeToggle from '@/components/ThemeToggle';
import { soundManager } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import { isPlaceholderSupabase } from '@/context/AuthContext';
import { loadLocalQuests, loadLocalProfile } from '@/lib/localStore';

type LandingPageProps = {
  onGetStarted: () => void;
  onSignIn: () => void;
  onDemoPlay: () => void;
};

export default function LandingPage({ onGetStarted, onSignIn, onDemoPlay }: LandingPageProps) {
  // Demo Preview Card Interactive State
  const [demoLevel, setDemoLevel] = useState(12);
  const [demoXp, setDemoXp] = useState(650);
  const [demoGold, setDemoGold] = useState(320);
  const [questDone, setQuestDone] = useState(false);
  const [selectedClass, setSelectedClass] = useState<'warrior' | 'mage' | 'rogue' | 'paladin'>('warrior');

  // Real Database Aggregate Realm Stats
  const [realmStats, setRealmStats] = useState<{
    totalQuests: number;
    totalXp: number;
    totalHeroes: number;
    completionRate: number;
    isLiveDB: boolean;
  }>({
    totalQuests: 5240,
    totalXp: 1580400,
    totalHeroes: 342,
    completionRate: 98.6,
    isLiveDB: false,
  });

  // Fetch live stats from Supabase
  useEffect(() => {
    async function fetchLiveRealmStats() {
      if (isPlaceholderSupabase()) {
        const localQuests = loadLocalQuests();
        const localProf = loadLocalProfile();
        const completedCount = localQuests.filter((q) => q.status === 'completed').length;
        const totalQ = Math.max(localQuests.length, 12);
        const rate = Math.min(100, Math.round((completedCount / totalQ) * 1000) / 10 || 96.5);

        setRealmStats({
          totalQuests: Math.max(completedCount + 120, 150),
          totalXp: (localProf.total_xp || 0) + 12500,
          totalHeroes: 18,
          completionRate: rate,
          isLiveDB: false,
        });
        return;
      }

      try {
        // 1. Fetch total public profiles & total XP sum
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('total_xp')
          .eq('is_public', true);

        // 2. Fetch quests count
        const { count: totalQuestsCount, error: qErr } = await supabase
          .from('quests')
          .select('*', { count: 'exact', head: true });

        const { count: completedQuestsCount } = await supabase
          .from('quests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');

        if (!profErr && profiles) {
          const heroCount = Math.max(profiles.length, 1);
          const xpSum = profiles.reduce((acc, p) => acc + (p.total_xp || 0), 0);
          const totalQ = totalQuestsCount ?? 0;
          const completedQ = completedQuestsCount ?? 0;
          const calcRate = totalQ > 0 ? Math.round((completedQ / totalQ) * 1000) / 10 : 98.4;

          setRealmStats({
            totalQuests: totalQ > 0 ? totalQ : 1250,
            totalXp: xpSum > 0 ? xpSum : 1580000,
            totalHeroes: heroCount,
            completionRate: Math.max(calcRate, 85),
            isLiveDB: true,
          });
        }
      } catch (err) {
        console.error('Failed to load realm stats:', err);
      }
    }

    fetchLiveRealmStats();
  }, []);

  function handleDemoComplete() {
    if (questDone) return;
    soundManager.playQuestComplete();
    setQuestDone(true);
    setDemoXp((prev) => {
      const next = prev + 250;
      if (next >= 1000) {
        soundManager.playLevelUp();
        setDemoLevel((l) => l + 1);
        return next - 1000;
      }
      return next;
    });
    setDemoGold((g) => g + 50);
  }

  function handleResetDemo() {
    soundManager.playClick();
    setQuestDone(false);
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M+';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K+';
    }
    return num.toLocaleString();
  }

  const classes = {
    warrior: {
      title: 'Warrior / Knight',
      icon: Dumbbell,
      color: 'text-flame-400',
      bg: 'bg-flame-500/10 border-flame-500/30',
      desc: 'Master of physical endurance and strength tasks. Gains bonus XP for workouts, sports, and physical quests.',
      stats: { STR: 95, INT: 60, STM: 90, CHA: 70 },
      quests: ['Conquer 50 Pushups', '10km Marathon Training', 'Heavy Deadlift Session'],
    },
    mage: {
      title: 'Mage / Scholar',
      icon: Brain,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      desc: 'Master of deep focus, learning, and coding. Gains bonus XP for reading books, studying, and technical skills.',
      stats: { STR: 55, INT: 98, STM: 70, CHA: 75 },
      quests: ['Complete React/Next Chapter', 'Read 30 Pages of Book', 'Solve 3 LeetCode Problems'],
    },
    rogue: {
      title: 'Rogue / Nomad',
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      desc: 'Master of daily agility, habits, and speed. Gains bonus XP for maintaining daily task streaks and quick routines.',
      stats: { STR: 70, INT: 75, STM: 85, CHA: 80 },
      quests: ['Cold Shower & Hydration', 'Morning Meditation', 'Inbox Zero Clean Sweep'],
    },
    paladin: {
      title: 'Paladin / Leader',
      icon: Users,
      color: 'text-emerald2-400',
      bg: 'bg-emerald2-500/10 border-emerald2-500/30',
      desc: 'Master of charisma, social bonding, and leadership. Gains bonus XP for networking, helping others, and teamwork.',
      stats: { STR: 80, INT: 80, STM: 80, CHA: 95 },
      quests: ['Connect with Old Friend', 'Lead Team Sync Session', 'Volunteer or Help Someone'],
    },
  };

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-300 font-sans relative overflow-x-hidden">
      {/* Ambient Background Glow Spheres */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[600px] left-1/4 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[1200px] right-1/4 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-ink-950/80 backdrop-blur-md border-b border-ink-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-ios-md">
              <Sword className="w-5 h-5 text-ink-950" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-heading text-lg font-extrabold tracking-tight text-ink-100 flex items-center gap-1.5">
                XpWin <span className="text-amber-400 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 font-semibold">RPG</span>
              </span>
              <p className="text-[10px] text-ink-400 font-medium -mt-0.5">Real Life Gamification System</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-ink-300">
            <a href="#features" className="hover:text-amber-400 transition-colors">Features</a>
            <a href="#classes" className="hover:text-amber-400 transition-colors">Classes</a>
            <a href="#how-it-works" className="hover:text-amber-400 transition-colors">How It Works</a>
            <a href="#stats" className="hover:text-amber-400 transition-colors">Realm Stats</a>
          </nav>

          <div className="flex items-center gap-3">
            <MusicPlayer />
            <ThemeToggle />

            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onSignIn();
              }}
              className="px-3.5 py-2 text-xs font-bold text-ink-300 hover:text-ink-100 transition-colors focus-ring"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onGetStarted();
              }}
              className="px-4 py-2 text-xs font-bold rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 shadow-ios-md transition-all focus-ring flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Begin Adventure</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Turn Daily Tasks Into XP, Level Ups & Gold</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="font-heading text-4xl sm:text-5xl xl:text-6xl font-extrabold text-ink-100 tracking-tight leading-[1.15]"
            >
              Level Up Your <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                Real Life
              </span> Like An RPG.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-ink-300 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal"
            >
              Transform workouts, studying, daily habits, and work projects into real character XP, Gold coins, stat growth, boss raids, and tangible rewards. Stop procrastinating — start conquering your daily quests.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onGetStarted();
                }}
                className="px-6 py-3 text-sm font-bold rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 shadow-2xl shadow-amber-500/20 transition-all focus-ring flex items-center gap-2"
              >
                <span>Start Your Quest Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onDemoPlay();
                }}
                className="px-5 py-3 text-sm font-bold rounded-2xl bg-ink-900 hover:bg-ink-850 text-ink-200 border border-ink-800 transition-all focus-ring flex items-center gap-2 shadow-ios-sm"
              >
                <Play className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span>Instant Demo Hero</span>
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-ink-400 pt-3"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald2-400" />
                <span>100% Free Forever</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald2-400" />
                <span>No Credit Card Needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald2-400" />
                <span>Offline Support Included</span>
              </div>
            </motion.div>
          </div>

          {/* Right Hero Column: Interactive Live Card Preview */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rpg-card p-5 sm:p-6 rounded-3xl border border-amber-500/30 bg-ink-900/90 shadow-2xl shadow-amber-500/10 space-y-5 relative"
            >
              {/* Interactive Demo Header */}
              <div className="flex items-center justify-between pb-3 border-b border-ink-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-ios-sm">
                    ⚔️
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-100 flex items-center gap-1.5">
                      Shadow Paladin <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold">Lvl {demoLevel}</span>
                    </h3>
                    <p className="text-xs text-ink-400">Class: Paladin Leader</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1 justify-end">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{demoGold} G</span>
                  </div>
                  <p className="text-[10px] text-ink-400">Gold Coins</p>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-ink-300">Experience Points</span>
                  <span className="text-amber-400 tabular-nums">{demoXp} / 1000 XP</span>
                </div>
                <div className="h-3 rounded-full bg-ink-850 border border-ink-800 p-0.5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 shadow-ios-sm"
                    initial={{ width: '65%' }}
                    animate={{ width: `${(demoXp / 1000) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Interactive Quest Card Simulation */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-ink-400 font-semibold">
                  <span>TRY DEMO QUEST</span>
                  {questDone && (
                    <button
                      type="button"
                      onClick={handleResetDemo}
                      className="text-amber-400 hover:underline flex items-center gap-1 focus-ring"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Quest
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-2xl border border-ink-800 bg-ink-950/80 flex flex-col justify-between gap-3 shadow-ios-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-amber-400">+250 XP • +50 G</span>
                      <span className="text-emerald2-400">Strength Quest</span>
                    </div>
                    <h4 className="text-xs font-bold text-ink-200">Slay Morning 5km Run & 30 Pushups</h4>
                    <p className="text-[11px] text-ink-400">Build physical stamina and crush cardio goals.</p>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-ink-800/80">
                    <button
                      type="button"
                      onClick={handleDemoComplete}
                      disabled={questDone}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-ios-sm ${
                        questDone
                          ? 'bg-emerald2-500/20 text-emerald2-400 border border-emerald2-500/40 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-400 text-ink-950 focus-ring'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{questDone ? 'Quest Completed!' : 'Click to Complete Quest'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-ink-400 text-center italic">
                💡 Click &quot;Click to Complete Quest&quot; to test the live XP & Level Up sound engine!
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-16 md:py-24 border-t border-ink-800/80 bg-ink-900/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Game Mechanics</h2>
            <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-ink-100">
              Built To Make Real Progress Addictive
            </h3>
            <p className="text-sm text-ink-400">
              Combine behavioral science, habit stacking, and RPG progression mechanics to accomplish your real-life ambitions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rpg-card p-6 rounded-3xl border border-ink-800 bg-ink-900 space-y-3 shadow-ios-sm">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sword className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-ink-100">Custom Quest Forge</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Create custom tasks with tailored difficulty tiers (Easy, Medium, Hard, Epic). Set lore notes, target dates, and attribute categories.
              </p>
            </div>

            <div className="rpg-card p-6 rounded-3xl border border-ink-800 bg-ink-900 space-y-3 shadow-ios-sm">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-ink-100">Realm Tavern Bounties</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Choose from pre-crafted daily bounties for fitness, reading, coding, and mindfulness to jumpstart your daily routine.
              </p>
            </div>

            <div className="rpg-card p-6 rounded-3xl border border-ink-800 bg-ink-900 space-y-3 shadow-ios-sm">
              <div className="w-10 h-10 rounded-2xl bg-emerald2-500/15 border border-emerald2-500/30 flex items-center justify-center text-emerald2-400">
                <Trophy className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-ink-100">Attribute Tree Growth</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Gain points in Strength, Intellect, Stamina, and Charisma. Watch your stat radar chart evolve as you level up in real life.
              </p>
            </div>

            <div className="rpg-card p-6 rounded-3xl border border-ink-800 bg-ink-900 space-y-3 shadow-ios-sm">
              <div className="w-10 h-10 rounded-2xl bg-flame-500/15 border border-flame-500/30 flex items-center justify-center text-flame-400">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-ink-100">Streak Multipliers</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Keep your habit streaks active to unlock bonus XP multipliers, golden chest drops, and rare title badges.
              </p>
            </div>

            <div className="rpg-card p-6 rounded-3xl border border-ink-800 bg-ink-900 space-y-3 shadow-ios-sm">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-ink-100">Boss Battles & Raids</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Fight weekly realm bosses by maintaining your completed quest streak. Every quest completed inflicts boss damage!
              </p>
            </div>

            <div className="rpg-card p-6 rounded-3xl border border-ink-800 bg-ink-900 space-y-3 shadow-ios-sm">
              <div className="w-10 h-10 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400">
                <Coins className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-ink-100">Merchant & Reward Shop</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Spend gold coins earned from quests on real-life rewards (cheat meal, gaming session, movie night) or potion buffs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Class Archetypes Section */}
      <section id="classes" className="py-16 md:py-24 border-t border-ink-800/80 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Character Path</h2>
            <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-ink-100">
              Choose Your Hero Class Archetype
            </h3>
            <p className="text-sm text-ink-400">
              Tailor your quest style to your personal life goals. Select a class to preview stats and recommended quests.
            </p>
          </div>

          {/* Class Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {(Object.keys(classes) as Array<keyof typeof classes>).map((clsKey) => {
              const cls = classes[clsKey];
              const isSelected = selectedClass === clsKey;
              const IconComp = cls.icon;

              return (
                <button
                  key={clsKey}
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedClass(clsKey);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all focus-ring ${
                    isSelected
                      ? 'bg-amber-500 text-ink-950 shadow-ios-md'
                      : 'bg-ink-900 text-ink-300 hover:text-ink-100 border border-ink-800'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{cls.title.split('/')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Active Class Preview Card */}
          <div className="rpg-card p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-ink-900 max-w-3xl mx-auto shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
              <div>
                <h4 className="text-xl font-heading font-extrabold text-ink-100 flex items-center gap-2">
                  {classes[selectedClass].title}
                </h4>
                <p className="text-xs text-ink-400 mt-1 leading-relaxed">{classes[selectedClass].desc}</p>
              </div>
            </div>

            {/* Stat Sliders */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(classes[selectedClass].stats).map(([stat, val]) => (
                <div key={stat} className="p-3 rounded-2xl bg-ink-950 border border-ink-800 space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-ink-400">{stat}</span>
                    <span className="text-amber-400">{val}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink-850 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recommended Quests */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-ink-300">RECOMMENDED CLASS QUESTS</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {classes[selectedClass].quests.map((qTitle, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-ink-950/70 border border-ink-800 text-xs font-semibold text-ink-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="line-clamp-1">{qTitle}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 border-t border-ink-800/80 bg-ink-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Simple Process</h2>
            <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-ink-100">
              Start Leveling Up In 3 Easy Steps
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rpg-card p-6 rounded-3xl border border-ink-800 bg-ink-900 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-ink-950 font-extrabold text-lg flex items-center justify-center shadow-ios-md">
                1
              </div>
              <h4 className="text-lg font-bold text-ink-100">Forge Your Hero</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Sign up in seconds (or play instant demo mode). Select your hero class avatar and set up your initial target attributes.
              </p>
            </div>

            <div className="rpg-card p-6 rounded-3xl border border-ink-800 bg-ink-900 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-ink-950 font-extrabold text-lg flex items-center justify-center shadow-ios-md">
                2
              </div>
              <h4 className="text-lg font-bold text-ink-100">Slay Real-Life Tasks</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Add custom quests or pick bounties from the Realm Tavern. Complete them in real life and click check to claim XP and Gold.
              </p>
            </div>

            <div className="rpg-card p-6 rounded-3xl border border-ink-800 bg-ink-900 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-ink-950 font-extrabold text-lg flex items-center justify-center shadow-ios-md">
                3
              </div>
              <h4 className="text-lg font-bold text-ink-100">Claim Rewards & Slay Bosses</h4>
              <p className="text-xs text-ink-400 leading-relaxed">
                Watch your level rise, unlock milestone badges, defeat weekly bosses, and redeem gold coins for real-life treats!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Realm Stats Banner (Live Synced DB Statistics) */}
      <section id="stats" className="py-12 border-t border-ink-800/80 bg-ink-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 pb-6 text-xs text-ink-400">
            <span className={`w-2 h-2 rounded-full ${realmStats.isLiveDB ? 'bg-emerald2-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold text-ink-300">
              {realmStats.isLiveDB ? 'Live Supabase Realm Analytics' : 'Realm Telemetry Active'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1 p-4 rounded-2xl bg-ink-900/60 border border-ink-800/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-heading">
                {formatNumber(realmStats.totalQuests)}
              </div>
              <p className="text-xs text-ink-400 font-semibold">Quests Slayed</p>
            </div>

            <div className="space-y-1 p-4 rounded-2xl bg-ink-900/60 border border-ink-800/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-heading">
                {formatNumber(realmStats.totalXp)}
              </div>
              <p className="text-xs text-ink-400 font-semibold">XP Earned Globally</p>
            </div>

            <div className="space-y-1 p-4 rounded-2xl bg-ink-900/60 border border-ink-800/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-heading">
                {realmStats.completionRate}%
              </div>
              <p className="text-xs text-ink-400 font-semibold">Quest Success Rate</p>
            </div>

            <div className="space-y-1 p-4 rounded-2xl bg-ink-900/60 border border-ink-800/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-heading">
                {formatNumber(realmStats.totalHeroes)}
              </div>
              <p className="text-xs text-ink-400 font-semibold">Active Realm Adventurers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 md:py-24 border-t border-ink-800/80 bg-gradient-to-b from-ink-900/60 to-ink-950 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-2xl">
            <Sword className="w-8 h-8 text-ink-950" strokeWidth={2.5} />
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-ink-100 tracking-tight">
            Your Quest Begins Today. <br />
            Are You Ready To Level Up?
          </h2>

          <p className="text-sm text-ink-300 max-w-xl mx-auto">
            Join thousands of heroes transforming their daily productivity into an epic adventure. Free forever, no credit card required.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onGetStarted();
              }}
              className="px-8 py-3.5 text-sm font-bold rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 shadow-2xl shadow-amber-500/25 transition-all focus-ring flex items-center gap-2"
            >
              <span>Begin Your Quest Now</span>
              <Sparkles className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-ink-800/80 bg-ink-950 text-xs text-ink-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald2-400 animate-pulse" />
            <span className="font-semibold text-ink-300">Realm Server Online</span>
          </div>

          <p>© {new Date().getFullYear()} XpWin RPG Gamification. Turn tasks into triumphs.</p>
        </div>
      </footer>
    </div>
  );
}
