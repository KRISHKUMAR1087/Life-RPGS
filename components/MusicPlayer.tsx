'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
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
      onToast(nextMuted ? '🔇 Sound effects muted.' : '🔊 Sound effects unmuted.', 'success');
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* BGM Music Play/Pause Icon Button */}
      <button
        type="button"
        onClick={handleToggleMusic}
        className={`p-2 rounded-xl border transition-all flex items-center justify-center focus-ring ${
          isPlaying
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            : 'bg-ink-850 border-ink-800 text-ink-500 hover:text-ink-300'
        }`}
        title={isPlaying ? 'Pause Background Music' : 'Play Background Music'}
        aria-label={isPlaying ? 'Pause Background Music' : 'Play Background Music'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-amber-400 text-amber-400" />
        ) : (
          <Play className="w-4 h-4 fill-current" />
        )}
      </button>

      {/* SFX Sound Effects Speaker Icon Button */}
      <button
        type="button"
        onClick={handleToggleSfx}
        className={`p-2 rounded-xl border transition-all flex items-center justify-center focus-ring ${
          isMuted
            ? 'bg-ink-850 border-ink-800 text-ink-500 hover:text-ink-300'
            : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
        }`}
        title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        aria-label={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
