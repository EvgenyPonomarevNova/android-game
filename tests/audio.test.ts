import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioManager } from '../src/platform/AudioManager';
import { defaultSave } from '../src/platform/SaveService';

class Param {
  value = 1;
  setTargetAtTime(value: number) {
    this.value = value;
  }
  cancelScheduledValues() {}
}
class Gain {
  gain = new Param();
  connect() {}
  disconnect() {}
}
class Source {
  buffer?: { key: string };
  loop = false;
  playbackRate = new Param();
  onended?: () => void;
  stopped = false;
  started = false;
  connect() {}
  disconnect() {}
  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
    this.onended?.();
  }
}
class Context {
  static last: Context;
  state = 'suspended';
  currentTime = 0;
  destination = {};
  sources: Source[] = [];
  gains: Gain[] = [];
  constructor() {
    Context.last = this;
  }
  createGain() {
    const gain = new Gain();
    this.gains.push(gain);
    return gain;
  }
  createBufferSource() {
    const node = new Source();
    this.sources.push(node);
    return node;
  }
  async decodeAudioData(bytes: ArrayBuffer) {
    return { key: new TextDecoder().decode(bytes) };
  }
  async resume() {
    this.state = 'running';
  }
  async suspend() {
    this.state = 'suspended';
  }
  async close() {
    this.state = 'closed';
  }
}
const response = (url: string) => ({
  ok: true,
  arrayBuffer: async () => new TextEncoder().encode(url).buffer,
});
const settle = async () => {
  for (let i = 0; i < 16; i++) await Promise.resolve();
};
let audio: AudioManager;

beforeEach(() => {
  vi.stubGlobal('document', { hidden: false });
  vi.stubGlobal('AudioContext', Context);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => response(url)),
  );
  audio = new AudioManager({ ...defaultSave().settings, music: true });
});
afterEach(() => {
  audio.dispose();
  vi.unstubAllGlobals();
});

describe('AudioKit lifecycle', () => {
  it('uses the night score and wet contact cues only while riding on wet ground', async () => {
    await audio.unlock();
    audio.setRideTheme(true);
    audio.setMode('playing');
    await settle();
    expect(
      Context.last.sources.some((s) => s.loop && s.buffer?.key.includes('music_ride_night_loop')),
    ).toBe(true);
    audio.engine(25, true, true, 0, 100, 0, 0, true);
    await settle();
    expect(Context.last.sources.some((s) => s.buffer?.key.includes('coffee_splash_light'))).toBe(
      true,
    );
    const count = Context.last.sources.length;
    audio.setMode('paused');
    audio.engine(25, true, true, 0, 100, 0, 0, true);
    await settle();
    expect(Context.last.sources.length).toBe(count);
  });
  it('applies independent music, engine and effects sliders to live buses', async () => {
    await audio.unlock();
    await settle();
    const before = Context.last.gains.slice(0, 8).map((gain) => gain.gain.value);
    audio.configure({
      ...defaultSave().settings,
      musicVolume: 0,
      engineVolume: 0,
      effectsVolume: 0,
    });
    const after = Context.last.gains.slice(0, 8).map((gain) => gain.gain.value);
    expect(before.some((value) => value > 0)).toBe(true);
    expect(after.every((value) => value === 0)).toBe(true);
    audio.configure({
      ...defaultSave().settings,
      musicVolume: 1,
      engineVolume: 0,
      effectsVolume: 0,
    });
    expect(Context.last.gains.slice(0, 8).filter((gain) => gain.gain.value > 0)).toHaveLength(1);
  });
  it('plays one landing cue per physical landing even across repeated telemetry', async () => {
    await audio.unlock();
    audio.setMode('playing');
    await settle();
    audio.engine(20, true, true, 0, 100, 1, 5);
    await settle();
    audio.engine(20, true, true, 0, 100, 1, 5);
    await settle();
    const landings = Context.last.sources.filter((source) =>
      source.buffer?.key.includes('land_hard.wav'),
    );
    expect(landings).toHaveLength(1);
    audio.setMode('paused');
    audio.engine(20, true, false, 0, 100, 2, 5);
    await settle();
    expect(
      Context.last.sources.filter((source) => source.buffer?.key.includes('land_hard.wav')),
    ).toHaveLength(1);
  });
  it('keeps three engine layers across restarts and preserves loops through pause', async () => {
    await audio.unlock();
    audio.setMode('playing');
    await settle();
    for (let i = 0; i < 3; i++) {
      audio.setMode('playing');
      audio.engine(25, true, true);
      await settle();
    }
    const engine = () =>
      Context.last.sources.filter(
        (source) => source.loop && source.buffer?.key.includes('/02_ENGINE/'),
      );
    expect(engine()).toHaveLength(3);
    audio.setMode('paused');
    expect(Context.last.state).toBe('suspended');
    expect(engine().every((source) => !source.stopped)).toBe(true);
    audio.setMode('playing');
    await settle();
    expect(Context.last.state).toBe('running');
    expect(engine()).toHaveLength(3);
    audio.setMode('finished');
    expect(engine().every((source) => source.stopped)).toBe(true);
  });

  it('does not start deferred buffers after backgrounding or disposal', async () => {
    const pending: (() => void)[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => new Promise((resolve) => pending.push(() => resolve(response(url))))),
    );
    await audio.unlock();
    audio.setMode('playing');
    audio.playSfx('ui_confirm');
    audio.suspend();
    pending.forEach((resolve) => resolve());
    await settle();
    expect(Context.last.sources).toHaveLength(0);
    expect(Context.last.state).toBe('suspended');
    audio.dispose();
    await audio.unlock();
    expect(Context.last.state).toBe('closed');
  });

  it('keeps music independent of SFX mute and cancels result cues on retry', async () => {
    await audio.unlock();
    audio.configure({ ...defaultSave().settings, music: true, sound: false });
    audio.playSfx('ui_confirm');
    await settle();
    expect(
      Context.last.sources.some(
        (source) => source.loop && source.buffer?.key.includes('/01_MUSIC/'),
      ),
    ).toBe(true);
    expect(Context.last.sources.filter((source) => !source.loop)).toHaveLength(0);
    audio.configure({ ...defaultSave().settings, music: true });
    audio.setMode('finished');
    audio.effect('finish');
    audio.reward(3, true);
    await settle();
    const resultSounds = Context.last.sources.filter((source) => !source.loop);
    expect(resultSounds).toHaveLength(3);
    audio.setMode('playing');
    expect(resultSounds.every((source) => source.stopped)).toBe(true);
  });
});
