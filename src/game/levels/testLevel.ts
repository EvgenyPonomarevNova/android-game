export const SURFACES = {
  asphalt: { friction: 1 },
  gravel: { friction: 0.35 },
  'wet-asphalt': { friction: 0.24 },
} as const;
export type SurfaceType = keyof typeof SURFACES;
export interface SurfaceRange {
  from: number;
  to: number;
  type: SurfaceType;
}

export interface LevelPlatform {
  id: string;
  points: Array<readonly [number, number]>;
  surface: SurfaceType;
  oneWay?: boolean;
}

export interface LevelData {
  id: string;
  name: string;
  start: { x: number; y: number };
  finish: { x: number; y: number; width: number };
  ground: Array<readonly [number, number]>;
  obstacles: Array<{ x: number; y: number; width: number; height: number }>;
  cargo: 'coffee' | 'surprise' | 'hot-meal';
  theme?: 'day' | 'rain-evening';
  temperature?: {
    initial: number;
    ambient: number;
    coolingPerSecond: number;
    minimum: number;
    silver: number;
    gold: number;
  };
  platforms?: LevelPlatform[];
  fork?: { fromX: number; toX: number; decisionX: number; riskyMinY: number };
  checkpoint?: { x: number; y: number; radius: number };
  /** Sorted, non-overlapping X ranges [from, to), in metres. Gaps are asphalt. */
  surfaces?: SurfaceRange[];
  /** Teaching signs only; never physics or input requirements. X is in metres. */
  sections?: Array<{ x: number; title: string; hint: string }>;
  difficulty: {
    targetSeconds: number;
    minimumIntegrity: number;
    deadlineSeconds?: number;
    silverSeconds?: number;
  };
}

export const testLevel: LevelData = {
  id: 'contract_001_surprise_fifth',
  name: 'Сюрприз на пятом',
  start: { x: 3, y: 1.15 },
  finish: { x: 216, y: 0, width: 4 },
  ground: [
    [-15, 0],
    [12, 0],
    [14, 0],
    [19, 3],
    [23, 3],
    [25, 1.5],
    [27, 1.5],
    [30, 2.2],
    [35, 0.5],
    [42, 0.5],
    [45, 0.5],
    [53, 2.5],
    [57, 2.5],
    [57.7, 2.8],
    [60, 2.8],
    [60.7, 3.1],
    [63, 3.1],
    [63.7, 3.4],
    [66, 3.4],
    [68, 1],
    [73, 0.5],
    [78, 0.5],
    [82, 2.3],
    [85, 0.5],
    [87, 0],
    [90, -1],
    [94, -2.5],
    [97, -2.5],
    [99, -2.2],
    [101, -2.5],
    [108, -2.5],
    [122, 1.3],
    [126, 0.5],
    [130, 0.5],
    [134, 2],
    [137, 1],
    [140, 2.4],
    [143, 0.8],
    [147, 1.9],
    [150, 0.5],
    [154, 1.6],
    [158, 0.5],
    [160, 0.5],
    [170, 3.5],
    [172, 3.5],
    [176, 0],
    [250, 0],
  ],
  obstacles: [],
  cargo: 'surprise',
  platforms: [
    {
      id: 'jump-ramp',
      points: [
        [85.5, 2.1],
        [90, 4.1],
        [95, 4.1],
      ],
      surface: 'asphalt',
      oneWay: true,
    },
    {
      id: 'jump-landing',
      points: [
        [99, 1.3],
        [108, 1.3],
        [122, 1.3],
      ],
      surface: 'asphalt',
      oneWay: true,
    },
  ],
  fork: { fromX: 82, toX: 122, decisionX: 90, riskyMinY: 1.8 },
  checkpoint: { x: 74, y: 1.65, radius: 3 },
  surfaces: [
    { from: -15, to: 42, type: 'asphalt' },
    { from: 42, to: 65, type: 'gravel' },
    { from: 65, to: 130, type: 'asphalt' },
    { from: 130, to: 160, type: 'gravel' },
    { from: 160, to: 250, type: 'asphalt' },
  ],
  sections: [
    {
      x: 3,
      title: 'Безопасный старт',
      hint: 'Газ — вперёд, тормоз — остановка. Наклон переносит вес.',
    },
    {
      x: 12,
      title: 'Крутой подъём',
      hint: 'Сохрани разгон. Наклонись вперёд, чтобы не опрокинуться назад.',
    },
    {
      x: 74,
      title: 'Перекрытый проезд',
      hint: 'Медленно — нижний объезд. С разгоном — верхняя рампа.',
    },
    { x: 110, title: 'Мостик и спуск', hint: 'Оба пути соединяются. Сохрани баланс на выходе.' },
    { x: 130, title: 'Последний рывок', hint: 'Притормози. Переноси вес на каждом переломе.' },
    { x: 200, title: 'Подъезд', hint: 'Последние метры. Довези заказ к празднику.' },
  ],
  difficulty: { targetSeconds: 48, silverSeconds: 65, deadlineSeconds: 180, minimumIntegrity: 50 },
};

