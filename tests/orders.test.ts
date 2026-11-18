import { expect, it } from 'vitest';
import {
  COFFEE_ORDER,
  deliveryRecordKey,
  isBetterResult,
  rateDelivery,
} from '../src/game/core/Orders';
import { integrityPercent } from '../src/shared/GameFeedback';
const run = { seconds: COFFEE_ORDER.targetSeconds - 2, integrity: 95, levelId: 'test-yard' };
it('rates delivery using raw integrity, medal deadlines and checkpoint cap', () => {
  expect(rateDelivery(run).stars).toBe(3);
  expect(rateDelivery({ ...run, seconds: COFFEE_ORDER.targetSeconds + 1 }).stars).toBe(2);
  expect(rateDelivery({ ...run, integrity: 69 }).stars).toBe(1);
  expect(rateDelivery({ ...run, integrity: 29 }).stars).toBe(0);
  expect(rateDelivery({ ...run, success: false }).score).toBe(0);
  expect(rateDelivery({ ...run, checkpointUsed: true })).toMatchObject({
    stars: 1,
    medal: 'bronze',
  });
  expect(rateDelivery({ ...run, seconds: COFFEE_ORDER.deadlineSeconds + 1 })).toMatchObject({
    success: false,
    stars: 0,
    medal: null,
  });
  expect(rateDelivery({ ...run, seconds: COFFEE_ORDER.silverSeconds + 1 }).stars).toBe(1);
  expect(rateDelivery({ ...run, integrity: 90, seconds: COFFEE_ORDER.targetSeconds }).medal).toBe(
    'gold',
  );
});
it('keeps the best delivery when a later run is worse', () => {
  const best = rateDelivery(run);
  expect(isBetterResult(rateDelivery({ ...run, integrity: 70 }), best)).toBe(false);
  expect(isBetterResult({ ...best, seconds: best.seconds - 1 }, best)).toBe(true);
  expect(isBetterResult(best, best)).toBe(false);
});
it('keeps presentation rounding separate from grading and old route records', () => {
  expect(integrityPercent(59.6)).toBe(60);
  expect(integrityPercent(59.2)).toBe(59);
  expect(integrityPercent(NaN)).toBe(0);
  expect(rateDelivery({ ...run, integrity: 89.8 }).stars).toBe(2);
  expect(deliveryRecordKey('test-yard')).not.toBe('test-yard');
  expect(deliveryRecordKey('test-yard')).not.toBe('test-yard:mission-04');
});
