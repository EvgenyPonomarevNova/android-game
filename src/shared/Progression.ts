/** Serializable career contracts. No renderer, platform or physics imports. */
export type VehicleId = 'dvorik_50' | 'tyagach_80';
export type TuningSlot = 'engine' | 'suspension' | 'tires' | 'cargo_mount';
export type PartId =
  | 'standard_engine'
  | 'torque_engine'
  | 'speed_engine'
  | 'standard_suspension'
  | 'soft_suspension'
  | 'sport_suspension'
  | 'standard_tires'
  | 'city_tires'
  | 'allweather_tires'
  | 'standard_mount'
  | 'reinforced_mount';
export type StarterPart = 'soft_suspension' | 'allweather_tires';
export type SkillId = 'soft_landing' | 'balance_sense';
export type PaintId = 'yellow' | 'mint' | 'coral';
export type ChallengeId =
  'no_crashes' | 'clean_landing' | 'perfect_order' | 'no_recovery' | 'district_record';
export type PartLoadout = Record<TuningSlot, PartId>;
export interface VehicleSetup {
  vehicleId: VehicleId;
  parts: PartLoadout;
  skills: SkillId[];
  paint?: PaintId;
}
export const STOCK_PARTS: PartLoadout = {
  engine: 'standard_engine',
  suspension: 'standard_suspension',
  tires: 'standard_tires',
  cargo_mount: 'standard_mount',
};
export const defaultVehicleSetup = (): VehicleSetup => ({
  vehicleId: 'dvorik_50',
  parts: { ...STOCK_PARTS },
  skills: [],
});
export interface ContractProgress {
  completions: number;
  bestStars: number;
  bestIntegrity: number;
  bestSeconds: number;
  bestTemperature?: number;
  bestRating: number;
  improvementsAwarded: number;
  challenges: ChallengeId[];
}
export interface CareerState {
  coins: number;
  xp: number;
  reputation: number | null;
  successfulDeliveries: number;
  ownedParts: PartId[];
  ownedVehicles: VehicleId[];
  selectedVehicle: VehicleId;
  ownedPaints: PaintId[];
  paint: PaintId;
  equippedByVehicle: Partial<Record<VehicleId, PartLoadout>>;
  unlockedSkills: SkillId[];
  enabledSkills: SkillId[];
  mastery: { cleanLandings: number; balancedSections: number };
  contracts: Record<string, ContractProgress>;
  claimedMilestones: string[];
  processedRuns: string[];
  stage: 'first_delivery' | 'first_upgrade' | 'second_delivery' | 'district_mastery';
}
export type CareerProgress = CareerState;
export interface RewardReceipt {
  coins: number;
  xp: number;
  firstCompletion: boolean;
  newLevel: number | null;
  reputationBefore: number | null;
  reputationAfter: number | null;
  challenges: ChallengeId[];
  unlockedSkills: SkillId[];
  starterChoiceAvailable: boolean;
  review: string;
  duplicate: boolean;
}
export interface PartDefinition {
  id: PartId;
  slot: TuningSlot;
  name: string;
  benefit: string;
  tradeoff: string;
}
export interface VehicleDefinition {
  id: VehicleId;
  name: string;
  description: string;
}
export interface TuningStat {
  id: string;
  label: string;
  value: number;
  unit: string;
}
