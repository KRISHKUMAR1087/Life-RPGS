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
  onComplete: (quest: Quest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  completingId: string | null;
};

export default function QuestBoard({
  quests,
  loading,
  customCategories = [],
  initialCategoryFilter = null,
  onAdd,
  onComplete,
  onDelete,
  completingId,
}: QuestBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryKey>('strength');
  const [difficulty, setDifficulty] = useState<DifficultyKey>('medium');
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
        // Status filter
        if (statusFilter === 'active' && q.status !== 'active') return false;
        if (statusFilter === 'completed' && q.status !== 'completed') return false;

        // Category filter
        if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;

        // Difficulty filter
        if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;

        // Search query
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
    setError(null);

    if (!title.trim()) {
      setError('Quest title cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
      });
      setTitle('');
      setDescription('');
      setCategory('strength');
      setDifficulty('medium');
      setShowForm(false);
    } catch {
      setError('Failed to create quest. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const activeCount = quests.filter((q) => q.status === 'active').length;
  const completedCount = quests.filter((q) => q.status === 'completed').length;

  return (
    <div className="space-y-5">
      {/* Top Header & Accept Quest Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rpg-card p-5 border border-ink-800 bg-ink-900">
        <div>
          <h2 className="font-heading text-lg font-bold text-ink-200 flex items-center gap-2">
            <Swords className="w-5 h-5 text-gold-400" /> Quest Board
          </h2>
          <p className="text-xs text-ink-400 mt-0.5">
            Complete active challenges to gain XP, Gold, and level up your character stats.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="btn-primary flex items-center justify-center gap-2 text-sm font-semibold rounded-2xl shadow-ios-sm shrink-0"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Accept New Quest
            </>
          )}
        </button>
      </div>

      {/* Add Quest Form Modal / Accordion */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="rpg-card p-5 sm:p-6 space-y-4 shadow-ios-md border border-gold-500/40" noValidate>
              <h3 className="font-heading text-base font-bold text-ink-200">Construct Quest Parameters</h3>

              {error && (
                <div className="p-3 rounded-xl bg-flame-500/10 border border-flame-500/30 text-flame-400 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">
                  Quest Objective <span className="text-flame-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete 30 min cardio workout, Read 20 pages of technical docs"
                  className="input-field text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">
                  Description <span className="text-ink-500 font-normal">(optional details)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional sub-tasks, notes, or execution constraints..."
                  rows={2}
                  className="input-field text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category selector */}
                <div>
                  <label className="block text-xs font-semibold text-ink-300 mb-1">Target Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryKey)}
                    className="input-field text-sm bg-ink-850"
                  >
                    {allCategories.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label} {cat.isCustom ? '(Custom)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty selector */}
                <div>
                  <label className="block text-xs font-semibold text-ink-300 mb-1">Challenge Tier</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIFFICULTIES.map((diff) => {
                      const isSelected = difficulty === diff.key;
                      return (
                        <button
                          key={diff.key}
                          type="button"
                          onClick={() => setDifficulty(diff.key)}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                            isSelected
                              ? `${diff.border} bg-ink-800 ${diff.color}`
                              : 'border-ink-800 bg-ink-850/50 text-ink-400 hover:border-ink-700'
                          }`}
                        >
                          <span>{diff.label}</span>
                          <span className="text-[10px] text-ink-500">+{diff.xp}XP</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Binding...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Accept Quest
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Controls & Search Bar */}
      <div className="rpg-card p-4 space-y-3 bg-ink-900 border border-ink-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-ink-850 p-1 rounded-xl border border-ink-800">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'active'
                  ? 'bg-ink-800 text-ink-200 shadow-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'completed'
                  ? 'bg-ink-800 text-emerald2-400 shadow-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-ink-800 text-ink-200 shadow-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              All ({quests.length})
            </button>
          </div>

          {/* Live Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quests..."
              className="input-field text-xs pl-9 py-1.5"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters & Sorting Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-ink-800/60 text-xs">
          {/* Category Pill Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium whitespace-nowrap transition-all ${
                categoryFilter === 'all'
                  ? 'bg-gold-500/10 border-gold-500/40 text-gold-400'
                  : 'bg-ink-850 border-ink-800 text-ink-400 hover:border-ink-700'
              }`}
            >
              All Categories
            </button>
            {allCategories.map((cat) => {
              const isSelected = categoryFilter === cat.key;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isSelected
                      ? `${cat.bgColor} ${cat.borderColor} ${cat.textColor}`
                      : 'bg-ink-850 border-ink-800 text-ink-400 hover:border-ink-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Difficulty & Sort Selectors */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-ink-400" />
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-ink-850 border border-ink-800 rounded-lg px-2 py-1 text-xs text-ink-300 focus:outline-none"
              >
                <option value="all">All Tiers</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-ink-400" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="bg-ink-850 border border-ink-800 rounded-lg px-2 py-1 text-xs text-ink-300 focus:outline-none"
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
            Try adjusting your search query, status tab, or category filter above.
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
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${catConfig.bgColor} border ${catConfig.borderColor}`}
                    >
                      <IconComp className={`w-5 h-5 ${catConfig.textColor}`} />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-sm font-bold truncate ${isCompleted ? 'line-through text-ink-400' : 'text-ink-200'}`}>
                          {quest.title}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${diffConfig.badge}`}>
                          {diffConfig.label} (+{diffConfig.xp} XP)
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${catConfig.bgColor} ${catConfig.borderColor} ${catConfig.textColor}`}>
                          {catConfig.label}
                        </span>
                      </div>

                      {quest.description && (
                        <p className="text-xs text-ink-400 line-clamp-2">{quest.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => onComplete(quest)}
                        disabled={isCompleting}
                        className="px-3 py-1.5 rounded-xl bg-emerald2-500/10 border border-emerald2-500/30 text-emerald2-500 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald2-500/20 transition-all disabled:opacity-50"
                        title="Complete Quest"
                      >
                        {isCompleting ? (
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

                    <button
                      type="button"
                      onClick={() => onDelete(quest.id)}
                      className="p-1.5 rounded-xl bg-ink-850 border border-ink-800 text-ink-400 hover:text-flame-400 hover:border-flame-500/30 transition-all"
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
