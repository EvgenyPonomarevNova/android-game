import { Box, Chain, Vec2, type Body } from 'planck';
import { RACE_RULES, SCOOTER } from '../../config/game';
import { EventBus } from '../../shared/EventBus';
import { Cargo, COFFEE, type CargoEvents } from '../cargo/Cargo';
import type { ControlState } from '../input/InputController';
import { SURFACES, surfaceAt, testLevel, validateLevel, type LevelData } from '../levels/testLevel';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { Scooter } from '../vehicle/Vehicle';

export type RaceOutcome =
  | { success: true; reason: 'delivered' }
  | {
      success: false;
      reason: 'cargo-destroyed' | 'cargo-rejected' | 'overturned' | 'out-of-bounds';
    };

export class Simulation {
  readonly physics = new PhysicsWorld();
  readonly events = new EventBus<CargoEvents>();
  readonly vehicle: Scooter;
  readonly cargo: Cargo;
  elapsed = 0;
  finished = false;
  outcome: RaceOutcome | null = null;
  private overturnedSeconds = 0;
  constructor(readonly level: LevelData = testLevel) {
    validateLevel(level);
    const ground = this.physics.world.createBody();
    // Chain adjacency avoids ghost collisions at terrain seams.
    const road = ground.createFixture(
      Chain(
        level.ground.map(([x, y]) => Vec2(x, y)),
        false,
      ),
      { friction: 1 },
    );
    // Keep one continuous chain and its ghost-vertex adjacency. Surface changes
    // affect the material at the contact point without adding terrain seams.
    this.physics.world.on('pre-solve', (contact) => {
      const a = contact.getFixtureA();
      const b = contact.getFixtureB();
      if (a !== road && b !== road) return;
      const manifold = contact.getWorldManifold(null);
      if (!manifold || contact.getManifold().pointCount === 0) return;
      const material = SURFACES[surfaceAt(level, manifold.points[0]!.x)];
      const other = a === road ? b : a;
      contact.setFriction(Math.sqrt(material.friction * other.getFriction()));
    });
    for (const o of level.obstacles) {
      const body = this.physics.world.createBody({ position: Vec2(o.x, o.y) });
      body.createFixture(Box(o.width / 2, o.height / 2), { friction: 0.8 });
    }
    this.vehicle = new Scooter(this.physics, level.start.x, level.start.y, SCOOTER);
    this.cargo = new Cargo(this.physics, this.vehicle.chassis, COFFEE, this.events);
  }

  advance(delta: number, input: ControlState): number {
    if (this.finished) return 0;
    return this.physics.advance(
      delta,
      () => this.vehicle.drive(input),
      (dt) => {
        this.elapsed += dt;
        this.cargo.afterStep(dt);
        const p = this.vehicle.chassis.getPosition();
        // Failure has priority over a finish crossing in the same fixed tick.
        if (p.y < RACE_RULES.minWorldY) {
          this.end({ success: false, reason: 'out-of-bounds' });
          return;
        }
        if (this.cargo.integrity <= 0) {
          this.end({ success: false, reason: 'cargo-destroyed' });
          return;
        }
        this.overturnedSeconds = this.isStablyOverturned() ? this.overturnedSeconds + dt : 0;
        if (this.overturnedSeconds + 1e-10 >= RACE_RULES.overturn.holdSeconds) {
          this.end({ success: false, reason: 'overturned' });
          return;
        }
        if (
          p.x >= this.level.finish.x &&
          p.x <= this.level.finish.x + this.level.finish.width &&
          Math.abs(p.y - this.level.finish.y) < 2
        ) {
          this.end(
            this.cargo.integrity >= this.level.difficulty.minimumIntegrity
              ? { success: true, reason: 'delivered' }
              : { success: false, reason: 'cargo-rejected' },
          );
        }
      },
    );
  }

  private end(outcome: RaceOutcome): void {
    if (this.finished) return;
    this.outcome = outcome;
    this.finished = true;
    this.cargo.delivery = outcome.success ? 'delivered' : 'failed';
    this.physics.setPaused(true);
  }

  private isStablyOverturned(): boolean {
    const { chassis } = this.vehicle;
    const rule = RACE_RULES.overturn;
    const speed = chassis.getLinearVelocity();
    if (
      Math.cos(chassis.getAngle()) > Math.cos(rule.minAngle) ||
      Math.hypot(speed.x, speed.y) > rule.maxSpeed ||
      Math.abs(chassis.getAngularVelocity()) > rule.maxAngularSpeed
    )
      return false;
    return this.hasSupport(chassis) || this.hasSupport(this.cargo.body);
  }

  private hasSupport(body: Body): boolean {
    for (let edge = body.getContactList(); edge; edge = edge.next) {
      const { contact, other } = edge;
      if (!other || other.getType() !== 'static' || !contact.isEnabled() || !contact.isTouching())
        continue;
      const a = contact.getFixtureA();
      const b = contact.getFixtureB();
      if (a.isSensor() || b.isSensor()) continue;
      const manifold = contact.getWorldManifold(null);
      if (!manifold || contact.getManifold().pointCount === 0) continue;
      // Contact normals point A -> B; require support from below, not a wall.
      const upwardNormal = a.getBody() === body ? -manifold.normal.y : manifold.normal.y;
      if (upwardNormal > 0.5) return true;
    }
    return false;
  }

  dispose(): void {
    this.events.clear();
    this.physics.dispose();
  }
}
