// Zero-dependency Web Audio API sound synthesizer and Background Music Engine for LifeQuest RPG

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmPlaying: boolean = false;
  private bgmVolume: number = 0.35;
  private onBgmChangeCallbacks: Set<(isPlaying: boolean) => void> = new Set();
  private onMuteChangeCallbacks: Set<(isMuted: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('life_rpg_muted');
      this.muted = storedMute === 'true';

      const storedBgm = localStorage.getItem('life_rpg_bgm');
      this.bgmPlaying = storedBgm === 'true';

      // Initialize audio element
      this.initBgm();
    }
  }

  private initBgm(): void {
    if (typeof window === 'undefined') return;
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio('/BackgroundMusic.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.bgmVolume;
      this.bgmAudio.preload = 'auto';

      this.bgmAudio.addEventListener('play', () => {
        this.bgmPlaying = true;
        this.notifyBgmChange();
      });

      this.bgmAudio.addEventListener('pause', () => {
        this.bgmPlaying = false;
        this.notifyBgmChange();
      });
    }
  }

  public subscribeBgm(callback: (isPlaying: boolean) => void): () => void {
    this.onBgmChangeCallbacks.add(callback);
    callback(this.bgmPlaying);
    return () => {
      this.onBgmChangeCallbacks.delete(callback);
    };
  }

  private notifyBgmChange(): void {
    this.onBgmChangeCallbacks.forEach((cb) => cb(this.bgmPlaying));
  }

  public async playBgm(): Promise<void> {
    this.initBgm();
    if (!this.bgmAudio) return;
    try {
      this.bgmAudio.volume = this.muted ? 0 : this.bgmVolume;
      await this.bgmAudio.play();
      this.bgmPlaying = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('life_rpg_bgm', 'true');
      }
      this.notifyBgmChange();
    } catch (err) {
      console.warn('Autoplay prevented or music error:', err);
    }
  }

  public pauseBgm(): void {
    if (!this.bgmAudio) return;
    this.bgmAudio.pause();
    this.bgmPlaying = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('life_rpg_bgm', 'false');
    }
    this.notifyBgmChange();
  }

  public toggleBgm(): boolean {
    if (this.bgmPlaying) {
      this.pauseBgm();
    } else {
      this.playBgm();
    }
    return this.bgmPlaying;
  }

  public isBgmPlaying(): boolean {
    return this.bgmPlaying;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public subscribeMute(callback: (isMuted: boolean) => void): () => void {
    this.onMuteChangeCallbacks.add(callback);
    callback(this.muted);
    return () => {
      this.onMuteChangeCallbacks.delete(callback);
    };
  }

  private notifyMuteChange(): void {
    this.onMuteChangeCallbacks.forEach((cb) => cb(this.muted));
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.bgmAudio) {
      this.bgmAudio.volume = muted ? 0 : this.bgmVolume;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('life_rpg_muted', String(muted));
    }
    this.notifyMuteChange();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Play a pleasant quest completed chime (arpeggiated triad with bright bell decay)
  public playQuestComplete(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  // Play an epic Level Up celebratory fanfare
  public playLevelUp(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const fanfareNotes = [
      { f: 440.0, t: 0.0, d: 0.12 }, // A4
      { f: 554.37, t: 0.12, d: 0.12 }, // C#5
      { f: 659.25, t: 0.24, d: 0.12 }, // E5
      { f: 880.0, t: 0.36, d: 0.35 }, // A5
      { f: 783.99, t: 0.72, d: 0.12 }, // G5
      { f: 880.0, t: 0.84, d: 0.6 }, // A5 high triumph
    ];

    fanfareNotes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d + 0.05);
    });
  }

  // Play a metallic coin clink sound when earning or spending gold
  public playCoinSound(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6
    osc2.frequency.setValueAtTime(1975.53, now); // B6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);
  }

  public playCoin(): void {
    this.playCoinSound();
  }

  // Play an equipment click / gear equip sound
  public playEquipSound(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.06);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playEquip(): void {
    this.playEquipSound();
  }

  // Play a Boss Strike slash sound
  public playBossHit(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Play Boss Defeated Victory Fanfare
  public playVictory(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major triumphant chord

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.001, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.06 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + 0.85);
    });
  }

  // Subtle UI click
  public playClick(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Soft low whoosh sound for abandoning/deleting a quest
  public playAbandonSound(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Celebratory sting sound for streak achievements
  public playStreakMilestoneSound(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 1046.5]; // C5, E5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0.001, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.32);
    });
  }

  // Low-tone dual frequency sound for error toasts
  public playErrorSound(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, now);
    osc2.frequency.setValueAtTime(170, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);
  }

  // Soft double tick for form validation rejection
  public playValidationErrorSound(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.07].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now + delay);
      osc.frequency.exponentialRampToValueAtTime(200, now + delay + 0.03);

      gain.gain.setValueAtTime(0.1, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.05);
    });
  }

  // Clean confirmation ping when saving custom category or editing quest
  public playSaveSound(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}

export const soundManager = new SoundManager();
