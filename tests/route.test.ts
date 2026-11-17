import { expect, it } from 'vitest';
import { Simulation } from '../src/game/core/Simulation';

it('can traverse the declared slope, bump and ramp and deliver coffee', () => {
  const sim = new Simulation();
  let maxX = 0,
    maxY = 0;
  const samples: string[] = [];
  for (let i = 0; i < 60 * 24 && !sim.finished; i++) {
    sim.advance(1 / 60, { throttle: true, brake: false, lean: 0 });
    const p = sim.vehicle.chassis.getPosition();
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
    if (i % 120 === 0)
      samples.push(
        `${i / 60}s: x=${p.x.toFixed(1)}, y=${p.y.toFixed(1)}, angle=${sim.vehicle.chassis.getAngle().toFixed(1)}, coffee=${sim.cargo.integrity.toFixed(0)}`,
      );
  }
  const evidence = samples.join('\n');
  expect(maxY, evidence).toBeGreaterThan(3.7);
  expect(maxX, evidence).toBeGreaterThan(65);
  expect(sim.finished, evidence).toBe(true);
  expect(sim.cargo.delivery).toBe('delivered');
  sim.dispose();
});
