'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  FolderPlus,
  Sparkles,
  Check,
  X,
  Layers,
  ArrowRight,
  AlertTriangle,
  Filter,
  Crown,
} from 'lucide-react';
import { soundManager } from '@/lib/audio';
import type { Quest } from '@/lib/supabase';
import {
  CATEGORIES,
  CUSTOM_CATEGORY_ICONS,
  getCategory,
  getDifficulty,
  calculateCategoryLevel,
  type CategoryConfig,
} from '@/lib/rpg';

type CategoryManagerProps = {
  quests: Quest[];
  customCategories: CategoryConfig[];
  onAddCategory: (cat: CategoryConfig) => void;
  onDeleteCategory: (key: string) => void;
  onSelectCategoryFilter: (key: string) => void;
  onCompleteQuest: (quest: Quest) => Promise<void>;
  onDeleteQuest: (id: string) => Promise<void>;
  completingId: string | null;
};

const COLOR_PRESETS = [
  { name: 'Amber Gold', hex: '#fbbf24', text: 'text-gold-400', border: 'border-gold-500/40', bg: 'bg-gold-500/10', gradient: 'from-gold-500/20 to-transparent' },
  { name: 'Azure Blue', hex: '#60a5fa', text: 'text-azure-400', border: 'border-azure-500/40', bg: 'bg-azure-500/10', gradient: 'from-azure-500/20 to-transparent' },
  { name: 'Emerald Green', hex: '#34d399', text: 'text-emerald2-400', border: 'border-emerald2-500/40', bg: 'bg-emerald2-500/10', gradient: 'from-emerald2-500/20 to-transparent' },
  { name: 'Flame Red', hex: '#f43f5e', text: 'text-flame-400', border: 'border-flame-500/40', bg: 'bg-flame-500/10', gradient: 'from-flame-500/20 to-transparent' },
  { name: 'Violet Purple', hex: '#a78bfa', text: 'text-violet2-400', border: 'border-violet2-500/40', bg: 'bg-violet2-500/10', gradient: 'from-violet2-500/20 to-transparent' },
];

