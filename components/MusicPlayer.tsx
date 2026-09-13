'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Clock } from 'lucide-react';
import { soundManager } from '@/lib/audio';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [showClockTooltip, setShowClockTooltip] = useState(false);

  useEffect(() => {
    const unsubBgm = soundManager.subscribeBgm((playing) => {
      setIsPlaying(playing);
    });

    const unsubMute = soundManager.subscribeMute((muted) => {
      setIsMuted(muted);
    });

    // Simple session timer (starts when component mounts)
    const timer = setInterval(() => {
      setSessionMinutes((prev) => prev + 1);
    }, 60000);

    return () => {
      unsubBgm();
      unsubMute();
      clearInterval(timer);
    };
  }, []);

  function handleToggleMusic() {
    const nextPlaying = soundManager.toggleBgm();
    setIsPlaying(nextPlaying);
  }

  function handleToggleMute() {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  }

  const formatSessionTime = () => {
    const hrs = Math.floor(sessionMinutes / 60);
    const mins = sessionMinutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
      {/* Continuous BGM Play / Pause Button */}
      <button
        type="button"
        onClick={handleToggleMusic}
        className={`relative group flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 !p-0 !rounded-xl transition-all duration-200 shrink-0 shadow-ios-sm ${
          isPlaying
            ? 'bg-amber-500/20 border border-amber-400/60 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
            : 'btn-ghost text-ink-400 hover:text-amber-300 hover:border-amber-500/40'
        }`}
        title={isPlaying ? 'Pause Continuous Sound' : 'Play Continuous Sound'}
        aria-label={isPlaying ? 'Pause Continuous Sound' : 'Play Continuous Sound'}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current text-amber-400 group-hover:scale-110 transition-transform" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-ink-400 group-hover:text-amber-300 group-hover:scale-110 transition-transform" />
        )}

        {/* Subtle pulse when music is playing */}
        {isPlaying && (
          <span className="absolute inset-0 rounded-xl border border-amber-400/30 animate-ping pointer-events-none opacity-20" />
        )}
      </button>

      {/* Sound Effects / Volume Mute & Unmute Toggle */}
      <button
        type="button"
        onClick={handleToggleMute}
        className={`relative group flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 !p-0 !rounded-xl transition-all duration-200 shrink-0 shadow-ios-sm ${
          isMuted
            ? 'bg-flame-500/15 border border-flame-500/40 text-flame-400'
            : 'btn-ghost text-ink-400 hover:text-ink-200 hover:border-white/20'
        }`}
        title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
      >
        {isMuted ? (
          <VolumeX className="w-3.5 h-3.5 text-flame-400 group-hover:scale-110 transition-transform" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-ink-400 group-hover:text-ink-200 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Clock / Session Timer Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowClockTooltip((prev) => !prev)}
          onMouseEnter={() => setShowClockTooltip(true)}
          onMouseLeave={() => setShowClockTooltip(false)}
          className="btn-ghost flex items-center justify-center gap-1 w-8 h-8 sm:w-auto sm:h-9 sm:px-2.5 !p-0 sm:!py-1 !rounded-xl text-ink-400 hover:text-amber-400 hover:border-amber-500/30 transition-all shrink-0 shadow-ios-sm"
          title={`Focus Session: ${formatSessionTime()}`}
          aria-label="Session Clock"
        >
          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400/90" />
          <span className="hidden md:inline text-[11px] font-bold text-ink-300 tabular-nums">
            {formatSessionTime()}
          </span>
        </button>

        {showClockTooltip && (
          <div className="absolute right-0 top-full mt-2 z-50 px-3 py-1.5 bg-ink-900/95 border border-white/10 rounded-xl shadow-ios-md whitespace-nowrap pointer-events-none text-center">
            <p className="text-[11px] font-bold text-amber-400">Active Quest Session</p>
            <p className="text-[10px] text-ink-400">{formatSessionTime()} elapsed</p>
          </div>
        )}
      </div>
    </div>
  );
}
