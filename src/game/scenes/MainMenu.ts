import { Scene } from 'phaser';
import { scooterArt } from '../rendering/vehicleArt';
import { YardBackdrop } from '../rendering/YardBackdrop';
import { SCOOTER } from '../../config/game';
import { surpriseArt } from '../rendering/cargoArt';

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
      const scooter = scooterArt(this);
      const radius = SCOOTER.wheel.radius * 60;
      for (const x of [-1, 1]) {
        scooter.add(
          this.add
            .sprite(x * SCOOTER.wheel.spacing * 60, SCOOTER.wheel.drop * 60, 'wheel')
            .setDisplaySize(radius * 2, radius * 2),
        );
      }
      scooter.add(surpriseArt(this).view.setPosition(-27, -27));
      const scale = Math.min(width / 420, height / 200) * 0.85;
      scooter
        .setPosition(width * 0.29, roadY - (SCOOTER.wheel.drop * 60 + radius) * scale)
        .setScale(scale);
    };
    redraw();
    this.scale.on('resize', redraw);
    this.events.once('shutdown', () => this.scale.off('resize', redraw));
  }
}
