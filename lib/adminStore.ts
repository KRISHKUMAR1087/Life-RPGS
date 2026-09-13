import type { Profile, Quest, ShopItem } from './supabase';
import { SEED_SHOP_ITEMS, loadLocalQuests, saveLocalQuests } from './localStore';

export type AdminAuditLog = {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  details: string;
};

export type AdminBossConfig = {
  name: string;
  title: string;
  maxHp: number;
  currentHp: number;
  avatar: string;
  quote: string;
  lootXp: number;
  lootGold: number;
};

const ADMIN_KEYS = {
  PROFILES: 'life_rpg_admin_profiles',
  SHOP_ITEMS: 'life_rpg_admin_shop_items',
  BOSS_CONFIG: 'life_rpg_admin_boss_config',
  AUDIT_LOGS: 'life_rpg_admin_audit_logs',
};

export function getAdminBossConfig(): AdminBossConfig {
  if (typeof window === 'undefined') {
    return {
      name: 'Malakor the Sloth Wyrm',
      title: 'Bane of Procrastination & Lord of Delay',
      maxHp: 500,
      currentHp: 500,
      avatar: '🐉',
      quote: '"You will never conquer your daily scrolls of fate..."',
      lootXp: 150,
      lootGold: 50,
    };
  }

  const raw = localStorage.getItem(ADMIN_KEYS.BOSS_CONFIG);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  const initial: AdminBossConfig = {
    name: 'Malakor the Sloth Wyrm',
    title: 'Bane of Procrastination & Lord of Delay',
    maxHp: 500,
    currentHp: 500,
    avatar: '🐉',
    quote: '"You will never conquer your daily scrolls of fate..."',
    lootXp: 150,
    lootGold: 50,
  };
  saveAdminBossConfig(initial);
  return initial;
}

export function saveAdminBossConfig(config: AdminBossConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_KEYS.BOSS_CONFIG, JSON.stringify(config));
}

export function getAdminShopItems(): ShopItem[] {
  if (typeof window === 'undefined') return SEED_SHOP_ITEMS;
  const raw = localStorage.getItem(ADMIN_KEYS.SHOP_ITEMS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  saveAdminShopItems(SEED_SHOP_ITEMS);
  return SEED_SHOP_ITEMS;
}

export function saveAdminShopItems(items: ShopItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_KEYS.SHOP_ITEMS, JSON.stringify(items));
}

export function getAdminAuditLogs(): AdminAuditLog[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(ADMIN_KEYS.AUDIT_LOGS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return [];
}

export function addAdminAuditLog(action: string, target: string, details: string): void {
  if (typeof window === 'undefined') return;
  const logs = getAdminAuditLogs();
  const newLog: AdminAuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    target,
    details,
  };
  localStorage.setItem(ADMIN_KEYS.AUDIT_LOGS, JSON.stringify([newLog, ...logs.slice(0, 49)]));
}

export function getAdminUserProfiles(): Profile[] {
  if (typeof window === 'undefined') return [];
  const demoRaw = localStorage.getItem('life_rpg_demo_profile');
  const demoProfile: Profile | null = demoRaw ? JSON.parse(demoRaw) : null;

  const adminProfilesRaw = localStorage.getItem(ADMIN_KEYS.PROFILES);
  let adminProfiles: Profile[] = [];
  if (adminProfilesRaw) {
    try {
      adminProfiles = JSON.parse(adminProfilesRaw);
    } catch {
      // fallback
    }
  }

  const map = new Map<string, Profile>();
  if (demoProfile) map.set(demoProfile.id, demoProfile);
  adminProfiles.forEach((p) => map.set(p.id, p));

  return Array.from(map.values());
}

export function saveAdminUserProfile(profile: Profile): void {
  if (typeof window === 'undefined') return;
  const profiles = getAdminUserProfiles();
  const updated = profiles.map((p) => (p.id === profile.id ? profile : p));
  if (!profiles.some((p) => p.id === profile.id)) {
    updated.push(profile);
  }

  localStorage.setItem(ADMIN_KEYS.PROFILES, JSON.stringify(updated));

  // If modifying demo user, update demo key as well
  if (profile.id === 'demo-hero') {
    localStorage.setItem('life_rpg_demo_profile', JSON.stringify(profile));
  }

  addAdminAuditLog('UPDATE_PROFILE', profile.username, `Updated level to ${profile.level}, gold to ${profile.gold}`);
}

export function deleteAdminUserProfile(userId: string): void {
  if (typeof window === 'undefined') return;
  const profiles = getAdminUserProfiles();
  const target = profiles.find((p) => p.id === userId);
  const updated = profiles.filter((p) => p.id !== userId);

  localStorage.setItem(ADMIN_KEYS.PROFILES, JSON.stringify(updated));
  if (userId === 'demo-hero') {
    localStorage.removeItem('life_rpg_demo_profile');
    localStorage.removeItem('life_rpg_demo_quests');
    localStorage.removeItem('life_rpg_demo_inventory');
  }

  addAdminAuditLog('DELETE_USER', target?.username || userId, `Deleted user account ID ${userId}`);
}

export function getAdminAllQuests(): Quest[] {
  if (typeof window === 'undefined') return [];
  return loadLocalQuests();
}

export function deleteAdminQuest(questId: string): void {
  const quests = loadLocalQuests();
  const target = quests.find((q) => q.id === questId);
  const updated = quests.filter((q) => q.id !== questId);
  saveLocalQuests(updated);
  addAdminAuditLog('DELETE_QUEST', target?.title || questId, `Deleted quest ID ${questId}`);
}

export function createSystemQuest(quest: {
  title: string;
  description: string;
  category: string;
  difficulty: string;
}): Quest {
  const quests = loadLocalQuests();
  const newQuest: Quest = {
    id: `quest-system-${Date.now()}`,
    user_id: 'demo-hero',
    title: quest.title,
    description: quest.description || null,
    category: quest.category,
    difficulty: quest.difficulty,
    status: 'active',
    completed_at: null,
    quest_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  };

  saveLocalQuests([newQuest, ...quests]);
  addAdminAuditLog('CREATE_SYSTEM_QUEST', quest.title, `Created global quest (${quest.difficulty} - ${quest.category})`);
  return newQuest;
}
