export const COFFEE_ORDER = {
  id: 'morning-coffee',
  levelId: 'test-yard',
  title: 'Кофе для соседа',
  customer: 'Двор на Солнечной',
  description: 'Один горячий кофе через двор. Притормози перед кочками и довези стакан целым.',
  targetSeconds: 40,
  minimumIntegrity: 30,
} as const;

export interface RunResult {
  seconds: number;
  integrity: number;
  levelId: string;
  success?: boolean;
  reason?: string;
}
export interface RatedResult extends RunResult {
  success: boolean;
  stars: number;
  score: number;
}

/** One star for delivery, another for >=70% integrity, third for >=90% within target. */
export function rateDelivery(result: RunResult): RatedResult {
  const integrity = Number.isFinite(result.integrity)
    ? Math.max(0, Math.min(100, result.integrity))
    : 0;
  const seconds = Number.isFinite(result.seconds) ? Math.max(0, result.seconds) : 0;
  const success =
    (result.success ?? true) &&
    Number.isFinite(result.seconds) &&
    result.seconds >= 0 &&
    integrity >= COFFEE_ORDER.minimumIntegrity;
  const stars = success
    ? 1 + Number(integrity >= 70) + Number(integrity >= 90 && seconds <= COFFEE_ORDER.targetSeconds)
    : 0;
  const score = success
    ? Math.round(integrity * 10 + Math.max(0, COFFEE_ORDER.targetSeconds - seconds) * 10)
    : 0;
  return { ...result, integrity, seconds, success, stars, score };
}

export function isBetterResult(
  candidate: { stars?: number; integrity: number; seconds: number },
  previous?: { stars?: number; integrity: number; seconds: number },
): boolean {
  if (!previous) return true;
  const a = candidate.stars ?? rateDelivery({ ...candidate, levelId: COFFEE_ORDER.levelId }).stars;
  const b = previous.stars ?? rateDelivery({ ...previous, levelId: COFFEE_ORDER.levelId }).stars;
  return (
    a > b ||
    (a === b &&
      (candidate.integrity > previous.integrity ||
        (candidate.integrity === previous.integrity && candidate.seconds < previous.seconds)))
  );
}
