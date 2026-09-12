'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Flame,
  History,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  TrendingUp,
  UserCog,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  supabase,
  type Profile,
  type Quest,
  type ShopItem,
  type InventoryItem,
  type CompleteQuestResult,
  type PurchaseResult,
} from '@/lib/supabase';
import {
  loadCustomCategories,
  saveCustomCategories,
  formatUsername,
  getISTDateString,
  type CategoryConfig,
  type CategoryKey,
  type DifficultyKey,
} from '@/lib/rpg';
import {
  SEED_SHOP_ITEMS,
  loadLocalQuests,
  saveLocalQuests,
  loadLocalInventory,
  loadLocalProfile,
  completeLocalQuest,
  purchaseLocalItem,
  editLocalQuest,
  toggleEquipLocalItem,
  addLocalVictoryBonus,
  processISTQuestResets,
} from '@/lib/localStore';
import { getAdminShopItems } from '@/lib/adminStore';

import { soundManager } from '@/lib/audio';
import CharacterPanel from '@/components/CharacterPanel';
import QuestBoard from '@/components/QuestBoard';
import Shop from '@/components/Shop';
import CategoryManager from '@/components/CategoryManager';
import ProgressPage from '@/components/ProgressPage';
import ProfilePage from '@/components/ProfilePage';
import Leaderboard from '@/components/Leaderboard';
import OnboardingPage from '@/components/OnboardingPage';
import LevelUpOverlay from '@/components/LevelUpOverlay';
import FloatingRewards, { type FloatingReward } from '@/components/FloatingRewards';
import BossBattle from '@/components/BossBattle';
import MusicPlayer from '@/components/MusicPlayer';
import ThemeToggle from '@/components/ThemeToggle';
import OfflineBanner, { useOnlineStatus } from '@/components/OfflineBanner';

type TabType = 'dashboard' | 'quests' | 'progress' | 'boss' | 'character' | 'shop' | 'categories' | 'profile' | 'chronicles' | 'leaderboard';

