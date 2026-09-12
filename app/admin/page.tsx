'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  Swords,
  ShoppingBag,
  Flame,
  FileText,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  X,
  Coins,
  Star,
  Trophy,
  Crown,
  Sparkles,
  Zap,
  Globe,
  RefreshCw,
  SlidersHorizontal,
  Save,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
  getAdminUserProfiles,
  saveAdminUserProfile,
  deleteAdminUserProfile,
  getAdminAllQuests,
  deleteAdminQuest,
  createSystemQuest,
  getAdminShopItems,
  saveAdminShopItems,
  getAdminBossConfig,
  saveAdminBossConfig,
  getAdminAuditLogs,
  addAdminAuditLog,
  type AdminBossConfig,
  type AdminAuditLog,
} from '@/lib/adminStore';
import type { Profile, Quest, ShopItem } from '@/lib/supabase';
import { CATEGORIES, DIFFICULTIES } from '@/lib/rpg';

type AdminTab = 'overview' | 'users' | 'quests' | 'shop' | 'boss' | 'logs';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { adminUser, isAdminAuthenticated, loading, logoutAdmin } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Data states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [bossConfig, setBossConfig] = useState<AdminBossConfig>(getAdminBossConfig());
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Search & Filter states
  const [userSearch, setUserSearch] = useState('');
  const [questSearch, setQuestSearch] = useState('');
  const [questCategoryFilter, setQuestCategoryFilter] = useState('all');
  const [shopSearch, setShopSearch] = useState('');

  // Modals & Editing states
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showCreateQuestModal, setShowCreateQuestModal] = useState(false);
  const [showCreateShopItemModal, setShowCreateShopItemModal] = useState(false);

  // Form states for Create System Quest
  const [sysQuestTitle, setSysQuestTitle] = useState('');
  const [sysQuestDesc, setSysQuestDesc] = useState('');
  const [sysQuestCat, setSysQuestCat] = useState('strength');
  const [sysQuestDiff, setSysQuestDiff] = useState('medium');

  // Form states for Create Shop Item
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(150);
  const [newItemType, setNewItemType] = useState('title');
  const [newItemRarity, setNewItemRarity] = useState('rare');
  const [newItemIcon, setNewItemIcon] = useState('Crown');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showAdminToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Load Data
  const refreshData = () => {
    setProfiles(getAdminUserProfiles());
    setQuests(getAdminAllQuests());
    setShopItems(getAdminShopItems());
    setBossConfig(getAdminBossConfig());
    setAuditLogs(getAdminAuditLogs());
  };

  useEffect(() => {
    if (!isAdminAuthenticated && !loading) {
      router.push('/admin/login');
    } else if (isAdminAuthenticated) {
      refreshData();
    }
  }, [isAdminAuthenticated, loading, router]);

  // Derived Analytics Metrics
  const metrics = useMemo(() => {
    const totalUsers = profiles.length || 1;
    const totalQuests = quests.length;
    const activeQuests = quests.filter((q) => q.status === 'active').length;
    const completedQuests = quests.filter((q) => q.status === 'completed').length;
    const totalGoldInCirculation = profiles.reduce((sum, p) => sum + p.gold, 0);
    const totalXpGenerated = profiles.reduce((sum, p) => sum + p.total_xp, 0);

    return {
      totalUsers,
      totalQuests,
      activeQuests,
      completedQuests,
      totalGoldInCirculation,
      totalXpGenerated,
    };
  }, [profiles, quests]);

  // Filtered Users
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase();
      return p.username.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    });
  }, [profiles, userSearch]);

  // Filtered Quests
  const filteredQuests = useMemo(() => {
    return quests.filter((q) => {
      if (questCategoryFilter !== 'all' && q.category !== questCategoryFilter) return false;
      if (!questSearch.trim()) return true;
      const query = questSearch.toLowerCase();
      return q.title.toLowerCase().includes(query) || (q.description || '').toLowerCase().includes(query);
    });
  }, [quests, questCategoryFilter, questSearch]);

  // Filtered Shop Items
  const filteredShopItems = useMemo(() => {
    return shopItems.filter((item) => {
      if (!shopSearch.trim()) return true;
      const query = shopSearch.toLowerCase();
      return item.name.toLowerCase().includes(query) || item.type.toLowerCase().includes(query);
    });
  }, [shopItems, shopSearch]);

  if (loading || !isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center gap-3 text-ink-400 text-sm">
        <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
        Authenticating Master Admin Session...
      </div>
    );
  }

  // Handle Edit User Profile Save
  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProfile) return;
    saveAdminUserProfile(editingProfile);
    refreshData();
    setEditingProfile(null);
    showAdminToast(`Updated user profile: ${editingProfile.username}`);
  }

  // Handle Delete User Profile
  function handleDeleteProfile(userId: string, username: string) {
    if (confirm(`Are you sure you want to delete user account "${username}"?`)) {
      deleteAdminUserProfile(userId);
      refreshData();
      showAdminToast(`Deleted user account: ${username}`);
    }
  }

  // Handle Delete Quest
  function handleDeleteQuestClick(questId: string, title: string) {
    if (confirm(`Delete quest "${title}"?`)) {
      deleteAdminQuest(questId);
      refreshData();
      showAdminToast(`Deleted quest: ${title}`);
    }
  }

  // Handle Create System Quest
  function handleCreateSystemQuest(e: React.FormEvent) {
    e.preventDefault();
    if (!sysQuestTitle.trim()) return;
    createSystemQuest({
      title: sysQuestTitle.trim(),
      description: sysQuestDesc.trim(),
      category: sysQuestCat,
      difficulty: sysQuestDiff,
    });
    setSysQuestTitle('');
    setSysQuestDesc('');
    setShowCreateQuestModal(false);
    refreshData();
    showAdminToast('Created new global system quest!');
  }

  // Handle Create Shop Item
  function handleCreateShopItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem: ShopItem = {
      id: `item-admin-${Date.now()}`,
      name: newItemName.trim(),
      description: newItemDesc.trim() || 'Exclusive admin item.',
      price: Number(newItemPrice),
      type: newItemType,
      rarity: newItemRarity,
      icon: newItemIcon,
    };
    const updated = [newItem, ...shopItems];
    saveAdminShopItems(updated);
    addAdminAuditLog('CREATE_SHOP_ITEM', newItem.name, `Created ${newItem.rarity} ${newItem.type} for ${newItem.price} G`);
    setNewItemName('');
    setNewItemDesc('');
    setShowCreateShopItemModal(false);
    refreshData();
    showAdminToast(`Added shop item: ${newItem.name}`);
  }

  // Handle Delete Shop Item
  function handleDeleteShopItem(itemId: string, name: string) {
    if (confirm(`Remove item "${name}" from shop?`)) {
      const updated = shopItems.filter((i) => i.id !== itemId);
      saveAdminShopItems(updated);
      addAdminAuditLog('DELETE_SHOP_ITEM', name, `Removed item ID ${itemId}`);
      refreshData();
      showAdminToast(`Removed shop item: ${name}`);
    }
  }

  // Handle Save Boss Config
  function handleSaveBossConfig(e: React.FormEvent) {
    e.preventDefault();
    saveAdminBossConfig(bossConfig);
    addAdminAuditLog('UPDATE_BOSS', bossConfig.name, `Updated HP to ${bossConfig.maxHp}`);
    refreshData();
    showAdminToast('Updated Daily Boss configuration!');
  }

  const ADMIN_NAV: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Platform Analytics', icon: LayoutDashboard },
    { id: 'users', label: 'User Profiles', icon: Users },
    { id: 'quests', label: 'Quest Control', icon: Swords },
    { id: 'shop', label: 'Shop & Items', icon: ShoppingBag },
    { id: 'boss', label: 'Daily Boss Raid', icon: Flame },
    { id: 'logs', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-ink-950 text-ink-200 flex flex-col font-sans relative">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-amber-500 text-ink-950 font-bold text-xs shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Top Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-ink-900/90 border-b border-ink-800 backdrop-blur-xl px-4 sm:px-8 h-16 flex items-center justify-between shadow-ios-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-ios-sm">
            <ShieldAlert className="w-5 h-5 text-ink-950" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-base font-bold text-ink-100">LifeQuest Admin Portal</h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                MASTER CONTROL
              </span>
            </div>
            <p className="text-[11px] text-ink-400 font-medium">Logged in as {adminUser?.name || 'Admin'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl border border-ink-750 bg-ink-850 hover:bg-ink-800 text-ink-300 hover:text-ink-100 text-xs font-bold flex items-center gap-1.5 transition-all focus-ring"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>User Portal</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              logoutAdmin();
              router.push('/admin/login');
            }}
            className="px-3 py-1.5 rounded-xl border border-flame-500/40 bg-flame-500/10 text-flame-400 hover:bg-flame-500/20 text-xs font-bold flex items-center gap-1.5 transition-all focus-ring"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Admin</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Admin Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-1 bg-ink-900 border border-ink-800 p-3 rounded-3xl h-fit shadow-ios-md">
          <div className="text-[10px] uppercase font-bold tracking-wider text-ink-500 px-3 py-2">
            Navigation Menu
          </div>
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all focus-ring ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-ink-400 hover:text-ink-200 hover:bg-ink-850'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {/* TAB 1: Platform Analytics Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="rpg-card p-6 border border-ink-800 bg-ink-900 rounded-3xl space-y-4 shadow-ios-md">
                    <h2 className="text-lg font-bold text-ink-100 flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-amber-500" /> Platform Metrics Overview
                    </h2>

                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-ink-850 p-4 rounded-2xl border border-ink-800 text-center">
                        <Users className="w-5 h-5 text-azure-400 mx-auto mb-1" />
                        <span className="text-xs text-ink-400 font-medium">Total Registered Heroes</span>
                        <p className="text-2xl font-extrabold text-ink-100 tabular-nums">{metrics.totalUsers}</p>
                      </div>

                      <div className="bg-ink-850 p-4 rounded-2xl border border-ink-800 text-center">
                        <Swords className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                        <span className="text-xs text-ink-400 font-medium">Total Active Quests</span>
                        <p className="text-2xl font-extrabold text-amber-400 tabular-nums">{metrics.activeQuests}</p>
                      </div>

                      <div className="bg-ink-850 p-4 rounded-2xl border border-ink-800 text-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald2-400 mx-auto mb-1" />
                        <span className="text-xs text-ink-400 font-medium">Completed Quests</span>
                        <p className="text-2xl font-extrabold text-emerald2-400 tabular-nums">{metrics.completedQuests}</p>
                      </div>

                      <div className="bg-ink-850 p-4 rounded-2xl border border-ink-800 text-center">
                        <Coins className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                        <span className="text-xs text-ink-400 font-medium">Gold in Circulation</span>
                        <p className="text-2xl font-extrabold text-amber-500 tabular-nums">{metrics.totalGoldInCirculation}</p>
                      </div>

                      <div className="bg-ink-850 p-4 rounded-2xl border border-ink-800 text-center">
                        <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                        <span className="text-xs text-ink-400 font-medium">Total XP Generated</span>
                        <p className="text-2xl font-extrabold text-amber-400 tabular-nums">{metrics.totalXpGenerated.toLocaleString()}</p>
                      </div>

                      <div className="bg-ink-850 p-4 rounded-2xl border border-ink-800 text-center">
                        <Flame className="w-5 h-5 text-flame-400 mx-auto mb-1" />
                        <span className="text-xs text-ink-400 font-medium">Daily Boss HP</span>
                        <p className="text-2xl font-extrabold text-flame-400 tabular-nums">{bossConfig.currentHp} / {bossConfig.maxHp}</p>
                      </div>
                    </div>
                  </div>

                  {/* System Status Card */}
                  <div className="rpg-card p-6 border border-ink-800 bg-ink-900 rounded-3xl space-y-3 shadow-ios-md">
                    <h3 className="text-sm font-bold text-ink-200 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" /> System Health Status
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-ink-850 rounded-xl border border-ink-800">
                        <span className="text-ink-300">Authentication Service (Supabase & Local)</span>
                        <span className="text-emerald2-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-ink-850 rounded-xl border border-ink-800">
                        <span className="text-ink-300">Quest State Engine</span>
                        <span className="text-emerald2-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: User Profiles Management */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="rpg-card p-6 border border-ink-800 bg-ink-900 rounded-3xl space-y-4 shadow-ios-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-ink-100 flex items-center gap-2">
                          <Users className="w-5 h-5 text-amber-500" /> User Accounts & RPG Profiles
                        </h2>
                        <p className="text-xs text-ink-400">View and manage registered hero profiles and stats</p>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Search username or ID..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-ink-850 border border-ink-800 text-xs text-ink-100 focus-ring"
                        />
                      </div>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto border border-ink-800 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-ink-850 border-b border-ink-800 text-ink-400 font-semibold">
                            <th className="p-3">Hero / User ID</th>
                            <th className="p-3">Level & Rank</th>
                            <th className="p-3">Gold</th>
                            <th className="p-3">Streak</th>
                            <th className="p-3">Total XP</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-800/60">
                          {filteredProfiles.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-ink-500">
                                No user profiles found matching filter.
                              </td>
                            </tr>
                          ) : (
                            filteredProfiles.map((p) => (
                              <tr key={p.id} className="hover:bg-ink-850/40 transition-colors">
                                <td className="p-3 font-bold text-ink-200">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
                                      {p.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <span>{p.username}</span>
                                      <span className="block text-[10px] text-ink-500 font-mono">{p.id}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 font-semibold text-amber-400">Level {p.level}</td>
                                <td className="p-3 tabular-nums text-amber-500 font-bold">{p.gold} G</td>
                                <td className="p-3 tabular-nums text-flame-400 font-bold">{p.streak} Days</td>
                                <td className="p-3 tabular-nums text-ink-300 font-semibold">{p.total_xp.toLocaleString()} XP</td>
                                <td className="p-3 text-right space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingProfile({ ...p })}
                                    className="p-1.5 rounded-lg bg-ink-850 border border-ink-750 text-amber-400 hover:bg-amber-500/20 transition-all focus-ring"
                                    title="Edit user profile"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProfile(p.id, p.username)}
                                    className="p-1.5 rounded-lg bg-ink-850 border border-ink-750 text-flame-400 hover:bg-flame-500/20 transition-all focus-ring"
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Quest Control & Management */}
              {activeTab === 'quests' && (
                <div className="space-y-6">
                  <div className="rpg-card p-6 border border-ink-800 bg-ink-900 rounded-3xl space-y-4 shadow-ios-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-ink-100 flex items-center gap-2">
                          <Swords className="w-5 h-5 text-amber-500" /> Platform Quest Control
                        </h2>
                        <p className="text-xs text-ink-400">View all active & completed quests across all users</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCreateQuestModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 text-ink-950 font-bold text-xs hover:bg-amber-400 transition-all focus-ring flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Create System Quest
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-[180px]">
                        <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={questSearch}
                          onChange={(e) => setQuestSearch(e.target.value)}
                          placeholder="Search quest title..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-ink-850 border border-ink-800 text-xs text-ink-100 focus-ring"
                        />
                      </div>

                      <select
                        value={questCategoryFilter}
                        onChange={(e) => setQuestCategoryFilter(e.target.value)}
                        className="bg-ink-850 border border-ink-800 rounded-xl px-3 py-1.5 text-xs text-ink-300 focus-ring cursor-pointer"
                      >
                        <option value="all">All Categories</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quest list table */}
                    <div className="overflow-x-auto border border-ink-800 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-ink-850 border-b border-ink-800 text-ink-400 font-semibold">
                            <th className="p-3">Quest Title</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Difficulty</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-800/60">
                          {filteredQuests.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-ink-500">
                                No quests found under current filter.
                              </td>
                            </tr>
                          ) : (
                            filteredQuests.map((q) => (
                              <tr key={q.id} className="hover:bg-ink-850/40 transition-colors">
                                <td className="p-3 font-bold text-ink-200">
                                  <span>{q.title}</span>
                                  {q.description && (
                                    <span className="block text-[10px] text-ink-400 font-normal line-clamp-1">{q.description}</span>
                                  )}
                                </td>
                                <td className="p-3 capitalize font-semibold text-ink-300">{q.category}</td>
                                <td className="p-3 capitalize font-semibold text-amber-400">{q.difficulty}</td>
                                <td className="p-3 font-bold">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                                      q.status === 'completed'
                                        ? 'bg-emerald2-500/20 text-emerald2-400 border border-emerald2-500/30'
                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    }`}
                                  >
                                    {q.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuestClick(q.id, q.title)}
                                    className="p-1.5 rounded-lg bg-ink-850 border border-ink-750 text-flame-400 hover:bg-flame-500/20 transition-all focus-ring"
                                    title="Delete quest"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Shop & Economy Management */}
              {activeTab === 'shop' && (
                <div className="space-y-6">
                  <div className="rpg-card p-6 border border-ink-800 bg-ink-900 rounded-3xl space-y-4 shadow-ios-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-ink-100 flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-amber-500" /> Shop Inventory & Economy
                        </h2>
                        <p className="text-xs text-ink-400">Manage available titles, badges, and avatar frames in the shop</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCreateShopItemModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 text-ink-950 font-bold text-xs hover:bg-amber-400 transition-all focus-ring flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Add New Shop Item
                      </button>
                    </div>

                    {/* Shop Table */}
                    <div className="overflow-x-auto border border-ink-800 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-ink-850 border-b border-ink-800 text-ink-400 font-semibold">
                            <th className="p-3">Item Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Rarity</th>
                            <th className="p-3">Price</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-800/60">
                          {filteredShopItems.map((item) => (
                            <tr key={item.id} className="hover:bg-ink-850/40 transition-colors">
                              <td className="p-3 font-bold text-ink-200">
                                <span>{item.name}</span>
                                {item.description && (
                                  <span className="block text-[10px] text-ink-400 font-normal">{item.description}</span>
                                )}
                              </td>
                              <td className="p-3 capitalize font-semibold text-ink-300">{item.type}</td>
                              <td className="p-3 capitalize font-bold text-amber-400">{item.rarity}</td>
                              <td className="p-3 tabular-nums font-bold text-amber-500">{item.price} G</td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteShopItem(item.id, item.name)}
                                  className="p-1.5 rounded-lg bg-ink-850 border border-ink-750 text-flame-400 hover:bg-flame-500/20 transition-all focus-ring"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Daily Boss Configuration */}
              {activeTab === 'boss' && (
                <div className="space-y-6">
                  <form onSubmit={handleSaveBossConfig} className="rpg-card p-6 border border-ink-800 bg-ink-900 rounded-3xl space-y-5 shadow-ios-md">
                    <div className="flex items-center justify-between border-b border-ink-800 pb-3">
                      <div>
                        <h2 className="text-lg font-bold text-ink-100 flex items-center gap-2">
                          <Flame className="w-5 h-5 text-flame-500" /> Daily Realm Boss Parameters
                        </h2>
                        <p className="text-xs text-ink-400">Configure global raid boss stats and victory loot</p>
                      </div>
                      <span className="text-3xl">{bossConfig.avatar}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-ink-300 mb-1">Boss Name</label>
                        <input
                          type="text"
                          value={bossConfig.name}
                          onChange={(e) => setBossConfig({ ...bossConfig, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-ink-850 border border-ink-750 text-xs text-ink-100 focus-ring"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink-300 mb-1">Boss Title</label>
                        <input
                          type="text"
                          value={bossConfig.title}
                          onChange={(e) => setBossConfig({ ...bossConfig, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-ink-850 border border-ink-750 text-xs text-ink-100 focus-ring"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink-300 mb-1">Max Health Pool (HP)</label>
                        <input
                          type="number"
                          value={bossConfig.maxHp}
                          onChange={(e) => setBossConfig({ ...bossConfig, maxHp: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-ink-850 border border-ink-750 text-xs text-ink-100 focus-ring"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink-300 mb-1">Victory XP Loot</label>
                        <input
                          type="number"
                          value={bossConfig.lootXp}
                          onChange={(e) => setBossConfig({ ...bossConfig, lootXp: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-ink-850 border border-ink-750 text-xs text-ink-100 focus-ring"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink-300 mb-1">Victory Gold Loot</label>
                        <input
                          type="number"
                          value={bossConfig.lootGold}
                          onChange={(e) => setBossConfig({ ...bossConfig, lootGold: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-ink-850 border border-ink-750 text-xs text-ink-100 focus-ring"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink-300 mb-1">Boss Quote / Taunt</label>
                        <input
                          type="text"
                          value={bossConfig.quote}
                          onChange={(e) => setBossConfig({ ...bossConfig, quote: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-ink-850 border border-ink-750 text-xs text-ink-100 focus-ring"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const reset = { ...bossConfig, currentHp: bossConfig.maxHp };
                          setBossConfig(reset);
                          saveAdminBossConfig(reset);
                          showAdminToast('Reset Boss HP to 100%');
                        }}
                        className="px-4 py-2 rounded-xl border border-ink-750 bg-ink-850 text-ink-300 hover:text-ink-100 text-xs font-bold transition-all focus-ring"
                      >
                        Reset Boss HP
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-amber-500 text-ink-950 font-bold text-xs hover:bg-amber-400 transition-all focus-ring shadow-sm flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" /> Save Boss Parameters
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 6: Audit Logs */}
              {activeTab === 'logs' && (
                <div className="space-y-6">
                  <div className="rpg-card p-6 border border-ink-800 bg-ink-900 rounded-3xl space-y-4 shadow-ios-md">
                    <h2 className="text-lg font-bold text-ink-100 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-500" /> Administrative Audit Trail
                    </h2>

                    <div className="overflow-x-auto border border-ink-800 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-ink-850 border-b border-ink-800 text-ink-400 font-semibold">
                            <th className="p-3">Timestamp</th>
                            <th className="p-3">Action</th>
                            <th className="p-3">Target Symbol</th>
                            <th className="p-3">Audit Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-800/60">
                          {auditLogs.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-ink-500">
                                No admin actions recorded yet.
                              </td>
                            </tr>
                          ) : (
                            auditLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-ink-850/40 transition-colors">
                                <td className="p-3 text-ink-400 font-mono text-[11px]">
                                  {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-3 font-bold text-amber-400">{log.action}</td>
                                <td className="p-3 font-semibold text-ink-200">{log.target}</td>
                                <td className="p-3 text-ink-300">{log.details}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Edit User Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.form
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onSubmit={handleSaveProfile}
            className="bg-ink-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <h3 className="font-bold text-sm text-ink-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" /> Edit Profile: {editingProfile.username}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="text-ink-400 hover:text-ink-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-ink-400 mb-1 font-semibold">Level</label>
                <input
                  type="number"
                  value={editingProfile.level}
                  onChange={(e) => setEditingProfile({ ...editingProfile, level: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                />
              </div>

              <div>
                <label className="block text-ink-400 mb-1 font-semibold">Gold</label>
                <input
                  type="number"
                  value={editingProfile.gold}
                  onChange={(e) => setEditingProfile({ ...editingProfile, gold: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                />
              </div>

              <div>
                <label className="block text-ink-400 mb-1 font-semibold">Current Streak</label>
                <input
                  type="number"
                  value={editingProfile.streak}
                  onChange={(e) => setEditingProfile({ ...editingProfile, streak: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                />
              </div>

              <div>
                <label className="block text-ink-400 mb-1 font-semibold">Total XP</label>
                <input
                  type="number"
                  value={editingProfile.total_xp}
                  onChange={(e) => setEditingProfile({ ...editingProfile, total_xp: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="px-4 py-2 rounded-xl border border-ink-750 bg-ink-800 text-ink-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 text-ink-950 font-bold text-xs hover:bg-amber-400"
              >
                Save User Changes
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {/* Create System Quest Modal */}
      {showCreateQuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.form
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onSubmit={handleCreateSystemQuest}
            className="bg-ink-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <h3 className="font-bold text-sm text-ink-100 flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-500" /> Create Global System Quest
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateQuestModal(false)}
                className="text-ink-400 hover:text-ink-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ink-300 mb-1 font-semibold">Quest Title *</label>
                <input
                  type="text"
                  required
                  value={sysQuestTitle}
                  onChange={(e) => setSysQuestTitle(e.target.value)}
                  placeholder="e.g. Realm Festival Quest"
                  className="w-full p-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                />
              </div>

              <div>
                <label className="block text-ink-300 mb-1 font-semibold">Description</label>
                <input
                  type="text"
                  value={sysQuestDesc}
                  onChange={(e) => setSysQuestDesc(e.target.value)}
                  placeholder="Instructions for all adventurers"
                  className="w-full p-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-300 mb-1 font-semibold">Category</label>
                  <select
                    value={sysQuestCat}
                    onChange={(e) => setSysQuestCat(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-ink-300 mb-1 font-semibold">Difficulty</label>
                  <select
                    value={sysQuestDiff}
                    onChange={(e) => setSysQuestDiff(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateQuestModal(false)}
                className="px-4 py-2 rounded-xl border border-ink-750 bg-ink-800 text-ink-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 text-ink-950 font-bold text-xs hover:bg-amber-400"
              >
                Publish System Quest
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {/* Create Shop Item Modal */}
      {showCreateShopItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.form
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onSubmit={handleCreateShopItem}
            className="bg-ink-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <h3 className="font-bold text-sm text-ink-100 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" /> Create Shop Inventory Item
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateShopItemModal(false)}
                className="text-ink-400 hover:text-ink-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ink-300 mb-1 font-semibold">Item Name *</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Master Architect Title"
                  className="w-full p-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                />
              </div>

              <div>
                <label className="block text-ink-300 mb-1 font-semibold">Description</label>
                <input
                  type="text"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Item effects or flavor text"
                  className="w-full p-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-300 mb-1 font-semibold">Gold Price</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                  />
                </div>

                <div>
                  <label className="block text-ink-300 mb-1 font-semibold">Item Type</label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                  >
                    <option value="title">Title</option>
                    <option value="badge">Badge</option>
                    <option value="avatar_frame">Avatar Frame</option>
                    <option value="theme">Theme</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-300 mb-1 font-semibold">Rarity</label>
                  <select
                    value={newItemRarity}
                    onChange={(e) => setNewItemRarity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink-300 mb-1 font-semibold">Icon Symbol</label>
                  <select
                    value={newItemIcon}
                    onChange={(e) => setNewItemIcon(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100"
                  >
                    <option value="Crown">Crown</option>
                    <option value="Sparkles">Sparkles</option>
                    <option value="Shield">Shield</option>
                    <option value="Sword">Sword</option>
                    <option value="Star">Star</option>
                    <option value="Flame">Flame</option>
                    <option value="Gem">Gem</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateShopItemModal(false)}
                className="px-4 py-2 rounded-xl border border-ink-750 bg-ink-800 text-ink-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 text-ink-950 font-bold text-xs hover:bg-amber-400"
              >
                Add to Shop
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
}
