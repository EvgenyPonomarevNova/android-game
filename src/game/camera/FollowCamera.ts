import type { Cameras } from 'phaser';
import { CAMERA, PHYSICS } from '../../config/game';

export class FollowCamera {
  private initialized = false;
  private kick = 0;
  private kickTime = 0;
  private offsetX = 0;
  private offsetY = 0;
  private ahead = 0;
  constructor(
    private camera: Cameras.Scene2D.Camera,
    bounds?: { x: number; y: number; width: number; height: number },
  ) {
    const b = bounds ?? CAMERA.bounds;
    camera.setBounds(b.x, b.y, b.width, b.height);
  }
  impulse(strength: number): void {
    this.kick = Math.max(this.kick, Math.max(0, Math.min(1, strength)));
    this.kickTime = 0;
  }
  reset(): void {
    this.camera.setScroll(this.camera.scrollX - this.offsetX, this.camera.scrollY - this.offsetY);
    this.initialized = false;
    this.kick = this.kickTime = this.offsetX = this.offsetY = this.ahead = 0;
  }
  update(
    x: number,
    y: number,
    velocityX: number,
    delta: number,
    active = true,
    reduced = false,
    terrainY?: number,
    shakeScale = 1,
  ): void {
    if (!active) return;
    const c = this.camera;
    const ahead = Math.max(
      -CAMERA.maxLookAhead,
      Math.min(CAMERA.maxLookAhead, velocityX * CAMERA.lookAhead * PHYSICS.pixelsPerMeter),
    );
    this.ahead +=
      (ahead - this.ahead) * (this.initialized ? 1 - Math.exp(-3 * Math.min(delta, 0.1)) : 1);
    const targetX = x + this.ahead - (c.width / c.zoom) * 0.38;
    const visibleHeight = c.height / c.zoom;
    const terrainOffset =
      terrainY === undefined
        ? 0
        : Math.max(-visibleHeight * 0.18, Math.min(visibleHeight * 0.18, terrainY - y - 60)) * 0.45;
    const targetY = y + terrainOffset - visibleHeight * 0.55;
    const blend = this.initialized ? 1 - Math.exp(-CAMERA.response * Math.min(delta, 0.1)) : 1;
    // Remove the previous visual offset before following so an impulse never feeds back into scroll.
    const baseX = c.scrollX - this.offsetX;
    const baseY = c.scrollY - this.offsetY;
    this.kickTime += Math.min(delta, 0.05);
    this.kick = reduced ? 0 : Math.max(0, this.kick - Math.min(delta, 0.05) / 0.14);
    const amplitude = (2.5 * this.kick ** 2 * Math.max(0, Math.min(1, shakeScale))) / c.zoom;
    this.offsetX = Math.sin(this.kickTime * 62) * amplitude;
    this.offsetY = Math.sin(this.kickTime * 83) * amplitude * 0.65;
    c.setScroll(
      baseX + (targetX - baseX) * blend + this.offsetX,
      baseY + (targetY - baseY) * blend + this.offsetY,
    );
    this.initialized = true;
  }
}
