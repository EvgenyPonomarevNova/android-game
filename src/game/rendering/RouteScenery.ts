import type { Scene, GameObjects } from 'phaser';
import { PHYSICS, RACE_RULES } from '../../config/game';
import type { LevelData } from '../levels/testLevel';
import { groundHeight, routeSections } from './routePresentation';

/** Background props have no collision role; all danger markings use real level geometry. */
export interface RouteSceneryView {
  setCheckpoint(used: boolean, available: boolean): void;
}
export function drawRouteScenery(scene: Scene, level: LevelData): RouteSceneryView {
  const scale = PHYSICS.pixelsPerMeter;
  const scenery = scene.add.graphics().setDepth(-18);
  const signs = scene.add.graphics().setDepth(-7);
  const sections = routeSections(level);
  sections.forEach((section, i) => {
    const end = sections[i + 1]?.x ?? level.finish.x;
    const x = section.x * scale;
    const y = -groundHeight(level, section.x) * scale;
    if (i > 0 && (!level.checkpoint || Math.abs(section.x - level.checkpoint.x) > 2)) {
      signs.lineStyle(3, 0x596478).lineBetween(x, y, x, y - 170);
      scene.add
        .text(x + 12, y - 180, `${String(i + 1).padStart(2, '0')}  ${section.title}`, {
          fontFamily: 'Onest Variable, sans-serif',
          fontSize: '21px',
          fontStyle: 'bold',
          color: '#192437',
          backgroundColor: '#fff7e8',
          padding: { x: 12, y: 7 },
        })
        .setDepth(-7);
    }
    // A quiet courtyard detail between section markers, behind the road plane.
    const px = (section.x + (end - section.x) * 0.55) * scale;
    const py = -groundHeight(level, px / scale) * scale;
    const key = i % 3 === 0 ? 'yard-bench' : i % 3 === 1 ? 'yard-yard-fence' : 'yard-street-lamp';
    const prop = scene.add
      .image(px, py + 8, key)
      .setOrigin(0.5, 1)
      .setDepth(-17);
    prop.setScale((i % 3 === 2 ? 165 : 78) / prop.height).setAlpha(0.8);
    if (i % 2 === 1) {
      // Low garage silhouettes use the ArtKit's concrete palette and stay behind gameplay.
      scenery.fillStyle(0x9aa7a8).fillRect(px + 110, py - 105, 150, 120);
      scenery.fillStyle(0x6d7b8f).fillRect(px + 124, py - 88, 122, 103);
      scenery.lineStyle(2, 0x8996a3);
      for (let row = 0; row < 5; row++)
        scenery.lineBetween(px + 125, py - 75 + row * 18, px + 245, py - 75 + row * 18);
    }
  });
  // Highlight the flat run-out of an actual descent. These strokes add no physics.
  for (let i = 1; i < level.ground.length - 1; i++) {
    const a = level.ground[i - 1]!,
      b = level.ground[i]!,
      c = level.ground[i + 1]!;
    const incoming = (b[1] - a[1]) / (b[0] - a[0]);
    const outgoing = (c[1] - b[1]) / (c[0] - b[0]);
    if (b[1] <= RACE_RULES.minWorldY + 2 || incoming >= -0.3 || Math.abs(outgoing) > 0.15) continue;
    const end = Math.min(b[0] + 3, c[0]);
    signs
      .lineStyle(4, 0x86d0b1)
      .lineBetween(
        b[0] * scale,
        -b[1] * scale - 2,
        end * scale,
        -groundHeight(level, end) * scale - 2,
      );
  }
  // A deep trench is a real hazard, not a decorative depression: mark both physical lips.
  for (let i = 1; i < level.ground.length; i++) {
    const a = level.ground[i - 1]!,
      b = level.ground[i]!;
    if (a[1] <= RACE_RULES.minWorldY + 2 || b[1] > RACE_RULES.minWorldY + 2) continue;
    const x = a[0] * scale,
      y = -a[1] * scale;
    signs.lineStyle(4, 0xffd12b).lineBetween(x - 65, y - 3, x, y - 3);
    signs.fillStyle(0xffd12b).fillTriangle(x - 25, y - 54, x + 5, y - 54, x - 10, y - 85);
    signs.lineStyle(3, 0x192437).strokeTriangle(x - 25, y - 54, x + 5, y - 54, x - 10, y - 85);
    const exit = level.ground.slice(i + 1).find((point) => point[1] > RACE_RULES.minWorldY + 2);
    if (exit) {
      const end = exit[0] + 2;
      signs
        .lineStyle(5, 0x86d0b1)
        .lineBetween(
          exit[0] * scale,
          -exit[1] * scale - 2,
          end * scale,
          -groundHeight(level, end) * scale - 2,
        );
      const arrow = scene.add
        .image(exit[0] * scale + 45, -exit[1] * scale - 110, 'yard-arrow-sign')
        .setOrigin(0.5, 1)
        .setDepth(-7);
      arrow.setScale(72 / arrow.height);
    }
  }
  const platforms = (level.platforms ?? [])
    .slice()
    .sort((a, b) => a.points[0]![0] - b.points[0]![0]);
  const deck = scene.add.graphics().setDepth(-5);
  platforms.forEach((platform, index) => {
    const points = platform.points;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]!,
        b = points[i]!;
      const dx = (b[0] - a[0]) * scale,
        dy = -(b[1] - a[1]) * scale;
      scene.add
        .tileSprite(
          a[0] * scale,
          -a[1] * scale,
          Math.hypot(dx, dy),
          17,
          platform.surface === 'gravel' ? 'gravel' : 'road',
        )
        .setOrigin(0)
        .setRotation(Math.atan2(dy, dx))
        .setDepth(-6);
      deck
        .lineStyle(3, 0xfff7e8)
        .lineBetween(a[0] * scale, -a[1] * scale, b[0] * scale, -b[1] * scale);
    }
    const first = points[0]!,
      last = points[points.length - 1]!;
    if (platforms[index + 1] && platforms[index + 1]!.points[0]![0] - last[0] > 1)
      deck
        .lineStyle(5, 0xffd12b)
        .lineBetween(
          last[0] * scale - 36,
          -last[1] * scale - 2,
          last[0] * scale,
          -last[1] * scale - 2,
        );
    if (index > 0)
      deck
        .lineStyle(5, 0x86d0b1)
        .lineBetween(
          first[0] * scale,
          -first[1] * scale - 2,
          points[1]![0] * scale,
          -points[1]![1] * scale - 2,
        );
  });
  if (level.fork) {
    const x = (level.fork.fromX - 3) * scale;
    const y = -groundHeight(level, level.fork.fromX - 3) * scale;
    signs.lineStyle(3, 0x596478).lineBetween(x, y, x, y - 165);
    scene.add
      .text(x - 30, y - 175, 'ВЕРХ: ПРЫЖОК\nНИЗ: ОБЪЕЗД', {
        fontFamily: 'Onest Variable, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffd12b',
        backgroundColor: '#192437',
        padding: { x: 12, y: 9 },
        lineSpacing: 5,
      })
      .setDepth(-4);
  }
  let checkpointLabel: GameObjects.Text | undefined;
  if (level.checkpoint) {
    const x = level.checkpoint.x * scale;
    const y = -groundHeight(level, level.checkpoint.x) * scale;
    signs.lineStyle(4, 0x36a6ed).lineBetween(x, y, x, y - 155);
    signs.fillStyle(0x36a6ed).fillTriangle(x, y - 155, x + 44, y - 141, x, y - 127);
    checkpointLabel = scene.add
      .text(x + 12, y - 186, 'КОНТРОЛЬНАЯ ТОЧКА', {
        fontFamily: 'Onest Variable, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#fff7e8',
        backgroundColor: '#192437',
        padding: { x: 11, y: 7 },
      })
      .setDepth(-4);
  }
  let previousCheckpointState = '';
  return {
    setCheckpoint(used, available) {
      const state = used
        ? 'КОНТРОЛЬНАЯ ТОЧКА · ИСПОЛЬЗОВАНА'
        : available
          ? 'КОНТРОЛЬНАЯ ТОЧКА · МОЖНО ПРОДОЛЖИТЬ'
          : 'КОНТРОЛЬНАЯ ТОЧКА';
      if (checkpointLabel && state !== previousCheckpointState) {
        checkpointLabel
          .setText(state)
          .setColor(used ? '#aebfd3' : available ? '#ffd12b' : '#fff7e8');
        previousCheckpointState = state;
      }
    },
  };
}
