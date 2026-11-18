import type { GameObjects, Scene } from 'phaser';

/** Screen-filling sky and three quiet parallax planes. No collision cues in the backdrop. */
export class YardBackdrop {
  private layers: Array<{ image: GameObjects.TileSprite; factor: number; sky: boolean }>;
  constructor(
    private scene: Scene,
    private horizon = 0.62,
    theme = 'day',
  ) {
    this.layers = ['sky', 'far', 'mid', 'near'].map((key, i) => ({
      image: scene.add
        .tileSprite(0, 0, 1, 1, theme === 'rain-evening' ? `evening-${key}` : key)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-100 + i),
      factor: [0, 0.08, 0.18, 0.3][i]!,
      sky: i === 0,
    }));
    this.update();
  }
  update(): void {
    const c = this.scene.cameras.main;
    const w = c.width / c.zoom;
    const h = c.height / c.zoom;
    for (const { image, factor, sky } of this.layers) {
      const layerH = sky ? h : h * (this.horizon + 0.1);
      const scale = layerH / 768;
      image.setPosition(
        c.originX * (c.width - w),
        c.originY * (c.height - h) - (sky ? 0 : h * 0.1),
      );
      image.setSize(w, layerH).setTileScale(scale);
      image.tilePositionX = (c.scrollX * factor) / scale;
    }
  }
}
