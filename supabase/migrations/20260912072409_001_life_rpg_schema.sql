/*
# Life RPG — Core Schema

## Overview
Creates the full data model for a gamified productivity app. Users complete real-world
"quests" to earn XP, gold, and attribute points. A non-linear leveling system governs
progression. Gold is spent in a shop for cosmetic items and badges.

## Tables
### profiles — RPG character data, auto-created on signup via trigger
### quests — user-defined tasks with category/difficulty
### shop_items — predefined purchasable items (public read)
### inventory — owned items per user

## Security
- RLS on all tables, owner-scoped CRUD
- complete_quest() and purchase_item() are SECURITY DEFINER for atomic reward/purchase logic
- handle_new_user() trigger auto-creates profile on registration
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  level int NOT NULL DEFAULT 1,
  xp int NOT NULL DEFAULT 0,
  total_xp int NOT NULL DEFAULT 0,
  gold int NOT NULL DEFAULT 0,
  strength int NOT NULL DEFAULT 0,
  intellect int NOT NULL DEFAULT 0,
  vitality int NOT NULL DEFAULT 0,
  charisma int NOT NULL DEFAULT 0,
  dexterity int NOT NULL DEFAULT 0,
  streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_active_date date,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ QUESTS ============
CREATE TABLE IF NOT EXISTS quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text,
  category text NOT NULL CHECK (category IN ('strength','intellect','vitality','charisma','dexterity')),
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard','epic')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  frequency text NOT NULL DEFAULT 'one_time' CHECK (frequency IN ('one_time','daily','weekly')),
  completed_at timestamptz,
  quest_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quests_user_id ON quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(user_id, status);

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quests" ON quests;
CREATE POLICY "select_own_quests" ON quests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quests" ON quests;
CREATE POLICY "insert_own_quests" ON quests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quests" ON quests;
CREATE POLICY "update_own_quests" ON quests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quests" ON quests;
CREATE POLICY "delete_own_quests" ON quests FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ SHOP ITEMS ============
CREATE TABLE IF NOT EXISTS shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price int NOT NULL CHECK (price >= 0),
  type text NOT NULL CHECK (type IN ('avatar_frame','title','badge','theme')),
  icon text NOT NULL DEFAULT 'Circle',
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary'))
);

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_shop_items" ON shop_items;
CREATE POLICY "select_shop_items" ON shop_items FOR SELECT
  TO authenticated USING (true);

-- ============ INVENTORY ============
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  equipped boolean NOT NULL DEFAULT false,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_inventory" ON inventory;
CREATE POLICY "select_own_inventory" ON inventory FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_inventory" ON inventory;
CREATE POLICY "insert_own_inventory" ON inventory FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_inventory" ON inventory;
CREATE POLICY "update_own_inventory" ON inventory FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_inventory" ON inventory;
CREATE POLICY "delete_own_inventory" ON inventory FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ COMPLETE QUEST FUNCTION ============
CREATE OR REPLACE FUNCTION complete_quest(p_quest_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest quests%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_xp_reward int;
  v_gold_reward int;
  v_attr text;
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
  v_new_level int;
  v_xp_for_next int;
  v_leveled_up boolean := false;
  v_levels_gained int := 0;
BEGIN
  SELECT * INTO v_quest FROM quests WHERE id = p_quest_id FOR UPDATE;

  IF v_quest.id IS NULL THEN
    RETURN json_build_object('error', 'Quest not found');
  END IF;

  IF v_quest.user_id != auth.uid() THEN
    RETURN json_build_object('error', 'Not authorized');
  END IF;

  IF v_quest.status = 'completed' THEN
    RETURN json_build_object('error', 'Quest already completed');
  END IF;

  v_xp_reward := CASE v_quest.difficulty
    WHEN 'easy' THEN 50
    WHEN 'medium' THEN 120
    WHEN 'hard' THEN 250
    WHEN 'epic' THEN 500
    ELSE 50
  END;

  v_gold_reward := CASE v_quest.difficulty
    WHEN 'easy' THEN 10
    WHEN 'medium' THEN 25
    WHEN 'hard' THEN 50
    WHEN 'epic' THEN 100
    ELSE 10
  END;

  SELECT * INTO v_profile FROM profiles WHERE id = v_quest.user_id FOR UPDATE;

  IF v_profile.last_active_date IS NULL THEN
    v_profile.streak := 1;
  ELSIF v_profile.last_active_date = v_yesterday THEN
    v_profile.streak := v_profile.streak + 1;
  ELSIF v_profile.last_active_date = v_today THEN
    NULL;
  ELSE
    v_profile.streak := 1;
  END IF;

  v_profile.last_active_date := v_today;
  IF v_profile.streak > v_profile.longest_streak THEN
    v_profile.longest_streak := v_profile.streak;
  END IF;

  v_attr := v_quest.category;
  IF v_attr = 'strength' THEN
    v_profile.strength := v_profile.strength + 1;
  ELSIF v_attr = 'intellect' THEN
    v_profile.intellect := v_profile.intellect + 1;
  ELSIF v_attr = 'vitality' THEN
    v_profile.vitality := v_profile.vitality + 1;
  ELSIF v_attr = 'charisma' THEN
    v_profile.charisma := v_profile.charisma + 1;
  ELSIF v_attr = 'dexterity' THEN
    v_profile.dexterity := v_profile.dexterity + 1;
  END IF;

  v_profile.xp := v_profile.xp + v_xp_reward;
  v_profile.total_xp := v_profile.total_xp + v_xp_reward;
  v_profile.gold := v_profile.gold + v_gold_reward;

  LOOP
    v_xp_for_next := floor(100 * power(v_profile.level, 1.5))::int;
    EXIT WHEN v_profile.xp < v_xp_for_next;
    v_profile.xp := v_profile.xp - v_xp_for_next;
    v_profile.level := v_profile.level + 1;
    v_leveled_up := true;
    v_levels_gained := v_levels_gained + 1;
  END LOOP;

  UPDATE quests SET status = 'completed', completed_at = now() WHERE id = p_quest_id;

  UPDATE profiles SET
    level = v_profile.level,
    xp = v_profile.xp,
    total_xp = v_profile.total_xp,
    gold = v_profile.gold,
    strength = v_profile.strength,
    intellect = v_profile.intellect,
    vitality = v_profile.vitality,
    charisma = v_profile.charisma,
    dexterity = v_profile.dexterity,
    streak = v_profile.streak,
    longest_streak = v_profile.longest_streak,
    last_active_date = v_profile.last_active_date
  WHERE id = v_profile.id;

  RETURN json_build_object(
    'profile', row_to_json(v_profile),
    'rewards', json_build_object(
      'xp', v_xp_reward,
      'gold', v_gold_reward,
      'attribute', v_attr,
      'leveled_up', v_leveled_up,
      'levels_gained', v_levels_gained,
      'new_level', v_profile.level
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION complete_quest(uuid) TO authenticated;

-- ============ PURCHASE ITEM FUNCTION ============
CREATE OR REPLACE FUNCTION purchase_item(p_item_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item shop_items%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_existing inventory%ROWTYPE;
BEGIN
  SELECT * INTO v_item FROM shop_items WHERE id = p_item_id;
  IF v_item.id IS NULL THEN
    RETURN json_build_object('error', 'Item not found');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF v_profile.id IS NULL THEN
    RETURN json_build_object('error', 'Profile not found');
  END IF;

  SELECT * INTO v_existing FROM inventory WHERE user_id = auth.uid() AND item_id = p_item_id;
  IF v_existing.id IS NOT NULL THEN
    RETURN json_build_object('error', 'Already owned');
  END IF;

  IF v_profile.gold < v_item.price THEN
    RETURN json_build_object('error', 'Not enough gold');
  END IF;

  UPDATE profiles SET gold = v_profile.gold - v_item.price WHERE id = v_profile.id;
  INSERT INTO inventory (user_id, item_id) VALUES (auth.uid(), p_item_id);

  RETURN json_build_object(
    'success', true,
    'remaining_gold', v_profile.gold - v_item.price,
    'item_name', v_item.name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION purchase_item(uuid) TO authenticated;

-- ============ NEW USER TRIGGER ============
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============ SEED SHOP ITEMS ============
INSERT INTO shop_items (name, description, price, type, icon, rarity) VALUES
  ('Iron Frame', 'A sturdy iron border for your avatar.', 50, 'avatar_frame', 'Shield', 'common'),
  ('Silver Crown', 'A gleaming silver crown title.', 150, 'title', 'Crown', 'rare'),
  ('Dragon Badge', 'A legendary dragon emblem badge.', 500, 'badge', 'Dragon', 'epic'),
  ('Forest Theme', 'A serene green forest theme.', 200, 'theme', 'Trees', 'rare'),
  ('Golden Frame', 'A luxurious golden avatar frame.', 300, 'avatar_frame', 'Sparkles', 'rare'),
  ('Scholar Title', 'Title for the intellectually gifted.', 100, 'title', 'BookOpen', 'common'),
  ('Warrior Badge', 'A badge of martial prowess.', 200, 'badge', 'Sword', 'common'),
  ('Cosmic Theme', 'A deep space starfield theme.', 400, 'theme', 'Star', 'epic'),
  ('Phoenix Badge', 'Rises from ashes. Ultra rare.', 800, 'badge', 'Flame', 'legendary'),
  ('Mythic Frame', 'An enchanted mythic frame.', 600, 'avatar_frame', 'Gem', 'epic'),
  ('Shadow Theme', 'A dark and mysterious theme.', 350, 'theme', 'Moon', 'rare'),
  ('Champion Title', 'For those who conquer all.', 250, 'title', 'Trophy', 'rare')
ON CONFLICT DO NOTHING;
