import { describe, expect, it } from 'vitest';
import { Vec2 } from 'planck';
import { Simulation } from '../src/game/core/Simulation';
import { SCOOTER } from '../src/config/game';
import { defaultVehicleSetup, type PartId, type VehicleSetup } from '../src/shared/Progression';
import {
  PART_CATALOG,
  VEHICLE_MODELS,
  resolveVehicleSetup,
  describeVehicleSetup,
} from '../src/game/vehicle/Tuning';
import { testLevel, type LevelData } from '../src/game/levels/testLevel';

const idle = { throttle: false, brake: false, lean: 0 };
const gas = { ...idle, throttle: true };
const flat: LevelData = {
  ...testLevel,
  ground: [
    [-100, 0],
    [1000, 0],
  ],
  finish: { x: 900, y: 0, width: 3 },
  platforms: [],
  fork: undefined,
  checkpoint: undefined,
  sections: undefined,
  surfaces: undefined,
  difficulty: { targetSeconds: 100, minimumIntegrity: 0, deadlineSeconds: 180 },
};
const setupWith = (id: PartId): VehicleSetup => {
  const setup = defaultVehicleSetup(),
    part = PART_CATALOG.find((p) => p.id === id)!;
  setup.parts[part.slot] = id;
  return setup;
};
function run(sim: Simulation, seconds: number, input = idle) {
  for (let tick = 0; tick < seconds * 60 && !sim.finished; tick++) sim.advance(1 / 60, input);
}

