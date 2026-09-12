import {
  Dumbbell,
  Brain,
  Heart,
  Users,
  Zap,
  Sparkles,
  BookOpen,
  Target,
  Briefcase,
  Smile,
  Compass,
  type LucideIcon,
} from 'lucide-react';

export type CategoryKey =
  | 'strength'
  | 'intellect'
  | 'vitality'
  | 'charisma'
  | 'dexterity'
  | string;

export type DifficultyKey = 'easy' | 'medium' | 'hard' | 'epic';

export type CategoryConfig = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  gradient: string;
  isCustom?: boolean;
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

export type TavernBounty = {
  title: string;
  description: string;
  category: CategoryKey;
  difficulty: DifficultyKey;
  icon: string;
};

export const TAVERN_BOUNTIES: TavernBounty[] = [
  {
    title: 'Morning 5km Run & Stretching',
    description: 'Crush cardiovascular training and build stamina.',
    category: 'strength',
    difficulty: 'hard',
    icon: '🏃',
  },
  {
    title: '45-Min Deep Focus Sprint',
    description: 'Zero distractions study or coding session.',
    category: 'intellect',
    difficulty: 'medium',
    icon: '⚡',
  },
  {
    title: 'Hydrate 2 Liters & Mindful Meditation',
    description: 'Restore energy and calm the mind.',
    category: 'vitality',
    difficulty: 'easy',
    icon: '💧',
  },
  {
    title: 'Ship Code Feature & Git Commit',
    description: 'Write clean code and deploy changes.',
    category: 'dexterity',
    difficulty: 'hard',
    icon: '💻',
  },
  {
    title: 'Read 20 Pages of Knowledge',
    description: 'Expand your mind with books or literature.',
    category: 'intellect',
    difficulty: 'easy',
    icon: '📖',
  },
  {
    title: 'Praise a Peer or Connect with Friends',
    description: 'Strengthen social bonds and camaraderie.',
    category: 'charisma',
    difficulty: 'medium',
    icon: '🤝',
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  strength: '#f43f5e',
  intellect: '#60a5fa',
  vitality: '#34d399',
  charisma: '#fbbf24',
  dexterity: '#a78bfa',
  wealth: '#eab308',
  creativity: '#ec4899',
  mindfulness: '#14b8a6',
  productivity: '#f97316',
  wisdom: '#8b5cf6',
};

export const CATEGORIES: CategoryConfig[] = [
  {
    key: 'strength',
    label: 'Strength',
    description: 'Physical training, gym, sports',
    icon: Dumbbell,
    color: CATEGORY_COLORS.strength,
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
    color: CATEGORY_COLORS.intellect,
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
    color: CATEGORY_COLORS.vitality,
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
    color: CATEGORY_COLORS.charisma,
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
    color: CATEGORY_COLORS.dexterity,
    textColor: 'text-violet2-400',
    borderColor: 'border-violet2-500/40',
    bgColor: 'bg-violet2-500/10',
    gradient: 'from-violet2-500/20 to-transparent',
  },
  {
    key: 'wealth',
    label: 'Wealth',
    description: 'Finance, budgeting, investing, business',
    icon: Briefcase,
    color: CATEGORY_COLORS.wealth,
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    bgColor: 'bg-yellow-500/10',
    gradient: 'from-yellow-500/20 to-transparent',
  },
  {
    key: 'creativity',
    label: 'Creativity',
    description: 'Design, writing, content creation, innovation',
    icon: Sparkles,
    color: CATEGORY_COLORS.creativity,
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/40',
    bgColor: 'bg-pink-500/10',
    gradient: 'from-pink-500/20 to-transparent',
  },
  {
    key: 'mindfulness',
    label: 'Mindfulness',
    description: 'Mental wellness, meditation, peace',
    icon: Compass,
    color: CATEGORY_COLORS.mindfulness,
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/40',
    bgColor: 'bg-teal-500/10',
    gradient: 'from-teal-500/20 to-transparent',
  },
  {
    key: 'productivity',
    label: 'Productivity',
    description: 'Time management, organization, habits',
    icon: Target,
    color: CATEGORY_COLORS.productivity,
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/40',
    bgColor: 'bg-orange-500/10',
    gradient: 'from-orange-500/20 to-transparent',
  },
  {
    key: 'wisdom',
    label: 'Wisdom',
    description: 'Life strategy, decision making, philosophy',
    icon: BookOpen,
    color: CATEGORY_COLORS.wisdom,
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    bgColor: 'bg-purple-500/10',
    gradient: 'from-purple-500/20 to-transparent',
  },
];

export type CategoryLevelInfo = {
  level: number;
  currentXp: number;
  xpNeeded: number;
  percent: number;
  title: string;
};

export function calculateCategoryLevel(xp: number): CategoryLevelInfo {
  let level = 1;
  let accumulatedXp = 0;
  let costForNext = Math.floor(80 * Math.pow(level, 1.4));

  while (xp >= accumulatedXp + costForNext) {
    accumulatedXp += costForNext;
    level++;
    costForNext = Math.floor(80 * Math.pow(level, 1.4));
  }

  const currentXp = Math.max(0, xp - accumulatedXp);
  const percent = Math.min(100, Math.max(0, Math.round((currentXp / costForNext) * 100)));

  let title = 'Novice';
  if (level >= 25) title = 'Grandmaster';
  else if (level >= 15) title = 'Master';
  else if (level >= 10) title = 'Expert';
  else if (level >= 5) title = 'Adept';
  else if (level >= 3) title = 'Apprentice';

  return {
    level,
    currentXp,
    xpNeeded: costForNext,
    percent,
    title,
  };
}

export const CUSTOM_CATEGORY_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  BookOpen,
  Target,
  Briefcase,
  Smile,
  Compass,
  Dumbbell,
  Brain,
  Heart,
  Users,
  Zap,
};

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

