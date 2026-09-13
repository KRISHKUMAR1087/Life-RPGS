-- Migration 007: Update level progression formula and gold calculation in complete_quest
-- Level 1: 100 XP, Level 2: 115 XP, Level 3: 130 XP (+15 XP per level)
-- Gold coin: 1 gold per 50 XP crossed (Math.max(1, floor(xp / 50)))

CREATE OR REPLACE FUNCTION complete_quest(p_quest_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quest quests%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_xp_reward int;
  v_gold_reward int;
  v_attr text;
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
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

  -- XP reward by difficulty if not custom
  v_xp_reward := CASE v_quest.difficulty
    WHEN 'easy' THEN 50
    WHEN 'medium' THEN 100
    WHEN 'hard' THEN 250
    WHEN 'epic' THEN 500
    ELSE 50
  END;

  -- 1 gold per 50 XP crossed
  v_gold_reward := GREATEST(1, floor(v_xp_reward / 50)::int);

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

  -- Level up loop: 100 + (level - 1) * 15 XP per level
  LOOP
    v_xp_for_next := 100 + (GREATEST(1, v_profile.level) - 1) * 15;
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
