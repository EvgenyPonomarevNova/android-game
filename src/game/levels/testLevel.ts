export interface LevelData {
  id: string;
  name: string;
  start: { x: number; y: number };
  finish: { x: number; y: number; width: number };
  ground: Array<readonly [number, number]>;
  obstacles: Array<{ x: number; y: number; width: number; height: number }>;
  cargo: 'coffee';
  difficulty: { targetSeconds: number; minimumIntegrity: number };
}

export const testLevel: LevelData = {
  id: 'test-yard',
  name: 'Первый кофе',
  start: { x: 3, y: 1.15 },
  finish: { x: 65, y: 0, width: 3 },
  ground: [
    [-15, 0],
    [12, 0],
    [19, 2],
    [25, 2],
    [28, 1.5],
    [29, 1.8],
    [30, 1.5],
    [36, 1.5],
    [40, 3.3],
    [42, 3.3],
    [45, 0],
    [80, 0],
  ],
  obstacles: [{ x: 52, y: 0.12, width: 0.8, height: 0.24 }],
  cargo: 'coffee',
  difficulty: { targetSeconds: 40, minimumIntegrity: 30 },
};

export function validateLevel(level: LevelData): LevelData {
  if (!level.id || !level.name || level.ground.length < 2 || level.cargo !== 'coffee')
    throw new Error('Invalid level identity, terrain or cargo');
  const numbers = [
    level.start.x,
    level.start.y,
    level.finish.x,
    level.finish.y,
    level.finish.width,
    level.difficulty.targetSeconds,
    level.difficulty.minimumIntegrity,
    ...level.ground.flat(),
    ...level.obstacles.flatMap((o) => [o.x, o.y, o.width, o.height]),
  ];
  if (!numbers.every(Number.isFinite)) throw new Error('Level contains non-finite data');
  if (
    level.finish.width <= 0 ||
    level.difficulty.targetSeconds <= 0 ||
    level.difficulty.minimumIntegrity < 0 ||
    level.difficulty.minimumIntegrity > 100 ||
    level.obstacles.some((o) => o.width <= 0 || o.height <= 0)
  )
    throw new Error('Invalid level dimensions');
  for (let i = 1; i < level.ground.length; i++) {
    if (level.ground[i]![0] <= level.ground[i - 1]![0])
      throw new Error('Ground must progress along X');
  }
  return level;
}
