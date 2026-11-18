import {
  CAREER_BALANCE as B,
  CHALLENGES,
  PART_PRICES,
  SKILLS,
  VEHICLE_LEVELS,
  VEHICLE_PRICES,
  PAINTS,
} from '../../config/career';
import {
  STOCK_PARTS,
  type CareerState,
  type ChallengeId,
  type PartId,
  type PartLoadout,
  type RewardReceipt,
  type SkillId,
  type StarterPart,
  type TuningSlot,
  type VehicleId,
  type VehicleSetup,
  type PaintId,
} from '../../shared/Progression';
import {
  CONTRACTS,
  FIRST_CONTRACT_ID,
  SECOND_CONTRACT_ID,
  type ContractDefinition,
} from './Contracts';
import { deliveryRecordKey, type RatedResult } from './Orders';

const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const amount = (v: unknown, max = 10_000_000) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;
const decimal = (v: unknown, max: number, fallback = 0) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, v)) : fallback;
const strings = (v: unknown, max = 256): string[] =>
  Array.isArray(v)
    ? [
        ...new Set(
          v.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 180),
        ),
      ].slice(-max)
    : [];
const partIds = Object.keys(PART_PRICES) as PartId[];
const vehicleIds = Object.keys(VEHICLE_PRICES) as VehicleId[];
const skillIds = Object.keys(SKILLS) as SkillId[];
const challengeIds = Object.keys(CHALLENGES) as ChallengeId[];
export function partSlot(id: PartId): TuningSlot {
  return id.endsWith('_engine')
    ? 'engine'
    : id.endsWith('_suspension')
      ? 'suspension'
      : id.endsWith('_tires')
        ? 'tires'
        : 'cargo_mount';
}
export function defaultCareer(): CareerState {
  return {
    coins: B.startingCoins,
    xp: 0,
    reputation: null,
    successfulDeliveries: 0,
    ownedParts: Object.values(STOCK_PARTS),
    ownedVehicles: ['dvorik_50'],
    selectedVehicle: 'dvorik_50',
    ownedPaints: ['yellow'],
    paint: 'yellow',
    equippedByVehicle: { dvorik_50: { ...STOCK_PARTS } },
    unlockedSkills: [],
    enabledSkills: [],
    mastery: { cleanLandings: 0, balancedSections: 0 },
    contracts: Object.create(null) as CareerState['contracts'],
    claimedMilestones: [],
    processedRuns: [],
    stage: 'first_delivery',
  };
}
export function careerLevel(xp: number): number {
  return Math.max(1, B.levelThresholds.filter((n) => xp >= n).length);
}
export function levelProgress(xp: number) {
  const level = careerLevel(xp),
    base = B.levelThresholds[level - 1]!,
    next = B.levelThresholds[level];
  return {
    level,
    current: Math.max(0, xp - base),
    required: next === undefined ? 0 : next - base,
    nextAt: next ?? null,
  };
}
export function currentSetup(career: CareerState): VehicleSetup {
  return {
    vehicleId: career.selectedVehicle,
    parts: { ...STOCK_PARTS, ...career.equippedByVehicle[career.selectedVehicle] },
    skills: [...career.enabledSkills],
    paint: career.paint,
  };
}
export function starterChoiceAvailable(career: CareerState): boolean {
  return (
    (career.contracts[FIRST_CONTRACT_ID]?.completions ?? 0) > 0 &&
    !career.claimedMilestones.includes('starter-gift')
  );
}
export function isContractUnlocked(career: CareerState, contract: ContractDefinition): boolean {
  return !contract.unlockAfter || (career.contracts[contract.unlockAfter]?.completions ?? 0) > 0;
}
function refreshDerived(c: CareerState): CareerState {
  const completed = Object.values(c.contracts).filter((s) => s.completions > 0);
  c.reputation = completed.length
    ? Math.round((completed.reduce((sum, s) => sum + s.bestRating, 0) / completed.length) * 10) / 10
    : null;
  c.successfulDeliveries = completed.reduce((sum, s) => sum + s.completions, 0);
  c.stage = !c.contracts[FIRST_CONTRACT_ID]?.completions
    ? 'first_delivery'
    : starterChoiceAvailable(c)
      ? 'first_upgrade'
      : !c.contracts[SECOND_CONTRACT_ID]?.completions
        ? 'second_delivery'
        : 'district_mastery';
  return c;
}
/** Restore only coherent inventory/loadouts. Unknown future schemas are guarded by SaveService. */
export function normalizeCareer(raw: unknown): CareerState {
  const c = defaultCareer();
  if (!object(raw)) return c;
  c.coins = amount(raw.coins);
  c.xp = amount(raw.xp);
  c.ownedPaints = [
    ...new Set<PaintId>([
      'yellow',
      ...strings(raw.ownedPaints).filter((id): id is PaintId => own(PAINTS, id)),
    ]),
  ];
  if (c.ownedPaints.includes(raw.paint as PaintId)) c.paint = raw.paint as PaintId;
  c.ownedParts = [
    ...new Set([
      ...c.ownedParts,
      ...strings(raw.ownedParts).filter((id): id is PartId => partIds.includes(id as PartId)),
    ]),
  ];
  c.ownedVehicles = [
    ...new Set([
      ...c.ownedVehicles,
      ...strings(raw.ownedVehicles).filter((id): id is VehicleId =>
        vehicleIds.includes(id as VehicleId),
      ),
    ]),
  ];
  if (c.ownedVehicles.includes(raw.selectedVehicle as VehicleId))
    c.selectedVehicle = raw.selectedVehicle as VehicleId;
  for (const vehicle of c.ownedVehicles) {
    const loadout: PartLoadout = { ...STOCK_PARTS };
    const stored = object(raw.equippedByVehicle) ? raw.equippedByVehicle[vehicle] : undefined;
    if (object(stored))
      for (const slot of Object.keys(STOCK_PARTS) as TuningSlot[]) {
        const id = stored[slot] as PartId;
        if (c.ownedParts.includes(id) && partSlot(id) === slot) loadout[slot] = id;
      }
    c.equippedByVehicle[vehicle] = loadout;
  }
  c.unlockedSkills = strings(raw.unlockedSkills).filter((id): id is SkillId =>
    skillIds.includes(id as SkillId),
  );
  c.enabledSkills = strings(raw.enabledSkills).filter((id): id is SkillId =>
    c.unlockedSkills.includes(id as SkillId),
  );
  if (object(raw.mastery))
    c.mastery = {
      cleanLandings: amount(raw.mastery.cleanLandings, 1000),
      balancedSections: amount(raw.mastery.balancedSections, 1000),
    };
  c.claimedMilestones = strings(raw.claimedMilestones, 4096);
  c.processedRuns = strings(raw.processedRuns, 256);
  if (object(raw.contracts))
    for (const [id, s] of Object.entries(raw.contracts)) {
      if (!/^[a-z][a-z0-9_-]{2,63}$/.test(id) || !object(s)) continue;
      const completions = amount(s.completions, 1_000_000);
      if (!completions) continue;
      c.contracts[id] = {
        completions,
        bestStars: Math.max(1, amount(s.bestStars, 3)),
        bestIntegrity: decimal(s.bestIntegrity, 100),
        bestSeconds: decimal(s.bestSeconds, 86400),
        bestRating: Math.max(1, decimal(s.bestRating, 5)),
        improvementsAwarded: amount(s.improvementsAwarded, B.recordRewardLimit),
        challenges: strings(s.challenges).filter((v): v is ChallengeId =>
          challengeIds.includes(v as ChallengeId),
        ),
        ...(typeof s.bestTemperature === 'number'
          ? { bestTemperature: decimal(s.bestTemperature, 100) }
          : {}),
      };
    }
  return refreshDerived(c);
}
function emptyReceipt(c: CareerState): RewardReceipt {
  return {
    coins: 0,
    xp: 0,
    firstCompletion: false,
    newLevel: null,
    reputationBefore: c.reputation,
    reputationAfter: c.reputation,
    challenges: [],
    unlockedSkills: [],
    starterChoiceAvailable: starterChoiceAvailable(c),
    review: '',
    duplicate: false,
  };
}
/** One settlement per attempt outcome; all grants are part of the caller's single save snapshot. */
export function settleDelivery(
  previous: CareerState,
  result: RatedResult,
  runId: string,
): { career: CareerState; reward: RewardReceipt } {
  const reward = emptyReceipt(previous),
    contract = CONTRACTS.find((c) => c.levelId === result.levelId);
  if (
    !contract ||
    !isContractUnlocked(previous, contract) ||
    !runId ||
    previous.processedRuns.includes(runId)
  ) {
    reward.duplicate = true;
    return { career: previous, reward };
  }
  const c = normalizeCareer(previous),
    oldLevel = careerLevel(c.xp);
  c.processedRuns = [...c.processedRuns, runId].slice(-256);
  c.mastery.cleanLandings = Math.max(c.mastery.cleanLandings, amount(result.cleanLandings, 1000));
  c.mastery.balancedSections = Math.max(
    c.mastery.balancedSections,
    amount(result.balancedSections, 1000),
  );
  const unlock = (id: SkillId, progress: number) => {
    if (progress >= SKILLS[id].threshold && !c.unlockedSkills.includes(id)) {
      c.unlockedSkills.push(id);
      reward.unlockedSkills.push(id);
      // Unlocks are explicit choices in Profile; never silently change a learned setup.
    }
  };
  unlock('soft_landing', c.mastery.cleanLandings);
  unlock('balance_sense', c.mastery.balancedSections);
  const grant = (key: string, coins: number, xp: number) => {
    if (c.claimedMilestones.includes(key)) return;
    c.claimedMilestones.push(key);
    reward.coins += coins;
    reward.xp += xp;
  };
  for (const id of reward.unlockedSkills) grant(`skill:${id}`, 0, B.skillXp);
  if (result.success) {
    const old = c.contracts[result.levelId];
    reward.firstCompletion = !old;
    if (!old) grant(`${result.levelId}:first`, contract.rewardCoins, contract.rewardXp);
    else if (old.completions <= B.repeatRewardLimit)
      grant(`${result.levelId}:repeat:${old.completions}`, B.repeatCoins, B.repeatXp);
    if (result.stars >= 2) grant(`${result.levelId}:silver`, B.silverBonus.coins, B.silverBonus.xp);
    if (result.stars >= 3) grant(`${result.levelId}:gold`, B.goldBonus.coins, B.goldBonus.xp);
    const improved =
      !!old &&
      (result.stars > old.bestStars ||
        (result.stars === old.bestStars &&
          (result.integrity > old.bestIntegrity + 0.1 ||
            (result.integrity >= old.bestIntegrity - 0.1 &&
              result.seconds < old.bestSeconds - 0.25))));
    let improvements = old?.improvementsAwarded ?? 0;
    if (improved && improvements < B.recordRewardLimit) {
      improvements++;
      grant(`${result.levelId}:improved:${improvements}`, B.recordCoins, B.recordXp);
    }
    const achieved: ChallengeId[] = [];
    if (result.falls === 0) achieved.push('no_crashes');
    if ((result.cleanLandings ?? 0) >= 1) achieved.push('clean_landing');
    if (
      result.integrity >= 99 &&
      (result.temperature === undefined ||
        result.temperature >= (result.rules?.goldTemperature ?? 70))
    )
      achieved.push('perfect_order');
    if (result.checkpointUsed === false) achieved.push('no_recovery');
    if (result.medal === 'gold') achieved.push('district_record');
    for (const id of achieved)
      if (!old?.challenges.includes(id)) {
        grant(`${result.levelId}:challenge:${id}`, 0, CHALLENGES[id].xp);
        reward.challenges.push(id);
      }
    const quality =
      result.temperature === undefined
        ? result.integrity
        : (result.integrity + result.temperature) / 2;
    const rating = Math.min(5, 1 + result.stars + quality / 100);
    const better = !old || improved;
    c.contracts[result.levelId] = {
      completions: (old?.completions ?? 0) + 1,
      bestStars: better ? result.stars : old.bestStars,
      bestIntegrity: better ? result.integrity : old.bestIntegrity,
      bestSeconds: better ? result.seconds : old.bestSeconds,
      bestTemperature: better ? result.temperature : old.bestTemperature,
      bestRating: Math.max(old?.bestRating ?? 0, rating),
      improvementsAwarded: improvements,
      challenges: [...new Set([...(old?.challenges ?? []), ...achieved])],
    };
    reward.review =
      result.temperature !== undefined
        ? result.temperature < 60
          ? 'Ужин доехал целым, но уже тёплый. В следующий раз хочется погорячее!'
          : result.integrity >= 90
            ? 'Горячо и ничего не расплескалось. Спасибо за ужин!'
            : 'Успел горячим. Суп в следующий раз побережнее.'
        : result.integrity >= 90
          ? 'Торт цел, напитки на месте. Праздник спасён!'
          : 'Спасибо, успел. В следующий раз побережнее с заказом.';
  }
  c.coins += reward.coins;
  c.xp += reward.xp;
  refreshDerived(c);
  reward.newLevel = careerLevel(c.xp) > oldLevel ? careerLevel(c.xp) : null;
  reward.reputationAfter = c.reputation;
  reward.starterChoiceAvailable = starterChoiceAvailable(c);
  return { career: c, reward };
}

