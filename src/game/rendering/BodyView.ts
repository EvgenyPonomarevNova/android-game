import type { Body } from 'planck';
import type { GameObjects } from 'phaser';
import { PHYSICS } from '../../config/game';
import type { PhysicsWorld } from '../physics/PhysicsWorld';

export class BodyView {
  private pose = { x: 0, y: 0, angle: 0 };
  constructor(
    readonly body: Body,
    readonly view: GameObjects.Container | GameObjects.Graphics,
  ) {
    // Temporary artwork is authored at 60 px/m; positions and sizes share the configured scale.
    const artworkScale = PHYSICS.pixelsPerMeter / 60;
    view.setScale(view.scaleX * artworkScale, view.scaleY * artworkScale);
  }
  sync(physics: PhysicsWorld): void {
    physics.pose(this.body, this.pose);
    this.view.setPosition(
      this.pose.x * PHYSICS.pixelsPerMeter,
      -this.pose.y * PHYSICS.pixelsPerMeter,
    );
    this.view.rotation = -this.pose.angle;
  }
}
