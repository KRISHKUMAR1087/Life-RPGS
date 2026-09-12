import {
  Dumbbell,
  Brain,
  Heart,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type CategoryKey =
  | 'strength'
  | 'intellect'
  | 'vitality'
  | 'charisma'
  | 'dexterity';

export type DifficultyKey = 'easy' | 'medium' | 'hard' | 'epic';

export type CategoryConfig = {
  key: CategoryKey;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  gradient: string;
};

export type DifficultyConfig = {
  key: DifficultyKey;
  label: string;
  xp: number;
  gold: number;
  color: string;
  border: string;
  badge: string;
};

export const CATEGORIES: CategoryConfig[] = [
  {
    key: 'strength',
    label: 'Strength',
    description: 'Physical training, gym, sports',
    icon: Dumbbell,
    color: '#f43f5e',
    textColor: 'text-flame-400',
    borderColor: 'border-flame-500/40',
    bgColor: 'bg-flame-500/10',
    gradient: 'from-flame-500/20 to-transparent',
  },
  {
    key: 'intellect',
    label: 'Intellect',
    description: 'Study, reading, coding, learning',
    icon: Brain,
    color: '#60a5fa',
    textColor: 'text-azure-400',
    borderColor: 'border-azure-500/40',
    bgColor: 'bg-azure-500/10',
    gradient: 'from-azure-500/20 to-transparent',
  },
  {
    key: 'vitality',
    label: 'Vitality',
    description: 'Sleep, nutrition, self-care, meditation',
    icon: Heart,
    color: '#34d399',
    textColor: 'text-emerald2-400',
    borderColor: 'border-emerald2-500/40',
    bgColor: 'bg-emerald2-500/10',
    gradient: 'from-emerald2-500/20 to-transparent',
  },
  {
    key: 'charisma',
    label: 'Charisma',
    description: 'Social skills, networking, relationships',
    icon: Users,
    color: '#fbbf24',
    textColor: 'text-gold-400',
    borderColor: 'border-gold-500/40',
    bgColor: 'bg-gold-500/10',
    gradient: 'from-gold-500/20 to-transparent',
  },
  {
    key: 'dexterity',
    label: 'Dexterity',
    description: 'Crafts, art, music, agility',
    icon: Zap,
    color: '#a78bfa',
    textColor: 'text-violet2-400',
    borderColor: 'border-violet2-500/40',
    bgColor: 'bg-violet2-500/10',
    gradient: 'from-violet2-500/20 to-transparent',
  },
];

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    key: 'easy',
    label: 'Easy',
    xp: 50,
    gold: 10,
    color: 'text-emerald2-400',
    border: 'border-emerald2-500/50',
    badge: 'bg-emerald2-500/15 text-emerald2-400 border-emerald2-500/30',
  },
  {
    key: 'medium',
    label: 'Medium',
    xp: 120,
    gold: 25,
    color: 'text-azure-400',
    border: 'border-azure-500/50',
    badge: 'bg-azure-500/15 text-azure-400 border-azure-500/30',
  },
  {
    key: 'hard',
    label: 'Hard',
    xp: 250,
    gold: 50,
    color: 'text-flame-400',
    border: 'border-flame-500/50',
    badge: 'bg-flame-500/15 text-flame-400 border-flame-500/30',
  },
  {
    key: 'epic',
    label: 'Epic',
    xp: 500,
    gold: 100,
    color: 'text-violet2-400',
    border: 'border-violet2-500/50',
    badge: 'bg-violet2-500/15 text-violet2-400 border-violet2-500/30',
  },
];

export function getCategory(key: string): CategoryConfig {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

export function getDifficulty(key: string): DifficultyConfig {
  return DIFFICULTIES.find((d) => d.key === key) ?? DIFFICULTIES[1];
}

// XP required to advance from `level` to `level + 1`
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Character rank title based on level
export function getRankTitle(level: number): string {
  if (level >= 50) return 'Mythic Legend';
  if (level >= 40) return 'Grandmaster';
  if (level >= 30) return 'Champion';
  if (level >= 20) return 'Knight';
  if (level >= 15) return 'Squire';
  if (level >= 10) return 'Adventurer';
  if (level >= 5) return 'Apprentice';
  return 'Novice';
}

export const RARITY_STYLES: Record<string, { color: string; border: string; glow: string }> = {
  common: { color: 'text-ink-300', border: 'border-ink-500', glow: '' },
  rare: { color: 'text-azure-400', border: 'border-azure-500/50', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]' },
  epic: { color: 'text-violet2-400', border: 'border-violet2-500/50', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]' },
  legendary: { color: 'text-gold-400', border: 'border-gold-500/50', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]' },
};