export function equipPart(previous: CareerState, id: PartId): CareerState {
  if (!previous.ownedParts.includes(id)) throw new Error('Сначала получи эту деталь.');
  const c = normalizeCareer(previous),
    setup = currentSetup(c);
  setup.parts[partSlot(id)] = id;
  c.equippedByVehicle[c.selectedVehicle] = setup.parts;
  return c;
}
export function claimStarterPart(previous: CareerState, id: StarterPart): CareerState {
  if (!starterChoiceAvailable(previous))
    throw new Error('Первая деталь уже получена или доставка ещё не завершена.');
  if (id !== 'soft_suspension' && id !== 'allweather_tires')
    throw new Error('Выбери подвеску или всепогодные шины.');
  const c = normalizeCareer(previous);
  c.ownedParts = [...new Set([...c.ownedParts, id])];
  c.claimedMilestones.push('starter-gift');
  return refreshDerived(equipPart(c, id));
}
export function purchasePart(previous: CareerState, id: PartId): CareerState {
  if (!own(PART_PRICES, id)) throw new Error('Неизвестная деталь.');
  if (previous.ownedParts.includes(id)) return previous;
  if (starterChoiceAvailable(previous) && (id === 'soft_suspension' || id === 'allweather_tires'))
    return claimStarterPart(previous, id);
  const price = PART_PRICES[id];
  if (previous.coins < price)
    throw new Error('Не хватает монет. Повтори доставку или улучши медаль.');
  const c = normalizeCareer(previous);
  c.coins -= price;
  c.ownedParts.push(id);
  return equipPart(c, id);
}
export function selectVehicle(previous: CareerState, id: VehicleId): CareerState {
  if (!previous.ownedVehicles.includes(id)) throw new Error('Сначала купи этот транспорт.');
  return { ...previous, selectedVehicle: id };
}
export function purchaseVehicle(previous: CareerState, id: VehicleId): CareerState {
  if (!own(VEHICLE_PRICES, id)) throw new Error('Неизвестный транспорт.');
  if (previous.ownedVehicles.includes(id)) return previous;
  if (careerLevel(previous.xp) < VEHICLE_LEVELS[id])
    throw new Error(`Нужен уровень курьера ${VEHICLE_LEVELS[id]}.`);
  if (previous.coins < VEHICLE_PRICES[id]) throw new Error('Не хватает монет на транспорт.');
  const c = normalizeCareer(previous);
  c.coins -= VEHICLE_PRICES[id];
  c.ownedVehicles.push(id);
  c.selectedVehicle = id;
  c.equippedByVehicle[id] = { ...STOCK_PARTS };
  return c;
}
export function toggleSkill(previous: CareerState, id: SkillId): CareerState {
  if (!previous.unlockedSkills.includes(id)) throw new Error('Этот навык ещё не открыт.');
  return {
    ...previous,
    enabledSkills: previous.enabledSkills.includes(id)
      ? previous.enabledSkills.filter((s) => s !== id)
      : [...previous.enabledSkills, id],
  };
}

