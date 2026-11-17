import { Box, Chain, Vec2 } from 'planck';
import { SCOOTER } from '../../config/game';
import { EventBus } from '../../shared/EventBus';
import { Cargo, COFFEE, type CargoEvents } from '../cargo/Cargo';
import type { ControlState } from '../input/InputController';
import { testLevel, validateLevel, type LevelData } from '../levels/testLevel';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { Scooter } from '../vehicle/Vehicle';

export class Simulation {
  readonly physics = new PhysicsWorld();
  readonly events = new EventBus<CargoEvents>();
  readonly vehicle: Scooter;
  readonly cargo: Cargo;
  elapsed = 0;
  finished = false;
  constructor(readonly level: LevelData = testLevel) {
    validateLevel(level);
    const ground = this.physics.world.createBody();
    // Chain adjacency avoids ghost collisions at terrain seams.
    ground.createFixture(
      Chain(
        level.ground.map(([x, y]) => Vec2(x, y)),
        false,
      ),
      { friction: 1 },
    );
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
        if (
          p.x >= this.level.finish.x &&
          p.x <= this.level.finish.x + this.level.finish.width &&
          Math.abs(p.y - this.level.finish.y) < 2 &&
          this.cargo.integrity >= this.level.difficulty.minimumIntegrity &&
          !this.finished
        ) {
          this.finished = true;
          this.cargo.delivery = 'delivered';
        }
        if (p.y < -15) {
          this.cargo.applyImpact(100);
        }
      },
    );
  }

  dispose(): void {
    this.events.clear();
    this.physics.dispose();
  }
}
