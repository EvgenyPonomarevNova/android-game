import { Box, Vec2, WeldJoint, type Body, type Contact } from 'planck';
import type { EventBus } from '../../shared/EventBus';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { CargoImpact, VehicleMotion } from '../../shared/GameFeedback';

export interface CargoConfig {
  id: string;
  type: 'coffee' | 'surprise' | 'hot-meal';
  mass: number;
  impactThreshold: number;
  sensitivity: number;
  allowedDamage: number;
  overloadG: number;
  feedbackThreshold: number;
  mediumImpact: number;
  heavyImpact: number;
  impactWindow: number;
  impactReleaseSeconds: number;
}
export const COFFEE: CargoConfig = {
  id: 'coffee-1',
  type: 'coffee',
  mass: 1.2,
  impactThreshold: 1.9,
  sensitivity: 10,
  allowedDamage: 70,
  overloadG: 4,
  feedbackThreshold: 0.8,
  mediumImpact: 3.2,
  heavyImpact: 6,
  impactWindow: 0.05,
  impactReleaseSeconds: 0.14,
};
export const SURPRISE: CargoConfig = {
  ...COFFEE,
  id: 'surprise-1',
  type: 'surprise',
  allowedDamage: 50,
};
export const HOT_MEAL: CargoConfig = { ...SURPRISE, id: 'hot-meal-1', type: 'hot-meal', mass: 1.8 };
export interface CargoMountOptions {
  frequencyHz?: number;
  dampingRatio?: number;
  softLanding?: boolean;
}
export interface CargoComponent {
  readonly id: 'cake' | 'drinks' | 'noodles' | 'soup';
  readonly integrity: number;
  readonly weight: number;
}
export type DeliveryState = 'in-transit' | 'delivered' | 'failed';
export interface CargoDamage {
  id: string;
  integrity: number;
  loss: number;
}
export interface CargoEvents {
  'cargo:damaged': CargoDamage;
  'cargo:critical': CargoDamage;
  'cargo:destroyed': CargoDamage;
  'cargo:impact': CargoImpact;
}

export class Cargo {
  readonly body: Body;
  readonly mount: WeldJoint;
  private cushionActive = false;
  private parts: Array<{ id: CargoComponent['id']; integrity: number; weight: number }> = [
    { id: 'cake', integrity: 100, weight: 0.6 },
    { id: 'drinks', integrity: 100, weight: 0.4 },
  ];
  get components(): readonly CargoComponent[] {
    return this.parts;
  }
  get integrity(): number {
    return this.parts.reduce((sum, part) => sum + part.integrity * part.weight, 0);
  }
  set integrity(value: number) {
    const clamped = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    for (const part of this.parts) part.integrity = clamped;
  }
  delivery: DeliveryState = 'in-transit';
  stress = 0;
  private criticalSent = false;
  private shock = 0;
  private shockVertical = 1;
  private impactSpeeds = new WeakMap<Contact, number>();
  private struckContacts = new WeakSet<Contact>();
  private touchingCargo = new Set<Contact>();
  private previousVelocity = { x: 0, y: 0 };
  private impactPeak = 0;
  private impactVertical = 1;
  private impactTilt = 0;
  private impactAge = 0;
  private quietSeconds = 0;
  private impactLatched = false;
  private gravity: Vec2;
  private chassis: Body;

