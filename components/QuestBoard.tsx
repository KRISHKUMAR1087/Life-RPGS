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
  Dumbbell,
  Brain,
  Heart,
  Users,
  Zap,
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
} from '@/lib/rpg';
import { soundManager } from '@/lib/audio';

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
};

const TAVERN_BOUNTIES: TavernBounty[] = [
  {
    title: 'Morning 5km Run & Stretching',
    description: 'Crush cardiovascular training and build stamina.',
    category: 'strength',
    difficulty: 'hard',
    icon: '🏃',
  },
  {
    title: '45-Min Deep Focus Sprint',
    description: 'Zero distractions study or coding session.',
    category: 'intellect',
    difficulty: 'medium',
    icon: '⚡',
  },
  {
    title: 'Hydrate 2 Liters & Mindful Meditation',
    description: 'Restore energy and calm the mind.',
    category: 'vitality',
    difficulty: 'easy',
    icon: '💧',
  },
  {
    title: 'Ship Code Feature & Git Commit',
    description: 'Write clean code and deploy changes.',
    category: 'dexterity',
    difficulty: 'hard',
    icon: '💻',
  },
  {
    title: 'Read 20 Pages of Knowledge',
    description: 'Expand your mind with books or literature.',
    category: 'intellect',
    difficulty: 'easy',
    icon: '📖',
  },
  {
    title: 'Praise a Peer or Connect with Friends',
    description: 'Strengthen social bonds and camaraderie.',
    category: 'charisma',
    difficulty: 'medium',
    icon: '🤝',
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline Delete Confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
          return getDifficulty(b.difficulty).xp - getDifficulty(a.difficulty).xp;
        }
        if (sortOrder === 'xp_asc') {
          return getDifficulty(a.difficulty).xp - getDifficulty(b.difficulty).xp;
        }
        if (sortOrder === 'title_asc') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [quests, statusFilter, categoryFilter, difficultyFilter, searchQuery, sortOrder]);

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
    setError(null);
    setSubmitting(true);
    soundManager.playSaveSound();

    try {
      if (editingQuest && onEdit) {
        await onEdit({
          ...editingQuest,
          title: title.trim(),
          description: description.trim() || null,
          category,
          difficulty,
        });
        setEditingQuest(null);
      } else {
        await onAdd({
          title: title.trim(),
          description: description.trim(),
          category,
          difficulty,
        });
      }
      setTitle('');
      setDescription('');
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
        description: bounty.description,
        category: bounty.category,
        difficulty: bounty.difficulty,
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
    setCategory(quest.category);
    setDifficulty(quest.difficulty as DifficultyKey);
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
          <h2 className="font-heading text-xl font-bold text-ink-200">Quest Board</h2>
          <p className="text-xs text-ink-400 font-medium">Accept tasks, defeat challenges, and level up</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setShowBounties(!showBounties);
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-ios-sm focus-ring ${
              showBounties
                ? 'bg-amber-500 text-ink-950 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                : 'bg-ink-850 hover:bg-ink-800 text-amber-400 border border-amber-500/30'
            }`}
            aria-label="Toggle Tavern Bounties section"
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
              }
            }}
            className="btn-primary px-4 py-2 text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-ios-md focus-ring"
            aria-label={showForm ? 'Cancel new quest form' : 'Create new quest'}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Cancel' : 'New Quest'}</span>
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
            <div className="rpg-card p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-ink-900 to-ink-950 border border-amber-500/30 rounded-3xl shadow-ios-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-300">Tavern Bounty Board (1-Click Add)</h3>
                </div>
                <span className="text-[10px] font-semibold text-ink-400">Instantly accept popular quests</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {TAVERN_BOUNTIES.map((bounty, idx) => {
                  const diff = getDifficulty(bounty.difficulty);
                  return (
                    <div
                      key={idx}
                      className="bg-ink-850/80 hover:bg-ink-800 rounded-2xl p-3 border border-ink-700/60 flex flex-col justify-between transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-lg">{bounty.icon}</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${diff.badge}`}>
                            {diff.label} (+{diff.xp} XP)
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-ink-200 group-hover:text-amber-400 transition-colors">
                          {bounty.title}
                        </h4>
                        <p className="text-[10px] text-ink-400 line-clamp-2 mt-0.5 font-normal">
                          {bounty.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClaimBounty(bounty)}
                        className="mt-3 w-full py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all focus-ring"
                        aria-label={`Accept tavern bounty "${bounty.title}"`}
                      >
                        <Plus className="w-3 h-3" /> Accept Bounty
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New / Edit Quest Form */}
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
              className="rpg-card p-5 sm:p-6 border border-amber-500/30 rounded-3xl space-y-4 shadow-ios-lg bg-ink-900"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink-200 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-amber-500" />
                  {editingQuest ? 'Edit Quest Details' : 'Forge a New Quest'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingQuest(null);
                  }}
                  className="text-ink-400 hover:text-ink-200 p-1 focus-ring rounded-lg"
                  aria-label="Close quest form"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="text-xs text-flame-500 bg-flame-500/10 border border-flame-500/20 p-2.5 rounded-xl">
                  {error}
                </div>
              )}

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
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Conquer 50 Pushups or Complete React Chapter"
                  className="input-field text-sm focus-ring"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-300">Quest Notes / Lore (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add specific objectives, links, or notes..."
                  rows={2}
                  className="input-field text-sm resize-none focus-ring"
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-300">Attribute Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field text-sm focus-ring cursor-pointer"
                    disabled={submitting}
                  >
                    {allCategories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label} ({c.description})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-300">Difficulty Tier</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyKey)}
                    className="input-field text-sm focus-ring cursor-pointer"
                    disabled={submitting}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label} — +{d.xp} XP / +{d.gold} Gold
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingQuest(null);
                  }}
                  className="px-4 py-2 bg-ink-800 text-ink-300 rounded-xl text-xs font-semibold hover:bg-ink-700 focus-ring"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 focus-ring"
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
      <div className="rpg-card p-4 rounded-2xl border border-ink-800 bg-ink-900 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active & completed quests..."
              className="input-field pl-10 text-xs w-full focus-ring"
              aria-label="Search quests"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200 focus-ring p-1 rounded"
                aria-label="Clear quest search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex p-1 bg-ink-850 rounded-xl border border-ink-800 w-full sm:w-auto self-stretch">
            {(['active', 'completed', 'all'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all focus-ring ${
                  statusFilter === s
                    ? 'bg-white dark:bg-ink-800 text-amber-500 shadow-ios-sm'
                    : 'text-ink-400 hover:text-ink-200'
                }`}
                aria-label={`Filter status: ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Tier Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-ink-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-ink-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden xs:inline text-[11px] font-semibold">Filter:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-ink-850 border border-ink-800 rounded-lg px-2.5 py-1 text-xs text-ink-300 focus-ring cursor-pointer min-w-[120px]"
              aria-label="Filter quests by category"
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
              aria-label="Filter quests by difficulty"
            >
              <option value="all">All Tiers</option>
              {DIFFICULTIES.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-ink-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="bg-ink-850 border border-ink-800 rounded-lg px-2.5 py-1 text-xs text-ink-300 focus-ring cursor-pointer min-w-[130px]"
              aria-label="Sort quests order"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="xp_desc">XP (High to Low)</option>
              <option value="xp_asc">XP (Low to High)</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quests List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rpg-card p-4 h-20 loading-skeleton rounded-2xl" />
          ))}
        </div>
      ) : filteredAndSortedQuests.length === 0 ? (
        <div className="rpg-card p-8 text-center border border-ink-800 bg-ink-900 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-ink-850 border border-ink-800 flex items-center justify-center mx-auto text-ink-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-ink-300">No quests match your current filter parameters.</p>
          <p className="text-xs text-ink-500">
            Accept a Tavern Bounty above or create your own custom quest!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedQuests.map((quest) => {
              const catConfig = getCategory(quest.category, customCategories);
              const diffConfig = getDifficulty(quest.difficulty);
              const isCompleted = quest.status === 'completed';
              const isCompleting = completingId === quest.id;
              const isDeleting = deletingId === quest.id;
              const IconComp = catConfig.icon;

              return (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rpg-card p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    isCompleted
                      ? 'border-ink-800/60 bg-ink-900/40 opacity-70'
                      : 'border-ink-800 bg-ink-900 hover:border-ink-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${catConfig.bgColor} border ${catConfig.borderColor}`}
                    >
                      <IconComp className={`w-5 h-5 ${catConfig.textColor}`} />
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-sm font-bold break-words ${
                            isCompleted ? 'line-through text-ink-400' : 'text-ink-200'
                          }`}
                        >
                          {quest.title}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${diffConfig.badge}`}>
                          {diffConfig.label} (+{diffConfig.xp} XP / +{diffConfig.gold} G)
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${catConfig.bgColor} ${catConfig.borderColor} ${catConfig.textColor}`}
                        >
                          {catConfig.label}
                        </span>
                      </div>

                      {quest.description && (
                        <p className="text-xs text-ink-400 line-clamp-2">{quest.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                    {!isCompleted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(quest)}
                          className="p-2 rounded-xl bg-ink-850 border border-ink-800 text-ink-400 hover:text-ink-200 hover:border-ink-700 transition-all focus-ring"
                          title="Edit quest"
                          aria-label={`Edit quest "${quest.title}"`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => {
                            soundManager.playQuestComplete();
                            onComplete(quest);
                          }}
                          disabled={isCompleting}
                          className="px-3.5 py-2 rounded-xl bg-emerald2-500/15 border border-emerald2-500/30 text-emerald2-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald2-500/25 transition-all disabled:opacity-50 shadow-ios-sm focus-ring"
                          title="Complete Quest"
                          aria-label={`Complete quest "${quest.title}"`}
                        >
                          {isCompleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <motion.span initial={{ scale: 0.8 }} animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 0.3 }}>
                              <Check className="w-3.5 h-3.5" />
                            </motion.span>
                          )}
                          Complete
                        </motion.button>
                      </>
                    ) : (
                      <span className="text-xs text-emerald2-400 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald2-500/10 border border-emerald2-500/20">
                        <Check className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}

                    {/* Delete button with inline confirmation */}
                    <button
                      type="button"
                      onClick={() => handleInitiateDelete(quest.id)}
                      className={`p-2 rounded-xl border transition-all focus-ring text-xs font-bold flex items-center gap-1 ${
                        isDeleting
                          ? 'bg-flame-500/20 border-flame-500/60 text-flame-400 px-3'
                          : 'bg-ink-850 border-ink-800 text-ink-400 hover:text-flame-400 hover:border-flame-500/30'
                      }`}
                      title={isDeleting ? 'Click again to confirm deletion' : 'Delete quest'}
                      aria-label={`Delete quest "${quest.title}"`}
                    >
                      {isDeleting ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Confirm?
                        </>
                      ) : (
                        <Trash2 className="w-4 h-4" />
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
  );
}
