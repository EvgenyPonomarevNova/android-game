import type { Settings } from './SaveService';

/** Original synthesized test tones; no downloaded assets or network audio. */
export class AudioManager {
  private context?: AudioContext;
  private settings: Settings;
  private timer?: ReturnType<typeof setInterval>;
  private note = 0;
  private active = false;
  constructor(settings: Settings) {
    this.settings = settings;
  }

  async unlock(): Promise<void> {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch {
      /* Audio may remain unavailable; gameplay must continue. */
    }
  }
  configure(settings: Settings): void {
    this.settings = settings;
    this.scheduleMusic();
  }
  private tone(hz: number, duration: number, gain: number): void {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return;
    const oscillator = ctx.createOscillator();
    const volume = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = hz;
    volume.gain.setValueAtTime(gain * this.settings.volume, ctx.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(volume);
    volume.connect(ctx.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      volume.disconnect();
    };
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }
  effect(kind: 'start' | 'damage' | 'finish'): void {
    if (this.settings.sound)
      this.tone(kind === 'damage' ? 140 : kind === 'finish' ? 880 : 440, 0.15, 0.12);
  }
  setActive(active: boolean): void {
    this.active = active;
    this.scheduleMusic();
    if (!active) void this.context?.suspend().catch(() => {});
  }
  private scheduleMusic(): void {
    clearInterval(this.timer);
    this.timer = undefined;
    if (!this.active || !this.settings.music) return;
    const melody = [262, 330, 392, 330, 294, 349, 440, 349];
    this.timer = setInterval(
      () => this.tone(melody[this.note++ % melody.length]!, 0.25, 0.035),
      450,
    );
  }
  dispose(): void {
    clearInterval(this.timer);
    void this.context?.close().catch(() => {});
  }
}
