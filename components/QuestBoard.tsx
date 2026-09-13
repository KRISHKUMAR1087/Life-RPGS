'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Check,
  Trash2,
  X,
  Loader2,
  Swords,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  Edit3,
  BookmarkPlus,
  Zap,
  Bot,
  ChevronDown,
} from 'lucide-react';
import type { Quest } from '@/lib/supabase';
import {
  CATEGORIES,
  DIFFICULTIES,
  getCategory,
  getDifficulty,
  type CategoryConfig,
  type CategoryKey,
  type DifficultyKey,
} from '@/lib/rpg';
import { soundManager } from '@/lib/audio';
import { evaluateQuestAI, type AIEvaluationResult } from '@/lib/gemini';

type QuestBoardProps = {
  quests: Quest[];
  loading: boolean;
  customCategories?: CategoryConfig[];
  initialCategoryFilter?: string | null;
  onAdd: (data: {
    title: string;
    description: string;
    category: CategoryKey;
    difficulty: DifficultyKey;
    ai_badge?: string;
    ai_rationale?: string;
    xp_reward?: number;
    gold_reward?: number;
  }) => Promise<void>;
  onEdit?: (quest: Quest) => Promise<void>;
  onComplete: (quest: Quest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  completingId: string | null;
};

type TavernBounty = {
  title: string;
  description: string;
  category: CategoryKey;
  difficulty: DifficultyKey;
  icon: string;
  xp_reward: number;
  gold_reward: number;
};

const TAVERN_BOUNTIES: TavernBounty[] = [
  {
    title: 'Morning 5km Run & Mobility',
    description: 'Crush cardiovascular training and build legendary stamina.',
    category: 'strength',
    difficulty: 'hard',
    icon: '🏃',
    xp_reward: 75,
    gold_reward: 30,
  },
  {
    title: '45-Min Deep Focus Sprint',
    description: 'Zero distractions deep work or coding session.',
    category: 'intellect',
    difficulty: 'medium',
    icon: '⚡',
    xp_reward: 45,
    gold_reward: 20,
  },
  {
    title: 'Hydrate 2 Liters & Breathwork',
    description: 'Restore vitality and practice 10-minute mindfulness.',
    category: 'vitality',
    difficulty: 'easy',
    icon: '💧',
    xp_reward: 25,
    gold_reward: 10,
  },
  {
    title: 'Ship Clean Code & Git Commit',
    description: 'Solve an algorithmic problem or deploy a new feature.',
    category: 'dexterity',
    difficulty: 'hard',
    icon: '💻',
    xp_reward: 80,
    gold_reward: 35,
  },
  {
    title: 'Read 20 Pages of Knowledge',
    description: 'Expand your mind with philosophy or technical lore.',
    category: 'intellect',
    difficulty: 'easy',
    icon: '📖',
    xp_reward: 30,
    gold_reward: 15,
  },
  {
    title: 'Praise a Peer or Connect with Friends',
    description: 'Strengthen social bonds and collaborative charisma.',
    category: 'charisma',
    difficulty: 'medium',
    icon: '🤝',
    xp_reward: 40,
    gold_reward: 20,
  },
];

export default function QuestBoard({
  quests,
  loading,
  customCategories = [],
  initialCategoryFilter = null,
  onAdd,
  onEdit,
  onComplete,
  onDelete,
  completingId,
}: QuestBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [showBounties, setShowBounties] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryKey>('strength');
  const [difficulty, setDifficulty] = useState<DifficultyKey>('medium');
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluationResult | null>(null);
  const [evaluatingAI, setEvaluatingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter || 'all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'xp_desc' | 'xp_asc' | 'title_asc'>('newest');

  const allCategories = useMemo(() => [...CATEGORIES, ...customCategories], [customCategories]);

  // Combined Filtering & Sorting
  const filteredAndSortedQuests = useMemo(() => {
    return quests
      .filter((q) => {
        if (statusFilter === 'active' && q.status !== 'active') return false;
        if (statusFilter === 'completed' && q.status !== 'completed') return false;
        if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
        if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesTitle = q.title.toLowerCase().includes(query);
          const matchesDesc = (q.description || '').toLowerCase().includes(query);
          if (!matchesTitle && !matchesDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortOrder === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortOrder === 'xp_desc') {
          const xpA = a.xp_reward || getDifficulty(a.difficulty).xp;
          const xpB = b.xp_reward || getDifficulty(b.difficulty).xp;
          return xpB - xpA;
        }
        if (sortOrder === 'xp_asc') {
          const xpA = a.xp_reward || getDifficulty(a.difficulty).xp;
          const xpB = b.xp_reward || getDifficulty(b.difficulty).xp;
          return xpA - xpB;
        }
        if (sortOrder === 'title_asc') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [quests, statusFilter, categoryFilter, difficultyFilter, searchQuery, sortOrder]);

  async function handleAIEvaluate() {
    if (!title.trim()) {
      setError('Please provide a quest title before running AI evaluation.');
      return;
    }
    setError(null);
    setEvaluatingAI(true);
    soundManager.playClick();

    try {
      const res = await evaluateQuestAI(title, category, description.slice(0, 75));
      setAiEvaluation(res);
      setDifficulty(res.difficulty);
      if (res.attribute && CATEGORIES.some((c) => c.key === res.attribute)) {
        setCategory(res.attribute as CategoryKey);
      }
      soundManager.playEquip();
    } catch {
      setError('AI evaluation temporary error, standard rewards applied.');
    } finally {
      setEvaluatingAI(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a quest title.');
      return;
    }
    setError(null);
    setSubmitting(true);
    soundManager.playClick();

    try {
      if (editingQuest && onEdit) {
        await onEdit({
          ...editingQuest,
          title: title.trim(),
          description: description.trim().slice(0, 75) || null,
          category,
          difficulty,
          ai_badge: aiEvaluation?.badge || editingQuest.ai_badge,
          ai_rationale: aiEvaluation?.rationale || editingQuest.ai_rationale,
          xp_reward: aiEvaluation?.xp || editingQuest.xp_reward,
          gold_reward: aiEvaluation?.gold || editingQuest.gold_reward,
        });
        setEditingQuest(null);
      } else {
        await onAdd({
          title: title.trim(),
          description: description.trim().slice(0, 75),
          category,
          difficulty,
          ai_badge: aiEvaluation?.badge,
          ai_rationale: aiEvaluation?.rationale,
          xp_reward: aiEvaluation?.xp,
          gold_reward: aiEvaluation?.gold,
        });
      }
      setTitle('');
      setDescription('');
      setAiEvaluation(null);
      setShowForm(false);
    } catch {
      // Error handled by parent toast
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClaimBounty(bounty: TavernBounty) {
    soundManager.playClick();
    try {
      await onAdd({
        title: bounty.title,
        description: bounty.description.slice(0, 75),
        category: bounty.category,
        difficulty: bounty.difficulty,
        xp_reward: bounty.xp_reward,
        gold_reward: bounty.gold_reward,
        ai_badge: 'Tavern Bounty',
      });
    } catch {
      // error handled by parent
    }
  }

  function handleStartEdit(quest: Quest) {
    soundManager.playClick();
    setEditingQuest(quest);
    setTitle(quest.title);
    setDescription(quest.description || '');
    setCategory(quest.category as CategoryKey);
    setDifficulty(quest.difficulty as DifficultyKey);
    if (quest.ai_badge) {
      setAiEvaluation({
        xp: quest.xp_reward || getDifficulty(quest.difficulty).xp,
        gold: quest.gold_reward || getDifficulty(quest.difficulty).gold,
        difficulty: quest.difficulty as any,
        attribute: quest.category as any,
        badge: quest.ai_badge,
        rationale: quest.ai_rationale || '',
      });
    } else {
      setAiEvaluation(null);
    }
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-black text-ink-100 flex items-center gap-2">
            Quest Board
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300">
              {quests.filter((q) => q.status === 'active').length} Active
            </span>
          </h2>
          <p className="text-xs text-ink-400 font-medium mt-0.5">
            Accept tasks, earn AI-calibrated XP & gold, and level up your hero
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setShowBounties(!showBounties);
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-ios-sm ${
              showBounties
                ? 'bg-amber-500 text-ink-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'glass-tab text-amber-300 hover:text-amber-200 hover:border-amber-400/40'
            }`}
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Tavern Bounties</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              if (showForm && editingQuest) setEditingQuest(null);
              setShowForm(!showForm);
              if (!showForm) {
                setTitle('');
                setDescription('');
                setAiEvaluation(null);
              }
            }}
            className="btn-primary px-4 py-2 text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-ios-md"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Cancel' : 'Forge Quest'}</span>
          </button>
        </div>
      </div>

      {/* Tavern Bounties Drawer */}
      <AnimatePresence>
        {showBounties && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-5 bg-gradient-to-br from-amber-500/10 via-ink-900/90 to-ink-950 border border-amber-500/30 rounded-3xl shadow-ios-lg">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-300">Tavern Bounty Board (1-Click Add)</h3>
                    <p className="text-[11px] text-ink-400 font-normal">Pre-calibrated challenges ready for adventure</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {TAVERN_BOUNTIES.map((bounty, idx) => {
                  const diff = getDifficulty(bounty.difficulty);
                  return (
                    <div
                      key={idx}
                      className="glass-card rounded-2xl p-3.5 border border-white/10 hover:border-amber-500/40 flex flex-col justify-between transition-all group hover:scale-[1.01]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-xl">{bounty.icon}</span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${diff.badge}`}>
                            +{bounty.xp_reward} XP / +{bounty.gold_reward} G
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-ink-100 group-hover:text-amber-300 transition-colors">
                          {bounty.title}
                        </h4>
                        <p className="text-[10px] text-ink-400 line-clamp-2 mt-1 font-normal">
                          {bounty.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClaimBounty(bounty)}
                        className="mt-3 w-full py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Accept Bounty
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New / Edit Quest Form (with Gemini AI Integration & 75-char limit) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="glass-card p-5 sm:p-6 border border-amber-500/40 rounded-3xl space-y-4 shadow-ios-lg bg-ink-900/90 backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-amber-400" />
                  {editingQuest ? 'Edit Quest Details' : 'Forge a New Quest'}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Gemini 3.6 Flash Enabled</span>
                </div>
              </div>

              {error && (
                <div className="text-xs text-flame-400 bg-flame-500/10 border border-flame-500/20 p-2.5 rounded-xl">
                  {error}
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-300">Quest Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 50 Pushups or Complete Chapter 4 in Algorithms"
                  className="input-field text-sm"
                  disabled={submitting || evaluatingAI}
                />
              </div>

              {/* Description input with 75-character counter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-ink-300">
                    Quest Description / Lore (Max 75 chars)
                  </label>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      description.length > 70 ? 'text-amber-400' : 'text-ink-400'
                    }`}
                  >
                    {description.length} / 75
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 75))}
                  maxLength={75}
                  placeholder="Brief note or condition (e.g. Focus without tab switching)"
                  rows={2}
                  className="input-field text-sm resize-none"
                  disabled={submitting || evaluatingAI}
                />
              </div>

              {/* AI Auto-Evaluate Sparkle Button & Results Pill */}
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <div>
                      <div className="text-xs font-bold text-amber-300">AI Dungeon Master Valuation</div>
                      <div className="text-[10px] text-ink-400">
                        Evaluates cognitive/physical effort to balance XP & gold rewards
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAIEvaluate}
                    disabled={evaluatingAI || !title.trim()}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-ios-sm self-start sm:self-auto"
                  >
                    {evaluatingAI ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 fill-ink-950" />
                    )}
                    <span>{evaluatingAI ? 'Evaluating...' : '⚡ AI Auto-Evaluate'}</span>
                  </button>
                </div>

                {aiEvaluation && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-ink-850/90 border border-amber-400/40 text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                        Badge: {aiEvaluation.badge}
                      </span>
                      <span className="text-emerald2-400 font-bold">
                        +{aiEvaluation.xp} XP
                      </span>
                      <span className="text-amber-400 font-bold">
                        +{aiEvaluation.gold} Gold
                      </span>
                      <span className="text-ink-400 text-[10px] capitalize">
                        Tier: {aiEvaluation.difficulty}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-300 italic font-normal">
                      &quot;{aiEvaluation.rationale}&quot;
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Category & Difficulty Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-300">Attribute Category</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CategoryKey)}
                      className="input-field text-sm appearance-none pr-8 cursor-pointer bg-ink-900 border-white/15"
                      disabled={submitting}
                    >
                      {allCategories.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label} ({c.description})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-ink-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-300">Difficulty Tier</label>
                  <div className="relative">
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as DifficultyKey)}
                      className="input-field text-sm appearance-none pr-8 cursor-pointer bg-ink-900 border-white/15"
                      disabled={submitting}
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label} — +{d.xp} XP / +{d.gold} Gold
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-ink-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingQuest(null);
                    setAiEvaluation(null);
                  }}
                  className="btn-ghost px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || evaluatingAI}
                  className="btn-primary px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingQuest ? 'Save Changes' : 'Accept Quest'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active & completed quests..."
              className="input-field pl-10 text-xs w-full"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex p-1 bg-ink-850/80 rounded-xl border border-white/10 w-full sm:w-auto self-stretch">
            {(['active', 'completed', 'all'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-amber-500 text-ink-950 shadow-ios-sm'
                    : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Tier Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-white/10 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-ink-400 mr-1 font-semibold text-[11px]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Filters:</span>
            </div>

            {/* Category Select */}
            <div className="relative inline-flex items-center">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-ink-900 border border-white/15 hover:border-amber-400/50 rounded-xl pl-3 pr-7 py-1.5 text-xs text-ink-100 focus:outline-none focus:border-amber-400 cursor-pointer shadow-ios-sm transition-all"
              >
                <option value="all">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-ink-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Difficulty Tier Select */}
            <div className="relative inline-flex items-center">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="appearance-none bg-ink-900 border border-white/15 hover:border-amber-400/50 rounded-xl pl-3 pr-7 py-1.5 text-xs text-ink-100 focus:outline-none focus:border-amber-400 cursor-pointer shadow-ios-sm transition-all"
              >
                <option value="all">All Tiers</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-ink-400 absolute right-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Sort Order Select */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <div className="relative inline-flex items-center">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="appearance-none bg-ink-900 border border-white/15 hover:border-amber-400/50 rounded-xl pl-3 pr-7 py-1.5 text-xs text-ink-100 focus:outline-none focus:border-amber-400 cursor-pointer shadow-ios-sm transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="xp_desc">XP (High to Low)</option>
                <option value="xp_asc">XP (Low to High)</option>
                <option value="title_asc">Title (A-Z)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-ink-400 absolute right-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Quests List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card p-4 h-20 loading-skeleton rounded-2xl" />
          ))}
        </div>
      ) : filteredAndSortedQuests.length === 0 ? (
        <div className="glass-card p-10 text-center border border-white/10 space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink-100">Your Chronicle Awaits</h3>
            <p className="text-xs text-ink-400 max-w-sm mx-auto mt-1">
              You currently have no quests in this view. Accept a Tavern Bounty or forge your first personalized task!
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setShowBounties(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all"
            >
              Summon Tavern Bounties
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setShowForm(true);
              }}
              className="btn-primary px-4 py-2 text-xs font-bold rounded-xl"
            >
              Forge Quest
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedQuests.map((quest) => {
              const catConfig = getCategory(quest.category, customCategories);
              const diffConfig = getDifficulty(quest.difficulty);
              const isCompleted = quest.status === 'completed';
              const isCompleting = completingId === quest.id;
              const IconComp = catConfig.icon;
              const xpVal = quest.xp_reward || diffConfig.xp;
              const goldVal = quest.gold_reward || diffConfig.gold;

              return (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`glass-card p-4 sm:p-5 border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-amber-500/40 ${
                    isCompleted
                      ? 'border-white/5 bg-ink-950/40 opacity-65'
                      : 'border-white/10 bg-ink-900/60'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${catConfig.bgColor} border ${catConfig.borderColor} shadow-ios-sm`}
                    >
                      <IconComp className={`w-5 h-5 ${catConfig.textColor}`} />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-sm font-bold truncate ${
                            isCompleted ? 'line-through text-ink-400' : 'text-ink-100 group-hover:text-amber-300 transition-colors'
                          }`}
                        >
                          {quest.title}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-extrabold ${diffConfig.badge}`}>
                          +{xpVal} XP / +{goldVal} G
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${catConfig.bgColor} ${catConfig.borderColor} ${catConfig.textColor}`}
                        >
                          {catConfig.label}
                        </span>
                        {quest.ai_badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-400/30 text-purple-300 font-bold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {quest.ai_badge}
                          </span>
                        )}
                      </div>

                      {quest.description && (
                        <p className="text-xs text-ink-400 line-clamp-2">{quest.description}</p>
                      )}

                      {quest.ai_rationale && (
                        <p className="text-[10px] text-amber-300/80 italic font-mono">
                          AI: &quot;{quest.ai_rationale}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isCompleted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(quest)}
                          className="p-2 rounded-xl bg-ink-850 border border-white/10 text-ink-400 hover:text-amber-300 hover:border-amber-400/40 transition-all"
                          title="Edit quest"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playQuestComplete();
                            onComplete(quest);
                          }}
                          disabled={isCompleting}
                          className="px-4 py-2 rounded-xl bg-emerald2-500/15 border border-emerald2-500/40 text-emerald2-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald2-500/25 transition-all disabled:opacity-50 shadow-ios-sm hover:scale-[1.02]"
                          title="Complete Quest"
                        >
                          {isCompleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Complete
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-emerald2-400 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald2-500/10 border border-emerald2-500/25">
                        <Check className="w-3.5 h-3.5" /> Conquered
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        onDelete(quest.id);
                      }}
                      className="p-2 rounded-xl bg-ink-850 border border-white/10 text-ink-400 hover:text-flame-400 hover:border-flame-500/40 transition-all"
                      title="Abandon quest"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
