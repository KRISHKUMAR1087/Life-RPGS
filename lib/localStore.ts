import { xpForLevel, formatUsername, getISTDateString, getISTWeekString, TAVERN_BOUNTIES, type TavernBounty, type DifficultyKey } from './rpg';
import type { Profile, Quest, ShopItem, InventoryItem, CompleteQuestResult, PurchaseResult } from './supabase';

export const SEED_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'item-iron-frame',
    name: 'Iron Frame',
    description: 'A sturdy iron border for your avatar.',
    price: 50,
    type: 'avatar_frame',
    icon: 'Shield',
    rarity: 'common',
  },
  {
    id: 'item-silver-crown',
    name: 'Silver Crown',
    description: 'A gleaming silver crown title.',
    price: 150,
    type: 'title',
    icon: 'Crown',
    rarity: 'rare',
  },
  {
    id: 'item-dragon-badge',
    name: 'Dragon Badge',
    description: 'A legendary dragon emblem badge.',
    price: 500,
    type: 'badge',
    icon: 'Sparkles',
    rarity: 'epic',
  },
  {
    id: 'item-forest-theme',
    name: 'Forest Theme',
    description: 'A serene green forest theme.',
    price: 200,
    type: 'theme',
    icon: 'Trees',
    rarity: 'rare',
  },
  {
    id: 'item-golden-frame',
    name: 'Golden Frame',
    description: 'A luxurious golden avatar frame.',
    price: 300,
    type: 'avatar_frame',
    icon: 'Sparkles',
    rarity: 'rare',
  },
  {
    id: 'item-scholar-title',
    name: 'Scholar Title',
    description: 'Title for the intellectually gifted.',
    price: 100,
    type: 'title',
    icon: 'BookOpen',
    rarity: 'common',
  },
  {
    id: 'item-warrior-badge',
    name: 'Warrior Badge',
    description: 'A badge of martial prowess.',
    price: 200,
    type: 'badge',
    icon: 'Sword',
    rarity: 'common',
  },
  {
    id: 'item-cosmic-theme',
    name: 'Cosmic Theme',
    description: 'A deep space starfield theme.',
    price: 400,
    type: 'theme',
    icon: 'Star',
    rarity: 'epic',
  },
  {
    id: 'item-phoenix-badge',
    name: 'Phoenix Badge',
    description: 'Rises from ashes. Ultra rare.',
    price: 800,
    type: 'badge',
    icon: 'Flame',
    rarity: 'legendary',
  },
  {
    id: 'item-mythic-frame',
    name: 'Mythic Frame',
    description: 'An enchanted mythic frame.',
    price: 600,
    type: 'avatar_frame',
    icon: 'Gem',
    rarity: 'epic',
  },
  {
    id: 'item-shadow-theme',
    name: 'Shadow Theme',
    description: 'A dark and mysterious theme.',
    price: 350,
    type: 'theme',
    icon: 'Moon',
    rarity: 'rare',
  },
  {
    id: 'item-champion-title',
    name: 'Champion Title',
    description: 'For those who conquer all.',
    price: 250,
    type: 'title',
    icon: 'Trophy',
    rarity: 'rare',
  },
];

export const INITIAL_DEMO_QUESTS: Quest[] = [
  {
    id: 'quest-morning-workout',
    user_id: 'demo-hero',
    title: 'Morning Workout & Stretch',
    description: 'Complete 20 minutes of stretching and physical exercise.',
    category: 'strength',
    difficulty: 'easy',
    status: 'active',
    frequency: 'daily',
    completed_at: null,
    quest_date: getISTDateString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'quest-read-book',
    user_id: 'demo-hero',
    title: 'Read 15 Pages of a Book',
    description: 'Focus on personal development or fantasy lore.',
    category: 'intellect',
    difficulty: 'medium',
    status: 'active',
    frequency: 'daily',
    completed_at: null,
    quest_date: getISTDateString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'quest-hydrate-meditate',
    user_id: 'demo-hero',
    title: 'Hydrate & 10-Min Mindfulness',
    description: 'Drink 1L water and practice mindful breathing.',
    category: 'vitality',
    difficulty: 'easy',
    status: 'active',
    frequency: 'daily',
    completed_at: null,
    quest_date: getISTDateString(),
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'quest-code-project',
    user_id: 'demo-hero',
    title: 'Build a Feature in Code',
    description: 'Solve an interesting coding challenge or ship a feature.',
    category: 'dexterity',
    difficulty: 'hard',
    status: 'active',
    frequency: 'weekly',
    completed_at: null,
    quest_date: getISTDateString(),
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
];

export function getInitialDemoProfile(heroName = 'Hero'): Profile {
  return {
    id: 'demo-hero',
    username: formatUsername(heroName),
    bio: 'On an epic quest to master daily habits, slay procrastination, and level up in real life!',
    country: 'US',
    is_public: true,
    onboarding_completed: true,
    level: 1,
    xp: 0,
    total_xp: 0,
    gold: 75,
    strength: 5,
    intellect: 5,
    vitality: 5,
    charisma: 5,
    dexterity: 5,
    streak: 3,
    longest_streak: 7,
    last_active_date: getISTDateString(),
    avatar_url: null,
    created_at: new Date().toISOString(),
  };
}

const STORAGE_KEYS = {
  PROFILE: 'life_rpg_demo_profile',
  QUESTS: 'life_rpg_demo_quests',
  INVENTORY: 'life_rpg_demo_inventory',
  IS_DEMO: 'life_rpg_is_demo',
};

export function isDemoActive(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
}

export function setDemoActive(active: boolean): void {
  if (typeof window === 'undefined') return;
  if (active) {
    localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.IS_DEMO);
  }
}

