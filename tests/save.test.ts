import { expect, it } from 'vitest';
import {
  decodeSave,
  defaultSave,
  SaveService,
  type StorageAdapter,
} from '../src/platform/SaveService';

class MemoryStorage implements StorageAdapter {
  data = new Map<string, string>();
  fail = false;
  async get(key: string) {
    return this.data.get(key) ?? null;
  }
  async set(key: string, value: string) {
    if (this.fail) throw new Error('Disk full');
    this.data.set(key, value);
  }
}
it('starts with defaults, saves settings and restores level results', async () => {
  const storage = new MemoryStorage();
  const service = new SaveService(storage);
  const { data } = await service.load();
  expect(data).toEqual(defaultSave());
  data.settings.sound = false;
  data.settings.music = false;
  data.results['test-yard'] = { seconds: 21, integrity: 84, stars: 2, score: 1030 };
  data.results['test-yard:polish-03'] = { seconds: 28, integrity: 95, stars: 3, score: 1070 };
  data.results['test-yard:mission-04'] = { seconds: 68, integrity: 85, stars: 2, score: 850 };
  data.results['contract_001_surprise_fifth:mission-001-v1'] = {
    seconds: 70,
    integrity: 83,
    stars: 1,
    score: 1400,
    medal: 'bronze',
    checkpointUsed: true,
    falls: 1,
  };
  await service.save(data);
  expect((await new SaveService(storage).load()).data).toEqual(data);
});
it('migrates v1 audio/layout preferences without unmuting old users', () => {
  const data = decodeSave(
    JSON.stringify({
      version: 1,
      settings: { sound: false, music: false, volume: 0.2, showFps: true },
      results: {},
    }),
  );
  expect(data.settings).toMatchObject({
    sound: false,
    music: false,
    volume: 0.2,
    musicVolume: 0.7,
    engineVolume: 0.85,
    leftHanded: false,
    controlScale: 1,
    hints: true,
  });
  data.settings.controlScale = 10;
  data.settings.engineVolume = -4;
  expect(decodeSave(JSON.stringify(data)).settings).toMatchObject({
    controlScale: 1.2,
    engineVolume: 0,
  });
});
it('recovers a corrupt primary from the last known good backup', async () => {
  const storage = new MemoryStorage();
  const service = new SaveService(storage);
  await service.load();
  await service.save(defaultSave());
  const newer = defaultSave();
  newer.settings.sound = false;
  await service.save(newer);
  storage.data.set('nerazley.save', '{broken');
  const result = await new SaveService(storage).load();
  expect(result.warning).toBeTruthy();
  expect(result.data).toEqual(defaultSave());
});
it('handles denied storage, migrates v0 and rejects invalid or newer schemas', async () => {
  expect(decodeSave('{"version":0,"sound":false}').settings.sound).toBe(false);
  expect(() => decodeSave('{"version":1,"settings":null}')).toThrow();
  const storage = new MemoryStorage();
  storage.data.set('nerazley.save', '{"version":99}');
  const future = new SaveService(storage);
  expect((await future.load()).warning).toContain('новой');
  await expect(future.save(defaultSave())).rejects.toThrow();
  expect(storage.data.get('nerazley.save')).toBe('{"version":99}');
  const inaccessible = new SaveService({
    get: async () => {
      throw new Error('Denied');
    },
    set: async () => {},
  });
  expect((await inaccessible.load()).data).toEqual(defaultSave());
});
it('takes an immutable snapshot, serializes writes and recovers after a failed write', async () => {
  const storage = new MemoryStorage();
  const service = new SaveService(storage);
  await service.load();
  const data = defaultSave();
  data.settings.music = false;
  const first = service.save(data);
  data.settings.music = true;
  const second = service.save(data);
  data.settings.volume = 0;
  await Promise.all([first, second]);
  expect((await service.load()).data.settings).toMatchObject({ music: true, volume: 0.65 });
  storage.fail = true;
  await expect(service.save(defaultSave())).rejects.toThrow();
  storage.fail = false;
  await service.save(defaultSave());
  expect((await service.load()).data).toEqual(defaultSave());
});
