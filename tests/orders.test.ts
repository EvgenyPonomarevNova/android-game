import { expect, it } from 'vitest';
import { isBetterResult, rateDelivery } from '../src/game/core/Orders';
const run = { seconds: 30, integrity: 95, levelId: 'test-yard' };
it('rates delivered coffee with understandable integrity and time thresholds', () => {
  expect(rateDelivery(run).stars).toBe(3);
  expect(rateDelivery({ ...run, seconds: 41 }).stars).toBe(2);
  expect(rateDelivery({ ...run, integrity: 69 }).stars).toBe(1);
  expect(rateDelivery({ ...run, integrity: 29 }).stars).toBe(0);
  expect(rateDelivery({ ...run, success: false }).score).toBe(0);
});
it('keeps the best delivery when a later run is worse', () => {
  const best = rateDelivery(run);
  expect(isBetterResult(rateDelivery({ ...run, integrity: 70 }), best)).toBe(false);
  expect(isBetterResult({ ...best, seconds: 20 }, best)).toBe(true);
  expect(isBetterResult(best, best)).toBe(false);
});
