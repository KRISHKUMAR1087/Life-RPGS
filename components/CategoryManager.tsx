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
} from 'lucide-react';
import type { Quest } from '@/lib/supabase';
import {
  CATEGORIES,
  CUSTOM_CATEGORY_ICONS,
  getCategory,
  getDifficulty,
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

  const allCategories = [...CATEGORIES, ...customCategories];

  function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;

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

  const categoryStats = allCategories.map((cat) => {
    const catQuests = quests.filter((q) => q.category === cat.key);
    const active = catQuests.filter((q) => q.status === 'active');
    const completed = catQuests.filter((q) => q.status === 'completed');
    const earnedXp = completed.reduce((sum, q) => sum + getDifficulty(q.difficulty).xp, 0);

    return {
      category: cat,
      totalQuests: catQuests.length,
      activeQuests: active.length,
      completedQuests: completed.length,
      earnedXp,
      quests: catQuests,
    };
  });

  const selectedStats = selectedCategoryKey
    ? categoryStats.find((s) => s.category.key === selectedCategoryKey)
    : null;

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
              Organize your quests into specialized skill categories or create your own custom domains.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Custom Category
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
                className="text-ink-400 hover:text-ink-200"
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
                  className="input-field text-sm"
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
                  className="input-field text-sm"
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
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                            : 'bg-ink-850 border-ink-800 text-ink-400 hover:border-ink-700'
                        }`}
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
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        selectedColorIdx === idx ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs flex items-center gap-1">
                  <Check className="w-4 h-4" /> Save Category
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryStats.map(({ category, totalQuests, activeQuests, completedQuests, earnedXp }) => {
          const Icon = category.icon;
          const isSelected = selectedCategoryKey === category.key;

          return (
            <div
              key={category.key}
              className={`rpg-card p-5 border transition-all relative group cursor-pointer ${
                isSelected
                  ? `${category.borderColor} shadow-lg ring-1 ring-gold-500/30`
                  : 'border-ink-800 hover:border-ink-700'
              }`}
              onClick={() => setSelectedCategoryKey(isSelected ? null : category.key)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl ${category.bgColor} ${category.borderColor} border flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${category.textColor}`} />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-ink-200 flex items-center gap-1.5">
                      {category.label}
                      {category.isCustom && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold-500/30 text-gold-400">
                          Custom
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-ink-400 line-clamp-1">{category.description}</p>
                  </div>
                </div>

                {category.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCategory(category.key);
                      if (selectedCategoryKey === category.key) setSelectedCategoryKey(null);
                    }}
                    className="text-ink-500 hover:text-flame-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete custom category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

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
                  className="inline-flex items-center gap-1 text-gold-400 hover:text-gold-300 transition-colors"
                >
                  View Quests <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Quest Detail Section if selected */}
      {selectedStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rpg-card p-5 border border-ink-800 bg-ink-900 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-ink-800 pb-3">
            <h3 className="font-heading text-base font-bold text-ink-200 flex items-center gap-2">
              Quests in &ldquo;{selectedStats.category.label}&rdquo; ({selectedStats.quests.length})
            </h3>
            <button
              type="button"
              onClick={() => setSelectedCategoryKey(null)}
              className="text-xs text-ink-400 hover:text-ink-200"
            >
              Close
            </button>
          </div>

          {selectedStats.quests.length === 0 ? (
            <p className="text-xs text-ink-400 text-center py-6">No quests created under this category yet.</p>
          ) : (
            <div className="space-y-2">
              {selectedStats.quests.map((quest) => {
                const difficulty = getDifficulty(quest.difficulty);
                const isCompleted = quest.status === 'completed';
                return (
                  <div
                    key={quest.id}
                    className="p-3 rounded-xl border border-ink-800 bg-ink-850/60 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className={`text-sm font-semibold ${isCompleted ? 'line-through text-ink-500' : 'text-ink-200'}`}>
                        {quest.title}
                      </h4>
                      {quest.description && (
                        <p className="text-xs text-ink-400">{quest.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-lg border ${difficulty.badge}`}>
                        +{difficulty.xp} XP
                      </span>
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => onCompleteQuest(quest)}
                          disabled={completingId === quest.id}
                          className="w-8 h-8 rounded-lg bg-emerald2-500/10 border border-emerald2-500/30 text-emerald2-400 flex items-center justify-center hover:bg-emerald2-500/20"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteQuest(quest.id)}
                        className="w-8 h-8 rounded-lg bg-ink-900 border border-ink-800 text-ink-400 flex items-center justify-center hover:text-flame-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
