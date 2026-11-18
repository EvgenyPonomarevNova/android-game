import type { GameObjects, Scene } from 'phaser';
import type { CargoImpact, VehicleMotion } from '../../shared/GameFeedback';
import { PHYSICS } from '../../config/game';
import { RideFeedback } from './RideFeedback';

interface Speck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  duration: number;
  color: number;
  radius: number;
}

/** Small, bounded pool. No emitters, timers, random idle animation or new texture resources. */
export class RidePresentation {
  private readonly feedback = new RideFeedback();
  private readonly rider: GameObjects.Sprite;
  private readonly ink: GameObjects.Graphics;
  private readonly scale = PHYSICS.pixelsPerMeter / 60;
  private readonly specks: Speck[] = Array.from({ length: 24 }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    duration: 1,
    color: 0,
    radius: 0,
  }));
  private readonly impacts: CargoImpact[] = [];
  private dustAt = 0;

  constructor(
    scene: Scene,
    chassis: GameObjects.Container,
    private cup: GameObjects.Sprite,
    cargo: GameObjects.Container,
    private rearWheel: GameObjects.Sprite,
  ) {
    if (cup.parentContainer !== cargo) cargo.add(cup);
    this.rider = chassis.getByName('courier') as GameObjects.Sprite;
    this.ink = scene.add.graphics().setDepth(3);
  }

  impact(event: CargoImpact): void {
    this.feedback.impact(event.severity);
    if (this.impacts.length < 3) this.impacts.push(event);
  }

  reset(landingId = 0): void {
    this.feedback.reset(landingId);
    this.dustAt = 0;
    this.impacts.length = 0;
    this.specks.forEach((p) => {
      p.life = 0;
    });
    this.ink.clear();
  }

  private burst(x: number, y: number, count: number, coffee: boolean, wet = false): void {
    for (let i = 0; i < count; i++) {
      const dot = this.specks.find((p) => p.life <= 0);
      if (!dot) break;
      const fan = count <= 1 ? 0 : i / (count - 1) - 0.5;
      Object.assign(dot, {
        x,
        y,
        vx: fan * 52 * this.scale,
        vy: -(24 + (i % 3) * 12) * this.scale,
        life: 0.32,
        duration: 0.32,
        color: coffee ? 0xb76f36 : wet ? 0xa1cfdf : 0xb4ad97,
        radius: (coffee ? 1.9 : 2.5) * this.scale,
      });
    }
  }

  update(
    motion: VehicleMotion,
    stress: number,
    speed: number,
    gravel: boolean,
    crashed: boolean,
    dt: number,
    reduced: boolean,
    wet = false,
  ): void {
    const pose = this.feedback.step(motion, stress, crashed, dt, reduced);
    this.rider.setRotation(pose.riderLean).setY(-4 + pose.riderY);
    this.cup.setRotation(pose.cupLean).setX(pose.cupX);
    if (reduced) {
      this.impacts.length = 0;
      this.specks.forEach((p) => {
        p.life = 0;
      });
      this.ink.clear();
      return;
    }
    if (dt <= 0) return;
    dt = Math.min(dt, 0.05);
    for (const event of this.impacts) {
      const mouth = this.cup.getWorldTransformMatrix().transformPoint(0, -this.cup.height * 0.45);
      if (event.loss > 0 && event.severity !== 'light')
        this.burst(mouth.x, mouth.y, event.severity === 'heavy' ? 5 : 3, true);
    }
    this.impacts.length = 0;
    const wheelY = this.rearWheel.y + this.rearWheel.displayHeight / 2;
    if (pose.landed) this.burst(this.rearWheel.x, wheelY, 4, false, wet);
    this.dustAt = Math.max(0, this.dustAt - dt);
    if (
      motion.grounded &&
      Math.abs(speed) > 2.5 &&
      (wet || gravel || motion.accelerationX < -3) &&
      this.dustAt === 0
    ) {
      this.burst(this.rearWheel.x, wheelY, 2, false, wet);
      this.dustAt = 0.16;
    }
    this.ink.clear();
    for (const dot of this.specks) {
      if (dot.life <= 0) continue;
      dot.life = Math.max(0, dot.life - dt);
      dot.x += dot.vx * dt;
      dot.y += dot.vy * dt;
      dot.vy += 100 * this.scale * dt;
      this.ink.fillStyle(dot.color, dot.life / dot.duration).fillCircle(dot.x, dot.y, dot.radius);
    }
  }

  destroy(): void {
    this.impacts.length = 0;
    this.ink.destroy();
  }
}
