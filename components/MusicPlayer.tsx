'use client';

import { useState, useEffect } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { soundManager } from '@/lib/audio';

type MusicPlayerProps = {
  onToast?: (msg: string, type: 'success' | 'error') => void;
};

export default function MusicPlayer({ onToast }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(soundManager.isMuted());
    const unsubscribe = soundManager.subscribeBgm((playing) => {
      setIsPlaying(playing);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  function handleToggleMusic() {
    const nextPlaying = soundManager.toggleBgm();
    setIsPlaying(nextPlaying);
    if (onToast) {
      onToast(
        nextPlaying ? '🎵 Background music playing.' : '⏸️ Background music paused.',
        'success'
      );
    }
  }

  function handleToggleSfx() {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
    if (onToast) {
      onToast(nextMuted ? '🔇 Audio muted.' : '🔊 Audio unmuted.', 'success');
    }
  }

  return (
    <div className="flex items-center gap-1.5 bg-ink-850/90 border border-ink-700/60 hover:border-amber-500/40 rounded-2xl px-2.5 py-1.5 shadow-ios-sm transition-all group">
      {/* Equalizer Wave or Music Note */}
      <div
        className="flex items-center gap-0.5 cursor-pointer py-1 px-1 text-amber-400"
        onClick={handleToggleMusic}
        title={isPlaying ? 'Pause Background Music' : 'Play Background Music'}
      >
        {isPlaying ? (
          <div className="flex items-end gap-0.5 h-3.5 w-3.5">
            <span className="w-0.5 bg-amber-400 rounded-full animate-[equalizer_0.8s_ease-in-out_infinite]" />
            <span className="w-0.5 bg-amber-400 rounded-full animate-[equalizer_1.1s_ease-in-out_infinite_0.2s]" />
            <span className="w-0.5 bg-amber-400 rounded-full animate-[equalizer_0.9s_ease-in-out_infinite_0.4s]" />
          </div>
        ) : (
          <Music className="w-3.5 h-3.5 text-ink-400 group-hover:text-amber-400 transition-colors" />
        )}
      </div>

      {/* Music Play / Pause Button */}
      <button
        type="button"
        onClick={handleToggleMusic}
        className={`px-2 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
          isPlaying
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : 'bg-ink-800 text-ink-400 hover:text-ink-200'
        }`}
        title={isPlaying ? 'Pause Realm Music' : 'Play Realm Music'}
        aria-label="Toggle Background Music"
      >
        {isPlaying ? (
          <>
            <Pause className="w-3 h-3 fill-amber-400" />
            <span className="hidden sm:inline">Music ON</span>
          </>
        ) : (
          <>
            <Play className="w-3 h-3 fill-ink-400 group-hover:fill-amber-400" />
            <span className="hidden sm:inline">Play BGM</span>
          </>
        )}
      </button>

      {/* SFX Mute/Unmute toggle */}
      <button
        type="button"
        onClick={handleToggleSfx}
        className={`p-1 rounded-lg text-xs transition-colors ${
          isMuted ? 'text-ink-500 hover:text-ink-400' : 'text-amber-400 hover:text-amber-300'
        }`}
        title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        aria-label="Toggle Sound Effects"
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