export function validateLevel(value: unknown): LevelData {
  const fail = (message: string): never => {
    throw new Error(message);
  };
  const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  const text = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
  if (!value || typeof value !== 'object') return fail('Level must be an object');
  const level = value as LevelData;
  if (
    !text(level.id) ||
    !text(level.name) ||
    !['coffee', 'surprise', 'hot-meal'].includes(level.cargo)
  )
    return fail('Invalid level identity or cargo');
  const line = (points: unknown): points is Array<readonly [number, number]> => {
    if (!Array.isArray(points) || points.length < 2) return false;
    return points.every(
      (point, i) =>
        Array.isArray(point) &&
        point.length === 2 &&
        point.every(finite) &&
        (i === 0 || point[0]! > points[i - 1]![0]!),
    );
  };
  if (!line(level.ground)) return fail('Ground must contain finite points progressing along X');
  const left = level.ground[0]![0],
    right = level.ground[level.ground.length - 1]![0];
  const inside = (x: unknown): x is number => finite(x) && x >= left && x <= right;
  if (
    !level.start ||
    !inside(level.start.x) ||
    !finite(level.start.y) ||
    !level.finish ||
    !inside(level.finish.x) ||
    !finite(level.finish.y) ||
    !finite(level.finish.width) ||
    level.finish.width <= 0 ||
    level.finish.x + level.finish.width > right
  )
    return fail('Invalid start or finish bounds');
  const d = level.difficulty;
  if (
    !d ||
    !finite(d.targetSeconds) ||
    d.targetSeconds <= 0 ||
    !finite(d.minimumIntegrity) ||
    d.minimumIntegrity < 0 ||
    d.minimumIntegrity > 100 ||
    (d.deadlineSeconds !== undefined &&
      (!finite(d.deadlineSeconds) ||
        d.deadlineSeconds <= 0 ||
        d.deadlineSeconds < d.targetSeconds)) ||
    (d.silverSeconds !== undefined &&
      (!finite(d.silverSeconds) ||
        d.silverSeconds < d.targetSeconds ||
        (d.deadlineSeconds !== undefined && d.silverSeconds > d.deadlineSeconds)))
  )
    return fail('Invalid difficulty thresholds');
  if (
    !Array.isArray(level.obstacles) ||
    level.obstacles.some(
      (o) =>
        !o ||
        !inside(o.x) ||
        !finite(o.y) ||
        !finite(o.width) ||
        !finite(o.height) ||
        o.width <= 0 ||
        o.height <= 0 ||
        o.x - o.width / 2 < left ||
        o.x + o.width / 2 > right,
    )
  )
    return fail('Invalid obstacle bounds');
  if (level.surfaces !== undefined && !Array.isArray(level.surfaces))
    return fail('Invalid surfaces array');
  let previousEnd = left;
  for (const s of level.surfaces ?? []) {
    if (
      !s ||
      !inside(s.from) ||
      !inside(s.to) ||
      s.from < previousEnd ||
      s.to <= s.from ||
      !Object.prototype.hasOwnProperty.call(SURFACES, s.type)
    )
      return fail('Invalid surface range or type');
    previousEnd = s.to;
  }
  if (level.sections !== undefined && !Array.isArray(level.sections))
    return fail('Invalid sections array');
  let previousSection = -Infinity;
  for (const s of level.sections ?? []) {
    if (!s || !inside(s.x) || s.x <= previousSection || !text(s.title) || !text(s.hint))
      return fail('Invalid teaching section');
    previousSection = s.x;
  }
  if (level.platforms !== undefined && !Array.isArray(level.platforms))
    return fail('Invalid platforms array');
  const platformIds = new Set<string>();
  for (const p of level.platforms ?? []) {
    if (
      !p ||
      !text(p.id) ||
      platformIds.has(p.id) ||
      !line(p.points) ||
      !p.points.every(([x]) => inside(x)) ||
      !Object.prototype.hasOwnProperty.call(SURFACES, p.surface) ||
      (p.oneWay !== undefined && typeof p.oneWay !== 'boolean')
    )
      return fail('Invalid platform');
    platformIds.add(p.id);
  }
  const fork = level.fork;
  if (
    fork !== undefined &&
    (!fork ||
      !inside(fork.fromX) ||
      !inside(fork.toX) ||
      !inside(fork.decisionX) ||
      !(fork.fromX < fork.decisionX && fork.decisionX < fork.toX) ||
      !finite(fork.riskyMinY) ||
      !level.platforms?.length)
  )
    return fail('Invalid physical fork');
  const cp = level.checkpoint;
  if (
    cp !== undefined &&
    (!cp ||
      !inside(cp.x) ||
      !finite(cp.y) ||
      !finite(cp.radius) ||
      cp.radius <= 0 ||
      cp.x - cp.radius < left ||
      cp.x + cp.radius > right)
  )
    return fail('Invalid checkpoint bounds');
  if (level.theme !== undefined && !['day', 'rain-evening'].includes(level.theme))
    return fail('Invalid theme');
  const heat = level.temperature;
  if (level.cargo === 'hot-meal' && heat === undefined)
    return fail('Hot meal needs temperature rules');
  if (
    heat !== undefined &&
    (!heat ||
      ![
        heat.initial,
        heat.ambient,
        heat.coolingPerSecond,
        heat.minimum,
        heat.silver,
        heat.gold,
      ].every(finite) ||
      heat.coolingPerSecond <= 0 ||
      !(
        heat.ambient <= heat.minimum &&
        heat.minimum <= heat.silver &&
        heat.silver <= heat.gold &&
        heat.gold <= heat.initial
      ) ||
      heat.initial <= heat.ambient)
  )
    return fail('Invalid temperature rules');
  return level;
}

export function surfaceAt(level: LevelData, x: number): SurfaceType {
  return level.surfaces?.find((surface) => x >= surface.from && x < surface.to)?.type ?? 'asphalt';
}
