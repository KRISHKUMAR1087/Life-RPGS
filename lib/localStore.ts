import { xpForLevel, type DifficultyKey } from './rpg';
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

export const INITIAL_DEMO_QUESTS: Quest[] = [];

export function getInitialDemoProfile(heroName = 'Hero'): Profile {
  return {
    id: 'demo-hero',
    username: heroName || 'Hero',
    level: 1,
    xp: 0,
    total_xp: 0,
    gold: 0,
    strength: 0,
    intellect: 0,
    vitality: 0,
    charisma: 0,
    dexterity: 0,
    streak: 0,
    longest_streak: 0,
    last_active_date: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    motto: 'Aspiring adventurer forging their destiny',
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
      return JSON.parse(raw);
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

export function loadLocalQuests(): Quest[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.QUESTS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return [];
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
  const standardReward = rewardMap[difficulty] ?? rewardMap.medium;
  const xpGain = quest.xp_reward || standardReward.xp;
  const goldGain = quest.gold_reward || standardReward.gold;

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
    strength: profile.strength + (quest.category === 'strength' ? 1 : 0),
    intellect: profile.intellect + (quest.category === 'intellect' ? 1 : 0),
    vitality: profile.vitality + (quest.category === 'vitality' ? 1 : 0),
    charisma: profile.charisma + (quest.category === 'charisma' ? 1 : 0),
    dexterity: profile.dexterity + (quest.category === 'dexterity' ? 1 : 0),
    streak: profile.streak + 1,
    longest_streak: Math.max(profile.longest_streak, profile.streak + 1),
    last_active_date: new Date().toISOString().split('T')[0],
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

