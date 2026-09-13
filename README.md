# 🛡️ LifeQuest — Life RPG Gamified Productivity Platform

**LifeQuest** is a full-stack gamified productivity RPG application built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Supabase (PostgreSQL)**. It converts everyday real-world habits, tasks, and goals into an engaging RPG progression system with real-time audio, particle effects, non-linear XP leveling, attribute matrix progression, global leaderboards, shop economy, and daily boss raids.

---

## 🚀 Live Demo & Repo Links

- **Live App**: [xpwin](https://XPWIN.pages.dev)
- **GitHub Repository**: [https://github.com/Krish1216-web/Life-RPGS](https://github.com/KRISHKUMAR1087/Life-RPGS)


---

## ✨ Features & Problem Statement Alignment

### 1. 🎮 RPG Progression Engine & Non-Linear Math
- **Non-Linear Leveling Curve**: XP requirements scale non-linearly using `xpForLevel(L) = Math.floor(100 * L^1.5)`.
- **Attribute Matrix**: Quests map directly to core hero attributes:
  - 🏋️‍♂️ **Strength** (Gym, Sports, Cardio)
  - 🧠 **Intellect** (Reading, Study, Coding)
  - 🫀 **Vitality** (Sleep, Hydration, Meditation)
  - 🤝 **Charisma** (Social, Networking, Teamwork)
  - ⚡ **Dexterity** (Crafts, Music, Coding)

### 2. ⚡ Tactile & Responsive UI
- **Celebratory Effects**: Confetti particle systems (`ParticleEffect.tsx`), floating XP/Gold gain popups (`FloatingRewards.tsx`), and level-up modal overlay (`LevelUpOverlay.tsx`).
- **Audio Feedback**: Built-in sound effects using Web Audio API synthesis (`audio.ts`).
- **Keyboard Navigation & Accessibility**: Full keyboard support (`Tab`, `Enter`, `Space`) with clear focus states (`focus-ring`) and ARIA labels.

### 3. 🛡️ Security & Full-Stack Database Persistence
- **Authentication**: Email/password signup, login, session persistence, and password reset via Supabase Auth.
- **Data Isolation**: User data (Quests, Inventory, Profile) is strictly isolated using Supabase Row Level Security (RLS).
- **Full CRUD Operations**: Create custom quests, filter active/completed quests, edit quest details, complete quests for XP/Gold rewards, and delete quests.

### 4. 🏆 Gamification Elements
- **Active Streaks**: Tracks consecutive daily activity and personal best longest streak.
- **Virtual Economy & Shop**: Earn **Gold** from quests to purchase Avatar Frames, Titles, Badges, and UI Themes.
- **Realm Boss Battle**: Engage in daily boss raids (*Malakor the Sloth Wyrm*) where quest completions strike critical hits.
- **Global & Category Leaderboards**: Compare total XP and attribute standings against real global adventurers.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide React Icons.
- **Backend / Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security).
- **Deployment**: Cloudflare Pages (`@cloudflare/next-on-pages`).

---

## ⚙️ Environment Variables Setup

Create a `.env.local` file in the root directory (or copy `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🗄️ Database Schema Setup (Supabase PostgreSQL)

Run the following SQL script in your **Supabase SQL Editor** to initialize the tables and Row Level Security:

```sql
-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  bio TEXT DEFAULT '',
  country TEXT DEFAULT 'US',
  is_public BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  total_xp INT DEFAULT 0,
  gold INT DEFAULT 0,
  strength INT DEFAULT 0,
  intellect INT DEFAULT 0,
  vitality INT DEFAULT 0,
  charisma INT DEFAULT 0,
  dexterity INT DEFAULT 0,
  streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Quests Table
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  frequency TEXT DEFAULT 'one_time',
  completed_at TIMESTAMPTZ,
  quest_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inventory Table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  equipped BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their own quests" ON public.quests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own inventory" ON public.inventory FOR ALL USING (auth.uid() = user_id);
```

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript type check
npm run typecheck

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Cloudflare Pages Deployment Settings

- **Framework Preset**: `Next.js`
- **Build Command**: `npm run build && npx @cloudflare/next-on-pages`
- **Build Output Directory**: `.vercel/output/static`
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
  - `NODE_VERSION`: `20`

