import { AABB, Box, Chain, Vec2, type Body, type Contact, type Fixture } from 'planck';
import { RACE_RULES, SCOOTER } from '../../config/game';
import { EventBus } from '../../shared/EventBus';
import { Cargo, COFFEE, SURPRISE, type CargoComponent, type CargoEvents } from '../cargo/Cargo';
import type { ControlState } from '../input/InputController';
import {
  SURFACES,
  surfaceAt,
  testLevel,
  validateLevel,
  type LevelData,
  type LevelPlatform,
} from '../levels/testLevel';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { Scooter } from '../vehicle/Vehicle';

export type RaceOutcome =
  | { success: true; reason: 'delivered' }
  | {
      success: false;
      reason: 'cargo-destroyed' | 'cargo-rejected' | 'overturned' | 'out-of-bounds' | 'deadline';
    };

export class Simulation {
  private activePhysics = new PhysicsWorld();
  private activeVehicle!: Scooter;
  private activeCargo!: Cargo;
  get physics(): PhysicsWorld {
    return this.activePhysics;
  }
  get vehicle(): Scooter {
    return this.activeVehicle;
  }
  get cargo(): Cargo {
    return this.activeCargo;
  }
  readonly events = new EventBus<CargoEvents>();
  elapsed = 0;
  finished = false;
  outcome: RaceOutcome | null = null;
  checkpointUsed = false;
  falls = 0;
  routeChoice: 'safe' | 'risky' | null = null;
  private checkpointReached = false;
  private overturnedSeconds = 0;
  private previousBottom = new Map<Body, number>();

  constructor(readonly level: LevelData = testLevel) {
    validateLevel(level);
    this.populate(level.start);
  }

  private populate(
    start: LevelData['start'],
    components?: readonly CargoComponent[],
    landingId = 0,
  ): void {
    this.previousBottom.clear();
    const ground = this.physics.world.createBody();
    const road = ground.createFixture(
      Chain(
        this.level.ground.map(([x, y]) => Vec2(x, y)),
        false,
      ),
      { friction: 1 },
    );
    const platforms = new Map<Fixture, LevelPlatform>();
    const supports = new Set<Contact>();
    for (const platform of this.level.platforms ?? []) {
      const body = this.physics.world.createBody();
      const fixture = body.createFixture(
        Chain(
          platform.points.map(([x, y]) => Vec2(x, y)),
          false,
        ),
        { friction: SURFACES[platform.surface].friction },
      );
      platforms.set(fixture, platform);
    }
    this.physics.world.on('end-contact', (contact) => supports.delete(contact));
    this.physics.world.on('pre-solve', (contact) => {
      const a = contact.getFixtureA(),
        b = contact.getFixtureB();
      const platform = platforms.get(a) ?? platforms.get(b);
      const terrainIsA = a === road || platforms.has(a);
      if (a !== road && b !== road && !platform) return;
      const manifold = contact.getWorldManifold(null);
      if (!manifold || contact.getManifold().pointCount === 0) return;
      const other = terrainIsA ? b : a;
      if (platform?.oneWay) {
        const up = terrainIsA ? manifold.normal.y : -manifold.normal.y;
        const previous = this.previousBottom.get(other.getBody()) ?? -Infinity;
        // A whole actor must approach from above. Heads/cargo cannot catch a
        // bridge underside, and the lower route never toggles a hidden branch.
        if (up < 0.1 || (previous < manifold.points[0]!.y - 0.15 && !supports.has(contact))) {
          contact.setEnabled(false);
          return;
        }
        supports.add(contact);
      }
      const material = platform
        ? SURFACES[platform.surface]
        : SURFACES[surfaceAt(this.level, manifold.points[0]!.x)];
      contact.setFriction(Math.sqrt(material.friction * other.getFriction()));
    });
    for (const o of this.level.obstacles) {
      const body = this.physics.world.createBody({ position: Vec2(o.x, o.y) });
      body.createFixture(Box(o.width / 2, o.height / 2), { friction: 0.8 });
    }
    this.activeVehicle = new Scooter(this.physics, start.x, start.y, SCOOTER);
    this.vehicle.motion.landingId = landingId;
    this.activeCargo = new Cargo(
      this.physics,
      this.vehicle.chassis,
      this.level.cargo === 'surprise' ? SURPRISE : COFFEE,
      this.events,
    );
    if (components) this.cargo.restoreComponents(components);
  }

