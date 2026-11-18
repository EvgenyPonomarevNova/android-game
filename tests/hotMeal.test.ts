import { expect, it } from 'vitest';
import { Simulation } from '../src/game/core/Simulation';
import { hotMealLevel } from '../src/game/levels/hotMealLevel';
import { validateLevel, testLevel, type LevelData } from '../src/game/levels/testLevel';
import { defaultVehicleSetup } from '../src/shared/Progression';

const idle = { throttle: false, brake: false, lean: 0 };

// Fixed 60 Hz ticks. G = gas, B = brake, < = +1 (A/back), > = -1 (D/forward), . = release.
// Commands are held for at least 0.5 s, with no state-aware controller.
export const HOT_MEAL_REPLAYS = {
  safe: [
    [0, '.'],
    [30, 'G'],
    [120, '.'],
    [480, 'B'],
    [540, '.'],
    [720, 'G'],
    [840, '.'],
    [900, 'G'],
    [960, 'B'],
    [990, 'B<'],
    [1050, '.'],
    [1140, 'G'],
    [1230, '.'],
    [1260, 'B'],
    [1320, 'G'],
    [1350, '.'],
    [1500, 'G'],
    [1560, '.'],
    [1650, 'G'],
    [1710, 'B'],
    [1770, '<'],
    [1800, 'B'],
    [1860, 'G'],
    [1890, '.'],
    [2250, 'G'],
    [2370, 'G<'],
    [2400, 'B<'],
    [2520, '.'],
    [2580, 'G'],
    [2610, '.'],
    [2760, 'G'],
    [2850, '.'],
    [2910, 'G'],
    [3030, '.'],
    [3060, 'B'],
    [3090, '.'],
    [3210, 'B'],
    [3270, '.'],
    [3300, 'G'],
    [3420, '.'],
    [3540, 'B<'],
    [3570, 'B'],
    [3600, '.'],
    [3630, 'G'],
    [3750, '.'],
    [3780, 'B'],
    [3810, 'G'],
    [3900, 'B'],
    [3960, 'G'],
    [4020, 'B'],
    [4080, '.'],
    [4170, 'G'],
    [4230, '.'],
    [4260, 'G'],
    [4440, '.'],
    [4470, '<'],
    [4500, 'B<'],
    [4530, 'B'],
    [4590, '.'],
    [4620, 'G'],
    [4710, '.'],
    [4800, '<'],
    [4830, 'B<'],
    [4860, 'B'],
    [4920, 'G'],
    [5010, '.'],
  ],
  fast: [
    [0, '.'],
    [30, 'G'],
    [150, '.'],
    [390, 'B'],
    [480, 'G'],
    [510, '.'],
    [570, 'G'],
    [690, '.'],
    [750, 'B<'],
    [780, 'B'],
    [810, '.'],
    [840, 'G'],
    [900, '.'],
    [1080, 'G'],
    [1110, '.'],
    [1140, 'G'],
    [1200, '.'],
    [1290, '<'],
    [1320, 'B'],
    [1380, '.'],
    [1500, 'G'],
    [1590, '.'],
    [1620, 'G'],
    [1650, 'G>'],
    [1680, 'G'],
    [1830, '<'],
    [1860, '.'],
    [1890, 'G'],
    [1950, '.'],
    [2100, 'B'],
    [2130, 'B<'],
    [2160, 'B'],
    [2190, '.'],
    [2220, 'G'],
    [2310, 'B'],
    [2340, 'B<'],
    [2370, 'B'],
    [2400, 'G'],
    [2490, 'G<'],
    [2520, 'B'],
    [2550, 'G'],
    [2580, '<'],
    [2610, 'B'],
    [2640, '.'],
    [2670, 'G'],
    [2700, '.'],
    [2730, 'B'],
    [2790, 'G'],
    [2880, '.'],
    [2910, 'G'],
    [3000, '.'],
    [3030, '<'],
    [3060, 'B'],
    [3120, 'G'],
    [3180, '.'],
    [3300, '<'],
    [3330, 'B'],
    [3390, 'G'],
    [3480, '.'],
  ],
  allweather: [
    [0, '.'],
    [30, 'G'],
    [150, '.'],
    [390, 'B'],
    [450, '.'],
    [570, 'G'],
    [720, 'B'],
    [750, '.'],
    [780, '<'],
    [810, 'B'],
    [870, 'G'],
    [960, 'B'],
    [990, '.'],
    [1050, 'G'],
    [1110, 'B'],
    [1140, '.'],
    [1170, 'G'],
    [1230, '.'],
    [1260, 'G'],
    [1320, 'B'],
    [1350, 'B<'],
    [1380, 'B'],
    [1410, 'G'],
    [1440, '.'],
    [1530, 'G'],
    [1680, '>'],
    [1710, 'G'],
    [1740, '>'],
    [1770, 'G'],
    [1830, '<'],
    [1860, 'G'],
    [1950, 'B'],
    [1980, '.'],
    [2070, 'B'],
    [2190, 'G'],
    [2250, '.'],
    [2280, 'G'],
    [2340, '.'],
    [2370, '<'],
    [2400, 'B'],
    [2460, 'G'],
    [2580, 'B'],
    [2610, 'G'],
    [2670, 'G<'],
    [2700, 'B'],
    [2760, '.'],
    [2910, 'G'],
    [3090, 'B'],
    [3120, '<'],
    [3150, 'B'],
    [3180, '.'],
    [3210, 'G'],
    [3270, '.'],
    [3390, '<'],
    [3420, 'B'],
    [3480, 'G'],
    [3570, '.'],
  ],
} as const;
type ReplayName = keyof typeof HOT_MEAL_REPLAYS;
function ride(name: ReplayName, fps = 60) {
  const setup = defaultVehicleSetup();
  if (name === 'allweather') setup.parts.tires = 'allweather_tires';
  const sim = new Simulation(hotMealLevel, setup),
    tape = HOT_MEAL_REPLAYS[name];
  let cursor = 0;
  for (let frame = 0; frame < 180 * fps && !sim.finished; frame++) {
    const tick = Math.floor((frame * 60) / fps);
    while (cursor + 1 < tape.length && tape[cursor + 1]![0] <= tick) cursor++;
    const command = tape[cursor]![1];
    sim.advance(1 / fps, {
      throttle: command.includes('G'),
      brake: command.includes('B'),
      lean: command.includes('<') ? 1 : command.includes('>') ? -1 : 0,
    });
  }
  const result = {
    outcome: sim.outcome,
    seconds: sim.elapsed,
    integrity: sim.cargo.integrity,
    components: sim.cargo.components,
    temperature: sim.temperature!,
    route: sim.routeChoice,
    cleanLandings: sim.cleanLandings,
    balancedSections: sim.balancedSections,
    setup: sim.setup,
  };
  sim.dispose();
  return result;
}

