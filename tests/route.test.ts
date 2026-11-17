import { describe, expect, it } from 'vitest';
import { Vec2 } from 'planck';
import { Simulation } from '../src/game/core/Simulation';
import { testLevel, validateLevel, type LevelData } from '../src/game/levels/testLevel';
import type { ControlState } from '../src/game/input/InputController';

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
  surfaces: undefined,
};

function run(sim: Simulation, seconds: number, fps = 60, input = idle) {
  for (let i = 0; i < seconds * fps && !sim.finished; i++) sim.advance(1 / fps, input);
}

function invert(sim: Simulation, height: number) {
  const origin = sim.vehicle.chassis.getPosition().clone();
  for (const body of [sim.vehicle.chassis, ...sim.vehicle.wheels, sim.cargo.body]) {
    const p = body.getPosition();
    body.setTransform(Vec2(3 - (p.x - origin.x), height - (p.y - origin.y)), Math.PI);
  }
}

function snapshot(sim: Simulation) {
  return {
    outcome: sim.outcome,
    delivery: sim.cargo.delivery,
    position: sim.vehicle.chassis.getPosition().clone(),
    velocity: sim.vehicle.chassis.getLinearVelocity().clone(),
    angle: sim.vehicle.chassis.getAngle(),
    integrity: sim.cargo.integrity,
    elapsed: sim.elapsed,
    ticks: sim.physics.ticks,
  };
}

describe('first coffee route and outcomes', () => {
  it('crosses both surfaces, slope, bump and ramp identically at 30/60/120 FPS', () => {
    const states = [30, 60, 120].map((fps) => {
      const sim = new Simulation();
      let maxY = 0;
      for (let i = 0; i < fps * 40 && !sim.finished; i++) {
        sim.advance(1 / fps, gas);
        maxY = Math.max(maxY, sim.vehicle.chassis.getPosition().y);
      }
      expect(maxY).toBeGreaterThan(3.7);
      expect(sim.outcome).toEqual({ success: true, reason: 'delivered' });
      expect(sim.cargo.integrity).toBeGreaterThanOrEqual(testLevel.difficulty.minimumIntegrity);
      expect(sim.elapsed).toBeLessThan(testLevel.difficulty.targetSeconds);
      const state = snapshot(sim);
      expect(sim.advance(1, { ...gas, lean: 1 })).toBe(0);
      expect(snapshot(sim)).toEqual(state);
      sim.dispose();
      return state;
    });
    expect(states[1]).toEqual(states[0]);
    expect(states[2]).toEqual(states[0]);
  });

  it.each([-1, 1])('holding lean %i produces a repeatable failure instead of delivery', (lean) => {
    const states = [30, 60, 120].map((fps) => {
      const sim = new Simulation();
      run(sim, 40, fps, { ...gas, lean });
      expect(sim.finished).toBe(true);
      expect(sim.outcome?.success).toBe(false);
      expect(sim.cargo.delivery).toBe('failed');
      const state = snapshot(sim);
      sim.dispose();
      return state;
    });
    expect(states[1]).toEqual(states[0]);
    expect(states[2]).toEqual(states[0]);
  });

  it('rejects insufficient coffee at the finish and preserves the measured remainder', () => {
    const sim = new Simulation({ ...flat, finish: { x: 2, y: 0, width: 3 } });
    sim.cargo.integrity = testLevel.difficulty.minimumIntegrity - 1;
    sim.advance(1 / 60, idle);
    expect(sim.outcome).toEqual({ success: false, reason: 'cargo-rejected' });
    expect(sim.cargo.integrity).toBe(29);
    expect(sim.cargo.delivery).toBe('failed');
    sim.dispose();
  });

  it('reports leaving the world before attempting delivery', () => {
    const sim = new Simulation({
      ...flat,
      start: { x: 3, y: -16 },
      finish: { x: 2, y: -16, width: 3 },
    });
    sim.advance(1 / 30, idle);
    expect(sim.outcome).toEqual({ success: false, reason: 'out-of-bounds' });
    expect(sim.physics.ticks).toBe(1);
    expect(sim.cargo.integrity).toBe(100);
    expect(sim.cargo.delivery).toBe('failed');
    sim.dispose();
  });

  it('reports cargo destroyed by a real hard landing, without synthetic damage calls', () => {
    const sim = new Simulation({ ...flat, start: { x: 3, y: 40 } });
    run(sim, 8);
    expect(sim.cargo.integrity).toBe(0);
    expect(sim.outcome).toEqual({ success: false, reason: 'cargo-destroyed' });
    sim.dispose();
  });

  it('waits for a stable supported overturn, keeping the cup intact until the verdict', () => {
    const sim = new Simulation(flat);
    invert(sim, 0.85);
    run(sim, 0.5);
    expect(sim.outcome).toBeNull();
    expect(sim.cargo.integrity).toBe(100);
    run(sim, 3);
    expect(sim.outcome).toEqual({ success: false, reason: 'overturned' });
    expect(sim.cargo.integrity).toBe(100);
    expect(sim.cargo.delivery).toBe('failed');
    sim.dispose();
  });

  it('allows an inverted scooter to rotate in flight without an overturn verdict', () => {
    const sim = new Simulation(flat);
    invert(sim, 20);
    run(sim, 1.5);
    expect(sim.vehicle.chassis.getPosition().y).toBeGreaterThan(5);
    expect(sim.outcome).toBeNull();
    expect(sim.cargo.integrity).toBe(100);
    sim.dispose();
  });
});

