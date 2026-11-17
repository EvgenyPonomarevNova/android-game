import { describe, expect, it } from 'vitest';
import { Box, Vec2 } from 'planck';
import { Simulation } from '../src/game/core/Simulation';
import { PhysicsWorld } from '../src/game/physics/PhysicsWorld';
import { toPhysics, toScreen } from '../src/game/physics/coordinates';
import { testLevel, validateLevel, type LevelData } from '../src/game/levels/testLevel';
import type { ControlState } from '../src/game/input/InputController';
import { InputController } from '../src/game/input/InputController';
import { SCOOTER } from '../src/config/game';

const idle: ControlState = { throttle: false, brake: false, lean: 0 };
const gas: ControlState = { ...idle, throttle: true };
const flat: LevelData = {
  ...testLevel,
  finish: { x: 900, y: 0, width: 3 },
  ground: [
    [-100, 0],
    [1000, 0],
  ],
  obstacles: [],
};
function run(sim: Simulation, seconds: number, fps: number, input = idle) {
  for (let i = 0; i < seconds * fps; i++) sim.advance(1 / fps, input);
}

describe('fixed-step Planck simulation', () => {
  it('produces the same trajectory at 30, 60 and 120 render FPS', () => {
    const states = [30, 60, 120].map((fps) => {
      const sim = new Simulation(flat);
      run(sim, 2, fps);
      run(sim, 3, fps, gas);
      const state = {
        x: sim.vehicle.chassis.getPosition().x,
        y: sim.vehicle.chassis.getPosition().y,
        angle: sim.vehicle.chassis.getAngle(),
        health: sim.cargo.integrity,
        ticks: sim.physics.ticks,
      };
      sim.dispose();
      return state;
    });
    expect(states[0]!.ticks).toBe(300);
    expect(states[1]).toEqual(states[0]);
    expect(states[2]).toEqual(states[0]);
    expect(states[0]!.x).toBeGreaterThan(10);
  });

  it('settles on two independently suspended wheels without damaging resting coffee', () => {
    const sim = new Simulation(flat);
    run(sim, 8, 60);
    expect(sim.vehicle.wheels).toHaveLength(2);
    expect(sim.vehicle.joints[0]).not.toBe(sim.vehicle.joints[1]);
    expect(sim.physics.world.getJointCount()).toBe(3);
    expect(sim.vehicle.chassis.getPosition().y).toBeGreaterThan(0.4);
    expect(Math.abs(sim.vehicle.chassis.getLinearVelocity().y)).toBeLessThan(0.05);
    expect(sim.cargo.integrity).toBe(100);
    expect(sim.vehicle.chassis.isAwake()).toBe(false);
    expect(sim.vehicle.wheels.every((wheel) => !wheel.isAwake())).toBe(true);
    const parked = sim.vehicle.chassis.getPosition().clone();
    run(sim, 2, 60);
    expect(sim.vehicle.chassis.getPosition()).toEqual(parked);
    run(sim, 1, 60, gas);
    expect(sim.vehicle.chassis.isAwake()).toBe(true);
    expect(sim.vehicle.chassis.getPosition().x).toBeGreaterThan(parked.x + 0.2);
    sim.dispose();
    expect(sim.physics.world.getBodyCount()).toBe(0);
  });

  it('keeps braking available above the drive limit with both pedals held', () => {
    const sim = new Simulation(flat);
    run(sim, 2, 60);
    sim.vehicle.chassis.setLinearVelocity(Vec2(SCOOTER.maxSpeed + 1, 0));
    sim.vehicle.drive({ throttle: true, brake: true, lean: 0 });
    expect(sim.vehicle.joints[0]!.isMotorEnabled()).toBe(true);
    expect(sim.vehicle.joints[0]!.getMotorSpeed()).toBe(0);
    sim.dispose();
  });

  it('does not mistake the static load on an inverted cup for repeated impacts', () => {
    const sim = new Simulation(flat);
    const origin = sim.vehicle.chassis.getPosition().clone();
    for (const body of [sim.vehicle.chassis, ...sim.vehicle.wheels, sim.cargo.body]) {
      const p = body.getPosition();
      body.setTransform(Vec2(3 - (p.x - origin.x), 0.85 - (p.y - origin.y)), Math.PI);
    }
    run(sim, 0.5, 60);
    expect(sim.cargo.integrity).toBe(100);
    sim.dispose();
  });

  it('accelerates, brakes and then reverses', () => {
    const sim = new Simulation(flat);
    run(sim, 2, 60);
    run(sim, 2, 60, gas);
    const forward = sim.vehicle.chassis.getLinearVelocity().x;
    expect(forward).toBeGreaterThan(2);
    run(sim, 0.5, 60, { ...idle, brake: true });
    expect(sim.vehicle.chassis.getLinearVelocity().x).toBeLessThan(forward);
    run(sim, 3, 60, { ...idle, brake: true });
    expect(sim.vehicle.chassis.getLinearVelocity().x).toBeLessThan(-0.3);
    sim.dispose();
  });

  it('cuts propulsion at the forward and reverse limits without clamping external velocity', () => {
    const sim = new Simulation(flat);
    for (const [speed, input] of [
      [SCOOTER.maxSpeed, gas],
      [-SCOOTER.maxSpeed / 2, { ...idle, brake: true }],
    ] as const) {
      sim.vehicle.chassis.setLinearVelocity(Vec2(speed, 0));
      sim.vehicle.drive(input);
      expect(sim.vehicle.joints[0]!.isMotorEnabled()).toBe(false);
      expect(sim.vehicle.chassis.getLinearVelocity().x).toBe(speed);
    }
    sim.vehicle.chassis.setLinearVelocity(Vec2(0, 0));
    sim.vehicle.drive(gas);
    expect(sim.vehicle.joints[0]!.isMotorEnabled()).toBe(true);
    sim.dispose();
  });

  it('lets airborne lean rotate either way and counter-steer above the angular drive limit', () => {
    for (const lean of [-1, 1]) {
      const sim = new Simulation({ ...flat, start: { x: 3, y: 20 } });
      run(sim, 0.5, 60, { ...idle, lean });
      expect(sim.vehicle.chassis.getAngle() * lean).toBeGreaterThan(0.1);
      expect(sim.cargo.integrity).toBe(100);
      sim.dispose();
      const speeds = [0, lean, -lean].map((direction) => {
        const spinning = new Simulation({ ...flat, start: { x: 3, y: 20 } });
        for (const body of [
          spinning.vehicle.chassis,
          ...spinning.vehicle.wheels,
          spinning.cargo.body,
        ])
          body.setAngularVelocity(lean * (SCOOTER.maxAngularSpeed + 1));
        spinning.advance(1 / 60, { ...idle, lean: direction });
        const speed = spinning.vehicle.chassis.getAngularVelocity() * lean;
        spinning.dispose();
        return speed;
      });
      expect(speeds[1]).toBe(speeds[0]);
      expect(speeds[2]!).toBeLessThan(speeds[0]! - 0.01);
    }
  });

  it('limits catch-up, rejects invalid delta and resumes without simulating background time', () => {
    const physics = new PhysicsWorld();
    const body = physics.track(physics.world.createDynamicBody(Vec2(0, 10)));
    body.createFixture(Box(0.5, 0.5), 1);
    expect(
      physics.advance(
        100,
        () => {},
        () => {},
      ),
    ).toBe(6);
    expect(
      physics.advance(
        Number.NaN,
        () => {},
        () => {},
      ),
    ).toBe(0);
    physics.setPaused(true);
    const before = body.getPosition().y;
    expect(
      physics.advance(
        20,
        () => {},
        () => {},
      ),
    ).toBe(0);
    expect(body.getPosition().y).toBe(before);
    physics.setPaused(false);
    physics.advance(
      1 / 120,
      () => {},
      () => {},
    );
    expect(physics.ticks).toBe(6);
    physics.advance(
      1 / 120,
      () => {},
      () => {},
    );
    expect(physics.ticks).toBe(7);
    physics.dispose();
  });

  it('interpolates between snapshots and reverses the physical Y axis', () => {
    const physics = new PhysicsWorld();
    const body = physics.track(physics.world.createDynamicBody(Vec2(1, 10)));
    body.createFixture(Box(0.5, 0.5), 1);
    body.setLinearVelocity(Vec2(6, 0));
    physics.advance(
      1 / 60 + 1 / 120,
      () => {},
      () => {},
    );
    const pose = physics.pose(body, { x: 0, y: 0, angle: 0 });
    expect(pose.x).toBeCloseTo(1.05, 5);
    expect(toScreen(2, 3)).toEqual({ x: 120, y: -180 });
    expect(toPhysics(120, -180)).toEqual({ x: 2, y: 3 });
    expect(() => toScreen(NaN, 0)).toThrow();
    physics.dispose();
  });

  it('honours a pause requested within a catch-up step', () => {
    const physics = new PhysicsWorld();
    const body = physics.track(physics.world.createDynamicBody(Vec2(0, 10)));
    body.createFixture(Box(0.5, 0.5), 1);
    expect(
      physics.advance(
        1 / 30,
        () => {},
        () => physics.setPaused(true),
      ),
    ).toBe(1);
    expect(physics.ticks).toBe(1);
    expect(physics.alpha).toBe(1);
    physics.setPaused(false);
    expect(
      physics.advance(
        1 / 120,
        () => {},
        () => {},
      ),
    ).toBe(0);
    physics.dispose();
  });

  it('defers contact mutations until the world is unlocked', () => {
    const physics = new PhysicsWorld();
    physics.world.createBody().createFixture(Box(5, 0.5));
    const falling = physics.track(physics.world.createDynamicBody(Vec2(0, 1)));
    falling.createFixture(Box(0.5, 0.5), 1);
    let lockedAtContact = false,
      unlockedAtMutation = false;
    physics.world.on('begin-contact', () => {
      lockedAtContact = physics.world.isLocked();
      physics.defer(() => {
        unlockedAtMutation = !physics.world.isLocked();
        physics.world.createBody();
      });
    });
    physics.advance(
      1 / 30,
      () => {},
      () => {},
    );
    expect(lockedAtContact).toBe(true);
    expect(unlockedAtMutation).toBe(true);
    physics.dispose();
  });

  it('damages coffee from a real impact and emits critical/destroyed once', () => {
    const sim = new Simulation({ ...flat, start: { x: 3, y: 8 } });
    let critical = 0,
      destroyed = 0;
    sim.events.on('cargo:critical', () => critical++);
    sim.events.on('cargo:destroyed', () => destroyed++);
    run(sim, 3, 60);
    expect(sim.cargo.integrity).toBeLessThan(100);
    sim.cargo.applyImpact(100);
    sim.cargo.applyImpact(100);
    expect(sim.cargo.integrity).toBe(0);
    expect(critical).toBe(1);
    expect(destroyed).toBe(1);
    expect(sim.cargo.delivery).toBe('failed');
    sim.dispose();
  });

  it('validates level geometry and resets the whole simulation for a fresh run', () => {
    expect(validateLevel(testLevel)).toBe(testLevel);
    expect(() =>
      validateLevel({
        ...testLevel,
        ground: [
          [1, 0],
          [0, 0],
        ],
      }),
    ).toThrow();
    expect(() => validateLevel({ ...testLevel, start: { x: NaN, y: 0 } })).toThrow();
    const sim = new Simulation();
    run(sim, 1, 60, gas);
    sim.dispose();
    const fresh = new Simulation();
    expect(fresh.elapsed).toBe(0);
    expect(fresh.cargo.integrity).toBe(100);
    expect(fresh.vehicle.chassis.getPosition().x).toBe(testLevel.start.x);
    fresh.dispose();
  });
});

it('keeps simultaneous input sources independent and clears cancelled controls', () => {
  const input = new InputController();
  input.set('pointer:1', 'throttle');
  input.set('pointer:2', 'leanForward');
  input.set('KeyW', 'throttle');
  expect(input.state).toEqual({ throttle: true, brake: false, lean: -1 });
  input.release('pointer:1');
  expect(input.state.throttle).toBe(true);
  input.release('pointer:2');
  expect(input.state.lean).toBe(0);
  input.reset();
  expect(input.state).toEqual(idle);
});
