import type { GameObjects, Scene } from 'phaser';

export function drawScooter(graphics: GameObjects.Graphics): void {
  graphics.fillStyle(0xffce32).fillRoundedRect(-52, -12, 102, 24, 8);
  graphics.lineStyle(7, 0x252a2a).lineBetween(31, -3, 30, -52).lineBetween(30, -52, 48, -52);
  graphics.fillStyle(0x252a2a).fillRoundedRect(-29, -29, 42, 9, 4);
  graphics.lineStyle(5, 0x606864).lineBetween(-27, -15, -40, 21).lineBetween(29, 1, 40, 21);
  graphics.fillStyle(0xfff5d9).fillCircle(48, -46, 5);
}

export function drawCity(scene: Scene, width: number, height: number): void {
  const g = scene.add.graphics();
  g.fillStyle(0xeee9da).fillRect(0, 0, width, height);
  g.fillStyle(0xffce32).fillCircle(width * 0.77, height * 0.29, height * 0.14);
  for (let i = 0; i < 15; i++) {
    const x = i * 145 - 50;
    const h = 100 + ((i * 47) % 180);
    g.fillStyle(i % 2 ? 0xd9d9c9 : 0xdedcca).fillRect(x, height * 0.76 - h, 115, h);
    g.fillStyle(0xeee9da);
    for (let y = 25; y < h - 15; y += 38)
      for (let w = 18; w < 100; w += 30) g.fillRect(x + w, height * 0.76 - h + y, 13, 19);
  }
  g.fillStyle(0xc4ccb6).fillRect(0, height * 0.76, width, height * 0.24);
  g.fillStyle(0x343a37).fillRect(0, height * 0.83, width, height * 0.17);
  g.lineStyle(3, 0xf7f1df);
  for (let x = 20; x < width; x += 120) g.lineBetween(x, height * 0.94, x + 60, height * 0.94);
}