describe('surface ranges', () => {
  it('starts a route on WebView versions without Object.hasOwn', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Object, 'hasOwn')!;
    Object.defineProperty(Object, 'hasOwn', { value: undefined, configurable: true });
    try {
      const sim = new Simulation();
      expect(sim.outcome).toBeNull();
      sim.dispose();
    } finally {
      Object.defineProperty(Object, 'hasOwn', descriptor);
    }
  });

  it('keeps legacy levels valid and rejects malformed, overlapping or unknown surfaces', () => {
    expect(validateLevel({ ...flat, surfaces: undefined })).toEqual(flat);
    for (const surfaces of [
      [{ from: 2, to: 2, type: 'gravel' }],
      [{ from: NaN, to: 20, type: 'asphalt' }],
      [{ from: -101, to: 0, type: 'asphalt' }],
      [
        { from: 0, to: 10, type: 'gravel' },
        { from: 9, to: 20, type: 'asphalt' },
      ],
      [{ from: 0, to: 10, type: 'unknown' }],
    ]) {
      expect(() => validateLevel({ ...flat, surfaces } as LevelData)).toThrow();
    }
  });

  it('gives gravel a measurably longer braking distance than asphalt', () => {
    const distances = (['asphalt', 'gravel'] as const).map((type) => {
      const sim = new Simulation({ ...flat, surfaces: [{ from: -100, to: 1000, type }] });
      run(sim, 2);
      run(sim, 3, 60, gas);
      const speed = sim.vehicle.chassis.getLinearVelocity().x;
      const startX = sim.vehicle.chassis.getPosition().x;
      expect(speed).toBeGreaterThan(4);
      for (let i = 0; i < 600 && sim.vehicle.chassis.getLinearVelocity().x > 0.6; i++)
        sim.advance(1 / 60, { ...idle, brake: true });
      expect(sim.vehicle.chassis.getLinearVelocity().x).toBeLessThanOrEqual(0.6);
      const distance = sim.vehicle.chassis.getPosition().x - startX;
      sim.dispose();
      return distance;
    });
    expect(distances[1]!).toBeGreaterThan(distances[0]! * 1.1);
  });

  it('restores asphalt grip after the same wheel crosses a gravel range', () => {
    const sim = new Simulation({ ...flat, surfaces: [{ from: 10, to: 16, type: 'gravel' }] });
    const rear = sim.vehicle.wheels[0]!;
    const materials: number[] = [];
    for (let i = 0; i < 600; i++) {
      sim.advance(1 / 60, gas);
      for (let edge = rear.getContactList(); edge; edge = edge.next) {
        if (!edge.contact.isTouching()) continue;
        const friction = edge.contact.getFriction();
        if (materials[materials.length - 1] !== friction) materials.push(friction);
      }
    }
    expect(materials).toEqual([Math.sqrt(1.4), Math.sqrt(1.4 * 0.35), Math.sqrt(1.4)]);
    sim.dispose();
  });
});