export default function CategoryManager({
  quests,
  customCategories,
  onAddCategory,
  onDeleteCategory,
  onSelectCategoryFilter,
  onCompleteQuest,
  onDeleteQuest,
  completingId,
}: CategoryManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('Sparkles');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);

  // Category Scope Filter state ('all' | 'platform' | 'custom')
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<'all' | 'platform' | 'custom'>('all');

  // Custom Category Deletion state & modal
  const [deletingCatKey, setDeletingCatKey] = useState<string | null>(null);

  const allCategories = [...CATEGORIES, ...customCategories];

  const filteredCategories = allCategories.filter((cat) => {
    if (categoryTypeFilter === 'platform') return !cat.isCustom;
    if (categoryTypeFilter === 'custom') return !!cat.isCustom;
    return true;
  });

  function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;

    soundManager.playSaveSound();
    const key = label.trim().toLowerCase().replace(/\s+/g, '_');
    const colorPreset = COLOR_PRESETS[selectedColorIdx];
    const Icon = CUSTOM_CATEGORY_ICONS[selectedIconName] ?? Sparkles;

    const newCat: CategoryConfig = {
      key,
      label: label.trim(),
      description: description.trim() || 'User custom category',
      icon: Icon,
      color: colorPreset.hex,
      textColor: colorPreset.text,
      borderColor: colorPreset.border,
      bgColor: colorPreset.bg,
      gradient: colorPreset.gradient,
      isCustom: true,
    };

    onAddCategory(newCat);
    setLabel('');
    setDescription('');
    setShowAddForm(false);
  }

  function handleConfirmDeleteCategory() {
    if (!deletingCatKey) return;
    onDeleteCategory(deletingCatKey);
    if (selectedCategoryKey === deletingCatKey) setSelectedCategoryKey(null);
    setDeletingCatKey(null);
  }

  const categoryStats = filteredCategories.map((cat) => {
    const catQuests = quests.filter((q) => q.category === cat.key);
    const active = catQuests.filter((q) => q.status === 'active');
    const completed = catQuests.filter((q) => q.status === 'completed');
    const earnedXp = completed.reduce((sum, q) => sum + getDifficulty(q.difficulty).xp, 0);
    const levelInfo = calculateCategoryLevel(earnedXp);

    return {
      category: cat,
      totalQuests: catQuests.length,
      activeQuests: active.length,
      completedQuests: completed.length,
      earnedXp,
      levelInfo,
      quests: catQuests,
    };
  });

  const selectedStats = selectedCategoryKey
    ? categoryStats.find((s) => s.category.key === selectedCategoryKey)
    : null;

  const categoryPendingDelete = customCategories.find((c) => c.key === deletingCatKey);
  const pendingDeleteQuestCount = categoryPendingDelete
    ? quests.filter((q) => q.category === categoryPendingDelete.key).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="rpg-card p-6 border border-ink-800 bg-gradient-to-r from-ink-900 to-ink-850 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-gold-400" />
              <h2 className="font-heading text-xl font-bold text-ink-200">Category Hub</h2>
            </div>
            <p className="text-xs text-ink-400 max-w-xl">
              Organize your quests into specialized skill categories. Each category levels up separately as you earn XP in that domain!
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center justify-center gap-2 text-sm focus-ring"
            aria-label="Add custom category"
          >
            <Plus className="w-4 h-4" /> Add Custom Category
          </button>
        </div>
      </div>

      {/* Category Scope Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-ink-850 p-3 rounded-2xl border border-ink-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-ink-300">Category Scope:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCategoryTypeFilter('all')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-semibold transition-all focus-ring ${
              categoryTypeFilter === 'all'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-ink-400 hover:text-ink-200 bg-ink-900/50'
            }`}
          >
            All Domains ({allCategories.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryTypeFilter('platform')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-semibold transition-all focus-ring ${
              categoryTypeFilter === 'platform'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-ink-400 hover:text-ink-200 bg-ink-900/50'
            }`}
          >
            Platform Domains ({CATEGORIES.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryTypeFilter('custom')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-semibold transition-all focus-ring ${
              categoryTypeFilter === 'custom'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-ink-400 hover:text-ink-200 bg-ink-900/50'
            }`}
          >
            Your Categories ({customCategories.length})
          </button>
        </div>
      </div>

      {/* Add Custom Category Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rpg-card p-5 border border-gold-500/40 bg-ink-900 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-gold-400" />
                <h3 className="font-heading text-base font-bold text-ink-200">Create New Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-ink-400 hover:text-ink-200 focus-ring p-1 rounded-lg"
                aria-label="Close create category modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">
                  Category Name <span className="text-flame-400">*</span>
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Finances, Language Learning, Meditation"
                  className="input-field text-sm focus-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of quests in this category"
                  className="input-field text-sm focus-ring"
                />
              </div>

              {/* Icon selector */}
              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">Select Icon</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(CUSTOM_CATEGORY_ICONS).map((iconName) => {
                    const IconComp = CUSTOM_CATEGORY_ICONS[iconName];
                    const isSelected = selectedIconName === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIconName(iconName)}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all focus-ring ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                            : 'bg-ink-850 border-ink-800 text-ink-400 hover:border-ink-700'
                        }`}
                        aria-label={`Select icon ${iconName}`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color preset selector */}
              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">Color Palette</label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedColorIdx(idx)}
                      style={{ backgroundColor: preset.hex }}
                      className={`w-7 h-7 rounded-full border-2 transition-all focus-ring ${
                        selectedColorIdx === idx ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      title={preset.name}
                      aria-label={`Select color preset ${preset.name}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-ghost text-xs focus-ring"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs flex items-center gap-1 focus-ring">
                  <Check className="w-4 h-4" /> Save Category
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Category Warning Confirmation Modal */}
      <AnimatePresence>
        {deletingCatKey && categoryPendingDelete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rpg-card p-5 border border-flame-500/50 bg-ink-900 shadow-2xl space-y-3"
          >
            <div className="flex items-center gap-2.5 text-flame-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-heading text-sm font-bold text-ink-200">
                Confirm Deleting Category &ldquo;{categoryPendingDelete.label}&rdquo;
              </h3>
            </div>

            <p className="text-xs text-ink-300 font-normal leading-relaxed">
              {pendingDeleteQuestCount > 0 ? (
                <>
                  <strong className="text-flame-400">{pendingDeleteQuestCount} quest(s)</strong> currently use this category label.
                  Deleting this category will preserve the label on existing quests, but it will no longer appear in custom category filters or quest creation.
                </>
              ) : (
                <>Are you sure you want to delete this custom category? This action cannot be undone.</>
              )}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCatKey(null)}
                className="btn-ghost text-xs focus-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-4 py-2 bg-flame-500 hover:bg-flame-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 focus-ring"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirm Delete Category
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryStats.map(({ category, totalQuests, activeQuests, completedQuests, earnedXp, levelInfo }) => {
          const Icon = category.icon;
          const isSelected = selectedCategoryKey === category.key;

          return (
            <div
              key={category.key}
              className={`rpg-card p-5 border transition-all relative group cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? `${category.borderColor} shadow-lg ring-1 ring-gold-500/30`
                  : 'border-ink-800 hover:border-ink-700'
              }`}
              onClick={() => setSelectedCategoryKey(isSelected ? null : category.key)}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl ${category.bgColor} ${category.borderColor} border flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${category.textColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-heading text-sm font-bold text-ink-200 truncate">
                          {category.label}
                        </h3>
                        {category.isCustom && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold-500/30 text-gold-400">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-400 line-clamp-1">{category.description}</p>
                    </div>
                  </div>

                  {category.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCatKey(category.key);
                      }}
                      className="text-ink-500 hover:text-flame-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg focus-ring shrink-0"
                      title="Delete custom category"
                      aria-label={`Delete custom category "${category.label}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Per-Category Level Progress Bar */}
                <div className="bg-ink-900/80 rounded-xl p-2.5 border border-ink-800/80 mb-3 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-extrabold text-amber-400 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-500" /> Lvl {levelInfo.level} {levelInfo.title}
                    </span>
                    <span className="text-ink-400 font-medium tabular-nums">
                      {levelInfo.currentXp} / {levelInfo.xpNeeded} XP
                    </span>
                  </div>
                  <div className="h-2 bg-ink-950 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: category.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${levelInfo.percent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-ink-800/60 text-center">
                  <div>
                    <p className="text-[10px] text-ink-400 uppercase tracking-wider font-semibold">Active</p>
                    <p className="text-sm font-extrabold text-ink-200">{activeQuests}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-400 uppercase tracking-wider font-semibold">Done</p>
                    <p className="text-sm font-extrabold text-emerald2-400">{completedQuests}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-400 uppercase tracking-wider font-semibold">XP Earned</p>
                    <p className="text-sm font-extrabold text-azure-400">+{earnedXp}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-ink-400 font-medium">
                  <span>{totalQuests} Total Quests</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategoryFilter(category.key);
                    }}
                    className="inline-flex items-center gap-1 text-gold-400 hover:text-gold-300 transition-colors focus-ring px-1 rounded"
                    aria-label={`View quests in category "${category.label}"`}
                  >
                    View Quests <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
