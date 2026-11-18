import type { CargoImpact, VehicleMotion } from '../../shared/GameFeedback';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Visual offsets only, in the artwork's local 60 px/m space. Never changes a body. */
export class RideFeedback {
  readonly pose = { riderLean: 0, riderY: 0, cupLean: 0, cupX: 0, landed: false };
  private landingId = 0;
  private pulse = 0;
  private pulseTime = 0;

  reset(landingId = 0): void {
    Object.assign(this.pose, { riderLean: 0, riderY: 0, cupLean: 0, cupX: 0, landed: false });
    this.landingId = landingId;
    this.pulse = this.pulseTime = 0;
  }

  impact(severity: CargoImpact['severity']): void {
    this.pulse = Math.max(this.pulse, { light: 0.2, medium: 0.55, heavy: 1 }[severity]);
    this.pulseTime = 0;
  }

  step(motion: VehicleMotion, stress: number, crashed: boolean, dt: number, reduced = false) {
    const p = this.pose;
    p.landed = false;
    if (reduced) {
      p.riderLean = p.riderY = p.cupLean = p.cupX = 0;
      this.pulse = 0;
      this.landingId = motion.landingId;
      return p;
    }
    if (dt <= 0) return p;
    dt = Math.min(dt, 0.05);
    if (motion.landingId !== this.landingId) {
      this.landingId = motion.landingId;
      p.landed = motion.landingImpact >= 2.4;
      if (p.landed) {
        this.pulse = Math.max(this.pulse, clamp(motion.landingImpact / 10, 0, 0.8));
        this.pulseTime = 0;
      }
    }
    this.pulseTime += dt;
    this.pulse = Math.max(0, this.pulse - dt * 3.2);
    const acceleration = clamp(motion.accelerationX, -8, 8);
    const load = clamp(stress, 0, 1);
    const brace = motion.grounded ? 0 : clamp(-motion.verticalSpeed / 160, -0.025, 0.045);
    const recoil = Math.sin(this.pulseTime * 26) * this.pulse;
    const blend = 1 - Math.exp(-12 * dt);
    const lean = clamp(
      -acceleration * 0.008 + brace + recoil * 0.045 + (crashed ? 0.06 : 0),
      -0.1,
      0.11,
    );
    const crouch = (motion.grounded ? 0 : 1.2) + this.pulse * 2.5 + (crashed ? 1.5 : 0);
    p.riderLean += (lean - p.riderLean) * blend;
    p.riderY += (clamp(crouch, 0, 5) - p.riderY) * blend;
    p.cupLean = clamp(-acceleration * 0.004 + recoil * 0.08 + load * brace, -0.1, 0.1);
    p.cupX = clamp(-acceleration * 0.04 + recoil * 0.7, -1, 1);
    return p;
  }
}
