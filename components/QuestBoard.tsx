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
  Sparkles,
  Edit3,
  Bot,
  Zap,
  ChevronDown,
  AlertTriangle,
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
  type TavernBounty,
} from '@/lib/rpg';
import { soundManager } from '@/lib/audio';
import { evaluateQuestAI, type AIEvaluationResult } from '@/lib/gemini';
import { getPlatformBounties } from '@/lib/localStore';

type QuestBoardProps = {
  quests: Quest[];
  loading: boolean;
  customCategories?: CategoryConfig[];
  initialCategoryFilter?: string | null;
  hideUnacceptedBounties?: boolean;
  onAdd: (data: {
    title: string;
    description: string;
    category: CategoryKey;
    difficulty: DifficultyKey;
    frequency?: string;
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

export default function QuestBoard({
  quests,
  loading,
  customCategories = [],
  initialCategoryFilter = null,
  hideUnacceptedBounties = false,
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
  const [frequency, setFrequency] = useState<string>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluationResult | null>(null);
  const [evaluatingAI, setEvaluatingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline Delete Confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Your Quests Filter & Sort State
  const [yourSearchQuery, setYourSearchQuery] = useState('');
  const [yourStatusFilter, setYourStatusFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [yourCategoryFilter, setYourCategoryFilter] = useState<string>(initialCategoryFilter || 'all');
  const [yourDifficultyFilter, setYourDifficultyFilter] = useState<string>('all');
  const [yourSortOrder, setYourSortOrder] = useState<'newest' | 'oldest' | 'xp_desc' | 'xp_asc' | 'title_asc'>('newest');

  // Tavern Bounties Filter State
  const [bountySearchQuery, setBountySearchQuery] = useState('');
  const [bountyStatusFilter, setBountyStatusFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [bountyCategoryFilter, setBountyCategoryFilter] = useState<string>('all');
  const [bountyDifficultyFilter, setBountyDifficultyFilter] = useState<string>('all');

  const allCategories = useMemo(() => [...CATEGORIES, ...customCategories], [customCategories]);

  const tavernBounties = useMemo(() => getPlatformBounties(), []);

  const bountyTitles = useMemo(() => new Set(tavernBounties.map((tb) => tb.title.toLowerCase())), [tavernBounties]);

  const STATUS_TABS = [
    { id: 'active', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
    { id: 'all', label: 'All' },
  ] as const;

  // Filtered Your Quests
  const filteredYourQuests = useMemo(() => {
    return quests
      .filter((q) => {
        const isBounty = bountyTitles.has(q.title.toLowerCase());
        if (hideUnacceptedBounties && isBounty) return false;

        if (yourStatusFilter === 'active' && q.status !== 'active') return false;
        if (yourStatusFilter === 'completed' && q.status !== 'completed') return false;
        if (yourCategoryFilter !== 'all' && q.category !== yourCategoryFilter) return false;
        if (yourDifficultyFilter !== 'all' && q.difficulty !== yourDifficultyFilter) return false;

        if (yourSearchQuery.trim()) {
          const query = yourSearchQuery.toLowerCase();
          const matchesTitle = q.title.toLowerCase().includes(query);
          const matchesDesc = (q.description || '').toLowerCase().includes(query);
          if (!matchesTitle && !matchesDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (yourSortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (yourSortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (yourSortOrder === 'xp_desc') {
          const xpA = a.xp_reward || getDifficulty(a.difficulty).xp;
          const xpB = b.xp_reward || getDifficulty(b.difficulty).xp;
          return xpB - xpA;
        }
        if (yourSortOrder === 'xp_asc') {
          const xpA = a.xp_reward || getDifficulty(a.difficulty).xp;
          const xpB = b.xp_reward || getDifficulty(b.difficulty).xp;
          return xpA - xpB;
        }
        if (yourSortOrder === 'title_asc') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [quests, bountyTitles, hideUnacceptedBounties, yourStatusFilter, yourCategoryFilter, yourDifficultyFilter, yourSearchQuery, yourSortOrder]);

  // Filtered Accepted Tavern Bounties (for Dashboard)
  const filteredAcceptedBounties = useMemo(() => {
    return quests.filter((q) => {
      if (!bountyTitles.has(q.title.toLowerCase())) return false;
      if (bountyStatusFilter === 'active' && q.status !== 'active') return false;
      if (bountyStatusFilter === 'completed' && q.status !== 'completed') return false;
      if (bountyCategoryFilter !== 'all' && q.category !== bountyCategoryFilter) return false;
      if (bountyDifficultyFilter !== 'all' && q.difficulty !== bountyDifficultyFilter) return false;

      if (bountySearchQuery.trim()) {
        const query = bountySearchQuery.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesDesc = (q.description || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [quests, bountyTitles, bountyStatusFilter, bountyCategoryFilter, bountyDifficultyFilter, bountySearchQuery]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      soundManager.playValidationErrorSound();
      setError('Please provide a quest title.');
      return;
    }
    if (title.trim().length > 100) {
      soundManager.playValidationErrorSound();
      setError('Quest title cannot exceed 100 characters.');
      return;
    }
    if (frequency === 'weekly' && selectedDays.length === 0) {
      soundManager.playValidationErrorSound();
      setError('Please select at least one day for weekly quests.');
      return;
    }
    setError(null);
    setSubmitting(true);
    soundManager.playClick();

    try {
      let evaluation = aiEvaluation;
      
      // Step 1: If not evaluated, evaluate first and pause for user to review
      if (!evaluation) {
        setEvaluatingAI(true);
        try {
          evaluation = await evaluateQuestAI(
            title.trim(),
            category,
            description.trim().slice(0, 75)
          );
          if (evaluation) {
            setAiEvaluation(evaluation);
            setDifficulty(evaluation.difficulty);
            if (evaluation.attribute && CATEGORIES.some((c) => c.key === evaluation?.attribute)) {
              setCategory(evaluation.attribute as CategoryKey);
            }
          }
          soundManager.playEquip();
          setEvaluatingAI(false);
          setSubmitting(false);
          return; // Pause here so user can see AI results and then click "Accept Quest"
        } catch {
          // Fallback handled in evaluateQuestAI but if it totally fails:
          setEvaluatingAI(false);
        }
      }

      // Step 2: Actually submit
      soundManager.playSaveSound();
      const allocatedXp = evaluation?.xp || getDifficulty(difficulty).xp;
      const allocatedGold = evaluation?.gold || getDifficulty(difficulty).gold;
      const allocatedDifficulty = evaluation?.difficulty || difficulty;

      const finalFrequency = frequency === 'weekly' 
        ? `weekly_${selectedDays.sort().join('_')}` 
        : frequency;

      if (editingQuest && onEdit) {
        await onEdit({
          ...editingQuest,
          title: title.trim(),
          description: description.trim().slice(0, 75) || null,
          category,
          difficulty: allocatedDifficulty,
          frequency: finalFrequency,
          ai_badge: evaluation?.badge || editingQuest.ai_badge,
          ai_rationale: evaluation?.rationale || editingQuest.ai_rationale,
          xp_reward: allocatedXp,
          gold_reward: allocatedGold,
        });
        setEditingQuest(null);
      } else {
        await onAdd({
          title: title.trim(),
          description: description.trim().slice(0, 75),
          category,
          difficulty: allocatedDifficulty,
          frequency: finalFrequency,
          ai_badge: evaluation?.badge || 'Hero Task',
          ai_rationale: evaluation?.rationale || 'AI calculated reward based on effort.',
          xp_reward: allocatedXp,
          gold_reward: allocatedGold,
        });
      }
      setTitle('');
      setDescription('');
      setSelectedDays([]);
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
        description: (bounty.description || '').slice(0, 75),
        category: bounty.category as CategoryKey,
        difficulty: bounty.difficulty as DifficultyKey,
        frequency: 'daily',
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
    const freq = quest.frequency || 'daily';
    if (freq.startsWith('weekly_')) {
      setFrequency('weekly');
      const days = freq.replace('weekly_', '').split('_').map(Number);
      setSelectedDays(days);
    } else {
      setFrequency(freq);
      setSelectedDays([]);
    }
    if (quest.ai_badge) {
      setAiEvaluation({
        xp: quest.xp_reward || getDifficulty(quest.difficulty).xp,
        gold: quest.gold_reward || getDifficulty(quest.difficulty).gold,
        difficulty: quest.difficulty as DifficultyKey,
        attribute: (quest.category as any) || 'strength',
        badge: quest.ai_badge,
        rationale: quest.ai_rationale || '',
      });
    } else {
      setAiEvaluation(null);
    }
    setShowForm(true);
  }

  function handleInitiateDelete(questId: string) {
    if (deletingId === questId) {
      soundManager.playAbandonSound();
      onDelete(questId);
      setDeletingId(null);
    } else {
      soundManager.playClick();
      setDeletingId(questId);
      setTimeout(() => {
        setDeletingId((current) => (current === questId ? null : current));
      }, 3000);
    }
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
              if (showForm && editingQuest) setEditingQuest(null);
              setShowForm(!showForm);
              if (!showForm) {
                setTitle('');
                setDescription('');
                setAiEvaluation(null);
              }
            }}
            className="px-4 py-2 text-xs font-bold rounded-2xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-ios-md transition-all focus-ring shrink-0"
            aria-label={showForm ? 'Cancel new quest form' : 'Create new quest'}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Cancel' : 'Forge Quest'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setShowBounties(true);
            }}
            className="px-4 py-2 text-xs font-bold rounded-2xl bg-amber-500 hover:bg-amber-400 text-ink-950 flex items-center gap-1.5 shadow-ios-md transition-all focus-ring shrink-0"
            aria-label="Open Tavern Bounties selection modal"
          >
            <Sparkles className="w-4 h-4 text-ink-950" />
            <span>+ Tavern Bounty</span>
          </button>
        </div>
      </div>

      {/* Tavern Bounties Selection Popup Modal */}
      <AnimatePresence>
        {showBounties && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowBounties(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-2xl"
            >
              <div className="glass-card p-5 sm:p-6 border border-amber-500/30 rounded-3xl space-y-4 shadow-2xl bg-ink-900 relative max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-ink-800">
                  <div>
                    <h3 className="text-base font-bold text-ink-200 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" /> Select a Realm Tavern Bounty
                    </h3>
                    <p className="text-xs text-ink-400">Accept pre-crafted bounties to add them directly to your quest log</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBounties(false)}
                    className="text-ink-400 hover:text-ink-200 p-1 focus-ring rounded-lg"
                    aria-label="Close bounties modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {tavernBounties.map((bounty, idx) => {
                    const diffConfig = getDifficulty(bounty.difficulty);
                    const catConfig = getCategory(bounty.category, customCategories);
                    const isAlreadyActive = quests.some(
                      (q) => q.status === 'active' && q.title.toLowerCase() === bounty.title.toLowerCase()
                    );
                    const xpVal = bounty.xp_reward || diffConfig.xp;
                    const goldVal = bounty.gold_reward || diffConfig.gold;

                    return (
                      <div
                        key={idx}
                        className="glass-card p-4 rounded-2xl border border-ink-800 bg-ink-950/80 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 group shadow-ios-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-2xl">{bounty.icon}</span>
                            <span className="text-[11px] font-bold text-amber-400">
                              +{xpVal} XP • +{goldVal} G
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-ink-200 group-hover:text-amber-400 transition-colors line-clamp-1">
                              {bounty.title}
                            </h4>
                            <p className="text-[11px] text-ink-400 line-clamp-2 mt-0.5">{bounty.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-ink-800/80">
                          <span className={`text-xs font-semibold ${catConfig.textColor}`}>
                            {catConfig.label}
                          </span>

                          <button
                            type="button"
                            disabled={isAlreadyActive}
                            onClick={async () => {
                              if (isAlreadyActive) return;
                              await handleClaimBounty(bounty);
                              setShowBounties(false);
                            }}
                            className={`px-3.5 py-1.5 rounded-xl transition-all text-xs font-bold flex items-center gap-1 focus-ring ${
                              isAlreadyActive
                                ? 'bg-emerald2-500/10 border border-emerald2-500/30 text-emerald2-400 opacity-80 cursor-not-allowed'
                                : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                            }`}
                          >
                            {isAlreadyActive ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald2-400" /> Accepted
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" /> Accept Bounty
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New / Edit Quest Popup Modal (with Gemini AI Integration & 75-char limit) */}
      <AnimatePresence>
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowForm(false);
                setEditingQuest(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-lg"
            >
              <form
                onSubmit={handleSubmit}
                className="glass-card p-5 sm:p-6 border border-amber-500/40 rounded-3xl space-y-4 shadow-2xl bg-ink-900 relative max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-ink-100">
                      {editingQuest ? 'Edit Quest Details' : 'Forge a New Quest'}
                    </h3>
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-flame-400 bg-flame-500/10 border border-flame-500/20 p-2.5 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Title input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-ink-300">Quest Title *</label>
                    <span
                      className={`text-[10px] tabular-nums font-semibold ${
                        title.length > 90 ? 'text-flame-400' : 'text-ink-500'
                      }`}
                    >
                      {title.length} / 100
                    </span>
                  </div>
                  <input
                    type="text"
                    value={title}
                    maxLength={100}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!editingQuest) setAiEvaluation(null);
                    }}
                    placeholder="e.g. 50 Pushups or Complete React Chapter"
                    className="input-field text-sm"
                    disabled={submitting}
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
                    onChange={(e) => {
                      setDescription(e.target.value.slice(0, 75));
                      if (!editingQuest) setAiEvaluation(null);
                    }}
                    maxLength={75}
                    placeholder="Brief note or condition (e.g. Deep focus without distractions)"
                    rows={2}
                    className="input-field text-sm resize-none"
                    disabled={submitting}
                  />
                </div>

                {/* Category & AI Difficulty Allocation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink-300">Attribute Category *</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value as CategoryKey);
                          if (!editingQuest) setAiEvaluation(null);
                        }}
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
                    <p className="text-[10px] text-ink-500">Stat attribute boosted upon completion</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-ink-300">XP & Reward Allocation</label>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        AI Managed
                      </span>
                    </div>
                    <div className="input-field text-sm bg-ink-950 border-white/10 flex items-center justify-between py-2 text-ink-300">
                      <span className="capitalize font-bold text-amber-300">
                        {aiEvaluation ? `${aiEvaluation.difficulty} Tier` : 'Pending AI Evaluation'}
                      </span>
                      <span className="text-xs font-semibold text-ink-400">
                        {aiEvaluation ? `+${aiEvaluation.xp} XP • +${aiEvaluation.gold} Gold` : '? XP • ? Gold'}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-500">XP and gold are allocated strictly by Gemini AI, not self-selected</p>
                  </div>
                </div>

                {/* Recurrence Schedule */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-300 flex items-center gap-1">
                    <span>Recurrence Schedule (IST Reset)</span>
                    <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      UTC+5:30 IST
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'daily', label: '🔁 Daily IST', desc: 'Resets midnight IST' },
                      { key: 'weekly', label: '📅 Weekly IST', desc: 'Select days below' },
                      { key: 'one_time', label: '⚡ One-Time', desc: 'Single completion' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => {
                          setFrequency(f.key);
                          if (f.key !== 'weekly') setSelectedDays([]);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                          frequency === f.key
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-ios-sm'
                            : 'bg-ink-850 text-ink-400 border-ink-800 hover:text-ink-200 hover:border-ink-750'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className="text-[9px] font-normal text-ink-500">{f.desc}</span>
                      </button>
                    ))}
                  </div>
                  
                  <AnimatePresence>
                    {frequency === 'weekly' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-between items-center gap-1 mt-2 overflow-hidden"
                      >
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                          const isSelected = selectedDays.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedDays(selectedDays.filter(d => d !== idx));
                                } else {
                                  setSelectedDays([...selectedDays, idx]);
                                }
                              }}
                              className={`w-9 h-9 rounded-full text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-amber-500 text-ink-950 border-amber-400'
                                  : 'bg-ink-900 text-ink-400 border-ink-800 hover:border-ink-600'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                    {(submitting || evaluatingAI) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {!aiEvaluation ? 'Evaluate Quest' : (editingQuest ? 'Save Changes' : 'Accept Quest')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quests Content: Unified Blocks */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 items-start min-w-0">
        {/* BLOCK 1: Your Quests Unified Block */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-ink-800 bg-ink-900 space-y-4 shadow-ios-md h-full flex flex-col justify-between">
          {/* Header Row: Title on Left, Search Box on Right */}
          <div className="space-y-3 pb-3 border-b border-ink-800/80">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Swords className="w-4 h-4 text-amber-500" /> Your Quests ({filteredYourQuests.length})
              </h3>

              {/* Search Box in Header Row */}
              <div className="relative flex-1 min-w-[140px] max-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
                <input
                  type="text"
                  value={yourSearchQuery}
                  onChange={(e) => setYourSearchQuery(e.target.value)}
                  placeholder="Search quests..."
                  className="bg-ink-850 border border-ink-800 rounded-xl pl-7 pr-2 py-1.5 text-xs text-ink-200 focus-ring w-full"
                />
              </div>
            </div>

            {/* Controls Row: Status Tabs + Category + Difficulty + Sort */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Tabs (Pending / Completed / All) */}
              <div className="flex p-0.5 bg-ink-850 rounded-xl border border-ink-800 shrink-0">
                {STATUS_TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setYourStatusFilter(id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all focus-ring ${
                      yourStatusFilter === id
                        ? 'bg-ink-800 text-amber-400 shadow-ios-sm font-extrabold'
                        : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <select
                value={yourCategoryFilter}
                onChange={(e) => setYourCategoryFilter(e.target.value)}
                className="bg-ink-850 border border-ink-800 rounded-xl px-2.5 py-1 text-xs text-ink-300 focus-ring cursor-pointer"
              >
                <option value="all">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={yourDifficultyFilter}
                onChange={(e) => setYourDifficultyFilter(e.target.value)}
                className="bg-ink-850 border border-ink-800 rounded-xl px-2.5 py-1 text-xs text-ink-300 focus-ring cursor-pointer"
              >
                <option value="all">All Tiers</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>

              {/* Sort Order */}
              <select
                value={yourSortOrder}
                onChange={(e) => setYourSortOrder(e.target.value as typeof yourSortOrder)}
                className="bg-ink-850 border border-ink-800 rounded-xl px-2.5 py-1 text-xs text-ink-300 focus-ring cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="xp_desc">XP (&rarr; Low)</option>
                <option value="xp_asc">XP (&rarr; High)</option>
                <option value="title_asc">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Quest Items / Empty State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-card p-4 h-36 loading-skeleton rounded-2xl" />
              ))}
            </div>
          ) : filteredYourQuests.length === 0 ? (
            <div className="p-4 rounded-2xl border border-dashed border-ink-800 bg-ink-950/40 flex items-center gap-2 text-xs text-ink-400 my-auto">
              <Swords className="w-4 h-4 text-amber-500" />
              <span>No quests found under this filter.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto scrollbar-thin scrollbar-thumb-ink-800 scrollbar-track-transparent pr-1.5 min-w-0">
              <AnimatePresence mode="popLayout">
                {filteredYourQuests.map((quest) => {
                  const catConfig = getCategory(quest.category, customCategories);
                  const diffConfig = getDifficulty(quest.difficulty);
                  const isCompleted = quest.status === 'completed';
                  const isCompleting = completingId === quest.id;
                  const isDeleting = deletingId === quest.id;
                  const xpVal = quest.xp_reward || diffConfig.xp;
                  const goldVal = quest.gold_reward || diffConfig.gold;

                  return (
                    <motion.div
                      key={quest.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-3.5 sm:p-4 border rounded-2xl transition-all flex flex-col justify-between space-y-3 group shadow-ios-sm min-w-0 overflow-hidden ${
                        isCompleted
                          ? 'border-ink-800/60 bg-ink-900/90 opacity-70'
                          : 'border-ink-800 bg-ink-900/95 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-amber-400 shrink-0">
                              +{xpVal} XP • +{goldVal} G
                            </span>
                            {quest.frequency && quest.frequency !== 'one_time' && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                                {quest.frequency === 'daily' ? '🔁 Daily' : '📅 Weekly'}
                              </span>
                            )}
                            {quest.ai_badge && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-400/30 flex items-center gap-0.5 shrink-0">
                                <Sparkles className="w-2.5 h-2.5" />
                                {quest.ai_badge}
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] sm:text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-lg bg-ink-850 border border-ink-800/80 ${catConfig.textColor}`}>
                            {catConfig.label}
                          </span>
                        </div>

                        <div>
                          <h4
                            className={`text-xs font-bold transition-colors line-clamp-2 break-words ${
                              isCompleted ? 'line-through text-ink-400' : 'text-ink-200 group-hover:text-amber-400'
                            }`}
                          >
                            {quest.title}
                          </h4>
                          {quest.description && (
                            <p className="text-[11px] text-ink-400 line-clamp-2 mt-1 break-words">{quest.description}</p>
                          )}
                          {quest.ai_rationale && (
                            <p className="text-[10px] text-amber-300/80 italic font-mono mt-0.5">
                              AI: &quot;{quest.ai_rationale}&quot;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-ink-800/80 flex-wrap">
                        {!isCompleted ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(quest)}
                              className="p-1.5 rounded-xl bg-ink-850 border border-ink-800 text-ink-400 hover:text-ink-200 transition-all focus-ring shrink-0"
                              title="Edit quest"
                              aria-label={`Edit quest "${quest.title}"`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => {
                                soundManager.playQuestComplete();
                                onComplete(quest);
                              }}
                              disabled={isCompleting}
                              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-emerald2-500/15 border border-emerald2-500/30 text-emerald2-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald2-500/25 transition-all disabled:opacity-50 shadow-ios-sm focus-ring shrink-0"
                              title="Complete Quest"
                              aria-label={`Complete quest "${quest.title}"`}
                            >
                              {isCompleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Complete</span>
                            </motion.button>
                          </>
                        ) : (
                          <span className="text-xs text-emerald2-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald2-500/10 border border-emerald2-500/20 shrink-0">
                            <Check className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleInitiateDelete(quest.id)}
                          className={`p-1.5 rounded-xl border transition-all focus-ring text-xs font-bold flex items-center gap-1 shrink-0 ${
                            isDeleting
                              ? 'bg-flame-500/20 border-flame-500/60 text-flame-400 px-2.5'
                              : 'bg-ink-850 border-ink-800 text-ink-400 hover:text-flame-400 hover:border-flame-500/30'
                          }`}
                          title={isDeleting ? 'Click again to confirm deletion' : 'Delete quest'}
                          aria-label={`Delete quest "${quest.title}"`}
                        >
                          {isDeleting ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                              <span>Confirm?</span>
                            </>
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* BLOCK 2: Tavern Bounties Unified Block */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-ink-800 bg-ink-900 space-y-4 shadow-ios-md h-full flex flex-col justify-between">
          {/* Header Row: Title on Left, Search Box on Right */}
          <div className="space-y-3 pb-3 border-b border-ink-800/80">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {hideUnacceptedBounties
                  ? `ACCEPTED TAVERN BOUNTIES (${filteredAcceptedBounties.length})`
                  : 'TAVERN BOUNTIES'}
              </h3>

              {/* Search Box in Header Row */}
              <div className="relative flex-1 min-w-[140px] max-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
                <input
                  type="text"
                  value={bountySearchQuery}
                  onChange={(e) => setBountySearchQuery(e.target.value)}
                  placeholder="Search bounties..."
                  className="bg-ink-850 border border-ink-800 rounded-xl pl-7 pr-2 py-1.5 text-xs text-ink-200 focus-ring w-full"
                />
              </div>
            </div>

            {/* Controls Row: Status Tabs + Category + Difficulty */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Tabs (Pending / Completed / All) */}
              <div className="flex p-0.5 bg-ink-850 rounded-xl border border-ink-800 shrink-0">
                {STATUS_TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setBountyStatusFilter(id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all focus-ring ${
                      bountyStatusFilter === id
                        ? 'bg-ink-800 text-amber-400 shadow-ios-sm font-extrabold'
                        : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <select
                value={bountyCategoryFilter}
                onChange={(e) => setBountyCategoryFilter(e.target.value)}
                className="bg-ink-850 border border-ink-800 rounded-xl px-2.5 py-1 text-xs text-ink-300 focus-ring cursor-pointer"
              >
                <option value="all">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={bountyDifficultyFilter}
                onChange={(e) => setBountyDifficultyFilter(e.target.value)}
                className="bg-ink-850 border border-ink-800 rounded-xl px-2.5 py-1 text-xs text-ink-300 focus-ring cursor-pointer"
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

          {/* Bounties Content inside outer block */}
          {filteredAcceptedBounties.length === 0 ? (
            <div className="p-4 rounded-2xl border border-dashed border-ink-800 bg-ink-950/40 flex items-center gap-2 text-xs text-ink-400 my-auto">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>No Tavern Bounties found under this filter.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto scrollbar-thin scrollbar-thumb-ink-800 scrollbar-track-transparent pr-1.5 min-w-0">
              {filteredAcceptedBounties.map((quest) => {
                const catConfig = getCategory(quest.category, customCategories);
                const diffConfig = getDifficulty(quest.difficulty);
                const isCompleted = quest.status === 'completed';
                const xpVal = quest.xp_reward || diffConfig.xp;
                const goldVal = quest.gold_reward || diffConfig.gold;

                return (
                  <div
                    key={quest.id}
                    className={`p-3.5 sm:p-4 border rounded-2xl flex flex-col justify-between space-y-3 shadow-ios-sm transition-all min-w-0 overflow-hidden ${
                      isCompleted
                        ? 'border-ink-800/60 bg-ink-900/90 opacity-70'
                        : 'border-ink-800 bg-ink-900/95 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-amber-400 shrink-0">
                          +{diffConfig.xp} XP • +{diffConfig.gold} G
                        </span>
                        <span className={`text-[10px] sm:text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-lg bg-ink-850 border border-ink-800/80 ${catConfig.textColor}`}>
                          {catConfig.label}
                        </span>
                      </div>

                      <div>
                        <h4
                          className={`text-xs font-bold transition-colors line-clamp-2 break-words ${
                            isCompleted ? 'line-through text-ink-400' : 'text-ink-200'
                          }`}
                        >
                          {quest.title}
                        </h4>
                        {quest.description && (
                          <p className="text-[11px] text-ink-400 line-clamp-2 mt-1 break-words">{quest.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-ink-800/80 flex-wrap">
                      {!isCompleted ? (
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playQuestComplete();
                            onComplete(quest);
                          }}
                          disabled={completingId === quest.id}
                          className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-emerald2-500/15 border border-emerald2-500/30 text-emerald2-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald2-500/25 transition-all disabled:opacity-50 shadow-ios-sm focus-ring shrink-0"
                        >
                          {completingId === quest.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Complete</span>
                        </button>
                      ) : (
                        <span className="text-xs text-emerald2-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald2-500/10 border border-emerald2-500/20 shrink-0">
                          <Check className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}

                      {/* Delete Bounty Button */}
                      <button
                        type="button"
                        onClick={() => handleInitiateDelete(quest.id)}
                        className={`p-1.5 rounded-xl border transition-all focus-ring text-xs font-bold flex items-center gap-1 shrink-0 ${
                          deletingId === quest.id
                            ? 'bg-flame-500/20 border-flame-500/60 text-flame-400 px-2.5'
                            : 'bg-ink-850 border-ink-800 text-ink-400 hover:text-flame-400 hover:border-flame-500/30'
                        }`}
                        title={deletingId === quest.id ? 'Click again to confirm deletion' : 'Abandon bounty'}
                        aria-label={`Delete bounty "${quest.title}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === quest.id && <span>Confirm?</span>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
