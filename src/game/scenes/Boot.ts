import { Scene } from 'phaser';
import type { GameBridge } from '../core/GameBridge';
import { queueAssets } from '../rendering/AssetLoader';
import { artManifest } from '../../assets/artkit';
import { routeAssets } from '../rendering/routeAssets';
import { cargoAssets } from '../rendering/cargoArt';

export class Boot extends Scene {
  constructor(private bridge: GameBridge) {
    super('Boot');
  }
  preload(): void {
    queueAssets(
      this,
      { ...artManifest, images: [...(artManifest.images ?? []), ...routeAssets, ...cargoAssets] },
      (key) => this.bridge.emit('error', `Не найден ресурс: ${key}`),
    );
  }
  create(): void {
    this.scene.start('MainMenu');
    this.bridge.emit('ready', undefined);
  }
}
