import type { Settings } from './SaveService';
import type { CargoImpact } from '../shared/GameFeedback';
import type { GameMode } from '../game/core/GameBridge';
import { AUDIO_ASSETS, AUDIO_BUS_VOLUMES, type AudioKey, type AudioBus } from './AudioAssets';

type Voice = { source: AudioBufferSourceNode; gain: GainNode };
type LoopMix = { gain: number; rate: number };
const ENGINE_KEYS = ['engine_idle_loop', 'engine_cruise_loop', 'engine_fast_loop'] as const;
const PRELOAD: AudioKey[] = [
  ...ENGINE_KEYS,
  'engine_start',
  'level_start',
  'delivery_success',
  'delivery_failed',
  'collision_small',
  'collision_medium',
  'collision_heavy',
  'coffee_splash_light',
  'coffee_spill',
  'cargo_danger',
  'ui_click_01',
  'ui_back',
  'ui_confirm',
  'star_one',
  'star_two',
  'star_three',
  'new_record',
  'land_safe',
  'land_hard',
];

/** The app's single audio owner. Local buffers are cached; physics only supplies events. */
export class AudioManager {
  private context?: AudioContext;
  private buses = new Map<AudioBus, GainNode>();
  private buffers = new Map<AudioKey, Promise<AudioBuffer | null>>();
  private loops = new Map<AudioKey, Voice>();
  private pendingLoops = new Set<AudioKey>();
  private voices = new Set<Voice>();
  private lastPlayed = new Map<AudioKey, number>();
  private settings: Settings;
  private mode: GameMode = 'menu';
  private screen = 'main';
  private background = false;
  private unlocked = false;
  private disposed = false;
  private epoch = 0;
  private speed = 0;
  private grounded = true;
  private throttle = false;
  private danger = false;
  private lastLandingId = 0;
  private rainyRide = false;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  async unlock(): Promise<void> {
    if (this.disposed || document.hidden) return;
    this.background = false;
    this.unlocked = true;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        for (const bus of Object.keys(AUDIO_BUS_VOLUMES) as (AudioBus | 'master')[]) {
          if (bus === 'master') continue;
          const node = this.context.createGain();
          node.connect(this.context.destination);
          this.buses.set(bus, node);
        }
        this.applyVolumes();
        for (const key of PRELOAD) void this.load(key);
      }
      if (this.mode === 'paused' || this.mode === 'error') return;
      await this.context.resume();
      // A pending resume/decode may finish after the app was hidden or paused.
      if (!this.audible()) {
        await this.context.suspend();
        return;
      }
      this.syncLoops();
    } catch {
      /* Missing/unsupported audio never prevents a ride. */
    }
  }

  private audible(): boolean {
    return !this.disposed && !this.background && this.mode !== 'paused' && this.mode !== 'error';
  }

  private load(key: AudioKey): Promise<AudioBuffer | null> {
    const existing = this.buffers.get(key);
    if (existing) return existing;
    const context = this.context;
    if (!context || this.disposed) return Promise.resolve(null);
    const promise = fetch(`${import.meta.env.BASE_URL}assets/audio/${AUDIO_ASSETS[key].path}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Audio ${response.status}: ${key}`);
        return response.arrayBuffer();
      })
      .then((bytes) => context.decodeAudioData(bytes))
      .catch(() => null);
    this.buffers.set(key, promise);
    return promise;
  }

  configure(settings: Settings): void {
    this.settings = settings;
    this.applyVolumes();
    if (!settings.sound || settings.volume <= 0) this.stopShots();
    this.syncLoops();
  }

  private applyVolumes(): void {
    if (!this.context) return;
    for (const [bus, node] of this.buses) {
      const enabled = bus === 'music' ? this.settings.music : this.settings.sound;
      const volume =
        bus === 'music'
          ? this.settings.musicVolume
          : bus === 'engine'
            ? this.settings.engineVolume
            : this.settings.effectsVolume;
      node.gain.setTargetAtTime(
        enabled ? AUDIO_BUS_VOLUMES[bus] * this.settings.volume * volume : 0,
        this.context.currentTime,
        0.025,
      );
    }
  }

  setMode(mode: GameMode): void {
    const previous = this.mode;
    this.mode = mode;
    if (mode !== previous || mode === 'playing') {
      this.epoch++;
      this.stopShots();
    }
    if (mode === 'menu') this.screen = 'main';
    if (mode === 'playing' && previous !== 'paused') {
      this.speed = 0;
      this.throttle = false;
      this.danger = false;
      this.lastLandingId = 0;
      this.lastPlayed.clear();
    }
    if (!this.audible()) {
      void this.context?.suspend().catch(() => {});
      return;
    }
    this.syncLoops();
    if (this.unlocked) void this.unlock();
    if (mode === 'playing' && previous !== 'paused') this.effect('start');
  }

  menuScreen(screen: string): void {
    this.screen = screen;
    this.syncLoops();
  }

  setRideTheme(rainy: boolean): void {
    this.rainyRide = rainy;
    this.syncLoops();
  }

  suspend(): void {
    this.background = true;
    this.epoch++;
    this.stopShots();
    void this.context?.suspend().catch(() => {});
  }

  engine(
    speed: number,
    grounded: boolean,
    throttle = false,
    stress = 0,
    integrity = 100,
    landingId = 0,
    landingImpact = 0,
    wetSurface = false,
  ): void {
    this.speed = Number.isFinite(speed) ? Math.max(0, Math.min(70, speed)) : 0;
    this.grounded = grounded;
    this.throttle = throttle;
    if (this.mode === 'playing' && landingId > this.lastLandingId && landingImpact > 1.5) {
      this.playSfx(landingImpact > 4.2 ? 'land_hard' : 'land_safe', 0.6, 0, 200);
    }
    this.lastLandingId = landingId;
    // AudioKit's light liquid splash is reused for small road puddles. No random damage.
    if (this.mode === 'playing' && wetSurface && grounded && this.speed > 6)
      this.playSfx('coffee_splash_light', Math.min(0.2, this.speed / 180), 0, 1600);
    const danger = stress >= 0.7 || integrity < 30;
    if (this.mode === 'playing' && danger && !this.danger)
      this.playSfx('cargo_danger', 0.55, 0, 3500);
    if (danger) this.danger = true;
    else if (stress < 0.45 && integrity >= 30) this.danger = false;
    this.syncLoops();
  }

  private wantedLoops(): Map<AudioKey, LoopMix> {
    const result = new Map<AudioKey, LoopMix>();
    if (this.settings.music) {
      const key: AudioKey =
        this.mode === 'menu'
          ? this.screen === 'garage'
            ? 'music_garage_funk_loop'
            : this.screen === 'orders'
              ? 'music_map_choices_loop'
              : 'music_menu_sunny_loop'
          : this.rainyRide
            ? 'music_ride_night_loop'
            : 'music_ride_day_loop';
      result.set(key, {
        gain: this.mode === 'finished' || this.mode === 'failed' ? 0.25 : 1,
        rate: 1,
      });
    }
    if (this.mode === 'playing' && this.settings.sound) {
      const speed = Math.min(1, this.speed / 42);
      const rev = this.throttle ? 0.1 : 0;
      result.set('engine_idle_loop', {
        gain: Math.max(0, 1 - speed * 2) * 0.65,
        rate: 0.9 + rev + speed * 0.25,
      });
      result.set('engine_cruise_loop', {
        gain: (1 - Math.abs(speed * 2 - 1)) * 0.65,
        rate: 0.9 + rev + speed * 0.2,
      });
      result.set('engine_fast_loop', {
        gain: Math.max(0, speed * 2 - 1) * 0.65,
        rate: 0.9 + rev + speed * 0.25 + (this.grounded ? 0 : 0.1),
      });
      result.set(this.rainyRide ? 'ambient_wind_loop' : 'ambient_city_day_loop', {
        gain: this.rainyRide ? 0.4 : 0.7,
        rate: 1,
      });
    }
    return result;
  }

  private syncLoops(): void {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running' || !this.audible()) return;
    const wanted = this.wantedLoops();
    for (const [key, voice] of this.loops) {
      if (!wanted.has(key)) {
        // Music crossfades for 400 ms; engine never tails into a result/menu.
        const duration = AUDIO_ASSETS[key].bus === 'music' ? 0.4 : 0.06;
        voice.gain.gain.cancelScheduledValues(ctx.currentTime);
        voice.gain.gain.setTargetAtTime(0, ctx.currentTime, duration / 4);
        voice.source.stop(ctx.currentTime + duration);
        this.loops.delete(key);
      }
    }
    for (const [key, mix] of wanted) {
      const voice = this.loops.get(key);
      if (voice) {
        voice.gain.gain.setTargetAtTime(mix.gain, ctx.currentTime, 0.1);
        voice.source.playbackRate.setTargetAtTime(mix.rate, ctx.currentTime, 0.15);
      } else if (!this.pendingLoops.has(key)) {
        this.pendingLoops.add(key);
        void this.load(key).then((buffer) => {
          this.pendingLoops.delete(key);
          const current = this.wantedLoops().get(key);
          if (
            !buffer ||
            !current ||
            !this.audible() ||
            ctx.state !== 'running' ||
            this.loops.has(key)
          )
            return;
          const created = this.createVoice(key, buffer);
          created.source.loop = true;
          created.source.playbackRate.value = current.rate;
          created.gain.gain.value = 0;
          created.gain.gain.setTargetAtTime(current.gain, ctx.currentTime, 0.1);
          this.loops.set(key, created);
          created.source.start();
        });
      }
    }
  }

  private createVoice(key: AudioKey, buffer: AudioBuffer): Voice {
    const ctx = this.context!;
    const source = ctx.createBufferSource(),
      gain = ctx.createGain();
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.buses.get(AUDIO_ASSETS[key].bus)!);
    const voice = { source, gain };
    this.voices.add(voice);
    source.onended = () => {
      this.voices.delete(voice);
      source.disconnect();
      gain.disconnect();
    };
    return voice;
  }

  playSfx(key: AudioKey, volume = 1, delay = 0, cooldownMs = 120): void {
    if (
      AUDIO_ASSETS[key].loop ||
      !this.settings.sound ||
      this.settings.volume <= 0 ||
      !this.audible()
    )
      return;
    const now = performance.now();
    if (now - (this.lastPlayed.get(key) ?? -Infinity) < cooldownMs) return;
    this.lastPlayed.set(key, now);
    const epoch = this.epoch;
    void this.load(key).then((buffer) => {
      const ctx = this.context;
      if (
        !buffer ||
        !ctx ||
        ctx.state !== 'running' ||
        !this.audible() ||
        epoch !== this.epoch ||
        !this.settings.sound ||
        this.settings.volume <= 0 ||
        performance.now() - now > 1200 ||
        this.voices.size > 20
      )
        return;
      const voice = this.createVoice(key, buffer);
      voice.gain.gain.value = volume;
      voice.source.start(ctx.currentTime + delay);
    });
  }

  effect(kind: 'start' | 'damage' | 'finish' | 'failure'): void {
    if (kind === 'start') {
      this.playSfx('engine_start', 0.6);
      this.playSfx('level_start', 0.6, 0.15);
    } else
      this.playSfx(
        kind === 'finish'
          ? 'delivery_success'
          : kind === 'failure'
            ? 'delivery_failed'
            : 'collision_small',
      );
  }

  reward(stars: number, newRecord: boolean): void {
    if (stars > 0)
      this.playSfx(stars === 3 ? 'star_three' : stars === 2 ? 'star_two' : 'star_one', 0.65, 1.4);
    if (newRecord) this.playSfx('new_record', 0.6, 2.5);
  }

  impact(impact: CargoImpact): void {
    if (this.mode !== 'playing') return;
    const severity = impact.severity;
    this.playSfx(
      severity === 'heavy'
        ? 'collision_heavy'
        : severity === 'medium'
          ? 'collision_medium'
          : 'collision_small',
      0.65,
    );
    if (impact.loss > 0)
      this.playSfx(impact.loss >= 5 ? 'coffee_spill' : 'coffee_splash_light', 0.65, 0, 350);
  }

  private stopShots(): void {
    const loops = new Set([...this.loops.values()].map((voice) => voice.source));
    for (const voice of this.voices) {
      if (loops.has(voice.source)) continue;
      try {
        voice.source.stop();
      } catch {
        /* Already ended. */
      }
    }
  }

  dispose(): void {
    this.disposed = true;
    this.epoch++;
    for (const voice of this.voices) {
      try {
        voice.source.stop();
      } catch {
        /* Already ended. */
      }
      voice.source.disconnect();
      voice.gain.disconnect();
    }
    this.voices.clear();
    this.loops.clear();
    this.buffers.clear();
    this.pendingLoops.clear();
    void this.context?.close().catch(() => {});
  }
}
