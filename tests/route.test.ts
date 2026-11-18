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
  platforms: [],
  fork: undefined,
  checkpoint: undefined,
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
    motion: { ...sim.vehicle.motion },
    stress: sim.cargo.stress,
  };
}

// Input-only recordings. Timestamps are fixed ticks (divide by 60 for seconds).
// G throttle; B brake/reverse; < lean back; > lean forward; . release.
const MISSION_REPLAYS: Record<'safe' | 'fast', Array<[number, string]>> = {
  safe: [
    [0, '.'],
    [30, 'G'],
    [180, '.'],
    [210, 'G'],
    [330, 'B<'],
    [360, 'B>'],
    [390, 'G>'],
    [420, '<'],
    [450, 'B'],
    [510, '.'],
    [600, 'G'],
    [690, '.'],
    [750, 'G'],
    [810, '.'],
    [840, 'G'],
    [870, '<'],
    [900, '.'],
    [960, 'B'],
    [1020, 'G'],
    [1170, 'G<'],
    [1230, 'B'],
    [1260, 'B<'],
    [1290, 'B'],
    [1350, '.'],
    [1470, 'G'],
    [1680, '.'],
    [1710, 'B'],
    [1770, 'G'],
    [1890, '.'],
    [1920, 'G'],
    [2010, 'G<'],
    [2040, '.'],
    [2100, '<'],
    [2130, '.'],
    [2160, 'G'],
    [2220, 'B'],
    [2250, '.'],
    [2280, 'G'],
    [2460, '.'],
    [2490, '<'],
    [2520, 'B<'],
    [2550, '.'],
  ],
  fast: [
    [0, '.'],
    [30, 'G'],
    [180, '.'],
    [210, 'G'],
    [330, 'B<'],
    [360, 'B>'],
    [390, 'G>'],
    [420, '<'],
    [450, 'B'],
    [510, '.'],
    [600, 'G'],
    [690, '.'],
    [750, 'G'],
    [810, '.'],
    [840, 'G'],
    [870, '<'],
    [900, '.'],
    [960, 'G'],
    [1050, '.'],
    [1080, 'G'],
    [1230, 'G<'],
    [1260, '<'],
    [1290, 'G'],
    [1350, '.'],
    [1440, 'B'],
    [1530, 'G'],
    [1560, '<'],
    [1590, 'G'],
    [1650, 'G<'],
    [1710, '>'],
    [1740, 'G<'],
    [1770, '<'],
    [1800, 'G'],
    [1830, 'G<'],
    [1860, '<'],
    [1890, 'B'],
    [1920, 'G'],
    [2040, '.'],
    [2070, '<'],
    [2100, 'G<'],
    [2130, 'G'],
    [2160, '.'],
  ],
};
type MissionStrategy = 'safe' | 'fast' | 'gas' | 'wrong-lean';
function missionInput(name: MissionStrategy, tick: number): ControlState {
  if (name === 'gas') return gas;
  if (name === 'wrong-lean') return { ...gas, lean: 1 };
  let command = '.';
  for (const [at, value] of MISSION_REPLAYS[name]) {
    if (at > tick) break;
    command = value;
  }
  return {
    throttle: command.includes('G'),
    brake: command.includes('B'),
    lean: command.includes('<') ? 1 : command.includes('>') ? -1 : 0,
  };
}
function rideMission(name: MissionStrategy, fps = 60) {
  const sim = new Simulation();
  for (let frame = 0; frame < fps * 90 && !sim.finished; frame++)
    sim.advance(1 / fps, missionInput(name, Math.floor((frame * 60) / fps)));
  const result = {
    ...snapshot(sim),
    route: sim.routeChoice,
    components: sim.cargo.components.map((p) => ({ ...p })),
  };
  sim.dispose();
  return result;
}