  private captureBounds(): void {
    const bounds = new AABB();
    for (const body of [this.vehicle.chassis, ...this.vehicle.wheels, this.cargo.body]) {
      let bottom = Infinity;
      for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
        fixture.getShape().computeAABB(bounds, body.getTransform(), 0);
        bottom = Math.min(bottom, bounds.lowerBound.y);
      }
      this.previousBottom.set(body, bottom);
    }
  }

  advance(delta: number, input: ControlState): number {
    if (this.finished) return 0;
    return this.physics.advance(
      delta,
      () => {
        this.captureBounds();
        this.vehicle.drive(input);
      },
      (dt) => {
        this.elapsed += dt;
        this.vehicle.afterStep(dt);
        this.cargo.afterStep(dt, this.vehicle.motion);
        const p = this.vehicle.chassis.getPosition();
        const atFinish =
          p.x >= this.level.finish.x &&
          p.x <= this.level.finish.x + this.level.finish.width &&
          Math.abs(p.y - this.level.finish.y) < 2;
        if (atFinish) this.cargo.flushImpact();
        const deadline = this.level.difficulty.deadlineSeconds ?? 180;
        if (this.elapsed + 1e-8 >= deadline) {
          const late = this.elapsed > deadline + 1e-8;
          this.elapsed = deadline;
          if (!atFinish || late) {
            this.end({ success: false, reason: 'deadline' });
            return;
          }
        }
        if (p.y < RACE_RULES.minWorldY) {
          this.end({ success: false, reason: 'out-of-bounds' });
          return;
        }
        if (this.cargo.integrity <= 0) {
          this.end({ success: false, reason: 'cargo-destroyed' });
          return;
        }
        if (this.cargo.integrity < this.level.difficulty.minimumIntegrity) {
          this.end({ success: false, reason: 'cargo-rejected' });
          return;
        }
        this.overturnedSeconds = this.isStablyOverturned() ? this.overturnedSeconds + dt : 0;
        if (this.overturnedSeconds + 1e-10 >= RACE_RULES.overturn.holdSeconds) {
          this.end({ success: false, reason: 'overturned' });
          return;
        }
        const cp = this.level.checkpoint;
        if (
          cp &&
          !this.checkpointReached &&
          this.vehicle.motion.grounded &&
          Math.hypot(p.x - cp.x, p.y - cp.y) <= cp.radius &&
          Math.cos(this.vehicle.chassis.getAngle()) > Math.cos(0.35) &&
          Math.abs(this.vehicle.chassis.getAngularVelocity()) < 1
        )
          this.checkpointReached = true;
        const fork = this.level.fork;
        if (fork && this.routeChoice === null && p.x >= fork.decisionX && p.x <= fork.toX)
          this.routeChoice = p.y >= fork.riskyMinY ? 'risky' : 'safe';
        if (atFinish) this.end({ success: true, reason: 'delivered' });
      },
    );
  }

  get checkpointAvailable(): boolean {
    const reason = this.outcome?.reason;
    return (
      !this.checkpointUsed &&
      this.checkpointReached &&
      this.falls === 1 &&
      (reason === 'overturned' || reason === 'out-of-bounds') &&
      this.cargo.integrity - 15 >= this.level.difficulty.minimumIntegrity &&
      this.elapsed < (this.level.difficulty.deadlineSeconds ?? 180)
    );
  }

  continueFromCheckpoint(): boolean {
    const cp = this.level.checkpoint;
    if (!cp || !this.checkpointAvailable) return false;
    const factor = (this.cargo.integrity - 15) / this.cargo.integrity;
    const retained = this.cargo.components.map((part) => ({
      ...part,
      integrity: part.integrity * factor,
    }));
    const landingId = this.vehicle.motion.landingId,
      ticks = this.physics.ticks;
    this.physics.dispose();
    this.activePhysics = new PhysicsWorld();
    this.populate(cp, retained, landingId);
    this.physics.ticks = ticks;
    this.checkpointUsed = true;
    this.finished = false;
    this.outcome = null;
    this.routeChoice = null;
    this.overturnedSeconds = 0;
    return true;
  }

  private end(outcome: RaceOutcome): void {
    if (this.finished) return;
    if (outcome.reason === 'overturned' || outcome.reason === 'out-of-bounds') this.falls++;
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
      const a = contact.getFixtureA(),
        b = contact.getFixtureB();
      if (a.isSensor() || b.isSensor()) continue;
      const manifold = contact.getWorldManifold(null);
      if (!manifold || contact.getManifold().pointCount === 0) continue;
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
