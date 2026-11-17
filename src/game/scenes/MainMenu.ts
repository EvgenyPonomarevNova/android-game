import { Scene } from 'phaser';
import { drawCity, drawScooter } from '../rendering/geometry';

export class MainMenu extends Scene {
  constructor() {
    super('MainMenu');
  }
  create(): void {
    const redraw = () => {
      this.children.removeAll(true);
      const { width, height } = this.scale;
      drawCity(this, width, height);
      const scooter = this.add.graphics();
      drawScooter(scooter);
      scooter.fillStyle(0x252a2a).fillCircle(-41, 27, 19).fillCircle(41, 27, 19);
      scooter.lineStyle(4, 0xf3efdf).strokeCircle(-41, 27, 10).strokeCircle(41, 27, 10);
      scooter.fillStyle(0xf9f4e6).fillRoundedRect(-44, -62, 23, 30, 3);
      scooter.fillStyle(0x252a2a).fillRect(-47, -66, 29, 7);
      scooter.setPosition(width * 0.75, height * 0.81).setScale(Math.max(1.4, height / 230));
    };
    redraw();
    this.scale.on('resize', redraw);
    this.events.once('shutdown', () => this.scale.off('resize', redraw));
  }
}
