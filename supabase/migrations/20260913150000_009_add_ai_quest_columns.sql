ALTER TABLE quests
ADD COLUMN IF NOT EXISTS ai_badge text,
ADD COLUMN IF NOT EXISTS ai_rationale text,
ADD COLUMN IF NOT EXISTS xp_reward integer,
ADD COLUMN IF NOT EXISTS gold_reward integer;

GRANT UPDATE (ai_badge, ai_rationale, xp_reward, gold_reward) ON public.quests TO authenticated;
