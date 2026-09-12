# LifeQuest — Gamified Productivity RPG

LifeQuest is a gamified productivity application built with Next.js 14+ (App Router), TypeScript, Tailwind CSS, Framer Motion, and Supabase.

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Cloudflare Pages Deployment Configuration

To deploy to Cloudflare Pages:

1. **Framework Preset**: Select `Next.js (Static HTML Export)` or `Next.js`.
2. **Build Command**: `npx @cloudflare/next-on-pages` (or `npm run build`)
3. **Build Output Directory**: `.vercel/output/static` (or `.next`)
4. **Environment Variables**:
   Add the following variables in the Cloudflare Pages Dashboard under **Settings > Environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NODE_VERSION`: `18` or higher