export function getCategory(key: string, customCategories: CategoryConfig[] = []): CategoryConfig {
  const foundBuiltIn = CATEGORIES.find((c) => c.key === key);
  if (foundBuiltIn) return foundBuiltIn;

  const foundCustom = customCategories.find((c) => c.key === key);
  if (foundCustom) return foundCustom;

  // Fallback for custom or unknown category
  return {
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    description: 'Custom quest category',
    icon: Sparkles,
    color: '#fbbf24',
    textColor: 'text-gold-400',
    borderColor: 'border-gold-500/40',
    bgColor: 'bg-gold-500/10',
    gradient: 'from-gold-500/20 to-transparent',
    isCustom: true,
  };
}

export function loadCustomCategories(userId: string): CategoryConfig[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`life_rpg_custom_categories_${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Omit<CategoryConfig, 'icon'> & { iconName?: string }>;
    return parsed.map((item) => ({
      ...item,
      icon: CUSTOM_CATEGORY_ICONS[item.iconName ?? 'Sparkles'] ?? Sparkles,
      isCustom: true,
    }));
  } catch (err) {
    console.error('Failed to load custom categories', err);
    return [];
  }
}

export function saveCustomCategories(userId: string, categories: CategoryConfig[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const serialized = categories.map((c) => ({
      key: c.key,
      label: c.label,
      description: c.description,
      color: c.color,
      textColor: c.textColor,
      borderColor: c.borderColor,
      bgColor: c.bgColor,
      gradient: c.gradient,
      iconName: Object.keys(CUSTOM_CATEGORY_ICONS).find(
        (k) => CUSTOM_CATEGORY_ICONS[k] === c.icon
      ) ?? 'Sparkles',
      isCustom: true,
    }));
    localStorage.setItem(`life_rpg_custom_categories_${userId}`, JSON.stringify(serialized));
  } catch (err) {
    console.error('Failed to save custom categories', err);
  }
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

export function formatUsername(name: string | null | undefined): string {
  if (!name) return 'Hero';
  let cleaned = name.trim();
  if (cleaned.includes('@')) {
    cleaned = cleaned.split('@')[0];
  }
  return cleaned.trim() || 'Hero';
}

/**
 * Returns current date string (YYYY-MM-DD) in Indian Standard Time (IST - Asia/Kolkata).
 */
export function getISTDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Returns year-week string (e.g. 2026-W37) in Indian Standard Time (IST).
 */
export function getISTWeekString(date: Date = new Date()): string {
  const istDateStr = getISTDateString(date);
  const d = new Date(istDateStr + 'T00:00:00+05:30');
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export type PlatformRanks = {
  overallRank: number;
  totalPlayers: number;
  categoryRanks: Record<string, { rank: number; score: number }>;
};

/**
 * Calculates overall rank (by total_xp) and category ranks (by attribute values)
 * comparing current profile against peer profiles or simulated benchmarks.
 */
export function calculatePlatformRanks(
  userProfile: {
    id?: string;
    total_xp: number;
    strength: number;
    intellect: number;
    vitality: number;
    charisma: number;
    dexterity: number;
  },
  peerProfiles: Array<{
    id?: string;
    total_xp: number;
    strength: number;
    intellect: number;
    vitality: number;
    charisma: number;
    dexterity: number;
  }> = [],
  options: { allowSyntheticBenchmarks?: boolean } = {}
): PlatformRanks {
  // Populate pool with userProfile if not already included
  let pool = [...peerProfiles];
  const exists = pool.some((p) => p.id && userProfile.id && p.id === userProfile.id);
  if (!exists) {
    pool.push(userProfile);
  }

  // Only inject synthetic benchmark competitors if explicitly requested (e.g. in demo mode)
  if (options.allowSyntheticBenchmarks && pool.length < 5) {
    const benchmarks = [
      { total_xp: 3500, strength: 24, intellect: 30, vitality: 22, charisma: 18, dexterity: 20 },
      { total_xp: 2200, strength: 18, intellect: 16, vitality: 25, charisma: 14, dexterity: 15 },
      { total_xp: 1200, strength: 12, intellect: 14, vitality: 10, charisma: 15, dexterity: 11 },
      { total_xp: 600, strength: 8, intellect: 7, vitality: 9, charisma: 6, dexterity: 8 },
      { total_xp: 150, strength: 5, intellect: 5, vitality: 5, charisma: 5, dexterity: 5 },
    ];
    pool = [...pool, ...benchmarks];
  }

  // 1. Overall Rank by total_xp
  const sortedByXp = [...pool].sort((a, b) => b.total_xp - a.total_xp);
  const overallRank = Math.max(1, sortedByXp.findIndex((p) => p.total_xp <= userProfile.total_xp) + 1);

  // 2. Category Ranks
  const categories = ['strength', 'intellect', 'vitality', 'charisma', 'dexterity'] as const;
  const categoryRanks: Record<string, { rank: number; score: number }> = {};

  for (const cat of categories) {
    const score = userProfile[cat] ?? 0;
    const sortedByCat = [...pool].sort((a, b) => (b[cat] ?? 0) - (a[cat] ?? 0));
    const rank = Math.max(1, sortedByCat.findIndex((p) => (p[cat] ?? 0) <= score) + 1);
    categoryRanks[cat] = { rank, score };
  }

  return {
    overallRank,
    totalPlayers: pool.length,
    categoryRanks,
  };
}

export type CountryConfig = {
  code: string;
  name: string;
  flag: string;
};

export const COUNTRIES: CountryConfig[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
];

export function getCountry(code?: string | null): CountryConfig {
  if (!code) return COUNTRIES[0];
  const found = COUNTRIES.find(
    (c) => c.code.toUpperCase() === code.toUpperCase() || c.name.toLowerCase() === code.toLowerCase()
  );
  return found || { code, name: code, flag: '🌐' };
}