export default function Dashboard() {
  const { profile, user, isDemo, signOut, refreshProfile, updateProfileBio } = useAuth();
  const isOnline = useOnlineStatus();
  const isDemoMode = isDemo || user?.id === 'demo-hero';

  // Navigation tab state
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('life_rpg_active_tab') as TabType;
      if (saved === 'chronicles') return 'progress';
      if (saved && ['dashboard', 'quests', 'progress', 'categories', 'boss', 'shop', 'character', 'profile', 'leaderboard'].includes(saved)) {
        return saved;
      }
    }
    return 'dashboard';
  });

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('life_rpg_active_tab', tab);
    }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Custom Categories state
  const [customCategories, setCustomCategories] = useState<CategoryConfig[]>([]);
  const [categoryFilterFromManager, setCategoryFilterFromManager] = useState<string | null>(null);

  // Data states
  const [quests, setQuests] = useState<Quest[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [peerProfiles, setPeerProfiles] = useState<Array<{
    id?: string;
    total_xp: number;
    strength: number;
    intellect: number;
    vitality: number;
    charisma: number;
    dexterity: number;
  }>>([]);
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [loadingShop, setLoadingShop] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [inFlightAction, setInFlightAction] = useState<Set<string>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // 7-day activity map for Dashboard sidebar card
  const weeklyActivityMap = useMemo(() => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const now = new Date();
    const map: Array<{ day: string; count: number; isToday: boolean }> = [];
    const completedQuests = quests.filter((q) => q.status === 'completed');

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = completedQuests.filter((q) => {
        const qDate = (q.completed_at || q.created_at).split('T')[0];
        return qDate === dateStr;
      }).length;

      map.push({
        day: days[d.getDay()],
        count,
        isToday: i === 0,
      });
    }
    return map;
  }, [quests]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      soundManager.playErrorSound();
    }
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    setIsMuted(soundManager.isMuted());
  }, []);

  // Handle Escape key to close mobile menu drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  function toggleAudio() {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
    showToast(nextMuted ? 'Audio sound effects muted.' : 'Audio sound effects unmuted.', 'success');
  }

  // Load custom categories for user
  useEffect(() => {
    if (user?.id) {
      const loaded = loadCustomCategories(user.id);
      setCustomCategories(loaded);
    }
  }, [user]);

  // Load peer profiles for rankings
  useEffect(() => {
    if (!user || isDemoMode) return;
    async function fetchPeers() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, total_xp, strength, intellect, vitality, charisma, dexterity');
        if (data) setPeerProfiles(data);
      } catch {
        // fallback
      }
    }
    fetchPeers();
  }, [user, isDemoMode]);

  // Load quests
  const loadQuests = useCallback(async () => {
    if (!user) return;
    if (isDemoMode) {
      setQuests(loadLocalQuests());
      setLoadingQuests(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        showToast('Failed to load quests.', 'error');
      } else {
        const fetched = (data as Quest[]) ?? [];
        const { updatedQuests } = processISTQuestResets(fetched);
        setQuests(updatedQuests);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Network error loading quests.', 'error');
    } finally {
      setLoadingQuests(false);
    }
  }, [user, isDemoMode, showToast]);

  // Load shop items
  useEffect(() => {
    if (!user) return;
    if (isDemoMode) {
      setShopItems(getAdminShopItems());
      setLoadingShop(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from('shop_items')
          .select('*')
          .order('price', { ascending: true });
        setShopItems((data as ShopItem[]) ?? getAdminShopItems());
      } catch (err) {
        console.error('Error loading shop items:', err);
        setShopItems(getAdminShopItems());
      } finally {
        setLoadingShop(false);
      }
    })();
  }, [user, isDemoMode]);

  // Load inventory
  const loadInventory = useCallback(async () => {
    if (!user) return;
    if (isDemoMode) {
      setInventory(loadLocalInventory());
      return;
    }
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
  }, [user, isDemoMode]);

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
    frequency?: 'one_time' | 'daily' | 'weekly';
  }) {
    if (!isOnline && !isDemoMode) {
      showToast('Cannot add quest while offline.', 'error');
      return;
    }

    const actionKey = `add-${data.title}`;
    if (inFlightAction.has(actionKey)) return;

    // Check if the same quest is already active
    const isDuplicate = quests.some(
      (q) => q.status === 'active' && q.title.trim().toLowerCase() === data.title.trim().toLowerCase()
    );
    if (isDuplicate) {
      showToast(`"${data.title}" is already active in your quest log!`, 'error');
      return;
    }

    setInFlightAction((prev) => new Set(prev).add(actionKey));

    try {
      const questFreq = data.frequency || 'daily';
      if (isDemoMode) {
        const current = loadLocalQuests();
        const newQuest: Quest = {
          id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          user_id: user?.id ?? 'demo-hero',
          title: data.title,
          description: data.description || null,
          category: data.category,
          difficulty: data.difficulty,
          status: 'active',
          frequency: questFreq,
          completed_at: null,
          quest_date: getISTDateString(),
          created_at: new Date().toISOString(),
        };
        const updated = [newQuest, ...current];
        saveLocalQuests(updated);
        setQuests(updated);
        showToast('Quest accepted!', 'success');
        return;
      }

      const { error } = await supabase.from('quests').insert({
        title: data.title,
        description: data.description || null,
        category: data.category,
        difficulty: data.difficulty,
        frequency: questFreq,
        quest_date: getISTDateString(),
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

  async function handleEditQuest(updatedQuest: Quest) {
    if (!isOnline && !isDemoMode) {
      showToast('Cannot edit quest while offline.', 'error');
      return;
    }

    try {
      if (isDemoMode) {
        editLocalQuest(updatedQuest);
        setQuests((prev) => prev.map((q) => (q.id === updatedQuest.id ? updatedQuest : q)));
        showToast('Quest updated!', 'success');
        return;
      }

      const { error } = await supabase
        .from('quests')
        .update({
          title: updatedQuest.title,
          description: updatedQuest.description,
          category: updatedQuest.category,
          difficulty: updatedQuest.difficulty,
          frequency: updatedQuest.frequency || 'one_time',
        })
        .eq('id', updatedQuest.id);

      if (error) throw error;
      await loadQuests();
      showToast('Quest updated!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update quest.', 'error');
      throw err;
    }
  }

  async function handleCompleteQuest(quest: Quest) {
    if (!isOnline && !isDemoMode) {
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
      let result: CompleteQuestResult;

      if (isDemoMode) {
        result = completeLocalQuest(quest.id);
      } else {
        const { data, error } = await supabase.rpc('complete_quest', {
          p_quest_id: quest.id,
        });

        if (error) throw error;
        result = data as CompleteQuestResult;
        if (result.error) throw new Error(result.error);
      }

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
    if (!isOnline && !isDemoMode) {
      showToast('Cannot abandon quest while offline.', 'error');
      return;
    }

    if (inFlightAction.has(`delete-${id}`)) return;
    setInFlightAction((prev) => new Set(prev).add(`delete-${id}`));

    const previousQuests = [...quests];
    setQuests((prev) => prev.filter((q) => q.id !== id));

    try {
      if (isDemoMode) {
        const current = loadLocalQuests();
        const updated = current.filter((q) => q.id !== id);
        saveLocalQuests(updated);
        showToast('Quest abandoned.', 'success');
        return;
      }

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

  // Shop & Equip Handlers
  async function handleBuyItem(item: ShopItem) {
    if (!isOnline && !isDemoMode) {
      showToast('Cannot purchase item while offline.', 'error');
      return;
    }

    const actionKey = `buy-${item.id}`;
    if (inFlightAction.has(actionKey)) return;

    setInFlightAction((prev) => new Set(prev).add(actionKey));
    const previousInventory = [...inventory];

    try {
      if (isDemoMode) {
        const result = purchaseLocalItem(item.id);
        if (result.error) throw new Error(result.error);

        await Promise.all([refreshProfile(), loadInventory()]);
        showToast(`Purchased ${item.name}!`, 'success');
        return;
      }

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

  async function handleToggleEquip(invItem: InventoryItem) {
    if (isDemoMode) {
      toggleEquipLocalItem(invItem.id);
      await loadInventory();
      showToast(
        invItem.equipped
          ? `Unequipped ${invItem.shop_items?.name}`
          : `Equipped ${invItem.shop_items?.name}!`,
        'success'
      );
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory')
        .update({ equipped: !invItem.equipped })
        .eq('id', invItem.id);

      if (error) throw error;
      await loadInventory();
      showToast(
        invItem.equipped
          ? `Unequipped ${invItem.shop_items?.name}`
          : `Equipped ${invItem.shop_items?.name}!`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update equipment.', 'error');
    }
  }

  async function handleClaimBossBonus(bonus: { xp: number; gold: number }) {
    if (isDemoMode) {
      addLocalVictoryBonus(bonus);
      await refreshProfile();
      showToast(`Claimed +${bonus.xp} XP and +${bonus.gold} Gold!`, 'success');
      return;
    }

    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            total_xp: (profile?.total_xp || 0) + bonus.xp,
            gold: (profile?.gold || 0) + bonus.gold,
          })
          .eq('id', user.id);

        if (error) throw error;
        await refreshProfile();
        showToast(`Claimed +${bonus.xp} XP and +${bonus.gold} Gold!`, 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to claim spoils.', 'error');
    }
  }

  const rawProfile: Profile =
    profile ||
    loadLocalProfile(formatUsername(user?.user_metadata?.username || user?.email || 'Hero'));

  const currentProfile: Profile = {
    ...rawProfile,
    username: formatUsername(rawProfile.username),
  };

  // Standalone Full Onboarding Page View (Shown ONLY if onboarding_completed is false; never shown once completed)
  if (!currentProfile.onboarding_completed) {
    return (
      <OnboardingPage
        initialUsername={currentProfile.username}
        initialBio={currentProfile.bio || ''}
        initialCountry={currentProfile.country || 'US'}
        onSubmit={async (data) => {
          const res = await updateProfileBio({
            username: data.username,
            bio: data.bio,
            country: data.country,
            onboarding_completed: true,
          });
          if (res.error) {
            throw new Error(res.error);
          }
          showToast('Hero profile registered successfully! Welcome to the realm.', 'success');
        }}
      />
    );
  }

  const NAV_ITEMS: Array<{ id: TabType; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'quests', label: 'Quests', icon: Target },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'leaderboard', label: 'Rankings', icon: Trophy },
    { id: 'boss', label: 'Boss Raid', icon: Flame },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'character', label: 'Character', icon: User },
    { id: 'profile', label: 'Profile', icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-ink-950 relative flex flex-col font-sans">
      <OfflineBanner />

      {/* Ambient background glows */}
      <div className="fixed inset-0 bg-radial-fade pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header - Floating Top Island Block */}
      <header className="sticky top-0 z-40 px-3 sm:px-6 pt-0 pointer-events-none">
        <div className="pointer-events-auto max-w-7xl mx-auto h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 bg-ink-900/90 dark:bg-ink-900/95 backdrop-blur-xl border-x border-b border-ink-800 rounded-b-2xl sm:rounded-b-3xl shadow-ios-md relative overflow-hidden">
          {/* Subtle permanent accent line spanning the entire bottom border of the whole nav bar */}
          <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />

          {/* Logo Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setActiveTab('dashboard')}
            title="LifeQuest Dashboard"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
              <Swords className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            {isDemoMode && (
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                LOCAL
              </span>
            )}
          </div>

          {/* Desktop Navigation Menu Bar */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1 bg-ink-900/90 dark:bg-ink-900/80 border border-ink-800 p-1 rounded-2xl shadow-inner whitespace-nowrap">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setActiveTab(item.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all focus-ring whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 font-extrabold'
                      : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controls, Music Player, Theme, Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <MusicPlayer onToast={showToast} />

            <ThemeToggle />

            {/* Logout Icon Button in Red */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                signOut();
              }}
              className="p-2 rounded-xl border border-flame-500/30 bg-flame-500/10 text-flame-500 hover:bg-flame-500/20 transition-all focus-ring"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 text-flame-500" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl border border-ink-800 bg-ink-850 text-ink-300 hover:text-ink-100 focus-ring"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
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
              className="pointer-events-auto max-w-7xl mx-auto lg:hidden border-x border-b border-ink-800 bg-ink-900 px-4 py-3 rounded-b-2xl shadow-ios-md mt-1"
            >
              <nav aria-label="Mobile navigation" className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all focus-ring ${
                        isActive
                          ? 'bg-ink-800 text-amber-400 border border-amber-500/30'
                          : 'text-ink-400 hover:text-ink-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Tab Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <CharacterPanel profile={currentProfile} inventory={inventory} variant="horizontal" />

                {/* Dashboard Main Grid: Quests + Boss Glance */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                  {/* Main Column: Quest Board */}
                  <div className="space-y-6">
                    <QuestBoard
                      quests={quests}
                      loading={loadingQuests}
                      customCategories={customCategories}
                      hideUnacceptedBounties={true}
                      onAdd={handleAddQuest}
                      onEdit={handleEditQuest}
                      onComplete={handleCompleteQuest}
                      onDelete={handleDeleteQuest}
                      completingId={completingId}
                    />
                  </div>

                  {/* Side Column: Boss Raid Glance & Activity Quick Peek */}
                  <div className="space-y-6">
                    {/* Boss Battle Glance Card */}
                    <div
                      onClick={() => {
                        soundManager.playClick();
                        setActiveTab('boss');
                      }}
                      className="rpg-card p-5 border border-flame-500/30 bg-gradient-to-br from-flame-500/10 via-ink-900 to-ink-950 rounded-3xl cursor-pointer hover:border-flame-500/50 transition-all shadow-ios-md group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🐉</span>
                          <div>
                            <h4 className="text-xs font-bold text-flame-400 uppercase tracking-wider">
                              Daily Realm Raid
                            </h4>
                            <p className="text-sm font-bold text-ink-200 group-hover:text-amber-400 transition-colors">
                              Malakor the Sloth Wyrm
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">
                          Attack &rarr;
                        </span>
                      </div>
                      <p className="text-xs text-ink-400 font-normal">
                        Complete quests to deal critical strikes and unlock the daily victory chest!
                      </p>
                    </div>

                    {/* Hero Activity Log & 7-Day Weekly Progress Card */}
                    <div
                      onClick={() => {
                        soundManager.playClick();
                        setActiveTab('progress');
                      }}
                      className="rpg-card p-5 border border-ink-800 bg-ink-900 rounded-3xl cursor-pointer hover:border-amber-500/40 transition-all shadow-ios-sm space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            📜
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-ink-200 group-hover:text-amber-400 transition-colors">
                              Hero Activity & Weekly Progress
                            </h4>
                            <p className="text-xs text-ink-400">7-Day Quest Completion Tracker</p>
                          </div>
                        </div>
                        <span className="text-xs text-ink-400 group-hover:text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">
                          &rarr;
                        </span>
                      </div>

                      {/* 7-Day Mini Weekly Progress Bar Bar Chart */}
                      <div className="pt-2.5 border-t border-ink-800/80">
                        <div className="grid grid-cols-7 gap-1.5 items-end h-12 pt-1">
                          {weeklyActivityMap.map((w: { day: string; count: number; isToday: boolean }, idx: number) => {
                            const maxCount = Math.max(...weeklyActivityMap.map((item: { day: string; count: number; isToday: boolean }) => item.count), 1);
                            const fillPercent = Math.max(18, (w.count / maxCount) * 100);
                            return (
                              <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                                <div className="w-full h-8 bg-ink-850 rounded-md flex items-end justify-center p-0.5 relative overflow-hidden border border-ink-800/80">
                                  <div
                                    className={`w-full rounded-sm transition-all ${
                                      w.count > 0
                                        ? w.isToday
                                          ? 'bg-amber-500 shadow-sm'
                                          : 'bg-amber-500/70'
                                        : 'bg-ink-800/40'
                                    }`}
                                    style={{ height: `${fillPercent}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-[9px] font-bold ${
                                    w.isToday ? 'text-amber-400' : 'text-ink-500'
                                  }`}
                                >
                                  {w.day}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'quests' && (
              <div className="max-w-7xl mx-auto">
                <QuestBoard
                  quests={quests}
                  loading={loadingQuests}
                  customCategories={customCategories}
                  initialCategoryFilter={categoryFilterFromManager}
                  onAdd={handleAddQuest}
                  onEdit={handleEditQuest}
                  onComplete={handleCompleteQuest}
                  onDelete={handleDeleteQuest}
                  completingId={completingId}
                />
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="max-w-5xl mx-auto">
                <ProgressPage profile={currentProfile} quests={quests} customCategories={customCategories} peerProfiles={peerProfiles} />
              </div>
            )}

            {activeTab === 'boss' && (
              <div className="max-w-3xl mx-auto">
                <BossBattle
                  quests={quests}
                  profile={currentProfile}
                  onClaimVictoryBonus={handleClaimBossBonus}
                />
              </div>
            )}

            {activeTab === 'character' && (
              <div className="max-w-2xl mx-auto">
                <CharacterPanel profile={currentProfile} inventory={inventory} peerProfiles={peerProfiles} />
              </div>
            )}

            {activeTab === 'shop' && (
              <div className="max-w-4xl mx-auto">
                <Shop
                  shopItems={shopItems}
                  inventory={inventory}
                  profile={currentProfile}
                  onBuy={handleBuyItem}
                  onToggleEquip={handleToggleEquip}
                  loading={loadingShop}
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

            {activeTab === 'profile' && (
              <div className="max-w-5xl mx-auto">
                <ProfilePage inventory={inventory} showToast={showToast} />
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="max-w-5xl mx-auto">
                <Leaderboard profile={currentProfile} quests={quests} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
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
              className={`fixed bottom-6 left-1/2 z-50 px-4 py-2.5 rounded-2xl border backdrop-blur-md text-sm font-semibold shadow-2xl flex items-center gap-3 ${
                toast.type === 'success'
                  ? 'bg-emerald2-500/20 border-emerald2-500/40 text-emerald2-300'
                  : 'bg-flame-500/20 border-flame-500/40 text-flame-300'
              }`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors focus-ring"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
