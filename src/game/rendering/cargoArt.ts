import { AABB, Transform, type Body } from 'planck';
import type { Scene } from 'phaser';

export const cargoAssets = ['cake', 'drinks'].map((key) => ({
  key,
  url: `${import.meta.env.BASE_URL}assets/cargo/${key}.png`,
}));

/** Two visual components in one physics cargo envelope, not two invented physical bodies. */
export function surpriseArt(scene: Scene, body?: Body) {
  const shape = body?.getFixtureList()?.getShape();
  const bounds = new AABB();
  shape?.computeAABB(bounds, Transform.identity(), 0);
  const skin = shape ? shape.getRadius() * 2 : 0;
  const width = shape ? (bounds.upperBound.x - bounds.lowerBound.x - skin) * 60 : 24;
  const height = shape ? (bounds.upperBound.y - bounds.lowerBound.y - skin) * 60 : 32;
  const cake = scene.add.sprite(0, height * 0.22, 'cake');
  cake.setScale(Math.min(width / cake.width, (height * 0.5) / cake.height));
  const drinks = scene.add.sprite(0, -height * 0.23, 'drinks');
  drinks.setScale(Math.min(width / drinks.width, (height * 0.5) / drinks.height));
  const view = scene.add.container(0, 0, [cake, drinks]);
  return { view, drinks };
}
