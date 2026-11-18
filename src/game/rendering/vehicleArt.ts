import type { Scene, GameObjects } from 'phaser';
import type { Body } from 'planck';
import { AABB, CircleShape, Transform } from 'planck';
import { SCOOTER, type VehicleConfig } from '../../config/game';
import { defaultVehicleSetup, type VehicleSetup } from '../../shared/Progression';
import { equipmentStyle } from './equipmentStyle';
import { PAINTS } from '../../config/career';

/** ArtKit wheel axle anchors mapped to the actual configured wheel spacing/drop. */
export function scooterArt(
  scene: Scene,
  config: VehicleConfig = SCOOTER,
  setup: VehicleSetup = defaultVehicleSetup(),
): GameObjects.Container {
  const view = scene.add.container(0, 0);
  const scale = (config.wheel.spacing * 2 * 60) / (535 - 170);
  const axleMidX = (170 + 535) / 2;
  const originY = 286 - (config.wheel.drop * 60) / scale;
  const body = scene.add.sprite(0, 0, 'scooter');
  body.setOrigin(axleMidX / 700, originY / 318).setScale(scale);
  body.setTint(Number.parseInt(PAINTS[setup.paint ?? 'yellow'].color.slice(1), 16));
  if (!setup.paint || setup.paint === 'yellow') body.clearTint();
  // Static cutout, not a sprite-sheet animation. Hip, hand and foot align with seat/handle/deck.
  const rider = scene.add.sprite(-14, -4, 'courier');
  rider.setName('courier');
  rider.setOrigin(100 / 274, 235 / 361).setScale(0.33);
  view.add([rider, body]);
  const style = equipmentStyle(setup);
  const gear = scene.add.graphics();
  if (setup.vehicleId === 'tyagach_80') gear.fillStyle(0x294459).fillRoundedRect(-34, 12, 40, 8, 2);
  if (style.engine)
    gear.fillStyle(Number.parseInt(style.engine.slice(1), 16)).fillRoundedRect(-20, 9, 17, 6, 2);
  if (style.suspension)
    gear
      .lineStyle(2, Number.parseInt(style.suspension.slice(1), 16))
      .lineBetween(-41, 8, -35, 5)
      .lineBetween(-35, 5, -39, 2)
      .lineBetween(-39, 2, -33, -1);
  view.add(gear);
  return view;
}

export function wheelArt(
  scene: Scene,
  body: Body,
  setup: VehicleSetup = defaultVehicleSetup(),
): GameObjects.Sprite {
  const shape = body.getFixtureList()?.getShape();
  const radius = shape instanceof CircleShape ? shape.getRadius() : SCOOTER.wheel.radius;
  const wheel = scene.add.sprite(0, 0, 'wheel').setDisplaySize(radius * 120, radius * 120);
  if (setup.parts.tires === 'allweather_tires') wheel.setTint(0xb7d6e6);
  else if (setup.parts.tires === 'city_tires') wheel.setTint(0xffe5b2);
  return wheel;
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
