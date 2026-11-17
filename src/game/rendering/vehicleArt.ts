import type { Scene, GameObjects } from 'phaser';
import type { Body } from 'planck';
import { AABB, CircleShape, Transform } from 'planck';
import { SCOOTER } from '../../config/game';

/** ArtKit wheel axle anchors mapped to the actual configured wheel spacing/drop. */
export function scooterArt(scene: Scene): GameObjects.Container {
  const view = scene.add.container(0, 0);
  const scale = (SCOOTER.wheel.spacing * 2 * 60) / (535 - 170);
  const axleMidX = (170 + 535) / 2;
  const originY = 286 - (SCOOTER.wheel.drop * 60) / scale;
  const body = scene.add.sprite(0, 0, 'scooter');
  body.setOrigin(axleMidX / 700, originY / 318).setScale(scale);
  // Static cutout, not a sprite-sheet animation. Hip, hand and foot align with seat/handle/deck.
  const rider = scene.add.sprite(-14, -4, 'courier');
  rider.setOrigin(100 / 274, 235 / 361).setScale(0.33);
  view.add([rider, body]);
  return view;
}

export function wheelArt(scene: Scene, body: Body): GameObjects.Sprite {
  const shape = body.getFixtureList()?.getShape();
  const radius = shape instanceof CircleShape ? shape.getRadius() : SCOOTER.wheel.radius;
  return scene.add.sprite(0, 0, 'wheel').setDisplaySize(radius * 120, radius * 120);
}

export function coffeeArt(scene: Scene, body?: Body): GameObjects.Sprite {
  const shape = body?.getFixtureList()?.getShape();
  const bounds = new AABB();
  shape?.computeAABB(bounds, Transform.identity(), 0);
  // AABB includes the collision skin; remove it to recover the cup's local rectangle.
  const skin = shape ? shape.getRadius() * 2 : 0;
  const width = shape ? (bounds.upperBound.x - bounds.lowerBound.x - skin) * 60 : 21.6;
  const height = shape ? (bounds.upperBound.y - bounds.lowerBound.y - skin) * 60 : 30;
  // The cup (not its steam or ground shadow) corresponds to the cargo fixture.
  return scene.add
    .sprite(0, 0, 'coffee')
    .setOrigin(116 / 260, 151 / 280)
    .setScale(width / 139, height / 211);
}
