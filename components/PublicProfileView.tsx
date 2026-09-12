'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sword,
  Shield,
  Crown,
  Lock,
  Globe,
  Flame,
  Star,
  Copy,
  Check,
  Award,
  Sparkles,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import {
  getRankTitle,
  formatUsername,
  getCountry,
  calculatePlatformRanks,
  CATEGORIES,
} from '@/lib/rpg';
import { loadLocalProfile } from '@/lib/localStore';
import { isPlaceholderSupabase } from '@/context/AuthContext';

type PublicProfileViewProps = {
  username: string;
};

export default function PublicProfileView({ username }: PublicProfileViewProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const cleanName = formatUsername(username);

  useEffect(() => {
    async function fetchPublicProfile() {
      if (isPlaceholderSupabase()) {
        const local = loadLocalProfile();
        if (local.username.toLowerCase() === cleanName.toLowerCase()) {
          setProfile(local);
        } else {
          // Mock benchmark profile for public link preview
          setProfile({
            id: 'public-preview',
            username: cleanName,
            bio: 'Adventuring across the realm, tackling real-world quests daily!',
            country: 'US',
            is_public: true,
            onboarding_completed: true,
            level: 12,
            xp: 2400,
            total_xp: 7800,
            gold: 320,
            strength: 14,
            intellect: 18,
            vitality: 16,
            charisma: 12,
            dexterity: 15,
            streak: 8,
            longest_streak: 14,
            last_active_date: new Date().toISOString().split('T')[0],
            avatar_url: null,
            created_at: new Date().toISOString(),
          });
        }
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', cleanName)
          .maybeSingle();

        if (data) {
          setProfile(data as Profile);
        } else {
          // Check local store
          const local = loadLocalProfile();
          if (local.username.toLowerCase() === cleanName.toLowerCase()) {
            setProfile(local);
          } else {
            setProfile(null);
          }
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPublicProfile();
  }, [cleanName]);

  function handleCopyUrl() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-pulse text-amber-400 mb-4">
          <Sword className="w-6 h-6" />
        </div>
        <p className="text-ink-300 text-sm">Searching the realm archives for {cleanName}...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-ink-900 border border-ink-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-flame-500/15 border border-flame-500/30 flex items-center justify-center text-flame-400 mx-auto text-2xl">
            🗡️
          </div>
          <h1 className="text-2xl font-bold text-ink-50 font-serif">Hero Not Found</h1>
          <p className="text-sm text-ink-400">
            No adventurer named <span className="text-amber-400 font-bold">{cleanName}</span> was found in the realm records.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-ink-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Realm
          </Link>
        </div>
      </div>
    );
  }

  // Private profile check
  if (profile.is_public === false) {
    const countryInfo = getCountry(profile.country);
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-ink-900 border border-amber-500/30 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto text-3xl">
            🔒
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-ink-400">
              <span>{countryInfo.flag}</span>
              <span>{countryInfo.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-ink-50 font-serif">{cleanName}</h1>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              {getRankTitle(profile.level)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-ink-950 border border-ink-800 text-ink-300 text-xs leading-relaxed">
            This adventurer has set their profile to <span className="text-amber-400 font-bold">Private</span>. Hero stats and achievements are hidden from public view.
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-ink-200 font-bold text-xs hover:bg-ink-750 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Enter LifeQuest Realm
          </Link>
        </div>
      </div>
    );
  }

  // Public profile card view
  const countryInfo = getCountry(profile.country);
  const rankTitle = getRankTitle(profile.level);
  const platformRanks = calculatePlatformRanks(profile);

  return (
    <div className="min-h-screen bg-ink-950 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Return / Share Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-ink-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            LifeQuest Realm
          </Link>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink-900 border border-ink-800 text-xs font-bold text-ink-200 hover:border-amber-500/40 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald2-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            {copied ? 'Link Copied!' : 'Share Profile'}
          </button>
        </div>

        {/* Public Hero Showcase Card */}
        <div className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-ink-900 via-ink-900 to-ink-950 p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Hero Header Meta */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 relative z-10">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-4xl font-extrabold text-white shadow-xl shrink-0 border-2 border-amber-300">
              {cleanName.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-50 font-serif truncate">
                  {cleanName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ink-800 border border-ink-700 text-ink-200 flex items-center gap-1">
                  <span>{countryInfo.flag}</span>
                  <span>{countryInfo.name}</span>
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  {rankTitle}
                </span>
                <span className="text-ink-500">•</span>
                <span className="font-bold text-ink-300">Level {profile.level}</span>
                <span className="text-ink-500">•</span>
                <span className="font-bold text-flame-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {profile.streak} Day Streak
                </span>
              </div>

              {profile.bio && (
                <p className="text-xs sm:text-sm text-ink-300 italic pt-1 max-w-xl">
                  &quot;{profile.bio}&quot;
                </p>
              )}
            </div>
          </div>

          {/* Stats Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-ink-950/80 border border-ink-800 text-center">
              <div className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">Level</div>
              <div className="text-lg font-extrabold text-amber-400 mt-0.5">{profile.level}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-ink-950/80 border border-ink-800 text-center">
              <div className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">Total XP</div>
              <div className="text-lg font-extrabold text-gold-300 mt-0.5">{profile.total_xp.toLocaleString()}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-ink-950/80 border border-ink-800 text-center">
              <div className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">Streak</div>
              <div className="text-lg font-extrabold text-flame-400 mt-0.5">{profile.streak} Days</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-ink-950/80 border border-ink-800 text-center">
              <div className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">Realm Rank</div>
              <div className="text-lg font-extrabold text-azure-400 mt-0.5">#{platformRanks.overallRank}</div>
            </div>
          </div>

          {/* Attribute Scores Breakdown */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> Hero Attribute Stats
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Strength', val: profile.strength, icon: '🏋️', color: 'bg-flame-500' },
                { label: 'Intellect', val: profile.intellect, icon: '🧠', color: 'bg-azure-500' },
                { label: 'Vitality', val: profile.vitality, icon: '💖', color: 'bg-emerald2-500' },
                { label: 'Charisma', val: profile.charisma, icon: '🤝', color: 'bg-gold-500' },
                { label: 'Dexterity', val: profile.dexterity, icon: '⚡', color: 'bg-violet2-500' },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-xl bg-ink-950 border border-ink-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{stat.icon}</span>
                    <span className="text-xs font-semibold text-ink-200">{stat.label}</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-400">Lvl {stat.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Banner to Join App */}
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-950/30 to-amber-500/10 border border-amber-500/30 text-center space-y-3">
            <h4 className="text-base font-bold text-ink-50">Turn your real life into an epic RPG too!</h4>
            <p className="text-xs text-ink-300 max-w-md mx-auto">
              Level up daily habits, track real-world quests, build streaks, and join {cleanName} in the LifeQuest realm.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-ink-950 font-extrabold text-xs uppercase tracking-wider hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
            >
              ⚡ Create Your Free Hero Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