it('delivers a cautious, advanced and free-tire run with ordinary held inputs', () => {
  for (const tape of Object.values(HOT_MEAL_REPLAYS))
    for (let i = 1; i < tape.length; i++)
      expect(tape[i]![0] - tape[i - 1]![0]).toBeGreaterThanOrEqual(30);
  const safe = ride('safe'),
    fast = ride('fast'),
    gift = ride('allweather');
  for (const result of [safe, fast, gift]) {
    expect(result.outcome).toEqual({ success: true, reason: 'delivered' });
    expect(result.integrity).toBeGreaterThanOrEqual(90);
    expect(result.setup.skills).toEqual([]);
    expect(result.balancedSections).toBeGreaterThan(0);
  }
  expect(safe.route).toBe('safe');
  expect(safe.seconds).toBeGreaterThanOrEqual(90);
  expect(safe.seconds).toBeLessThan(150);
  expect(safe.integrity).toBe(100);
  expect(safe.temperature).toBeGreaterThanOrEqual(hotMealLevel.temperature!.silver);
  expect(safe.temperature).toBeLessThan(hotMealLevel.temperature!.gold);
  expect(fast.route).toBe('risky');
  expect(fast.seconds).toBeLessThan(hotMealLevel.difficulty.targetSeconds);
  expect(fast.integrity).toBeLessThan(safe.integrity);
  expect(fast.temperature).toBeGreaterThanOrEqual(hotMealLevel.temperature!.gold);
  expect(fast.cleanLandings).toBeGreaterThan(0);
  expect(gift.route).toBe('risky');
  expect(gift.setup.parts.tires).toBe('allweather_tires');
  expect(gift.seconds).toBeLessThan(hotMealLevel.difficulty.targetSeconds);
  expect(gift.temperature).toBeGreaterThanOrEqual(hotMealLevel.temperature!.gold);
  expect(gift.cleanLandings).toBeGreaterThan(0);
});

