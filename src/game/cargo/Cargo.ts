import { Box, Vec2, WeldJoint, type Body } from 'planck';
import type { EventBus } from '../../shared/EventBus';
import type { PhysicsWorld } from '../physics/PhysicsWorld';

export interface CargoConfig {
  id: string;
  type: 'coffee';
  mass: number;
  impactThreshold: number;
  sensitivity: number;
  allowedDamage: number;
  overloadG: number;
}
export const COFFEE: CargoConfig = {
  id: 'coffee-1',
  type: 'coffee',
  mass: 1.2,
  impactThreshold: 2.8,
  sensitivity: 9,
  allowedDamage: 70,
  overloadG: 9,
};
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
}

export class Cargo {
  readonly body: Body;
  integrity = 100;
  delivery: DeliveryState = 'in-transit';
  private criticalSent = false;
  private shock = 0;
  private previousVelocity = { x: 0, y: 0 };

  constructor(
    physics: PhysicsWorld,
    chassis: Body,
    readonly config: CargoConfig,
    private events: EventBus<CargoEvents>,
  ) {
    const mount = chassis.getWorldPoint(Vec2(-0.45, 0.45));
    this.body = physics.track(physics.world.createDynamicBody({ position: mount }));
    this.body.createFixture(Box(0.18, 0.25), {
      density: config.mass / 0.18,
      friction: 0.5,
      filterGroupIndex: -1,
    });
    physics.world.createJoint(
      new WeldJoint(
        { frequencyHz: 5, dampingRatio: 0.8 },
        chassis,
        this.body,
        chassis.getWorldPoint(Vec2(-0.45, 0.22)),
      ),
    );
    physics.world.on('post-solve', (contact, impulse) => {
      if (
        contact.getFixtureA().getBody() === this.body ||
        contact.getFixtureB().getBody() === this.body
      )
        this.shock = Math.max(
          this.shock,
          impulse.normalImpulses.reduce((a, b) => a + b, 0) / config.mass,
        );
    });
  }

  /** Damage is deterministic and computed after the solver, never random. */
  applyImpact(deltaVelocity: number): void {
    if (!Number.isFinite(deltaVelocity) || this.delivery !== 'in-transit') return;
    const loss = Math.max(0, deltaVelocity - this.config.impactThreshold) * this.config.sensitivity;
    if (loss <= 0 || this.integrity <= 0) return;
    const before = this.integrity;
    this.integrity = Math.max(0, this.integrity - loss);
    const payload = {
      id: this.config.id,
      integrity: this.integrity,
      loss: before - this.integrity,
    };
    this.events.emit('cargo:damaged', payload);
    if (!this.criticalSent && this.integrity <= 100 - this.config.allowedDamage) {
      this.criticalSent = true;
      this.events.emit('cargo:critical', payload);
    }
    if (this.integrity === 0) {
      this.delivery = 'failed';
      this.events.emit('cargo:destroyed', payload);
    }
  }

  afterStep(dt: number): void {
    const velocity = this.body.getLinearVelocity();
    // Subtract free-fall acceleration. Resting support is ~1g, harmless.
    const acceleration = Math.hypot(
      (velocity.x - this.previousVelocity.x) / dt,
      (velocity.y - this.previousVelocity.y) / dt + 9.81,
    );
    const overload = Math.max(0, acceleration - this.config.overloadG * 9.81) * dt;
    this.applyImpact(Math.max(this.shock, overload));
    this.shock = 0;
    this.previousVelocity.x = velocity.x;
    this.previousVelocity.y = velocity.y;
  }
}
