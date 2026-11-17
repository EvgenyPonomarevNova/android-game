import type { Cameras } from 'phaser';
import { CAMERA } from '../../config/game';

export class FollowCamera {
  private initialized = false;
  constructor(private camera: Cameras.Scene2D.Camera) {
    const b = CAMERA.bounds;
    camera.setBounds(b.x, b.y, b.width, b.height);
  }
  update(x: number, y: number, velocityX: number, delta: number): void {
    const c = this.camera;
    const ahead = Math.max(
      -CAMERA.maxLookAhead,
      Math.min(CAMERA.maxLookAhead, velocityX * CAMERA.lookAhead * 60),
    );
    const targetX = x + ahead - (c.width / c.zoom) * 0.38;
    const targetY = y - (c.height / c.zoom) * 0.57;
    const blend = this.initialized ? 1 - Math.exp(-CAMERA.response * Math.min(delta, 0.1)) : 1;
    c.setScroll(
      c.scrollX + (targetX - c.scrollX) * blend,
      c.scrollY + (targetY - c.scrollY) * blend,
    );
    this.initialized = true;
  }
}
