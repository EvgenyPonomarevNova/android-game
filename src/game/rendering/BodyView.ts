import type { Body } from 'planck';
import type { GameObjects } from 'phaser';
import { PHYSICS } from '../../config/game';
import type { PhysicsWorld } from '../physics/PhysicsWorld';

export class BodyView {
  private pose = { x: 0, y: 0, angle: 0 };
  constructor(
    readonly body: Body,
    readonly view: GameObjects.Container | GameObjects.Graphics,
  ) {}
  sync(physics: PhysicsWorld): void {
    physics.pose(this.body, this.pose);
    this.view.setPosition(
      this.pose.x * PHYSICS.pixelsPerMeter,
      -this.pose.y * PHYSICS.pixelsPerMeter,
    );
    this.view.rotation = -this.pose.angle;
  }
}
