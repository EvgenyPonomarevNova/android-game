import type { LevelData } from '../levels/testLevel';

export interface RouteSection {
  x: number;
  title: string;
  hint: string;
}
type PresentedLevel = LevelData & { sections?: RouteSection[] };

/** Route metadata is shared by signs and HUD, without extending the event contract. */
export function routeSections(level: PresentedLevel): RouteSection[] {
  const sections = (level.sections ?? [])
    .filter((s) => Number.isFinite(s.x) && s.x >= level.start.x && s.x < level.finish.x)
    .slice()
    .sort((a, b) => a.x - b.x);
  if (!sections.length || sections[0]!.x > level.start.x)
    sections.unshift({
      x: level.start.x,
      title: 'Выезд',
      hint: 'Справа — газ и тормоз. Слева — наклон.',
    });
  return sections;
}

export function routeGuide(level: PresentedLevel, progress: number) {
  const sections = routeSections(level);
  const x = level.start.x + Math.max(0, Math.min(1, progress)) * (level.finish.x - level.start.x);
  let index = 0;
  for (let i = 1; i < sections.length; i++) if (x >= sections[i]!.x) index = i;
  const current = sections[index]!;
  const end = sections[index + 1]?.x ?? level.finish.x;
  return {
    sections,
    index,
    current,
    x,
    showHint: x - current.x < Math.min(12, (end - current.x) * 0.3),
  };
}

export function groundHeight(level: LevelData, x: number): number {
  const points = level.ground;
  if (x <= points[0]![0]) return points[0]![1];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!,
      b = points[i]!;
    if (x <= b[0]) return a[1] + (b[1] - a[1]) * ((x - a[0]) / (b[0] - a[0]));
  }
  return points[points.length - 1]![1];
}

/** Prefer an upper deck only when the vehicle is high enough to approach it. */
export function routeHeight(level: LevelData, x: number, vehicleY: number): number {
  let height = groundHeight(level, x);
  for (const platform of level.platforms ?? []) {
    if (x < platform.points[0]![0] || x > platform.points[platform.points.length - 1]![0]) continue;
    for (let i = 1; i < platform.points.length; i++) {
      const a = platform.points[i - 1]!,
        b = platform.points[i]!;
      if (x > b[0]) continue;
      const y = a[1] + (b[1] - a[1]) * ((x - a[0]) / (b[0] - a[0]));
      if (y <= vehicleY + 1.8) height = Math.max(height, y);
      break;
    }
  }
  return height;
}
