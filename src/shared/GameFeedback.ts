/** Fixed-step measurements shared by physics and presentation; no renderer dependencies. */
export interface VehicleMotion {
  grounded: boolean;
  accelerationX: number;
  verticalSpeed: number;
  landingImpact: number;
  landingId: number;
}

export interface CargoImpact {
  id: string;
  strength: number;
  severity: 'light' | 'medium' | 'heavy';
  integrity: number;
  loss: number;
}

/** Presentation only. Scoring always uses the unrounded measured integrity. */
export function integrityPercent(value: number): number {
  return Number.isFinite(value) ? Math.round(Math.max(0, Math.min(100, value))) : 0;
}
