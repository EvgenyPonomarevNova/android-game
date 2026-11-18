import { testLevel, validateLevel, type LevelData } from '../levels/testLevel';

export interface LevelDocument {
  schemaVersion: 1;
  status: 'draft' | 'published';
  generation?: { seed: string; preset: 'courtyard' | 'trial'; sections: number; fork?: boolean };
  level: LevelData;
}
export interface GenerationOptions {
  id: string;
  title: string;
  seed: string;
  preset: 'courtyard' | 'trial';
  sections: number;
  fork?: boolean;
}
type Point = readonly [number, number];
interface SectionTemplate {
  id: string;
  title: string;
  hint: string;
  points: readonly Point[];
}
/** Bounded hand-authored modules. Randomness selects geometry, never run-time damage. */
export const SECTION_TEMPLATES: readonly SectionTemplate[] = [
  {
    id: 'hill',
    title: 'Гаражная горка',
    hint: 'На подъёме удерживай нос, перед спуском отпусти газ.',
    points: [
      [0, 0],
      [4, 0],
      [10, 2.8],
      [13, 3.2],
      [17, 1],
      [22, 0],
    ],
  },
  {
    id: 'curbs',
    title: 'Бордюры',
    hint: 'Короткие разгоны помогают подвеске пройти уступы.',
    points: [
      [0, 0],
      [4, 0],
      [4.6, 0.22],
      [7, 0.22],
      [7.6, 0.44],
      [10, 0.44],
      [10.6, 0.66],
      [14, 0.66],
      [18, 0],
      [22, 0],
    ],
  },
  {
    id: 'rollers',
    title: 'Волна двора',
    hint: 'Сбрасывай скорость перед вершиной.',
    points: [
      [0, 0],
      [4, 0.6],
      [8, 0],
      [12, 1],
      [16, 0],
      [20, 0.5],
      [24, 0],
    ],
  },
  {
    id: 'tabletop',
    title: 'Бетонный проезд',
    hint: 'Набери ход до подъёма и погаси вращение на выходе.',
    points: [
      [0, 0],
      [4, 0],
      [8, 1.8],
      [13, 1.8],
      [18, 0],
      [23, 0],
    ],
  },
];
function seeded(seed: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
const identifier = /^[a-z][a-z0-9_-]{2,63}$/;
export function generateLevel(options: GenerationOptions): LevelDocument {
  if (!identifier.test(options.id))
    throw new Error('ID: 3–64 латинских символа, цифры, _ или -, первая — буква.');
  if (!options.title.trim() || options.title.length > 100)
    throw new Error('Название должно содержать 1–100 символов.');
  if (!Number.isInteger(options.sections) || options.sections < 2 || options.sections > 10)
    throw new Error('Выбери от 2 до 10 секций.');
  if (!options.seed || options.seed.length > 100)
    throw new Error('Seed должен содержать 1–100 символов.');
  if (options.preset !== 'courtyard' && options.preset !== 'trial')
    throw new Error('Неизвестный шаблон.');
  const random = seeded(`${options.seed}:${options.preset}`);
  const ground: Point[] = [
    [-10, 0],
    [0, 0],
    [10, 0],
  ];
  const sections = [{ x: 3, title: 'Тихий двор', hint: 'Почувствуй газ, тормоз и наклон.' }];
  let x = 10;
  let fork: LevelData['fork'];
  let checkpoint: LevelData['checkpoint'];
  const platforms: NonNullable<LevelData['platforms']> = [];
  for (let i = 0; i < options.sections; i++) {
    if (options.fork && i === Math.floor(options.sections / 2)) {
      const sourceFork = testLevel.fork;
      if (!sourceFork) throw new Error('Шаблон развилки пока недоступен.');
      const before = testLevel.ground.filter((p) => p[0] <= sourceFork.fromX - 8);
      const start = before[before.length - 1];
      const end = testLevel.ground.find((p) => p[0] >= sourceFork.toX + 8);
      if (!start || !end)
        throw new Error('Шаблону развилки нужны площадки до входа и после выхода.');
      const offset = x - start[0];
      const rounded = (value: number) => Number(value.toFixed(3));
      const transform = ([px, py]: Point): Point => [rounded(px + offset), rounded(py - start[1])];
      sections.push({
        x,
        title: 'Объезд или прыжок',
        hint: 'Нижний путь надёжнее. Верхняя рампа требует разгона.',
      });
      for (const point of testLevel.ground.filter((p) => p[0] > start[0] && p[0] <= end[0]))
        ground.push(transform(point));
      for (const platform of testLevel.platforms ?? []) {
        if (
          platform.points[0]![0] >= start[0] &&
          platform.points[platform.points.length - 1]![0] <= end[0]
        )
          platforms.push({ ...platform, points: platform.points.map(transform) });
      }
      fork = {
        fromX: sourceFork.fromX + offset,
        toX: sourceFork.toX + offset,
        decisionX: sourceFork.decisionX + offset,
        riskyMinY: rounded(sourceFork.riskyMinY - start[1]),
      };
      if (testLevel.checkpoint)
        checkpoint = {
          ...testLevel.checkpoint,
          x: testLevel.checkpoint.x + offset,
          y: rounded(testLevel.checkpoint.y - start[1]),
        };
      x = end[0] + offset + 8;
      ground.push([x, 0]);
    }
    const template = SECTION_TEMPLATES[Math.floor(random() * SECTION_TEMPLATES.length)]!;
    const height = options.preset === 'courtyard' ? 0.65 : 1;
    sections.push({ x, title: template.title, hint: template.hint });
    for (const [dx, y] of template.points.slice(1))
      ground.push([Number((x + dx).toFixed(3)), Number((y * height).toFixed(3))]);
    x += template.points[template.points.length - 1]![0];
    x += 5;
    ground.push([x, 0]);
  }
  const finishX = x + 8;
  ground.push([finishX + 12, 0]);
  sections.push({ x, title: 'Подъезд', hint: 'Спокойно довези заказ до линии доставки.' });
  const targetSeconds = Math.ceil((finishX - 3) / 2.8);
  const level: LevelData = {
    id: options.id,
    name: options.title.trim(),
    start: { x: 3, y: 1.15 },
    finish: { x: finishX, y: 0, width: 4 },
    ground,
    obstacles: [],
    cargo: testLevel.cargo,
    sections,
    platforms,
    fork,
    checkpoint,
    surfaces: [{ from: -10, to: finishX + 12, type: 'asphalt' }],
    difficulty: {
      targetSeconds,
      minimumIntegrity: 50,
      silverSeconds: Math.ceil(targetSeconds * 1.4),
      deadlineSeconds: Math.max(180, Math.ceil(targetSeconds * 2.5)),
    },
  };
  validateLevel(level);
  return {
    schemaVersion: 1,
    status: 'draft',
    generation: {
      seed: options.seed,
      preset: options.preset,
      sections: options.sections,
      fork: options.fork ?? false,
    },
    level,
  };
}
export function parseLevelDocument(text: string): LevelDocument {
  if (text.length > 1_000_000) throw new Error('JSON слишком большой: максимум 1 МБ.');
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Нужен объект документа уровня.');
  const doc = value as Partial<LevelDocument>;
  if (
    doc.schemaVersion !== 1 ||
    (doc.status !== 'draft' && doc.status !== 'published') ||
    !doc.level
  )
    throw new Error('Нужны schemaVersion:1, status:draft/published и level.');
  if (!identifier.test(doc.level.id)) throw new Error('Некорректный ID уровня.');
  validateLevel(doc.level);
  const points = [
    ...doc.level.ground,
    ...(doc.level.platforms ?? []).flatMap((platform) => platform.points),
  ];
  if (
    points.length > 4000 ||
    (doc.level.obstacles?.length ?? 0) > 500 ||
    points.some(([x, y]) => Math.abs(x) > 20000 || Math.abs(y) > 250) ||
    doc.level.obstacles.some((obstacle) => Math.abs(obstacle.y) > 250 || obstacle.height > 250)
  )
    throw new Error('Лимит мастерской: 4000 точек, 500 блоков, X ±20 км и Y ±250 м.');
  return doc as LevelDocument;
}
export function serializeLevel(doc: LevelDocument): string {
  return JSON.stringify(doc, null, 2) + '\n';
}
export function levelBounds(level: LevelData) {
  const points = [
    ...level.ground,
    ...(level.platforms ?? []).flatMap((platform) => platform.points),
  ];
  return {
    from: Math.min(...points.map((p) => p[0])),
    to: Math.max(...points.map((p) => p[0])),
    low: Math.min(...points.map((p) => p[1])),
    high: Math.max(...points.map((p) => p[1])),
  };
}
