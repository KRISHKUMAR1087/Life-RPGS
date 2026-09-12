'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Target,
  Layers,
  User,
  ShoppingBag,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  supabase,
  type Quest,
  type ShopItem,
  type InventoryItem,
  type CompleteQuestResult,
  type PurchaseResult,
} from '@/lib/supabase';
import {
  loadCustomCategories,
  saveCustomCategories,
  type CategoryConfig,
  type CategoryKey,
  type DifficultyKey,
} from '@/lib/rpg';
import CharacterPanel from '@/components/CharacterPanel';
import QuestBoard from '@/components/QuestBoard';
import Shop from '@/components/Shop';
import CategoryManager from '@/components/CategoryManager';
import LevelUpOverlay from '@/components/LevelUpOverlay';
import FloatingRewards, { type FloatingReward } from '@/components/FloatingRewards';
import ThemeToggle from '@/components/ThemeToggle';
import OfflineBanner, { useOnlineStatus } from '@/components/OfflineBanner';

type TabType = 'dashboard' | 'quests' | 'categories' | 'character' | 'shop';

export default function Dashboard() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const isOnline = useOnlineStatus();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Custom Categories state
  const [customCategories, setCustomCategories] = useState<CategoryConfig[]>([]);
  const [categoryFilterFromManager, setCategoryFilterFromManager] = useState<string | null>(null);

  // Data states
  const [quests, setQuests] = useState<Quest[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [loadingShop, setLoadingShop] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [inFlightAction, setInFlightAction] = useState<Set<string>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Load custom categories for user
  useEffect(() => {
    if (user?.id) {
      const loaded = loadCustomCategories(user.id);
      setCustomCategories(loaded);
    }
  }, [user]);

  // Load quests
  const loadQuests = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        showToast('Failed to load quests.', 'error');
      } else {
        setQuests((data as Quest[]) ?? []);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Network error loading quests.', 'error');
    } finally {
      setLoadingQuests(false);
    }
  }, [user, showToast]);

  // Load shop items
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('shop_items')
          .select('*')
          .order('price', { ascending: true });
        setShopItems((data as ShopItem[]) ?? []);
      } catch (err) {
        console.error('Error loading shop items:', err);
      } finally {
        setLoadingShop(false);
      }
    })();
  }, [user]);

  // Load inventory
  const loadInventory = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('inventory')
        .select('*, shop_items(*)')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });
      setInventory((data as InventoryItem[]) ?? []);
    } catch (err) {
      console.error('Error loading inventory:', err);
    }
  }, [user]);

  useEffect(() => {
    loadQuests();
    loadInventory();
  }, [loadQuests, loadInventory]);

  // Custom Category Handlers
  function handleAddCustomCategory(newCategory: CategoryConfig) {
    if (!user) return;
    const updated = [...customCategories, newCategory];
    setCustomCategories(updated);
    saveCustomCategories(user.id, updated);
    showToast(`Added category: ${newCategory.label}`, 'success');
  }

  function handleDeleteCustomCategory(key: string) {
    if (!user) return;
    const updated = customCategories.filter((c) => c.key !== key);
    setCustomCategories(updated);
    saveCustomCategories(user.id, updated);
    showToast('Category deleted.', 'success');
  }

  // Quest Handlers
  async function handleAddQuest(data: {
    title: string;
    description: string;
    category: CategoryKey;
    difficulty: DifficultyKey;
  }) {
    if (!isOnline) {
      showToast('Cannot add quest while offline.', 'error');
      return;
    }

    const actionKey = `add-${data.title}`;
    if (inFlightAction.has(actionKey)) return;

    setInFlightAction((prev) => new Set(prev).add(actionKey));

    try {
      const { error } = await supabase.from('quests').insert({
        title: data.title,
        description: data.description || null,
        category: data.category,
        difficulty: data.difficulty,
      });

      if (error) throw error;
      await loadQuests();
      showToast('Quest accepted!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create quest.', 'error');
      throw err;
    } finally {
      setInFlightAction((prev) => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  }

  async function handleCompleteQuest(quest: Quest) {
    if (!isOnline) {
      showToast('Cannot complete quest while offline.', 'error');
      return;
    }

    if (completingId === quest.id || inFlightAction.has(quest.id)) return;

    setCompletingId(quest.id);
    setInFlightAction((prev) => new Set(prev).add(quest.id));

    const previousQuests = [...quests];

    setQuests((prev) =>
      prev.map((q) =>
        q.id === quest.id ? { ...q, status: 'completed', completed_at: new Date().toISOString() } : q
      )
    );

    try {
      const { data, error } = await supabase.rpc('complete_quest', {
        p_quest_id: quest.id,
      });

      if (error) throw error;
      const result = data as CompleteQuestResult;
      if (result.error) throw new Error(result.error);

      await refreshProfile();

      const rewards: FloatingReward[] = [
        {
          id: `xp-${quest.id}`,
          text: `+${result.rewards.xp} XP`,
          icon: '✦',
          color: 'border-azure-500/40',
        },
        {
          id: `gold-${quest.id}`,
          text: `+${result.rewards.gold} Gold`,
          icon: '●',
          color: 'border-gold-500/40',
        },
      ];
      setFloatingRewards(rewards);

      if (result.rewards.leveled_up) {
        setLevelUpLevel(result.rewards.new_level);
      }
    } catch (err) {
      setQuests(previousQuests);
      showToast(err instanceof Error ? err.message : 'Failed to complete quest.', 'error');
    } finally {
      setCompletingId(null);
      setInFlightAction((prev) => {
        const next = new Set(prev);
        next.delete(quest.id);
        return next;
      });
    }
  }

  async function handleDeleteQuest(id: string) {
    if (!isOnline) {
      showToast('Cannot abandon quest while offline.', 'error');
      return;
    }

    if (inFlightAction.has(`delete-${id}`)) return;
    setInFlightAction((prev) => new Set(prev).add(`delete-${id}`));

    const previousQuests = [...quests];
    setQuests((prev) => prev.filter((q) => q.id !== id));

    try {
      const { error } = await supabase.from('quests').delete().eq('id', id);
      if (error) throw error;
      showToast('Quest abandoned.', 'success');
    } catch (err) {
      setQuests(previousQuests);
      showToast(err instanceof Error ? err.message : 'Failed to delete quest.', 'error');
    } finally {
      setInFlightAction((prev) => {
        const next = new Set(prev);
        next.delete(`delete-${id}`);
        return next;
      });
    }
  }

  // Shop Handler
  async function handleBuyItem(item: ShopItem) {
    if (!isOnline) {
      showToast('Cannot purchase item while offline.', 'error');
      return;
    }

    const actionKey = `buy-${item.id}`;
    if (inFlightAction.has(actionKey)) return;

    setInFlightAction((prev) => new Set(prev).add(actionKey));

    const previousInventory = [...inventory];

    try {
      const { data, error } = await supabase.rpc('purchase_item', {
        p_item_id: item.id,
      });

      if (error) throw error;
      const result = data as PurchaseResult;
      if (result.error) throw new Error(result.error);

      await Promise.all([refreshProfile(), loadInventory()]);
      showToast(`Purchased ${item.name}!`, 'success');
    } catch (err) {
      setInventory(previousInventory);
      showToast(err instanceof Error ? err.message : 'Purchase failed.', 'error');
    } finally {
      setInFlightAction((prev) => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ink-950">
        <div className="space-y-4 w-full max-w-md text-center">
          <div className="loading-skeleton w-20 h-20 rounded-2xl mx-auto" />
          <div className="loading-skeleton h-6 w-48 rounded-lg mx-auto" />
          <div className="loading-skeleton h-4 w-64 rounded-lg mx-auto" />
        </div>
      </div>
    );
  }

  const NAV_ITEMS: Array<{ id: TabType; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'quests', label: 'Quest Board', icon: Target },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'character', label: 'Character', icon: User },
    { id: 'shop', label: 'Armory Shop', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-ink-950 relative flex flex-col">
      <OfflineBanner />

      {/* Ambient background */}
      <div className="fixed inset-0 bg-radial-fade pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 ios-glass border-b border-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-ios-sm">
              <Swords className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="font-heading text-base font-extrabold text-ink-200 leading-none">LifeQuest</h1>
              <p className="text-[11px] text-ink-500 mt-0.5 hidden sm:block">RPG Productivity Engine</p>
            </div>
          </div>

          {/* Desktop Navigation Menu Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-ink-900/80 border border-ink-800/80 p-1 rounded-2xl shadow-inner">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all relative ${
                    isActive
                      ? 'bg-ink-800 text-gold-400 shadow-sm border border-gold-500/30'
                      : 'text-ink-400 hover:text-ink-200 hover:bg-ink-850/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controls & Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <span className="text-ink-400">Hero:</span>
              <span className="font-semibold text-gold-400">{profile.username}</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold">
                Lvl {profile.level}
              </span>
            </div>

            <ThemeToggle />

            <button
              type="button"
              onClick={signOut}
              className="btn-ghost flex items-center gap-1.5 text-xs py-2 px-3"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden btn-ghost p-2"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-ink-800 bg-ink-900 px-4 py-3 space-y-1"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                      isActive
                        ? 'bg-ink-800 text-gold-400 border border-gold-500/30'
                        : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Tab Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
            {/* Sidebar Overview */}
            <div className="space-y-6">
              <CharacterPanel profile={profile} />
              <div className="rpg-card p-5 border border-ink-800 bg-ink-900 space-y-3">
                <h3 className="font-heading text-sm font-bold text-ink-200 flex items-center justify-between">
                  <span>Quick Stats</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('character')}
                    className="text-xs text-gold-400 hover:underline"
                  >
                    View All
                  </button>
                </h3>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-ink-850 border border-ink-800">
                    <p className="text-[10px] text-ink-400 uppercase font-semibold">Total Gold</p>
                    <p className="font-extrabold text-gold-400 text-sm mt-0.5">{profile.gold}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-ink-850 border border-ink-800">
                    <p className="text-[10px] text-ink-400 uppercase font-semibold">Categories</p>
                    <p className="font-extrabold text-azure-400 text-sm mt-0.5">
                      {5 + customCategories.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Main View */}
            <div className="space-y-6">
              <QuestBoard
                quests={quests}
                loading={loadingQuests}
                customCategories={customCategories}
                onAdd={handleAddQuest}
                onComplete={handleCompleteQuest}
                onDelete={handleDeleteQuest}
                completingId={completingId}
              />
            </div>
          </div>
        )}

        {activeTab === 'quests' && (
          <div className="max-w-4xl mx-auto">
            <QuestBoard
              quests={quests}
              loading={loadingQuests}
              customCategories={customCategories}
              initialCategoryFilter={categoryFilterFromManager}
              onAdd={handleAddQuest}
              onComplete={handleCompleteQuest}
              onDelete={handleDeleteQuest}
              completingId={completingId}
            />
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="max-w-5xl mx-auto">
            <CategoryManager
              quests={quests}
              customCategories={customCategories}
              onAddCategory={handleAddCustomCategory}
              onDeleteCategory={handleDeleteCustomCategory}
              onSelectCategoryFilter={(catKey) => {
                setCategoryFilterFromManager(catKey);
                setActiveTab('quests');
              }}
              onCompleteQuest={handleCompleteQuest}
              onDeleteQuest={handleDeleteQuest}
              completingId={completingId}
            />
          </div>
        )}

        {activeTab === 'character' && (
          <div className="max-w-2xl mx-auto">
            <CharacterPanel profile={profile} />
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="max-w-4xl mx-auto">
            <Shop
              shopItems={shopItems}
              inventory={inventory}
              profile={profile}
              onBuy={handleBuyItem}
              loading={loadingShop}
            />
          </div>
        )}
      </main>

      {/* Level up overlay */}
      <LevelUpOverlay level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />

      {/* Floating rewards */}
      <FloatingRewards rewards={floatingRewards} onClear={() => setFloatingRewards([])} />

      {/* Toast notification region */}
      <div role="status" aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className={`fixed bottom-6 left-1/2 z-50 px-4 py-2.5 rounded-lg border backdrop-blur-md text-sm font-medium shadow-xl ${
                toast.type === 'success'
                  ? 'bg-emerald2-500/15 border-emerald2-500/40 text-emerald2-400'
                  : 'bg-flame-500/15 border-flame-500/40 text-flame-400'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