export function purchasePaint(previous: CareerState, id: PaintId): CareerState {
  if (!own(PAINTS, id)) throw new Error('Неизвестная окраска.');
  if (previous.ownedPaints.includes(id)) return previous;
  if (previous.coins < PAINTS[id].price) throw new Error('Не хватает монет на окраску.');
  return {
    ...previous,
    coins: previous.coins - PAINTS[id].price,
    ownedPaints: [...previous.ownedPaints, id],
    paint: id,
  };
}
export function selectPaint(previous: CareerState, id: PaintId): CareerState {
  if (!previous.ownedPaints.includes(id)) throw new Error('Сначала купи эту окраску.');
  return { ...previous, paint: id };
}

/** Existing v1 records earn their first career milestones once during v1→v2 migration. */
export function migrateCareer(
  results: Record<
    string,
    { seconds: number; integrity: number; stars?: number; checkpointUsed?: boolean; falls?: number }
  >,
): CareerState {
  let career = defaultCareer();
  for (const contract of CONTRACTS) {
    const saved = results[deliveryRecordKey(contract.levelId)];
    if (!saved || !saved.stars) continue;
    const stars = Math.min(3, Math.max(1, saved.stars));
    career = settleDelivery(
      career,
      {
        ...saved,
        levelId: contract.levelId,
        success: true,
        stars,
        score: 0,
        medal: stars === 3 ? 'gold' : stars === 2 ? 'silver' : 'bronze',
      },
      `migration-v1:${contract.levelId}`,
    ).career;
  }
  return career;
}
