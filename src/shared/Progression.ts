/** P1 design contracts only. No currency, XP or tuning is awarded in P0. */
export type StarterPart = 'soft_suspension' | 'grippy_tires';
export type VehicleId = 'dvorik_50' | 'strizh_90' | 'tyagach_80' | 'cross_125';
export type TuningSlot = 'engine' | 'suspension' | 'tires' | 'cargo_mount';
export interface CareerProgress {
  coins: number;
  xp: number;
  /** Idempotency keys: contract + first-completion / silver / gold. */
  claimedMilestones: string[];
  unlockedParts: StarterPart[];
  equippedPartsByVehicle: Partial<Record<VehicleId, Partial<Record<TuningSlot, string>>>>;
  achievements: Partial<Record<'no_crashes' | 'clean_landing', number>>;
  /** null until three different contracts have been completed. */
  reputation: number | null;
}
export interface TuningChoice {
  part: StarterPart;
  slot: 'suspension' | 'tires';
  benefit: string;
  tradeoff: string;
}
