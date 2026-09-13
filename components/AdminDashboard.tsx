'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Database,
  Users,
  Swords,
  Coins,
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Check,
  ArrowLeft,
  Flame,
  Activity,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import {
  loadLocalProfile,
  saveLocalProfile,
  loadLocalQuests,
  saveLocalQuests,
  SEED_SHOP_ITEMS,
} from '@/lib/localStore';
import type { Profile, Quest, ShopItem } from '@/lib/supabase';
import { evaluateQuestAI, type AIEvaluationResult } from '@/lib/gemini';
import { soundManager } from '@/lib/audio';
import MusicPlayer from '@/components/MusicPlayer';
import ThemeToggle from '@/components/ThemeToggle';

const ADMIN_PASSWORD = 'XpWinUnstop@4312';

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin tab navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'heroes' | 'ai_sandbox' | 'shop' | 'quests'>('overview');

  // Admin state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>(SEED_SHOP_ITEMS);
  const [globalMultiplier, setGlobalMultiplier] = useState<number>(1.0);
  const [bossHpOverride, setBossHpOverride] = useState<number>(500);

  // AI Sandbox state
  const [testTitle, setTestTitle] = useState('Build Next.js AI Feature');
  const [testCategory, setTestCategory] = useState('dexterity');
  const [testDesc, setTestDesc] = useState('Ship functional code in under 30 minutes.');
  const [testResult, setTestResult] = useState<AIEvaluationResult | null>(null);
  const [testingAI, setTestingAI] = useState(false);

  // Edit hero modal state
  const [heroGoldAdd, setHeroGoldAdd] = useState('100');
  const [heroXpAdd, setHeroXpAdd] = useState('200');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = sessionStorage.getItem('life_rpg_admin_auth') === 'true';
      if (isAuth) {
        setAuthenticated(true);
        loadAdminData();
      }
    }
  }, []);

  function loadAdminData() {
    setProfile(loadLocalProfile());
    setQuests(loadLocalQuests());
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem('life_rpg_admin_auth', 'true');
      setAuthError(null);
      loadAdminData();
      soundManager.playVictory();
    } else {
      setAuthError('Invalid Admin Access Key.');
      soundManager.playClick();
    }
  }

  function handleLogout() {
    setAuthenticated(false);
    sessionStorage.removeItem('life_rpg_admin_auth');
    soundManager.playClick();
  }

  function flashMessage(msg: string) {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  }

  function handleGrantGold() {
    if (!profile) return;
    const add = parseInt(heroGoldAdd, 10) || 0;
    const updated = { ...profile, gold: Math.max(0, profile.gold + add) };
    saveLocalProfile(updated);
    setProfile(updated);
    soundManager.playCoin();
    flashMessage(`Granted +${add} Gold to Hero!`);
  }

  function handleGrantXp() {
    if (!profile) return;
    const add = parseInt(heroXpAdd, 10) || 0;
    const updated = {
      ...profile,
      xp: profile.xp + add,
      total_xp: profile.total_xp + add,
    };
    saveLocalProfile(updated);
    setProfile(updated);
    soundManager.playQuestComplete();
    flashMessage(`Granted +${add} XP to Hero!`);
  }

  function handleResetStreak() {
    if (!profile) return;
    const updated = { ...profile, streak: 0 };
    saveLocalProfile(updated);
    setProfile(updated);
    soundManager.playClick();
    flashMessage('Hero daily streak reset to 0.');
  }

  function handleLevelUpDirect() {
    if (!profile) return;
    const updated = { ...profile, level: profile.level + 1 };
    saveLocalProfile(updated);
    setProfile(updated);
    soundManager.playLevelUp();
    flashMessage(`Promoted Hero to Level ${updated.level}!`);
  }

  async function handleRunAISandbox() {
    setTestingAI(true);
    soundManager.playClick();
    try {
      const res = await evaluateQuestAI(testTitle, testCategory, testDesc.slice(0, 75));
      setTestResult(res);
      soundManager.playEquip();
    } catch {
      flashMessage('AI Sandbox evaluation failed.');
    } finally {
      setTestingAI(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient background glowing orbs */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="absolute top-5 right-5 flex items-center gap-3 z-20">
          <MusicPlayer />
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-ios-lg text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.35)] text-ink-950">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl font-heading font-black text-ink-100">Realm Master Gate</h1>
              <p className="text-xs text-ink-400 mt-1 font-medium">
                Enter your administrative key to manage the LifeQuest RPG realm.
              </p>
            </div>

            {authError && (
              <div className="text-xs text-flame-400 bg-flame-500/10 border border-flame-500/20 p-2.5 rounded-xl font-bold">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Admin Password..."
                  className="input-field pl-10 text-sm"
                  autoFocus
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold rounded-xl shadow-ios-md">
                Authenticate & Unlock
              </button>
            </form>

            <div className="pt-2 border-t border-white/10">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-amber-300 font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Player Portal
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 p-4 sm:p-6 space-y-6 relative overflow-hidden">
      {/* Top ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-ink-850 border border-white/10 text-ink-400 hover:text-amber-300 transition-colors"
            title="Return to Main Game"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-heading font-black text-ink-100">LifeQuest Admin Command</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald2-500/20 text-emerald2-400 border border-emerald2-500/30">
                LIVE REALM
              </span>
            </div>
            <p className="text-xs text-ink-400 font-medium">Economy, AI quest valuation, and player governance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MusicPlayer />
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="btn-ghost px-3 py-1.5 text-xs font-bold rounded-xl text-flame-400 hover:text-flame-300"
          >
            Lock Out
          </button>
        </div>
      </header>

      {/* Action Notification */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card p-3 rounded-2xl border border-emerald2-500/40 bg-emerald2-500/15 text-emerald2-300 text-xs font-bold flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald2-400" />
            {actionSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap gap-2 p-1.5 bg-ink-900/60 rounded-2xl border border-white/10 backdrop-blur-xl">
        {[
          { key: 'overview', label: 'Realm Overview', icon: Activity },
          { key: 'heroes', label: 'Hero Manager', icon: Users },
          { key: 'ai_sandbox', label: 'Gemini AI Sandbox', icon: Bot },
          { key: 'shop', label: 'Armory Shop Economy', icon: ShoppingBag },
          { key: 'quests', label: 'Active Quests Chronicle', icon: Swords },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                soundManager.playClick();
                setActiveTab(tab.key as any);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-amber-500 text-ink-950 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                  : 'text-ink-400 hover:text-ink-100 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab 1: Realm Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-1">
              <span className="text-[11px] text-ink-400 font-bold uppercase tracking-wider">Heroes Online</span>
              <p className="text-2xl font-black text-amber-400">1</p>
              <span className="text-[10px] text-ink-500 font-mono">Local & Cloud Connected</span>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-1">
              <span className="text-[11px] text-ink-400 font-bold uppercase tracking-wider">Total Quests</span>
              <p className="text-2xl font-black text-emerald2-400">{quests.length}</p>
              <span className="text-[10px] text-ink-500 font-mono">Forged by players</span>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-1">
              <span className="text-[11px] text-ink-400 font-bold uppercase tracking-wider">Total Realm XP</span>
              <p className="text-2xl font-black text-purple-400">{profile?.total_xp || 0}</p>
              <span className="text-[10px] text-ink-500 font-mono">Distributed</span>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-1">
              <span className="text-[11px] text-ink-400 font-bold uppercase tracking-wider">Gold in Circulation</span>
              <p className="text-2xl font-black text-yellow-400">{profile?.gold || 0} G</p>
              <span className="text-[10px] text-ink-500 font-mono">Player vaults</span>
            </div>
          </div>

          {/* World Event Modifiers */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Global Realm Modifiers & World Events
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-ink-850/70 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-ink-100">Global XP Multiplier Event</h4>
                  <p className="text-[11px] text-ink-400">Boosts all quest XP earnings realm-wide</p>
                </div>
                <div className="flex items-center gap-2">
                  {[1.0, 1.5, 2.0].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => {
                        setGlobalMultiplier(mult);
                        flashMessage(`Global XP Multiplier set to ${mult}x!`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        globalMultiplier === mult
                          ? 'bg-amber-500 text-ink-950 font-black'
                          : 'bg-ink-900 border border-white/10 text-ink-400 hover:text-ink-200'
                      }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-ink-850/70 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-ink-100">Daily Boss Raid Wyrm Status</h4>
                  <p className="text-[11px] text-ink-400">Malakor the Sloth Wyrm (Max 500 HP)</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('life_rpg_daily_boss_damage');
                    flashMessage('Daily Boss Wyrm HP reset to 500/500!');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-flame-500/20 hover:bg-flame-500/30 border border-flame-500/40 text-flame-300 text-xs font-bold transition-all"
                >
                  Reset Boss HP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hero Management */}
      {activeTab === 'heroes' && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Active Hero Profile Inspector
            </h3>
            <span className="text-xs font-mono text-ink-400">Hero ID: {profile?.id || 'demo-hero'}</span>
          </div>

          {profile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-ink-850/70 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-ink-400 font-semibold">Hero Level</span>
                  <span className="text-base font-black text-amber-400">LVL {profile.level}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLevelUpDirect}
                  className="w-full py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold"
                >
                  +1 Instant Level Up
                </button>
              </div>

              <div className="bg-ink-850/70 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-ink-400 font-semibold">Gold Vault</span>
                  <span className="text-base font-black text-yellow-400">{profile.gold} G</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={heroGoldAdd}
                    onChange={(e) => setHeroGoldAdd(e.target.value)}
                    className="input-field text-xs py-1 px-2 w-20 text-center"
                  />
                  <button
                    type="button"
                    onClick={handleGrantGold}
                    className="flex-1 py-1.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 text-xs font-bold"
                  >
                    Grant Gold
                  </button>
                </div>
              </div>

              <div className="bg-ink-850/70 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-ink-400 font-semibold">XP Pool</span>
                  <span className="text-base font-black text-purple-400">{profile.xp} XP</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={heroXpAdd}
                    onChange={(e) => setHeroXpAdd(e.target.value)}
                    className="input-field text-xs py-1 px-2 w-20 text-center"
                  />
                  <button
                    type="button"
                    onClick={handleGrantXp}
                    className="flex-1 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold"
                  >
                    Grant XP
                  </button>
                </div>
              </div>

              <div className="bg-ink-850/70 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-ink-400 font-semibold">Daily Streak</span>
                  <span className="text-base font-black text-flame-400">{profile.streak} Days</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetStreak}
                  className="w-full py-1.5 rounded-xl bg-flame-500/20 hover:bg-flame-500/30 text-flame-300 border border-flame-500/40 text-xs font-bold"
                >
                  Reset Streak
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Gemini AI Sandbox */}
      {activeTab === 'ai_sandbox' && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-400" />
              Gemini 3.6 Flash Live AI Sandbox
            </h3>
            <span className="text-xs text-amber-300 font-mono">Max 75 Character Description Limit</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink-300">Quest Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink-300">Category</label>
                <select
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="strength">Strength (Fitness & Physical)</option>
                  <option value="intellect">Intellect (Learning & Mind)</option>
                  <option value="vitality">Vitality (Health & Sleep)</option>
                  <option value="charisma">Charisma (Social & Community)</option>
                  <option value="dexterity">Dexterity (Coding & Craft)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-ink-300">Description (Max 75 Chars)</label>
                  <span className="text-[10px] font-mono font-bold text-amber-400">{testDesc.length} / 75</span>
                </div>
                <textarea
                  value={testDesc}
                  maxLength={75}
                  onChange={(e) => setTestDesc(e.target.value.slice(0, 75))}
                  className="input-field text-sm resize-none"
                  rows={2}
                />
              </div>

              <button
                type="button"
                onClick={handleRunAISandbox}
                disabled={testingAI}
                className="btn-primary w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-ink-950" />
                {testingAI ? 'Evaluating with Gemini 3.6 Flash...' : 'Execute AI Valuation'}
              </button>
            </div>

            {/* Output Display */}
            <div className="bg-ink-900/90 p-4 rounded-2xl border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-ink-400 pb-2 border-b border-white/10">
                <span>Model Output (JSON)</span>
                <span className="text-[10px] text-emerald2-400">200 OK</span>
              </div>

              {testResult ? (
                <pre className="text-amber-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              ) : (
                <p className="text-ink-500 italic">Click &quot;Execute AI Valuation&quot; to test prompt response.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Armory Shop Economy */}
      {activeTab === 'shop' && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            Cataloged Armory Items ({shopItems.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {shopItems.map((item) => (
              <div
                key={item.id}
                className="bg-ink-850/70 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-ink-100">{item.name}</h4>
                  <p className="text-[10px] text-ink-400">{item.type} • {item.rarity}</p>
                </div>
                <span className="text-xs font-black text-amber-400">{item.price} G</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Active Quests Chronicle */}
      {activeTab === 'quests' && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            Quests Stored in Realm Database ({quests.length})
          </h3>

          {quests.length === 0 ? (
            <p className="text-xs text-ink-500 italic">No quests currently active in player storage.</p>
          ) : (
            <div className="space-y-2">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className="bg-ink-850/70 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-ink-100">{q.title}</span>
                    <span className="text-ink-400 ml-2">({q.category} • {q.difficulty})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    q.status === 'completed' ? 'text-emerald2-400 bg-emerald2-500/10' : 'text-amber-400 bg-amber-500/10'
                  }`}>
                    {q.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