it('offers checkpoint after a reproducible input-only fall in the actual mission', () => {
  const sim = new Simulation();
  for (let tick = 0; tick < 1500 && !sim.finished; tick++)
    sim.advance(1 / 60, missionInput('fast', tick));
  for (let tick = 0; tick < 30 * 60 && !sim.finished; tick++) {
    const at = 1500 + tick;
    sim.advance(
      1 / 60,
      at < 1626
        ? { throttle: true, brake: false, lean: -1 }
        : { throttle: false, brake: true, lean: at < 1674 ? 1 : 0 },
    );
  }
  expect(sim.outcome).toEqual({ success: false, reason: 'overturned' });
  expect(sim.falls).toBe(1);
  expect(sim.checkpointAvailable).toBe(true);
  const elapsed = sim.elapsed,
    integrity = sim.cargo.integrity;
  const continued = sim.continueFromCheckpoint();
  expect(continued).toBe(true);
  if (continued) {
    for (let tick = 0; tick < 120 && !sim.finished; tick++) sim.advance(1 / 60, idle);
    expect(sim.cargo.integrity).toBeCloseTo(integrity - 15, 10);
    expect(sim.elapsed).toBeCloseTo(elapsed + 2, 8);
    expect(sim.finished).toBe(false);
    expect(sim.checkpointUsed).toBe(true);
  }
  sim.dispose();
});

it('joins the physical lower detour and upper jump, with base-vehicle gold achievable', () => {
  const safe = rideMission('safe'),
    fast = rideMission('fast');
  expect(safe.outcome).toEqual({ success: true, reason: 'delivered' });
  expect(fast.outcome).toEqual({ success: true, reason: 'delivered' });
  expect(safe.route).toBe('safe');
  expect(fast.route).toBe('risky');
  expect(safe.integrity).toBe(100);
  expect(fast.integrity).toBeGreaterThanOrEqual(90);
  expect(fast.elapsed).toBeLessThan(testLevel.difficulty.targetSeconds);
  expect(safe.elapsed).toBeGreaterThan(testLevel.difficulty.targetSeconds);
  expect(safe.elapsed).toBeLessThan(testLevel.difficulty.silverSeconds!);
  expect(fast.integrity).toBeLessThan(safe.integrity);
  for (let i = 1; i < MISSION_REPLAYS.fast.length; i++)
    expect(MISSION_REPLAYS.fast[i]![0] - MISSION_REPLAYS.fast[i - 1]![0]).toBeGreaterThanOrEqual(
      30,
    );
  for (const name of ['gas', 'wrong-lean'] as const)
    expect(rideMission(name).outcome).toEqual({ success: false, reason: 'overturned' });
});

it('expires the 180-second game clock, while pause consumes no deadline time', () => {
  const sim = new Simulation(flat);
  run(sim, 2);
  sim.physics.setPaused(true);
  sim.advance(20, gas);
  expect(sim.elapsed).toBeCloseTo(2);
  sim.physics.setPaused(false);
  run(sim, 178);
  expect(sim.elapsed).toBe(180);
  expect(sim.outcome).toEqual({ success: false, reason: 'deadline' });
  expect(sim.falls).toBe(0);
  expect(sim.checkpointAvailable).toBe(false);
  expect(sim.continueFromCheckpoint()).toBe(false);
  sim.dispose();
});

it('restores one reached checkpoint with exactly 15 points lost and fresh contacts, then stops on the second fall', () => {
  // Fault injection isolates a gentle contact overturn, not a successful-run replay.
  const sim = new Simulation({
    ...flat,
    id: 'checkpoint-fixture',
    start: { x: 3, y: 1.65 },
    ground: [
      [-100, 0.5],
      [1000, 0.5],
    ],
    checkpoint: { x: 3, y: 1.65, radius: 2 },
  });
  expect(sim.checkpointAvailable).toBe(false);
  expect(sim.continueFromCheckpoint()).toBe(false);
  run(sim, 2);
  invert(sim, 1.35);
  run(sim, 3);
  expect(sim.outcome).toEqual({ success: false, reason: 'overturned' });
  expect(sim.falls).toBe(1);
  expect(sim.checkpointAvailable).toBe(true);
  sim.cargo.integrity = 64;
  expect(sim.checkpointAvailable).toBe(false);
  expect(sim.continueFromCheckpoint()).toBe(false);
  sim.cargo.integrity = 65;
  expect(sim.checkpointAvailable).toBe(true);
  sim.cargo.integrity = 100;
  const elapsed = sim.elapsed,
    ticks = sim.physics.ticks,
    landingId = sim.vehicle.motion.landingId;
  const oldWorld = sim.physics,
    oldVehicle = sim.vehicle,
    events = sim.events;
  expect(sim.continueFromCheckpoint()).toBe(true);
  expect(sim.events).toBe(events);
  expect(sim.vehicle).not.toBe(oldVehicle);
  expect(oldWorld.world.getBodyCount()).toBe(0);
  expect(sim.physics.world.getJointCount()).toBe(3);
  expect(sim.checkpointUsed).toBe(true);
  expect(sim.elapsed).toBe(elapsed);
  expect(sim.physics.ticks).toBe(ticks);
  expect(sim.vehicle.motion.landingId).toBe(landingId);
  expect(sim.cargo.integrity).toBeCloseTo(85);
  run(sim, 2);
  expect(sim.cargo.integrity).toBeCloseTo(85);
  expect(sim.elapsed).toBeCloseTo(elapsed + 2);
  invert(sim, 1.35);
  run(sim, 3);
  expect(sim.falls).toBe(2);
  expect(sim.checkpointAvailable).toBe(false);
  expect(sim.continueFromCheckpoint()).toBe(false);
  sim.dispose();
});

