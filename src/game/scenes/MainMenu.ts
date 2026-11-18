import { Scene } from 'phaser';
import { YardBackdrop } from '../rendering/YardBackdrop';

export class MainMenu extends Scene {
  constructor() {
    super('MainMenu');
  }
  create(): void {
    const redraw = () => {
      this.children.removeAll(true);
      const { width, height } = this.scale;
      new YardBackdrop(this, 0.85);
      const roadY = height * 0.8;
      this.add
        .graphics()
        .fillStyle(0x424c60)
        .fillRect(0, roadY, width, height - roadY);
      this.add.tileSprite(0, roadY, width, height - roadY, 'road').setOrigin(0);
      // React composes the same ArtKit parts from the current saved setup.
    };
    redraw();
    this.scale.on('resize', redraw);
    this.events.once('shutdown', () => this.scale.off('resize', redraw));
  }
}