export function loadLocalProfile(heroName?: string): Profile {
  if (typeof window === 'undefined') return getInitialDemoProfile(heroName);
  const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        username: formatUsername(parsed.username || heroName),
      };
    } catch {
      // fallback
    }
  }
  const initial = getInitialDemoProfile(heroName);
  saveLocalProfile(initial);
  return initial;
}

export function saveLocalProfile(profile: Profile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function processISTQuestResets(quests: Quest[]): { updatedQuests: Quest[]; modified: boolean } {
  const currentISTDate = getISTDateString();
  const currentISTWeek = getISTWeekString();
  let modified = false;

  const updatedQuests = quests.map((q) => {
    const freq = q.frequency || 'one_time';
    if (q.status !== 'completed' || !q.completed_at || freq === 'one_time') {
      return q;
    }

    const completedDateObj = new Date(q.completed_at);
    const completedISTDate = getISTDateString(completedDateObj);
    const completedISTWeek = getISTWeekString(completedDateObj);

    if (freq === 'daily' && completedISTDate < currentISTDate) {
      modified = true;
      return {
        ...q,
        status: 'active',
        completed_at: null,
        quest_date: currentISTDate,
      };
    }

    if (freq === 'weekly' && completedISTWeek < currentISTWeek) {
      modified = true;
      return {
        ...q,
        status: 'active',
        completed_at: null,
        quest_date: currentISTDate,
      };
    }

    return q;
  });

  return { updatedQuests, modified };
}

export function loadLocalQuests(): Quest[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_QUESTS;
  const raw = localStorage.getItem(STORAGE_KEYS.QUESTS);
  let quests = INITIAL_DEMO_QUESTS;
  if (raw) {
    try {
      quests = JSON.parse(raw);
    } catch {
      quests = INITIAL_DEMO_QUESTS;
    }
  }

  const { updatedQuests, modified } = processISTQuestResets(quests);
  if (modified || !raw) {
    saveLocalQuests(updatedQuests);
  }
  return updatedQuests;
}

export function saveLocalQuests(quests: Quest[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
}

export function loadLocalInventory(): InventoryItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return [];
}

export function saveLocalInventory(inventory: InventoryItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
}

export function completeLocalQuest(questId: string): CompleteQuestResult {
  const quests = loadLocalQuests();
  const quest = quests.find((q) => q.id === questId);
  if (!quest) {
    return {
      profile: loadLocalProfile(),
      rewards: { xp: 0, gold: 0, attribute: '', leveled_up: false, levels_gained: 0, new_level: 1 },
      error: 'Quest not found',
    };
  }

  const profile = loadLocalProfile();

  const rewardMap: Record<DifficultyKey, { xp: number; gold: number }> = {
    easy: { xp: 50, gold: 10 },
    medium: { xp: 120, gold: 25 },
    hard: { xp: 250, gold: 50 },
    epic: { xp: 500, gold: 100 },
  };

  const difficulty = (quest.difficulty as DifficultyKey) || 'medium';
  const { xp: xpGain, gold: goldGain } = rewardMap[difficulty] ?? rewardMap.medium;

  let currentXp = profile.xp + xpGain;
  let currentLevel = profile.level;
  let levelsGained = 0;

  while (currentXp >= xpForLevel(currentLevel)) {
    currentXp -= xpForLevel(currentLevel);
    currentLevel += 1;
    levelsGained += 1;
  }

  const updatedProfile: Profile = {
    ...profile,
    level: currentLevel,
    xp: currentXp,
    total_xp: profile.total_xp + xpGain,
    gold: profile.gold + goldGain,
    strength: quest.category === 'strength' ? profile.strength + 1 : profile.strength,
    intellect: quest.category === 'intellect' ? profile.intellect + 1 : profile.intellect,
    vitality: quest.category === 'vitality' ? profile.vitality + 1 : profile.vitality,
    charisma: quest.category === 'charisma' ? profile.charisma + 1 : profile.charisma,
    dexterity: quest.category === 'dexterity' ? profile.dexterity + 1 : profile.dexterity,
    last_active_date: getISTDateString(),
  };

  saveLocalProfile(updatedProfile);

  const updatedQuests = quests.map((q) =>
    q.id === questId ? { ...q, status: 'completed', completed_at: new Date().toISOString() } : q
  );
  saveLocalQuests(updatedQuests);

  return {
    profile: updatedProfile,
    rewards: {
      xp: xpGain,
      gold: goldGain,
      attribute: quest.category,
      leveled_up: levelsGained > 0,
      levels_gained: levelsGained,
      new_level: currentLevel,
    },
  };
}

export function purchaseLocalItem(itemId: string): PurchaseResult {
  const shopItem = SEED_SHOP_ITEMS.find((item) => item.id === itemId);
  if (!shopItem) return { error: 'Item not found' };

  const profile = loadLocalProfile();
  const inventory = loadLocalInventory();

  if (inventory.some((inv) => inv.item_id === itemId)) {
    return { error: 'Already owned' };
  }

  if (profile.gold < shopItem.price) {
    return { error: 'Not enough gold' };
  }

  const updatedProfile: Profile = {
    ...profile,
    gold: profile.gold - shopItem.price,
  };
  saveLocalProfile(updatedProfile);

  const newInventoryItem: InventoryItem = {
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: profile.id,
    item_id: itemId,
    equipped: false,
    purchased_at: new Date().toISOString(),
    shop_items: shopItem,
  };

  saveLocalInventory([newInventoryItem, ...inventory]);

  return {
    success: true,
    remaining_gold: updatedProfile.gold,
    item_name: shopItem.name,
  };
}

export function editLocalQuest(updatedQuest: Quest): void {
  const quests = loadLocalQuests();
  const updated = quests.map((q) => (q.id === updatedQuest.id ? updatedQuest : q));
  saveLocalQuests(updated);
}

export function toggleEquipLocalItem(invItemId: string): void {
  const inventory = loadLocalInventory();
  const target = inventory.find((i) => i.id === invItemId);
  if (!target || !target.shop_items) return;

  const targetType = target.shop_items.type;
  const newEquippedState = !target.equipped;

  // If equipping, unequip any other item of same type first
  const updated = inventory.map((inv) => {
    if (inv.id === invItemId) {
      return { ...inv, equipped: newEquippedState };
    }
    if (newEquippedState && inv.shop_items?.type === targetType) {
      return { ...inv, equipped: false };
    }
    return inv;
  });

  saveLocalInventory(updated);
}

export function addLocalVictoryBonus(bonus: { xp: number; gold: number }): Profile {
  const profile = loadLocalProfile();
  let currentXp = profile.xp + bonus.xp;
  let currentLevel = profile.level;

  while (currentXp >= xpForLevel(currentLevel)) {
    currentXp -= xpForLevel(currentLevel);
    currentLevel += 1;
  }

  const updated: Profile = {
    ...profile,
    level: currentLevel,
    xp: currentXp,
    total_xp: profile.total_xp + bonus.xp,
    gold: profile.gold + bonus.gold,
  };

  saveLocalProfile(updated);
  return updated;
}

export type RealmCompetitor = {
  id: string;
  username: string;
  avatar: string;
  baseLevel: number;
  baseXp: number;
  streak: number;
  country?: string;
  categoryXps: Record<string, number>;
};

export const INITIAL_DEMO_COMPETITORS: RealmCompetitor[] = [
  {
    id: 'hero-1',
    username: 'Valerius_Titan',
    avatar: '🛡️',
    baseLevel: 18,
    baseXp: 14200,
    streak: 24,
    country: 'US',
    categoryXps: {
      strength: 4500,
      intellect: 1200,
      vitality: 2800,
      charisma: 1100,
      dexterity: 1500,
      wealth: 900,
      creativity: 600,
      mindfulness: 500,
      productivity: 800,
      wisdom: 300,
    },
  },
  {
    id: 'hero-2',
    username: 'Elysia_Starweaver',
    avatar: '✨',
    baseLevel: 16,
    baseXp: 11800,
    streak: 19,
    country: 'IN',
    categoryXps: {
      strength: 800,
      intellect: 4200,
      vitality: 1500,
      charisma: 2100,
      dexterity: 900,
      wealth: 1100,
      creativity: 3800,
      mindfulness: 2500,
      productivity: 1400,
      wisdom: 3100,
    },
  },
  {
    id: 'hero-3',
    username: 'Kaelen_Drake',
    avatar: '🐉',
    baseLevel: 14,
    baseXp: 9400,
    streak: 15,
    country: 'GB',
    categoryXps: {
      strength: 3200,
      intellect: 1500,
      vitality: 1900,
      charisma: 1200,
      dexterity: 2900,
      wealth: 2100,
      creativity: 800,
      mindfulness: 400,
      productivity: 2500,
      wisdom: 900,
    },
  },
  {
    id: 'hero-4',
    username: 'Aura_Solis',
    avatar: '🌞',
    baseLevel: 12,
    baseXp: 7600,
    streak: 12,
    country: 'CA',
    categoryXps: {
      strength: 900,
      intellect: 2100,
      vitality: 3400,
      charisma: 2900,
      dexterity: 800,
      wealth: 1200,
      creativity: 1400,
      mindfulness: 3200,
      productivity: 1900,
      wisdom: 2200,
    },
  },
  {
    id: 'hero-5',
    username: 'Balthazar_Wealthcraft',
    avatar: '💰',
    baseLevel: 11,
    baseXp: 6800,
    streak: 10,
    country: 'DE',
    categoryXps: {
      strength: 600,
      intellect: 2800,
      vitality: 800,
      charisma: 1900,
      dexterity: 700,
      wealth: 4600,
      creativity: 900,
      mindfulness: 600,
      productivity: 3800,
      wisdom: 1500,
    },
  },
  {
    id: 'hero-6',
    username: 'Zephyr_Vance',
    avatar: '⚡',
    baseLevel: 9,
    baseXp: 5100,
    streak: 8,
    country: 'JP',
    categoryXps: {
      strength: 1400,
      intellect: 1900,
      vitality: 1100,
      charisma: 800,
      dexterity: 3600,
      wealth: 1100,
      creativity: 2400,
      mindfulness: 900,
      productivity: 1800,
      wisdom: 700,
    },
  },
  {
    id: 'hero-7',
    username: 'Rowan_Ironheart',
    avatar: '⚒️',
    baseLevel: 8,
    baseXp: 4200,
    streak: 6,
    country: 'AU',
    categoryXps: {
      strength: 3800,
      intellect: 800,
      vitality: 2100,
      charisma: 600,
      dexterity: 1200,
      wealth: 900,
      creativity: 500,
      mindfulness: 400,
      productivity: 1500,
      wisdom: 600,
    },
  },
  {
    id: 'hero-8',
    username: 'Lyra_Sage',
    avatar: '🦉',
    baseLevel: 7,
    baseXp: 3400,
    streak: 5,
    country: 'FR',
    categoryXps: {
      strength: 500,
      intellect: 3500,
      vitality: 1200,
      charisma: 1100,
      dexterity: 600,
      wealth: 800,
      creativity: 1900,
      mindfulness: 2800,
      productivity: 1400,
      wisdom: 3900,
    },
  },
];

export function getDemoCompetitors(): RealmCompetitor[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_COMPETITORS;
  const raw = localStorage.getItem('life_rpg_demo_competitors');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  saveDemoCompetitors(INITIAL_DEMO_COMPETITORS);
  return INITIAL_DEMO_COMPETITORS;
}

export function saveDemoCompetitors(competitors: RealmCompetitor[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('life_rpg_demo_competitors', JSON.stringify(competitors));
}

export function getPlatformBounties(): TavernBounty[] {
  if (typeof window === 'undefined') return TAVERN_BOUNTIES;
  const raw = localStorage.getItem('life_rpg_platform_bounties') || localStorage.getItem('life_rpg_demo_bounties');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  savePlatformBounties(TAVERN_BOUNTIES);
  return TAVERN_BOUNTIES;
}

export function savePlatformBounties(bounties: TavernBounty[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('life_rpg_platform_bounties', JSON.stringify(bounties));
}

export function getDemoBounties(): TavernBounty[] {
  return getPlatformBounties();
}

export function saveDemoBounties(bounties: TavernBounty[]): void {
  savePlatformBounties(bounties);
}