it('replays fixed-step physics consistently at 30, 60 and 120 render frames per second', () => {
  const reference = ride('fast');
  expect(ride('fast', 30)).toEqual(reference);
  expect(ride('fast', 120)).toEqual(reference);
});

it('rejects a continuous-gas run through the physical obstacles', () => {
  const sim = new Simulation(hotMealLevel);
  for (let tick = 0; tick < 180 * 60 && !sim.finished; tick++)
    sim.advance(1 / 60, { throttle: true, brake: false, lean: 0 });
  expect(sim.outcome).toEqual({ success: false, reason: 'cargo-rejected' });
  expect(sim.cargo.integrity).toBeLessThan(hotMealLevel.difficulty.minimumIntegrity);
  sim.dispose();
});

it('validates temperature data, stays legacy-compatible, and cools only with game time', () => {
  expect(validateLevel(hotMealLevel)).toBe(hotMealLevel);
  expect(validateLevel(testLevel).temperature).toBeUndefined();
  const flat: LevelData = {
    ...hotMealLevel,
    ground: [
      [-100, 0],
      [1000, 0],
    ],
    finish: { x: 900, y: 0, width: 3 },
    sections: undefined,
    platforms: [],
    fork: undefined,
    checkpoint: undefined,
    surfaces: undefined,
    difficulty: { targetSeconds: 5, silverSeconds: 8, deadlineSeconds: 20, minimumIntegrity: 50 },
    temperature: {
      initial: 80,
      ambient: 20,
      coolingPerSecond: 2,
      minimum: 60,
      silver: 70,
      gold: 75,
    },
  };
  const sim = new Simulation(flat);
  for (let i = 0; i < 120; i++) sim.advance(1 / 60, idle);
  expect(sim.temperature).toBeCloseTo(76);
  sim.physics.setPaused(true);
  sim.advance(10, idle);
  expect(sim.temperature).toBeCloseTo(76);
  sim.physics.setPaused(false);
  for (let i = 0; i < 600 && !sim.finished; i++) sim.advance(1 / 60, idle);
  expect(sim.outcome).toEqual({ success: false, reason: 'cold' });
  sim.dispose();
  const setup = defaultVehicleSetup();
  setup.parts.cargo_mount = 'reinforced_mount';
  const warm = new Simulation(flat, setup);
  for (let i = 0; i < 612; i++) warm.advance(1 / 60, idle);
  expect(warm.outcome).toBeNull();
  expect(warm.temperature!).toBeGreaterThan(60);
  warm.dispose();
  for (const temperature of [
    undefined,
    { ...flat.temperature!, gold: Infinity },
    { ...flat.temperature!, minimum: 90 },
    { ...flat.temperature!, coolingPerSecond: 0 },
  ])
    expect(() => validateLevel({ ...flat, temperature })).toThrow();
});
