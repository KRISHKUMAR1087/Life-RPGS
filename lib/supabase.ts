import { createClient as createBrowserSupabaseClient } from './supabase/client';

export const supabase = createBrowserSupabaseClient();

export type Profile = {
  id: string;
  username: string;
  level: number;
  xp: number;
  total_xp: number;
  gold: number;
  strength: number;
  intellect: number;
  vitality: number;
  charisma: number;
  dexterity: number;
  streak: number;
  longest_streak: number;
  last_active_date: string | null;
  avatar_url: string | null;
  created_at: string;
  motto?: string | null;
};

export type Quest = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  status: string;
  completed_at: string | null;
  quest_date: string;
  created_at: string;
  ai_badge?: string;
  ai_rationale?: string;
  xp_reward?: number;
  gold_reward?: number;
};

export type ShopItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: string;
  icon: string;
  rarity: string;
};

export type InventoryItem = {
  id: string;
  user_id: string;
  item_id: string;
  equipped: boolean;
  purchased_at: string;
  shop_items?: ShopItem;
};

export type QuestReward = {
  xp: number;
  gold: number;
  attribute: string;
  leveled_up: boolean;
  levels_gained: number;
  new_level: number;
};

export type CompleteQuestResult = {
  profile: Profile;
  rewards: QuestReward;
  error?: string;
};

export type PurchaseResult = {
  success?: boolean;
  remaining_gold?: number;
  item_name?: string;
  error?: string;
};