  constructor(
    physics: PhysicsWorld,
    chassis: Body,
    readonly config: CargoConfig,
    private events: EventBus<CargoEvents>,
    private mountOptions: CargoMountOptions = {},
  ) {
    if (config.type === 'hot-meal') {
      this.parts = [
        { id: 'noodles', integrity: 100, weight: 0.6 },
        { id: 'soup', integrity: 100, weight: 0.4 },
      ];
    }
    this.gravity = physics.world.getGravity().clone();
    this.chassis = chassis;
    const mount = chassis.getWorldPoint(Vec2(-0.45, 0.45));
    this.body = physics.track(physics.world.createDynamicBody({ position: mount }));
    this.body.createFixture(Box(0.18, 0.25), {
      density: config.mass / 0.18,
      friction: 0.5,
      filterGroupIndex: -1,
    });
    const mountJoint = physics.world.createJoint(
      new WeldJoint(
        {
          frequencyHz: mountOptions.frequencyHz ?? 5,
          dampingRatio: mountOptions.dampingRatio ?? 0.8,
        },
        chassis,
        this.body,
        chassis.getWorldPoint(Vec2(-0.45, 0.22)),
      ),
    );
    if (!mountJoint) throw new Error('Cargo joint creation failed');
    this.mount = mountJoint;
    physics.world.on('begin-contact', (contact) => {
      const a = contact.getFixtureA(),
        b = contact.getFixtureB();
      if (
        (a.getBody() === this.body || b.getBody() === this.body) &&
        !a.isSensor() &&
        !b.isSensor()
      )
        this.touchingCargo.add(contact);
    });
    physics.world.on('pre-solve', (contact) => {
      if (
        contact.getFixtureA().getBody() === this.body ||
        contact.getFixtureB().getBody() === this.body
      ) {
        const manifold = contact.getWorldManifold(null);
        if (!manifold) return;
        let closingSpeed = 0;
        for (let i = 0; i < contact.getManifold().pointCount; i++) {
          const point = manifold.points[i]!;
          const a = contact.getFixtureA().getBody().getLinearVelocityFromWorldPoint(point);
          const b = contact.getFixtureB().getBody().getLinearVelocityFromWorldPoint(point);
          closingSpeed = Math.max(
            closingSpeed,
            -((b.x - a.x) * manifold.normal.x + (b.y - a.y) * manifold.normal.y),
          );
        }
        this.impactSpeeds.set(contact, closingSpeed);
      }
    });
    physics.world.on('post-solve', (contact, impulse) => {
      const closingSpeed = this.impactSpeeds.get(contact) ?? 0;
      // Solver impulses also include sustained support. Only incoming contact
      // velocity can turn that impulse into damage, never the load at rest.
      if (closingSpeed > config.feedbackThreshold && !this.struckContacts.has(contact)) {
        this.struckContacts.add(contact);
        const shock = Math.min(
          closingSpeed,
          impulse.normalImpulses.reduce((a, b) => a + b, 0) / config.mass,
        );
        if (shock > this.shock) {
          this.shock = shock;
          this.shockVertical = Math.abs(contact.getWorldManifold(null)?.normal.y ?? 1);
        }
      }
    });
    physics.world.on('end-contact', (contact) => {
      this.touchingCargo.delete(contact);
      this.struckContacts.delete(contact);
      this.impactSpeeds.delete(contact);
    });
  }

  /** Finish crossings commit any already measured jolt before rating the cargo. */
  flushImpact(): void {
    if (this.impactPeak <= 0 || this.impactLatched) return;
    this.applyImpact(this.impactPeak, this.impactVertical, this.impactTilt);
    this.impactLatched = true;
    this.impactPeak = 0;
    this.impactAge = 0;
  }

