import { testLevel } from '../levels/testLevel';
import type { MissionState } from './GameBridge';

export const CONTRACT_ORDER = {
  id: 'contract_001_surprise_fifth',
  levelId: testLevel.id,
  title: 'Сюрприз на пятом',
  customer: 'Солнечная, 5-й подъезд',
  description:
    'До праздника три минуты. Проезд перекрыли. Остальные отказались. Довези мини-торт и два напитка: через ремонт быстрее, в объезд — спокойнее.',
  targetSeconds: testLevel.difficulty.targetSeconds,
  silverSeconds: testLevel.difficulty.silverSeconds ?? 140,
  deadlineSeconds: testLevel.difficulty.deadlineSeconds ?? 180,
  minimumIntegrity: testLevel.difficulty.minimumIntegrity,
  goodIntegrity: 75,
  excellentIntegrity: 90,
} as const;
// Existing consumers can migrate without changing the current contract's identity.
export const COFFEE_ORDER = CONTRACT_ORDER;
export const deliveryRecordKey = (levelId: string): string => `${levelId}:mission-001-v1`;
export type Medal = 'bronze' | 'silver' | 'gold';
export const MEDAL_NAMES: Record<Medal, string> = {
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
};

export interface RunResult extends MissionState {
  seconds: number;
  integrity: number;
  levelId: string;
  success?: boolean;
  reason?: string;
  progress?: number;
}
export interface RatedResult extends RunResult {
  success: boolean;
  stars: number;
  score: number;
  medal: Medal | null;
  rules?: DeliveryRules;
}
export interface DeliveryRules {
  targetSeconds: number;
  silverSeconds: number;
  deadlineSeconds: number;
  minimumIntegrity: number;
  goodIntegrity: number;
  excellentIntegrity: number;
  minimumTemperature?: number;
  silverTemperature?: number;
  goldTemperature?: number;
}

/** Medal thresholds use raw measurements; checkpoint delivery can only earn bronze. */
export function rateDelivery(
  result: RunResult,
  rules: DeliveryRules = CONTRACT_ORDER,
): RatedResult {
  const integrity = Number.isFinite(result.integrity)
    ? Math.max(0, Math.min(100, result.integrity))
    : 0;
  const seconds = Number.isFinite(result.seconds) ? Math.max(0, result.seconds) : 0;
  const success =
    (result.success ?? true) &&
    Number.isFinite(result.seconds) &&
    result.seconds >= 0 &&
    result.seconds <= rules.deadlineSeconds + 1e-8 &&
    (rules.minimumTemperature === undefined ||
      (typeof result.temperature === 'number' &&
        Number.isFinite(result.temperature) &&
        result.temperature >= rules.minimumTemperature)) &&
    integrity >= rules.minimumIntegrity;
  const gold =
    integrity >= rules.excellentIntegrity &&
    seconds <= rules.targetSeconds &&
    (rules.goldTemperature === undefined ||
      (result.temperature ?? -Infinity) >= rules.goldTemperature);
  const silver =
    integrity >= rules.goodIntegrity &&
    seconds <= rules.silverSeconds &&
    (rules.silverTemperature === undefined ||
      (result.temperature ?? -Infinity) >= rules.silverTemperature);
  const stars = success ? (result.checkpointUsed ? 1 : gold ? 3 : silver ? 2 : 1) : 0;
  const medal: Medal | null =
    stars === 3 ? 'gold' : stars === 2 ? 'silver' : stars === 1 ? 'bronze' : null;
  const score = success
    ? stars * 1000 + Math.round(integrity * 5 + Math.max(0, rules.deadlineSeconds - seconds))
    : 0;
  return { ...result, integrity, seconds, success, stars, medal, score, rules };
}

export function deliveryAdvice(result: RatedResult): string {
  const rules: DeliveryRules = result.rules ?? CONTRACT_ORDER;
  if (!result.success) {
    if (result.reason === 'cold')
      return 'Заказ остыл. Сохрани разгон на ровных участках и попробуй короткий путь: на паузе еда не остывает.';
    if (result.reason === 'deadline')
      return 'Время доставки вышло. После освоения объезда попробуй короткий путь и плавные разгоны.';
    if (result.reason === 'overturned')
      return 'Короткий встречный наклон гасит вращение. Перед переломом отпусти газ, приземляйся колёсами по склону.';
    if (result.reason === 'out-of-bounds')
      return 'Для прыжка нужен разгон до кромки. Если скорости мало, выбирай нижний объезд.';
    return result.temperature === undefined
      ? 'Торт не любит жёстких посадок, напитки — резких манёвров. Сбавь скорость и выровняй скутер перед касанием.'
      : 'Горячий заказ не пережил удары. Тормози перед спуском, выравнивай скутер; мягкая подвеска помогает на плитах.';
  }
  if (result.checkpointUsed)
    return 'Доставка с контрольной точки — бронза. Для серебра и золота пройди весь маршрут без продолжения.';
  if (result.medal === 'gold')
    return 'Золотая доставка! Попробуй улучшить время или довезти заказ без потерь.';
  const timeMissing = Math.max(0, result.seconds - rules.targetSeconds);
  const integrityMissing = Math.max(0, rules.excellentIntegrity - result.integrity);
  const parts = [
    timeMissing > 0 ? `сэкономить ${timeMissing.toFixed(1)} с` : '',
    integrityMissing > 0 ? `сохранить ещё ${integrityMissing.toFixed(1)}% груза` : '',
    rules.goldTemperature !== undefined && (result.temperature ?? 0) < rules.goldTemperature
      ? `довезти на ${(rules.goldTemperature - (result.temperature ?? 0)).toFixed(1)}°C горячее`
      : '',
  ].filter(Boolean);
  return `До золота: ${parts.join(' и ')}. Без контрольной точки.`;
}

export function isBetterResult(
  candidate: { stars?: number; integrity: number; seconds: number },
  previous?: { stars?: number; integrity: number; seconds: number },
): boolean {
  if (!previous) return true;
  const a =
    candidate.stars ?? rateDelivery({ ...candidate, levelId: CONTRACT_ORDER.levelId }).stars;
  const b = previous.stars ?? rateDelivery({ ...previous, levelId: CONTRACT_ORDER.levelId }).stars;
  return (
    a > b ||
    (a === b &&
      (candidate.integrity > previous.integrity ||
        (candidate.integrity === previous.integrity && candidate.seconds < previous.seconds)))
  );
}
