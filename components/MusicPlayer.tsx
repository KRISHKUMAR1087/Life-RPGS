'use client';

import { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { soundManager } from '@/lib/audio';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
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
  }

  return (
    <button
      type="button"
      onClick={handleToggleMusic}
      className={`relative group flex items-center justify-center w-9 h-9 !p-0 !rounded-2xl transition-all duration-300 shrink-0 shadow-ios-sm ${
        isPlaying
          ? 'bg-amber-500/15 border border-amber-400/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
          : 'btn-ghost text-ink-400 hover:text-amber-300 hover:border-amber-500/40'
      }`}
      title={isPlaying ? 'Realm Music Playing (Tap to Pause)' : 'Play Realm Music (Tap to Start)'}
      aria-label="Toggle Background Music"
    >
      {isPlaying ? (
        <div className="flex items-end gap-[3px] h-3.5 w-3.5 justify-center">
          <span className="w-1 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full animate-[equalizer_0.7s_ease-in-out_infinite]" />
          <span className="w-1 bg-gradient-to-t from-amber-400 to-yellow-200 rounded-full animate-[equalizer_1.0s_ease-in-out_infinite_0.15s]" />
          <span className="w-1 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full animate-[equalizer_0.85s_ease-in-out_infinite_0.3s]" />
        </div>
      ) : (
        <Music className="w-4 h-4 transition-transform group-hover:scale-110 group-active:scale-95" />
      )}

      {/* Subtle pulse ring when playing */}
      {isPlaying && (
        <span className="absolute inset-0 rounded-2xl border border-amber-400/30 animate-ping pointer-events-none opacity-30" />
      )}
    </button>
  );
}
