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
  AlertTriangle,
} from 'lucide-react';
import type { Quest } from '@/lib/supabase';
import {
  CATEGORIES,
  DIFFICULTIES,
  TAVERN_BOUNTIES,
  getCategory,
  getDifficulty,
  type CategoryConfig,
  type CategoryKey,
  type DifficultyKey,
  type TavernBounty,
} from '@/lib/rpg';
import { soundManager } from '@/lib/audio';
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
    frequency?: 'one_time' | 'daily' | 'weekly';
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
  const [frequency, setFrequency] = useState<'one_time' | 'daily' | 'weekly'>('daily');
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
        if (yourSortOrder === 'xp_desc') return getDifficulty(b.difficulty).xp - getDifficulty(a.difficulty).xp;
        if (yourSortOrder === 'xp_asc') return getDifficulty(a.difficulty).xp - getDifficulty(b.difficulty).xp;
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
          frequency,
        });
        setEditingQuest(null);
      } else {
        await onAdd({
          title: title.trim(),
          description: description.trim(),
          category,
          difficulty,
          frequency,
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
        frequency: 'daily',
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
    setFrequency(quest.frequency || 'daily');
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
              if (showForm && editingQuest) setEditingQuest(null);
              setShowForm(!showForm);
              if (!showForm) {
                setTitle('');
                setDescription('');
              }
            }}
            className="px-4 py-2 text-xs font-bold rounded-2xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-ios-md transition-all focus-ring shrink-0"
            aria-label={showForm ? 'Cancel new quest form' : 'Create new quest'}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Cancel' : 'New Quest'}</span>
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
              <div className="rpg-card p-5 sm:p-6 border border-amber-500/30 rounded-3xl space-y-4 shadow-2xl bg-ink-900 relative max-h-[85vh] overflow-y-auto">
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
                  {TAVERN_BOUNTIES.map((bounty, idx) => {
                    const diffConfig = getDifficulty(bounty.difficulty);
                    const catConfig = getCategory(bounty.category, customCategories);
                    const isAlreadyActive = quests.some(
                      (q) => q.status === 'active' && q.title.toLowerCase() === bounty.title.toLowerCase()
                    );

                    return (
                      <div
                        key={idx}
                        className="rpg-card p-4 rounded-2xl border border-ink-800 bg-ink-950/80 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 group shadow-ios-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-2xl">{bounty.icon}</span>
                            <span className="text-[11px] font-bold text-amber-400">
                              +{diffConfig.xp} XP • +{diffConfig.gold} G
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

      {/* New / Edit Quest Popup Modal */}
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
                className="rpg-card p-5 sm:p-6 border border-amber-500/30 rounded-3xl space-y-4 shadow-2xl bg-ink-900 relative max-h-[90vh] overflow-y-auto"
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
                      { key: 'weekly', label: '📅 Weekly IST', desc: 'Resets Monday IST' },
                      { key: 'one_time', label: '⚡ One-Time', desc: 'Single completion' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFrequency(f.key as 'one_time' | 'daily' | 'weekly')}
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
          </div>
        )}
      </AnimatePresence>

      {/* Quests Content: 2 Blocks Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* BLOCK 1: Your Quests Unified Block */}
        <div className="rpg-card p-4 sm:p-5 rounded-3xl border border-ink-800 bg-ink-900 space-y-4 shadow-ios-md h-full flex flex-col justify-between">
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
                <div key={n} className="rpg-card p-4 h-36 loading-skeleton rounded-2xl" />
              ))}
            </div>
          ) : filteredYourQuests.length === 0 ? (
            <div className="p-4 rounded-2xl border border-dashed border-ink-800 bg-ink-950/40 flex items-center gap-2 text-xs text-ink-400 my-auto">
              <Swords className="w-4 h-4 text-amber-500" />
              <span>No quests found under this filter.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto scrollbar-thin scrollbar-thumb-ink-800 scrollbar-track-transparent pr-1.5">
              <AnimatePresence mode="popLayout">
                {filteredYourQuests.map((quest) => {
                  const catConfig = getCategory(quest.category, customCategories);
                  const diffConfig = getDifficulty(quest.difficulty);
                  const isCompleted = quest.status === 'completed';
                  const isCompleting = completingId === quest.id;
                  const isDeleting = deletingId === quest.id;

                  return (
                    <motion.div
                      key={quest.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 border rounded-2xl transition-all flex flex-col justify-between space-y-3 group shadow-ios-sm ${
                        isCompleted
                          ? 'border-ink-800/60 bg-ink-950/40 opacity-70'
                          : 'border-ink-800/80 bg-ink-950/70 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="space-y-2.5 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-amber-400 shrink-0">
                              +{diffConfig.xp} XP • +{diffConfig.gold} G
                            </span>
                            {quest.frequency && quest.frequency !== 'one_time' && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                                {quest.frequency === 'daily' ? '🔁 Daily' : '📅 Weekly'}
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] font-semibold shrink-0 ${catConfig.textColor}`}>
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
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-ink-800/80">
                        {!isCompleted ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(quest)}
                              className="p-1.5 rounded-xl bg-ink-850 border border-ink-800 text-ink-400 hover:text-ink-200 transition-all focus-ring"
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
                              className="px-3.5 py-1.5 rounded-xl bg-emerald2-500/15 border border-emerald2-500/30 text-emerald2-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald2-500/25 transition-all disabled:opacity-50 shadow-ios-sm focus-ring"
                              title="Complete Quest"
                              aria-label={`Complete quest "${quest.title}"`}
                            >
                              {isCompleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Complete
                            </motion.button>
                          </>
                        ) : (
                          <span className="text-xs text-emerald2-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald2-500/10 border border-emerald2-500/20">
                            <Check className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleInitiateDelete(quest.id)}
                          className={`p-1.5 rounded-xl border transition-all focus-ring text-xs font-bold flex items-center gap-1 ${
                            isDeleting
                              ? 'bg-flame-500/20 border-flame-500/60 text-flame-400 px-2.5'
                              : 'bg-ink-850 border-ink-800 text-ink-400 hover:text-flame-400 hover:border-flame-500/30'
                          }`}
                          title={isDeleting ? 'Click again to confirm deletion' : 'Delete quest'}
                          aria-label={`Delete quest "${quest.title}"`}
                        >
                          {isDeleting ? (
                            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
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
        <div className="rpg-card p-4 sm:p-5 rounded-3xl border border-ink-800 bg-ink-900 space-y-4 shadow-ios-md h-full flex flex-col justify-between">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto scrollbar-thin scrollbar-thumb-ink-800 scrollbar-track-transparent pr-1.5">
              {filteredAcceptedBounties.map((quest) => {
                const catConfig = getCategory(quest.category, customCategories);
                const diffConfig = getDifficulty(quest.difficulty);
                const isCompleted = quest.status === 'completed';

                return (
                  <div
                    key={quest.id}
                    className={`p-4 border rounded-2xl flex flex-col justify-between space-y-3 shadow-ios-sm transition-all ${
                      isCompleted
                        ? 'border-ink-800/60 bg-ink-950/40 opacity-70'
                        : 'border-ink-800/80 bg-ink-950/70 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold text-amber-400 shrink-0">
                          +{diffConfig.xp} XP • +{diffConfig.gold} G
                        </span>
                        <span className={`text-[11px] font-semibold shrink-0 ${catConfig.textColor}`}>
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

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-ink-800/80">
                      {!isCompleted ? (
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playQuestComplete();
                            onComplete(quest);
                          }}
                          disabled={completingId === quest.id}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald2-500/15 border border-emerald2-500/30 text-emerald2-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald2-500/25 transition-all disabled:opacity-50 shadow-ios-sm focus-ring"
                        >
                          {completingId === quest.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Complete
                        </button>
                      ) : (
                        <span className="text-xs text-emerald2-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald2-500/10 border border-emerald2-500/20">
                          <Check className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}

                      {/* Delete Bounty Button */}
                      <button
                        type="button"
                        onClick={() => handleInitiateDelete(quest.id)}
                        className={`p-1.5 rounded-xl border transition-all focus-ring text-xs font-bold flex items-center gap-1 ${
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