it('validates serializable platform, fork, checkpoint and medal bounds for imported drafts', () => {
  expect(validateLevel(JSON.parse(JSON.stringify(testLevel)))).toEqual(testLevel);
  for (const patch of [
    {
      platforms: [
        {
          id: 'bad',
          points: [
            [85, 1],
            [84, 2],
          ],
          surface: 'asphalt',
        },
      ],
    },
    {
      platforms: [
        {
          id: 'bad',
          points: [
            [85, 1],
            [86, Infinity],
          ],
          surface: 'asphalt',
        },
      ],
    },
    {
      platforms: [
        {
          id: 'bad',
          points: [
            [85, 1],
            [86, 2],
          ],
          surface: 'unknown',
        },
      ],
    },
    {
      platforms: [
        {
          id: 'bad',
          points: [
            [85, 1],
            [86, 2],
          ],
          surface: 'asphalt',
          oneWay: 'yes',
        },
      ],
    },
    { platforms: [testLevel.platforms![0], testLevel.platforms![0]] },
    { fork: { ...testLevel.fork!, decisionX: 300 } },
    { fork: { ...testLevel.fork!, riskyMinY: NaN } },
    { checkpoint: { ...testLevel.checkpoint!, radius: 0 } },
    { checkpoint: { ...testLevel.checkpoint!, y: Infinity } },
    { difficulty: { ...testLevel.difficulty, deadlineSeconds: Infinity } },
    { difficulty: { ...testLevel.difficulty, silverSeconds: 1 } },
  ])
    expect(() => validateLevel({ ...testLevel, ...patch })).toThrow();
});

describe('first coffee route and outcomes', () => {
  it('crosses both surfaces, slope, bump and ramp identically at 30/60/120 FPS', () => {
    const states = [30, 60, 120].map((fps) => {
      const sim = new Simulation();
      let maxY = 0;
      for (let i = 0; i < fps * 75 && !sim.finished; i++) {
        sim.advance(1 / fps, missionInput('safe', Math.floor((i * 60) / fps)));
        maxY = Math.max(maxY, sim.vehicle.chassis.getPosition().y);
      }
      expect(maxY).toBeGreaterThan(3.7);
      expect(sim.outcome).toEqual({ success: true, reason: 'delivered' });
      expect(sim.cargo.integrity).toBeGreaterThanOrEqual(testLevel.difficulty.minimumIntegrity);
      expect(sim.elapsed).toBeLessThan(75);
      const state = snapshot(sim);
      expect(sim.advance(1, { ...gas, lean: 1 })).toBe(0);
      expect(snapshot(sim)).toEqual(state);
      sim.dispose();
      return state;
    });
    expect(states[1]).toEqual(states[0]);
    expect(states[2]).toEqual(states[0]);
  });

  it('holding forward lean produces a repeatable failure instead of delivery', () => {
    const states = [30, 60, 120].map((fps) => {
      const sim = new Simulation();
      run(sim, 40, fps, { ...gas, lean: -1 });
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
    expect(sim.cargo.integrity).toBe(testLevel.difficulty.minimumIntegrity - 1);
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
