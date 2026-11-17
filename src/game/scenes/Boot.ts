import { Scene } from 'phaser';
import type { GameBridge } from '../core/GameBridge';
import { queueAssets } from '../rendering/AssetLoader';
import { artManifest } from '../../assets/artkit';

export class Boot extends Scene {
  constructor(private bridge: GameBridge) {
    super('Boot');
  }
  preload(): void {
    queueAssets(this, artManifest, (key) => this.bridge.emit('error', `Не найден ресурс: ${key}`));
  }
  create(): void {
    this.scene.start('MainMenu');
    this.bridge.emit('ready', undefined);
  }
}
