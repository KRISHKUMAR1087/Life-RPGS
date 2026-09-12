'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Star, Coins, Flame, History, Award } from 'lucide-react';
import { getCategory, getDifficulty } from '@/lib/rpg';
import type { Quest, Profile } from '@/lib/supabase';

type ActivityTimelineProps = {
  quests: Quest[];
  profile: Profile;
};

export default function ActivityTimeline({ quests, profile }: ActivityTimelineProps) {
  const completedQuests = useMemo(
    () =>
      quests
        .filter((q) => q.status === 'completed')
        .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime()),
    [quests]
  );

  // Generate 7-day activity map
  const weeklyActivity = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const map: Array<{ day: string; dateStr: string; count: number; isToday: boolean }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = completedQuests.filter((q) => {
        const qDate = (q.completed_at || q.created_at).split('T')[0];
        return qDate === dateStr;
      }).length;

      map.push({
        day: days[d.getDay()],
        dateStr,
        count,
        isToday: i === 0,
      });
    }
    return map;
  }, [completedQuests]);

  return (
    <div className="rpg-card p-5 sm:p-6 shadow-ios-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-azure-500/10 border border-azure-500/30 flex items-center justify-center shadow-ios-sm">
            <History className="w-5 h-5 text-azure-500" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-ink-200">Chronicles of Valor</h2>
            <p className="text-xs text-ink-400 font-medium">Historical logs & streak journey</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-flame-500/10 border border-flame-500/30 rounded-2xl px-3 py-1.5 shadow-ios-sm">
          <Flame className="w-4 h-4 text-flame-500" />
          <span className="text-xs font-bold text-flame-500 tabular-nums">
            {profile.streak} Day Streak
          </span>
        </div>
      </div>

      {/* 7-Day Activity Grid */}
      <div className="bg-ink-850 rounded-2xl p-4 border border-ink-800 mb-6">
        <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-azure-400" /> 7-Day Realm Activity
        </h3>

        <div className="grid grid-cols-7 gap-2">
          {weeklyActivity.map((item) => (
            <div
              key={item.dateStr}
              className={`rounded-xl p-2.5 text-center flex flex-col items-center justify-between border transition-all ${
                item.isToday
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-ink-800 bg-ink-900/60'
              }`}
            >
              <span className="text-[10px] font-semibold text-ink-400 uppercase">{item.day}</span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center my-1 font-extrabold text-xs transition-colors ${
                  item.count > 0
                    ? 'bg-gradient-to-br from-emerald2-500 to-emerald2-600 text-ink-950 shadow-ios-sm'
                    : 'bg-ink-800 text-ink-500'
                }`}
              >
                {item.count > 0 ? item.count : '0'}
              </div>
              <span className="text-[9px] text-ink-500 font-medium">
                {item.count === 1 ? 'quest' : 'quests'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chronological List of Completed Quests */}
      <div>
        <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-500" /> Completed Quests History ({completedQuests.length})
        </h3>

        {completedQuests.length === 0 ? (
          <div className="text-center py-10 bg-ink-850/50 rounded-2xl border border-ink-800">
            <CheckCircle2 className="w-10 h-10 text-ink-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-ink-300">No quests recorded in your chronicle yet.</p>
            <p className="text-xs text-ink-500 mt-1">Complete active quests on the Quest Board to forge your history!</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {completedQuests.map((quest) => {
              const category = getCategory(quest.category);
              const difficulty = getDifficulty(quest.difficulty);
              const Icon = category.icon;
              const dateDisplay = new Date(quest.completed_at || quest.created_at).toLocaleDateString(
                undefined,
                { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
              );

              return (
                <div
                  key={quest.id}
                  className="bg-ink-850 rounded-2xl p-3.5 border border-ink-800 flex items-center justify-between gap-3 shadow-ios-sm hover:border-ink-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-ink-900 border border-ink-800"
                    >
                      <Icon className="w-5 h-5" style={{ color: category.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-ink-200 truncate">{quest.title}</h4>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${difficulty.badge}`}>
                          {difficulty.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-400 font-medium">{dateDisplay}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs font-extrabold text-azure-400">
                      <Star className="w-3 h-3 text-azure-400" /> +{difficulty.xp} XP
                    </span>
                    <span className="flex items-center gap-1 text-xs font-extrabold text-amber-500">
                      <Coins className="w-3 h-3 text-amber-500" /> +{difficulty.gold} G
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