describe('physical setup data', () => {
  it('keeps stock Dvorik exact, publishes 11 real parts and two distinct models', () => {
    expect(resolveVehicleSetup().vehicle).toEqual(SCOOTER);
    expect(PART_CATALOG).toHaveLength(11);
    expect(VEHICLE_MODELS).toHaveLength(2);
    const baseline = resolveVehicleSetup();
    const physical = (r: ReturnType<typeof resolveVehicleSetup>) =>
      JSON.stringify([r.vehicle, r.tireGrip, r.cargoMount]);
    for (const part of PART_CATALOG.filter((p) => !p.id.startsWith('standard_')))
      expect(physical(resolveVehicleSetup(setupWith(part.id)))).not.toBe(physical(baseline));
    const heavy = defaultVehicleSetup();
    heavy.vehicleId = 'tyagach_80';
    const config = resolveVehicleSetup(heavy).vehicle;
    expect(config.chassis.halfWidth).toBe(SCOOTER.chassis.halfWidth);
    expect(config.chassis.mass).toBeGreaterThan(SCOOTER.chassis.mass);
    expect(config.motor.torque).toBeGreaterThan(SCOOTER.motor.torque);
    expect(config.maxSpeed).toBeLessThan(SCOOTER.maxSpeed);
    expect(describeVehicleSetup(heavy).every((s) => Number.isFinite(s.value))).toBe(true);
  });

  it('changes acceleration, spring response, wet braking and cargo load on the same obstacles', () => {
    const engines = ['standard_engine', 'torque_engine', 'speed_engine'] as const;
    const acceleration = engines.map((id) => {
      const sim = new Simulation(flat, setupWith(id));
      run(sim, 2);
      run(sim, 3, gas);
      const value = {
        id,
        x: sim.vehicle.chassis.getPosition().x,
        vx: sim.vehicle.chassis.getLinearVelocity().x,
      };
      sim.dispose();
      return value;
    });
    expect(acceleration[1]!.vx).toBeGreaterThan(acceleration[0]!.vx);
    expect(acceleration[2]!.vx).toBeLessThan(acceleration[0]!.vx);
    const suspension = (
      ['standard_suspension', 'soft_suspension', 'sport_suspension'] as const
    ).map((id) => {
      const sim = new Simulation({ ...flat, start: { x: 3, y: 4 } }, setupWith(id));
      run(sim, 5);
      const value = { id, y: sim.vehicle.chassis.getPosition().y, integrity: sim.cargo.integrity };
      sim.dispose();
      return value;
    });
    expect(suspension[1]!.y).toBeLessThan(suspension[0]!.y);
    expect(suspension[2]!.y).toBeGreaterThan(suspension[0]!.y);
    const grip = (['standard_tires', 'city_tires', 'allweather_tires'] as const).map((id) => {
      const sim = new Simulation(
        { ...flat, surfaces: [{ from: -100, to: 1000, type: 'wet-asphalt' }] },
        setupWith(id),
      );
      run(sim, 2);
      for (let tick = 0; tick < 600 && sim.vehicle.chassis.getLinearVelocity().x < 6; tick++)
        sim.advance(1 / 60, gas);
      const speed = sim.vehicle.chassis.getLinearVelocity().x,
        start = sim.vehicle.chassis.getPosition().x;
      for (let tick = 0; tick < 600 && sim.vehicle.chassis.getLinearVelocity().x > 0.6; tick++)
        sim.advance(1 / 60, { ...idle, brake: true });
      const value = { id, speed, distance: sim.vehicle.chassis.getPosition().x - start };
      sim.dispose();
      return value;
    });
    expect(grip[2]!.distance).toBeLessThan(grip[0]!.distance);
    expect(grip[1]!.distance).toBeGreaterThan(grip[0]!.distance);
    const mount = (['standard_mount', 'reinforced_mount'] as const).map((id) => {
      const sim = new Simulation({ ...flat, start: { x: 3, y: 4 } }, setupWith(id));
      run(sim, 4);
      const value = {
        id,
        mass: sim.cargo.body.getMass(),
        integrity: sim.cargo.integrity,
        y: sim.cargo.body.getPosition().y,
      };
      sim.dispose();
      return value;
    });
    expect(mount[1]!.mass).toBeGreaterThan(mount[0]!.mass);
    expect(mount[1]!.integrity).not.toBe(mount[0]!.integrity);
    const mild = (
      ['standard_suspension', 'soft_suspension', 'sport_suspension', 'reinforced_mount'] as const
    ).map((id) => {
      const sim = new Simulation({ ...flat, start: { x: 3, y: 2 } }, setupWith(id));
      let peak = 0,
        peakCargo = 0;
      let vy = 0,
        cy = 0;
      for (let tick = 0; tick < 240; tick++) {
        sim.advance(1 / 60, idle);
        const v = sim.vehicle.chassis.getLinearVelocity().y,
          c = sim.cargo.body.getLinearVelocity().y;
        peak = Math.max(peak, (v - vy) * 60 + 9.81);
        peakCargo = Math.max(peakCargo, (c - cy) * 60 + 9.81);
        vy = v;
        cy = c;
      }
      const result = { id, peak, peakCargo, integrity: sim.cargo.integrity };
      sim.dispose();
      return result;
    });
    expect(mild[1]!.peakCargo).toBeLessThan(mild[0]!.peakCargo);
    expect(mild[2]!.peakCargo).toBeGreaterThan(mild[0]!.peakCargo);
  });

  it('applies tire grip only to wheels, never to a sliding chassis or cargo', () => {
    const sim = new Simulation(
      { ...flat, surfaces: [{ from: -100, to: 1000, type: 'wet-asphalt' }] },
      setupWith('allweather_tires'),
    );
    const origin = sim.vehicle.chassis.getPosition().clone();
    for (const body of [sim.vehicle.chassis, ...sim.vehicle.wheels, sim.cargo.body]) {
      const p = body.getPosition();
      body.setTransform(Vec2(3 - (p.x - origin.x), 0.85 - (p.y - origin.y)), Math.PI);
    }
    run(sim, 0.6);
    let checked = 0;
    for (const body of [sim.vehicle.chassis, sim.cargo.body])
      for (let edge = body.getContactList(); edge; edge = edge.next) {
        if (
          !edge.other ||
          edge.other.getType() !== 'static' ||
          !edge.contact.isTouching() ||
          !edge.contact.isEnabled()
        )
          continue;
        const a = edge.contact.getFixtureA(),
          b = edge.contact.getFixtureB(),
          own = a.getBody() === body ? a : b;
        expect(edge.contact.getFriction()).toBeCloseTo(Math.sqrt(0.24 * own.getFriction()), 12);
        checked++;
      }
    expect(checked).toBeGreaterThan(0);
    sim.dispose();
  });

  it('retains setup and food temperature when rebuilding actors at a checkpoint', () => {
    const setup = setupWith('reinforced_mount');
    setup.vehicleId = 'tyagach_80';
    setup.paint = 'mint';
    const level: LevelData = {
      ...flat,
      cargo: 'hot-meal',
      checkpoint: { x: 3, y: 1.15, radius: 2 },
      temperature: {
        initial: 92,
        ambient: 18,
        coolingPerSecond: 0.24,
        minimum: 50,
        silver: 68,
        gold: 75,
      },
    };
    const sim = new Simulation(level, setup);
    run(sim, 2);
    const origin = sim.vehicle.chassis.getPosition().clone();
    for (const body of [sim.vehicle.chassis, ...sim.vehicle.wheels, sim.cargo.body]) {
      const p = body.getPosition();
      body.setTransform(Vec2(3 - (p.x - origin.x), 0.85 - (p.y - origin.y)), Math.PI);
    }
    run(sim, 3);
    expect(sim.checkpointAvailable).toBe(true);
    const heat = sim.temperature,
      config = sim.vehicle.config;
    expect(sim.continueFromCheckpoint()).toBe(true);
    expect(sim.setup).toEqual(setup);
    expect(sim.vehicle.config).toEqual(config);
    expect(sim.temperature).toBe(heat);
    expect(sim.cargo.body.getMass()).toBeCloseTo(2.7);
    sim.dispose();
  });

  it('keeps skill effects controlled and changes the cargo joint only in a correct landing window', () => {
    const normal = new Simulation(flat),
      setup = defaultVehicleSetup();
    setup.skills = ['soft_landing', 'balance_sense'];
    const skilled = new Simulation(flat, setup);
    expect(skilled.vehicle.config.leanTorque).toBeCloseTo(normal.vehicle.config.leanTorque * 1.05);
    run(normal, 2);
    run(skilled, 2);
    expect(skilled.cleanLandings).toBe(0);
    expect(skilled.cargo.mount.getFrequency()).toBe(5);
    expect(skilled.vehicle.chassis.getAngle()).toBeCloseTo(normal.vehicle.chassis.getAngle(), 12);
    skilled.cargo.afterStep(1 / 60, skilled.vehicle.motion, true);
    expect(skilled.cargo.mount.getFrequency()).toBeCloseTo(4.75);
    expect(skilled.cargo.mount.getDampingRatio()).toBeCloseTo(0.84);
    skilled.cargo.afterStep(1 / 60, skilled.vehicle.motion, false);
    expect(skilled.cargo.mount.getFrequency()).toBe(5);
    const exposed = skilled.setup;
    exposed.parts.engine = 'speed_engine';
    expect(skilled.setup.parts.engine).toBe('standard_engine');
    normal.dispose();
    skilled.dispose();
  });
});
