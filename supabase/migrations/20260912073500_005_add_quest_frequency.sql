-- Add frequency column to quests table if it does not exist
ALTER TABLE quests ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'one_time';
