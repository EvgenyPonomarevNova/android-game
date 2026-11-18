import type { ChallengeId, PartId, SkillId, VehicleId, PaintId } from '../shared/Progression';

export const PAINTS: Record<PaintId, { name: string; color: string; price: number }> = {
  yellow: { name: 'Курьерский жёлтый', color: '#ffd12b', price: 0 },
  mint: { name: 'Мятный двор', color: '#78ddbb', price: 40 },
  coral: { name: 'Коралловый вечер', color: '#ff927d', price: 60 },
};
export const CAREER_BALANCE = {
  startingCoins: 0,
  levelThresholds: [0, 80, 200, 380, 650, 1000],
  repeatRewardLimit: 8,
  repeatCoins: 10,
  repeatXp: 3,
  recordRewardLimit: 3,
  recordCoins: 15,
  recordXp: 10,
  skillXp: 20,
  silverBonus: { coins: 40, xp: 20 },
  goldBonus: { coins: 60, xp: 30 },
} as const;
export const PART_PRICES: Record<PartId, number> = {
  standard_engine: 0,
  torque_engine: 220,
  speed_engine: 240,
  standard_suspension: 0,
  soft_suspension: 120,
  sport_suspension: 180,
  standard_tires: 0,
  city_tires: 100,
  allweather_tires: 120,
  standard_mount: 0,
  reinforced_mount: 160,
};
export const VEHICLE_PRICES: Record<VehicleId, number> = { dvorik_50: 0, tyagach_80: 500 };
export const VEHICLE_LEVELS: Record<VehicleId, number> = { dvorik_50: 1, tyagach_80: 3 };
export const CHALLENGES: Record<ChallengeId, { name: string; description: string; xp: number }> = {
  no_crashes: { name: 'Без падений', description: 'Доставь заказ без аварии.', xp: 15 },
  clean_landing: {
    name: 'Мягкая посадка',
    description: 'Доставь заказ с хотя бы одним измеренным мягким приземлением.',
    xp: 15,
  },
  perfect_order: {
    name: 'Идеальный заказ',
    description: 'Довези не менее 99% заказа; горячую еду — не ниже золотой температуры.',
    xp: 20,
  },
  no_recovery: {
    name: 'Без восстановления',
    description: 'Доставь заказ без контрольной точки.',
    xp: 10,
  },
  district_record: {
    name: 'Рекорд района',
    description: 'Получи золотую медаль контракта. Это локальная цель, не мировой рейтинг.',
    xp: 25,
  },
};
export const SKILLS: Record<
  SkillId,
  { name: string; description: string; requirement: string; threshold: number }
> = {
  soft_landing: {
    name: 'Мягкая посадка',
    description: 'Небольшая дополнительная работа подвески при правильной посадке.',
    requirement: 'Выполни 2 мягких приземления за один заезд.',
    threshold: 2,
  },
  balance_sense: {
    name: 'Чувство баланса',
    description: 'Немного больше контроля встречным наклоном; выравнивать скутер нужно самому.',
    requirement: 'Освой 1 сложную секцию с активным балансом.',
    threshold: 1,
  },
};
export const FUTURE_SKILLS = ['route_memory', 'thermal_care', 'careful_packing'] as const;
