'use client';

import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Check,
  Trash2,
  X,
  Loader2,
  Swords,
  Brain,
  Heart,
  Users,
  Zap,
  CircleDot,
  Lock,
} from 'lucide-react';
import type { Quest } from '@/lib/supabase';
import {
  CATEGORIES,
  DIFFICULTIES,
  getCategory,
  getDifficulty,
  type CategoryKey,
  type DifficultyKey,
} from '@/lib/rpg';

type QuestBoardProps = {
  quests: Quest[];
  loading: boolean;
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

const ICON_MAP: Record<string, typeof Swords> = {
  strength: Swords,
  intellect: Brain,
  vitality: Heart,
  charisma: Users,
  dexterity: Zap,
};

export default function QuestBoard({
  quests,
  loading,
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

  const activeQuests = quests.filter((q) => q.status === 'active');
  const completedQuests = quests.filter((q) => q.status === 'completed');

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

  return (
    <div className="space-y-4">
      {/* iOS Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-ink-200">Quest Board</h2>
          <p className="text-xs text-ink-400 mt-0.5 font-medium">
            {activeQuests.length} active · {completedQuests.length} completed
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="btn-primary flex items-center gap-1.5 text-sm font-semibold rounded-2xl shadow-ios-sm"
          aria-expanded={showForm}
          aria-controls="quest-form"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              New Quest
            </>
          )}
        </button>
      </div>

      {/* iOS Form Card */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            id="quest-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="rpg-card p-5 sm:p-6 space-y-4 shadow-ios-md" noValidate>
              <div>
                <label htmlFor="quest-title" className="block text-xs font-semibold text-ink-300 mb-1.5 ml-1">
                  Quest Title
                </label>
                <input
                  id="quest-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field text-sm font-medium"
                  placeholder="e.g. Complete 50 push-ups"
                  maxLength={100}
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="quest-desc" className="block text-xs font-semibold text-ink-300 mb-1.5 ml-1">
                  Description <span className="text-ink-500 font-normal">(optional)</span>
                </label>
                <input
                  id="quest-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field text-sm font-medium"
                  placeholder="Add details about your quest..."
                  maxLength={200}
                  disabled={submitting}
                />
              </div>

              {/* iOS Segmented Category Selector */}
              <div>
                <span id="category-label" className="block text-xs font-semibold text-ink-300 mb-1.5 ml-1">
                  Category
                </span>
                <div role="radiogroup" aria-labelledby="category-label" className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const selected = category === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setCategory(cat.key)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                          selected
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-ios-sm'
                            : 'bg-ink-850 border-ink-800 text-ink-400 hover:border-ink-700'
                        }`}
                        role="radio"
                        aria-checked={selected}
                        aria-label={`Category: ${cat.label}`}
                      >
                        <Icon className="w-5 h-5" style={{ color: selected ? cat.color : '#8e8e93' }} />
                        <span className="text-xs font-semibold">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* iOS Segmented Difficulty Selector */}
              <div>
                <span id="difficulty-label" className="block text-xs font-semibold text-ink-300 mb-1.5 ml-1">
                  Difficulty
                </span>
                <div role="radiogroup" aria-labelledby="difficulty-label" className="grid grid-cols-4 gap-2">
                  {DIFFICULTIES.map((diff) => {
                    const selected = difficulty === diff.key;
                    return (
                      <button
                        key={diff.key}
                        type="button"
                        onClick={() => setDifficulty(diff.key)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border transition-all ${
                          selected
                            ? 'bg-ink-800 border-amber-500/50 shadow-ios-sm'
                            : 'bg-ink-850 border-ink-800 hover:border-ink-700'
                        }`}
                        role="radio"
                        aria-checked={selected}
                        aria-label={`Difficulty: ${diff.label}`}
                      >
                        <CircleDot className="w-4 h-4" style={{ opacity: selected ? 1 : 0.4 }} />
                        <span className={`text-xs font-semibold ${selected ? diff.color : 'text-ink-400'}`}>
                          {diff.label}
                        </span>
                        <span className="text-[10px] text-ink-500 font-medium">
                          +{diff.xp} XP · +{diff.gold}g
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="text-xs font-medium text-flame-500 bg-flame-500/10 border border-flame-500/20 rounded-xl p-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-2.5 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Quest...
                  </>
                ) : (
                  'Accept Quest'
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rpg-card p-4 loading-skeleton h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Active Quests */}
      {!loading && activeQuests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider ml-1">
            Active Quests
          </h3>
          <AnimatePresence>
            {activeQuests.map((quest) => {
              const cat = getCategory(quest.category);
              const diff = getDifficulty(quest.difficulty);
              const Icon = ICON_MAP[quest.category] ?? CircleDot;
              const isCompleting = completingId === quest.id;
              return (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="rpg-card rpg-card-hover p-4 rounded-2xl relative overflow-hidden group border border-ink-800"
                >
                  <div className="relative flex items-start gap-3.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-ink-850 border border-ink-800 shadow-ios-sm"
                    >
                      <Icon className="w-5 h-5" style={{ color: cat.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-200 text-sm sm:text-base truncate">{quest.title}</p>
                          {quest.description && (
                            <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{quest.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => onComplete(quest)}
                            disabled={isCompleting}
                            className="w-9 h-9 rounded-xl bg-ios-green/10 border border-ios-green/30 text-ios-green flex items-center justify-center hover:bg-ios-green/20 transition-all disabled:opacity-50"
                            aria-label={`Complete quest: ${quest.title}`}
                            title="Complete quest"
                          >
                            {isCompleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(quest.id)}
                            className="w-9 h-9 rounded-xl bg-ink-850 border border-ink-800 text-ink-400 flex items-center justify-center hover:bg-ios-red/10 hover:text-ios-red hover:border-ios-red/30 transition-all opacity-0 group-hover:opacity-100"
                            aria-label={`Delete quest: ${quest.title}`}
                            title="Abandon quest"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-ink-850 border border-ink-800 text-ink-300 font-semibold">
                          {cat.label}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 font-semibold">
                          {diff.label}
                        </span>
                        <span className="text-[11px] text-ink-500 ml-auto font-medium">
                          +{diff.xp} XP · +{diff.gold} gold
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Completed Quests */}
      {!loading && completedQuests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider ml-1">
            Completed ({completedQuests.length})
          </h3>
          <div className="space-y-2">
            {completedQuests.slice(0, 10).map((quest) => {
              const cat = getCategory(quest.category);
              const Icon = ICON_MAP[quest.category] ?? CircleDot;
              return (
                <div
                  key={quest.id}
                  className="rpg-card p-3 rounded-2xl flex items-center gap-3 opacity-60 border border-ink-800"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-ink-850 border border-ink-800">
                    <Icon className="w-4 h-4" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-ink-300 line-through truncate font-medium">{quest.title}</p>
                    <p className="text-[10px] text-ink-500">
                      {cat.label} · {getDifficulty(quest.difficulty).label}
                    </p>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-ink-500 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && quests.length === 0 && !showForm && (
        <div className="rpg-card p-10 sm:p-12 text-center rounded-3xl border border-ink-800">
          <div className="w-16 h-16 rounded-3xl bg-ink-850 border border-ink-800 flex items-center justify-center mx-auto mb-4 shadow-ios-sm">
            <Swords className="w-8 h-8 text-ink-400" />
          </div>
          <h3 className="font-heading text-lg font-bold text-ink-200 mb-1">No Active Quests</h3>
          <p className="text-xs sm:text-sm text-ink-400 mb-5 max-w-xs mx-auto">
            Your journey starts with a single goal. Create your first real-world task.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-1.5 text-sm font-semibold rounded-2xl shadow-ios-md"
          >
            <Plus className="w-4 h-4" />
            Create Your First Quest
          </button>
        </div>
      )}
    </div>
  );
}