  /** Damage is deterministic and computed after the solver, never random. */
  applyImpact(
    deltaVelocity: number,
    vertical = 1,
    tilt = Math.abs(Math.sin(this.chassis.getAngle())),
  ): void {
    if (
      !Number.isFinite(deltaVelocity) ||
      deltaVelocity < this.config.feedbackThreshold ||
      this.delivery !== 'in-transit'
    )
      return;
    const loss = Math.max(0, deltaVelocity - this.config.impactThreshold) * this.config.sensitivity;
    if (this.integrity <= 0) return;
    const before = this.integrity;
    if (this.config.type === 'surprise' || this.config.type === 'hot-meal') {
      const verticalLoad = Math.max(0, Math.min(1, vertical));
      const tiltLoad = Math.max(0, Math.min(1, tilt));
      this.parts[0]!.integrity = Math.max(
        0,
        this.parts[0]!.integrity -
          loss *
            (this.config.type === 'hot-meal'
              ? 0.65 + 0.55 * verticalLoad
              : 0.55 + 0.7 * verticalLoad),
      );
      this.parts[1]!.integrity = Math.max(
        0,
        this.parts[1]!.integrity -
          loss *
            (this.config.type === 'hot-meal'
              ? 0.55 + 1.05 * tiltLoad + 0.2 * (1 - verticalLoad)
              : 0.55 + 0.8 * tiltLoad + 0.15 * (1 - verticalLoad)),
      );
    } else this.integrity = Math.max(0, this.integrity - loss);
    const payload = {
      id: this.config.id,
      integrity: this.integrity,
      loss: before - this.integrity,
    };
    this.events.emit('cargo:impact', {
      ...payload,
      strength: deltaVelocity,
      severity:
        deltaVelocity >= this.config.heavyImpact
          ? 'heavy'
          : deltaVelocity >= this.config.mediumImpact
            ? 'medium'
            : 'light',
    });
    if (payload.loss > 0) this.events.emit('cargo:damaged', payload);
    if (!this.criticalSent && this.integrity <= 100 - this.config.allowedDamage) {
      this.criticalSent = true;
      this.events.emit('cargo:critical', payload);
    }
    if (this.integrity === 0) {
      this.delivery = 'failed';
      this.events.emit('cargo:destroyed', payload);
    }
  }

  restoreComponents(components: readonly CargoComponent[]): void {
    for (const part of this.parts) {
      const saved = components.find((value) => value.id === part.id);
      if (saved && Number.isFinite(saved.integrity))
        part.integrity = Math.max(0, Math.min(100, saved.integrity));
    }
  }

  afterStep(dt: number, motion?: VehicleMotion, correctLanding = false): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    if (this.mountOptions.softLanding && this.cushionActive !== correctLanding) {
      this.cushionActive = correctLanding;
      this.mount.setFrequency((this.mountOptions.frequencyHz ?? 5) * (correctLanding ? 0.95 : 1));
      this.mount.setDampingRatio(
        (this.mountOptions.dampingRatio ?? 0.8) * (correctLanding ? 1.05 : 1),
      );
    }
    const velocity = this.body.getLinearVelocity();
    // Subtract free-fall acceleration. Resting support is ~1g, harmless.
    const acceleration = Math.hypot(
      (velocity.x - this.previousVelocity.x) / dt - this.gravity.x,
      (velocity.y - this.previousVelocity.y) / dt - this.gravity.y,
    );
    const overload = Math.max(0, acceleration - this.config.overloadG * 9.81) * dt;
    const strength = Math.max(this.shock, overload);
    // One physical jolt can ring across several solver ticks. Gather its peak
    // for 50 ms, report it once, and re-arm only after a quiet interval.
    if (strength >= this.config.feedbackThreshold) {
      this.quietSeconds = 0;
      if (!this.impactLatched && strength > this.impactPeak) {
        this.impactPeak = strength;
        this.impactVertical =
          this.shock >= overload
            ? this.shockVertical
            : Math.min(
                1,
                Math.abs((velocity.y - this.previousVelocity.y) / dt - this.gravity.y) /
                  (acceleration || 1),
              );
        this.impactTilt = Math.abs(Math.sin(this.chassis.getAngle()));
      }
    } else this.quietSeconds += dt;
    if (this.impactPeak > 0 && !this.impactLatched) {
      this.impactAge += dt;
      if (this.impactAge + 1e-10 >= this.config.impactWindow) {
        this.flushImpact();
      }
    }
    if (this.quietSeconds >= this.config.impactReleaseSeconds && this.touchingCargo.size === 0)
      this.impactLatched = false;
    const tilt = Math.min(1, Math.max(0, (1 - Math.cos(this.chassis.getAngle())) * 0.7));
    const fall = motion?.grounded ? 0 : Math.min(1, Math.max(0, (-velocity.y - 2) / 6));
    const risk = Math.max(tilt * (motion?.grounded ? 0.5 : 1), fall, Math.min(1, strength / 8));
    this.stress += (risk - this.stress) * (1 - Math.exp(-dt * (risk > this.stress ? 8 : 3)));
    this.shock = 0;
    this.previousVelocity.x = velocity.x;
    this.previousVelocity.y = velocity.y;
  }
}
