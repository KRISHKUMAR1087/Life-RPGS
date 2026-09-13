-- =================================================================
-- 006: Column-Level Grant Lockdown & Postgres Field Check Constraints
-- Security & Anti-Cheat Hardening Script for XpWin (Life-RPGS)
-- =================================================================

-- ============ PROFILES: column-level lockdown ============
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (username, bio, avatar_url, is_public, country, onboarding_completed)
  ON public.profiles TO authenticated;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_length CHECK (char_length(username) BETWEEN 1 AND 30),
  ADD CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_.\- ]*$'),
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 500),
  ADD CONSTRAINT profiles_country_length CHECK (country IS NULL OR char_length(country) <= 100);

-- ============ INVENTORY: force item gain through purchase_item() ============
DROP POLICY IF EXISTS "insert_own_inventory" ON public.inventory;
REVOKE INSERT ON public.inventory FROM authenticated;

REVOKE UPDATE ON public.inventory FROM authenticated;
GRANT UPDATE (equipped) ON public.inventory TO authenticated;

-- ============ QUESTS: restrict which columns a client can edit directly ============
REVOKE UPDATE ON public.quests FROM authenticated;
GRANT UPDATE (title, description, category, difficulty, frequency, quest_date)
  ON public.quests TO authenticated;

ALTER TABLE public.quests
  ADD CONSTRAINT quests_title_length CHECK (char_length(trim(title)) BETWEEN 1 AND 100),
  ADD CONSTRAINT quests_description_length CHECK (description IS NULL OR char_length(description) <= 1000);

-- ============ SHOP ITEMS: read-only from the client, always ============
REVOKE INSERT, UPDATE, DELETE ON public.shop_items FROM authenticated;

