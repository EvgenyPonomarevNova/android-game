import { describe, expect, it } from 'vitest';
import {
  defaultCareer,
  settleDelivery,
  claimStarterPart,
  purchasePart,
  purchaseVehicle,
  toggleSkill,
  normalizeCareer,
  careerLevel,
  isContractUnlocked,
  currentSetup,
  purchasePaint,
} from '../src/game/core/Career';
import { CONTRACTS, FIRST_CONTRACT_ID, SECOND_CONTRACT_ID } from '../src/game/core/Contracts';
import { rateDelivery } from '../src/game/core/Orders';
import {
  decodeSave,
  defaultSave,
  SaveService,
  type StorageAdapter,
} from '../src/platform/SaveService';
import { CAREER_BALANCE, PART_PRICES, VEHICLE_PRICES } from '../src/config/career';

const delivery = (id = FIRST_CONTRACT_ID) =>
  rateDelivery({
    levelId: id,
    seconds: 44,
    integrity: 100,
    success: true,
    falls: 0,
    checkpointUsed: false,
    cleanLandings: 2,
    balancedSections: 1,
  });
describe('offline career transactions', () => {
  it('keeps the economy configuration affordable and contract dependencies acyclic', () => {
    expect(CONTRACTS[0]!.rewardCoins).toBeGreaterThanOrEqual(PART_PRICES.allweather_tires);
    for (const value of [...Object.values(PART_PRICES), ...Object.values(VEHICLE_PRICES)])
      expect(Number.isFinite(value) && value >= 0).toBe(true);
    expect(new Set(CONTRACTS.map((c) => c.levelId)).size).toBe(CONTRACTS.length);
    const thresholds = CAREER_BALANCE.levelThresholds;
    expect(thresholds[0]).toBe(0);
    expect(thresholds.slice(1).every((n, i) => n > thresholds[i]!)).toBe(true);
    for (const contract of CONTRACTS) {
      const seen = new Set<string>();
      let next: typeof contract | undefined = contract;
      while (next) {
        expect(seen.has(next.levelId)).toBe(false);
        seen.add(next.levelId);
        const parent: string | null = next.unlockAfter;
        if (!parent) break;
        next = CONTRACTS.find((c) => c.levelId === parent);
        expect(next).toBeDefined();
      }
    }
  });
  it('settles once, opens contract two, offers one meaningful free upgrade and preserves the alternative', () => {
    const start = defaultCareer();
    expect(isContractUnlocked(start, CONTRACTS[1]!)).toBe(false);
    const first = settleDelivery(start, delivery(), 'run1');
    expect(first.reward).toMatchObject({
      firstCompletion: true,
      coins: 250,
      starterChoiceAvailable: true,
    });
    expect(careerLevel(first.career.xp)).toBeGreaterThan(1);
    expect(isContractUnlocked(first.career, CONTRACTS[1]!)).toBe(true);
    expect(first.career.enabledSkills).toEqual([]);
    expect(settleDelivery(first.career, delivery(), 'run1').career).toEqual(first.career);
    const upgraded = claimStarterPart(first.career, 'soft_suspension');
    expect(currentSetup(upgraded).parts.suspension).toBe('soft_suspension');
    expect(upgraded.coins).toBe(first.career.coins);
    expect(() => claimStarterPart(upgraded, 'allweather_tires')).toThrow();
    const bought = purchasePart(upgraded, 'allweather_tires');
    expect(bought.coins).toBe(upgraded.coins - 120);
    expect(currentSetup(bought).parts.tires).toBe('allweather_tires');
    expect(purchasePart(bought, 'allweather_tires')).toEqual(bought);
    const painted = purchasePaint(bought, 'mint');
    expect(painted.coins).toBe(bought.coins - 40);
    expect(currentSetup(painted).paint).toBe('mint');
    expect(purchasePaint(painted, 'mint')).toEqual(painted);
    expect(start.coins).toBe(0);
    expect(start.contracts).toEqual({});
  });
  it('caps repeat rewards and reputation by distinct best contracts; failure does not reduce reliability', () => {
    let c = settleDelivery(defaultCareer(), delivery(), 'first').career;
    for (let i = 0; i < 15; i++) c = settleDelivery(c, delivery(), `repeat${i}`).career;
    const saturated = c;
    for (let i = 15; i < 35; i++) c = settleDelivery(c, delivery(), `repeat${i}`).career;
    expect(c.coins).toBe(saturated.coins);
    expect(c.xp).toBe(saturated.xp);
    expect(c.reputation).toBe(saturated.reputation);
    for (let i = 1; i <= 12; i++)
      c = settleDelivery(c, { ...delivery(), seconds: 44 - i }, `record${i}`).career;
    expect(c.coins).toBe(
      saturated.coins + CAREER_BALANCE.recordRewardLimit * CAREER_BALANCE.recordCoins,
    );
    const fail = rateDelivery({
      levelId: FIRST_CONTRACT_ID,
      seconds: 10,
      integrity: 70,
      success: false,
      reason: 'overturned',
      falls: 1,
    });
    expect(settleDelivery(c, fail, 'failure').career.reputation).toBe(c.reputation);
    expect(settleDelivery(c, fail, 'failure').reward.coins).toBe(0);
    const second = settleDelivery(c, delivery(SECOND_CONTRACT_ID), 'second');
    expect(second.reward.firstCompletion).toBe(true);
    expect(Object.keys(second.career.contracts)).toHaveLength(2);
  });
  it('rejects unaffordable and locked purchases and normalizes impossible loadouts', () => {
    expect(() => purchasePart(defaultCareer(), 'speed_engine')).toThrow();
    expect(() => purchaseVehicle(defaultCareer(), 'tyagach_80')).toThrow();
    expect(() => toggleSkill(defaultCareer(), 'soft_landing')).toThrow();
    const c = normalizeCareer({
      ...defaultCareer(),
      coins: -300,
      ownedParts: ['fake'],
      selectedVehicle: 'fake',
      equippedByVehicle: { dvorik_50: { engine: 'speed_engine' } },
      enabledSkills: ['soft_landing'],
    });
    expect(c.coins).toBe(0);
    expect(currentSetup(c).parts.engine).toBe('standard_engine');
    expect(c.enabledSkills).toEqual([]);
  });
  it('migrates v1 records/settings without losing legacy results or regranting milestones', () => {
    const original = {
      version: 1,
      settings: { sound: false, music: false, volume: 0.2 },
      results: {
        'test-yard': { seconds: 80, integrity: 85 },
        [`${FIRST_CONTRACT_ID}:mission-001-v1`]: {
          seconds: 45,
          integrity: 96,
          stars: 3,
          falls: 0,
          checkpointUsed: false,
        },
      },
    };
    const migrated = decodeSave(JSON.stringify(original));
    expect(migrated.version).toBe(2);
    expect(migrated.results).toEqual(original.results);
    expect(migrated.settings).toMatchObject({ sound: false, music: false, volume: 0.2 });
    expect(migrated.career.coins).toBe(250);
    expect(decodeSave(JSON.stringify(migrated))).toEqual(migrated);
  });
  it('stores money and inventory in one snapshot and recovers the prior purchase state after a failed write', async () => {
    const values = new Map<string, string>();
    let deny = false;
    const storage: StorageAdapter = {
      get: async (k) => values.get(k) ?? null,
      set: async (k, v) => {
        if (deny && k === 'nerazley.save') throw Error('disk full');
        values.set(k, v);
      },
    };
    const service = new SaveService(storage);
    await service.load();
    const data = defaultSave();
    data.career = claimStarterPart(
      settleDelivery(data.career, delivery(), 'once').career,
      'soft_suspension',
    );
    await service.save(data);
    const bought = { ...data, career: purchasePart(data.career, 'allweather_tires') };
    deny = true;
    await expect(service.save(bought)).rejects.toThrow();
    expect((await new SaveService(storage).load()).data.career).toEqual(data.career);
    deny = false;
    await service.save(bought);
    expect((await new SaveService(storage).load()).data.career).toEqual(bought.career);
  });
});
