import { defaultCareer, migrateCareer, normalizeCareer } from '../game/core/Career';
import type { CareerState } from '../shared/Progression';

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
export interface Settings {
  sound: boolean;
  music: boolean;
  volume: number;
  showFps: boolean;
  musicVolume: number;
  effectsVolume: number;
  engineVolume: number;
  leftHanded: boolean;
  controlScale: number;
  cameraShake: number;
  hints: boolean;
}
export interface LevelResult {
  seconds: number;
  integrity: number;
  stars?: number;
  score?: number;
  medal?: 'bronze' | 'silver' | 'gold';
  checkpointUsed?: boolean;
  falls?: number;
  temperature?: number;
}
export interface SaveData {
  version: 2;
  settings: Settings;
  lastUnlockedLevel: string;
  results: Record<string, LevelResult>;
  career: CareerState;
}
export const defaultSave = (): SaveData => ({
  version: 2,
  career: defaultCareer(),
  settings: {
    sound: true,
    music: true,
    volume: 0.65,
    showFps: false,
    musicVolume: 0.7,
    effectsVolume: 1,
    engineVolume: 0.85,
    leftHanded: false,
    controlScale: 1,
    cameraShake: 0.65,
    hints: true,
  },
  lastUnlockedLevel: 'test-yard',
  results: {},
});
const KEY = 'nerazley.save';
const BACKUP = `${KEY}.backup`;
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function decodeSave(raw: string): SaveData {
  const parsed: unknown = JSON.parse(raw);
  if (!object(parsed)) throw new Error('Invalid save');
  if (typeof parsed.version === 'number' && parsed.version > 2)
    throw new Error('SAVE_FROM_NEWER_VERSION');
  // A small explicit migration entry point for the first prototype schema.
  if (parsed.version === 0) {
    const migrated = defaultSave();
    if (typeof parsed.sound === 'boolean') migrated.settings.sound = parsed.sound;
    if (typeof parsed.music === 'boolean') migrated.settings.music = parsed.music;
    return migrated;
  }
  if (
    (parsed.version !== 1 && parsed.version !== 2) ||
    !object(parsed.settings) ||
    !object(parsed.results)
  )
    throw new Error('Invalid save schema');
  if (parsed.version === 2 && !object(parsed.career)) throw new Error('Invalid career save');
  const next = defaultSave();
  const s = parsed.settings;
  for (const key of ['sound', 'music', 'showFps', 'leftHanded', 'hints'] as const)
    if (typeof s[key] === 'boolean') next.settings[key] = s[key];
  if (typeof s.volume === 'number' && Number.isFinite(s.volume))
    next.settings.volume = Math.max(0, Math.min(1, s.volume));
  for (const key of ['musicVolume', 'effectsVolume', 'engineVolume', 'cameraShake'] as const)
    if (typeof s[key] === 'number' && Number.isFinite(s[key]))
      next.settings[key] = Math.max(0, Math.min(1, s[key]));
  if (typeof s.controlScale === 'number' && Number.isFinite(s.controlScale))
    next.settings.controlScale = Math.max(0.85, Math.min(1.2, s.controlScale));
  if (typeof parsed.lastUnlockedLevel === 'string' && parsed.lastUnlockedLevel.length < 100)
    next.lastUnlockedLevel = parsed.lastUnlockedLevel;
  for (const [id, result] of Object.entries(parsed.results)) {
    if (id === '__proto__' || id === 'constructor' || id.length > 100 || !object(result)) continue;
    if (
      typeof result.seconds === 'number' &&
      Number.isFinite(result.seconds) &&
      result.seconds >= 0 &&
      typeof result.integrity === 'number' &&
      Number.isFinite(result.integrity) &&
      result.integrity >= 0 &&
      result.integrity <= 100
    ) {
      next.results[id] = { seconds: result.seconds, integrity: result.integrity };
      if (typeof result.temperature === 'number' && Number.isFinite(result.temperature))
        next.results[id]!.temperature = Math.max(0, Math.min(100, result.temperature));
      if (result.medal === 'bronze' || result.medal === 'silver' || result.medal === 'gold')
        next.results[id]!.medal = result.medal;
      if (typeof result.checkpointUsed === 'boolean')
        next.results[id]!.checkpointUsed = result.checkpointUsed;
      if (typeof result.falls === 'number' && Number.isInteger(result.falls) && result.falls >= 0)
        next.results[id]!.falls = result.falls;
      if (
        typeof result.stars === 'number' &&
        Number.isInteger(result.stars) &&
        result.stars >= 0 &&
        result.stars <= 3
      )
        next.results[id]!.stars = result.stars;
      if (typeof result.score === 'number' && Number.isFinite(result.score) && result.score >= 0)
        next.results[id]!.score = Math.round(result.score);
    }
  }
  next.career = parsed.version === 2 ? normalizeCareer(parsed.career) : migrateCareer(next.results);
  return next;
}

export class SaveService {
  private queue = Promise.resolve();
  private lastGood: string | null = null;
  private readOnly = false;
  constructor(private storage: StorageAdapter) {}

  async load(): Promise<{ data: SaveData; warning?: string }> {
    let warning: string | undefined;
    for (const key of [KEY, BACKUP]) {
      try {
        const raw = await this.storage.get(key);
        if (!raw) continue;
        const data = decodeSave(raw);
        this.lastGood = JSON.stringify(data);
        return { data, warning };
      } catch (error) {
        if (error instanceof Error && error.message === 'SAVE_FROM_NEWER_VERSION') {
          this.readOnly = true;
          return {
            data: defaultSave(),
            warning: 'Сохранение создано новой версией. Запись отключена.',
          };
        }
        warning =
          'Не удалось прочитать сохранение. Использована резервная копия или начальные настройки.';
      }
    }
    return { data: defaultSave(), warning };
  }

  save(data: SaveData): Promise<void> {
    if (this.readOnly)
      return Promise.reject(new Error('Запись сохранения новой версии запрещена.'));
    const snapshot = JSON.stringify(decodeSave(JSON.stringify(data)));
    const write = this.queue
      .catch(() => {})
      .then(async () => {
        if (this.lastGood) await this.storage.set(BACKUP, this.lastGood);
        await this.storage.set(KEY, snapshot);
        this.lastGood = snapshot;
      });
    this.queue = write;
    return write;
  }
}
