import { Scene } from 'phaser';
import type { GameBridge } from '../core/GameBridge';
import { queueAssets } from '../rendering/AssetLoader';

export class Boot extends Scene {
  constructor(private bridge: GameBridge) {
    super('Boot');
  }
  preload(): void {
    queueAssets(this, {}, (key) => this.bridge.emit('error', `Не найден ресурс: ${key}`));
  }
  create(): void {
    this.scene.start('MainMenu');
    this.bridge.emit('ready', undefined);
  }
}
