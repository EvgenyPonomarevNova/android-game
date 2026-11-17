import { Scene, Math as PhaserMath } from 'phaser';
import { PHYSICS } from '../../config/game';
import { FollowCamera } from '../camera/FollowCamera';
import type { GameBridge } from '../core/GameBridge';
import { Simulation } from '../core/Simulation';
import { BodyView } from '../rendering/BodyView';
import { drawScooter } from '../rendering/geometry';

export class Gameplay extends Scene {
  private simulation?: Simulation;
  private views: BodyView[] = [];
  private follow?: FollowCamera;
  private telemetryAt = 0;
  private resultSent = false;
  constructor(private bridge: GameBridge) {
    super('Gameplay');
  }

  create(): void {
    const simulation = new Simulation();
    this.simulation = simulation;
    this.views = [];
    this.telemetryAt = 0;
    this.resultSent = false;
    this.cameras.main.setBackgroundColor(0xeee9da);
    this.drawLevel(simulation);
    const chassis = this.add.graphics();
    drawScooter(chassis);
    this.views.push(new BodyView(simulation.vehicle.chassis, chassis));
    simulation.vehicle.wheels.forEach((body) => {
      const wheel = this.add.graphics();
      wheel.fillStyle(0x252a2a).fillCircle(0, 0, 19.2);
      wheel.lineStyle(3, 0xf5f0df).strokeCircle(0, 0, 10).lineBetween(-9, 0, 9, 0);
      this.views.push(new BodyView(body, wheel));
    });
    const coffee = this.add.graphics();
    coffee.fillStyle(0xfff9ec).fillRoundedRect(-11, -15, 22, 30, 3);
    coffee.fillStyle(0x343a37).fillRect(-13, -18, 26, 6);
    coffee.fillStyle(0xb86838).fillRect(-11, -3, 22, 9);
    this.views.push(new BodyView(simulation.cargo.body, coffee));
    const resize = () =>
      this.cameras.main.setZoom(Math.min(this.scale.width / 1600, this.scale.height / 900));
    resize();
    this.scale.on('resize', resize);
    this.follow = new FollowCamera(this.cameras.main);
    const unDamage = simulation.events.on('cargo:damaged', (event) =>
      this.bridge.emit('damage', event),
    );
    this.events.once('shutdown', () => {
      this.scale.off('resize', resize);
      unDamage();
      simulation.dispose();
      this.views = [];
      this.simulation = undefined;
      this.bridge.input.reset();
    });
    this.publish(0);
  }

  private drawLevel(sim: Simulation): void {
    const g = this.add.graphics().setDepth(-10);
    // Static geometry is built once per level, not each frame.
    for (let i = -2; i < 34; i++) {
      const x = i * 190,
        h = 150 + ((i * i * 37) % 160);
      g.fillStyle(i % 2 ? 0xd6d8c5 : 0xe1ddcc).fillRect(x, -h - 85, 150, h + 85);
      g.fillStyle(0xeee9da);
      for (let y = -h - 55; y < -100; y += 45)
        for (let w = 20; w < 140; w += 37) g.fillRect(x + w, y, 16, 24);
    }
    g.fillStyle(0xc2c9ad).fillRect(-900, 0, 6500, 900);
    const scale = PHYSICS.pixelsPerMeter;
    const points = sim.level.ground.map(([x, y]) => new PhaserMath.Vector2(x * scale, -y * scale));
    g.fillStyle(0x404740);
    g.fillPoints(
      [...points, new PhaserMath.Vector2(4800, 900), new PhaserMath.Vector2(-900, 900)],
      true,
    );
    g.lineStyle(9, 0x849274).strokePoints(points);
    g.lineStyle(2, 0xf8f0d4).strokePoints(points);
    sim.level.obstacles.forEach((o) => {
      g.fillStyle(0xc8754b).fillRoundedRect(
        (o.x - o.width / 2) * scale,
        -(o.y + o.height / 2) * scale,
        o.width * scale,
        o.height * scale,
        2,
      );
    });
    const finishX = sim.level.finish.x * PHYSICS.pixelsPerMeter;
    const finishY = -sim.level.finish.y * PHYSICS.pixelsPerMeter;
    g.lineStyle(5, 0x252a2a).lineBetween(finishX, finishY, finishX, finishY - 190);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 5; col++)
        g.fillStyle((row + col) % 2 ? 0x252a2a : 0xffce32).fillRect(
          finishX + col * 16,
          finishY - 190 + row * 16,
          16,
          16,
        );
    this.add.text(finishX - 25, finishY - 230, 'КОФЕ СЮДА', {
      fontFamily: 'Onest Variable, sans-serif',
      fontSize: '20px',
      color: '#252a2a',
      fontStyle: 'bold',
    });
    this.add.text(190, -160, 'ТИШЕ ЕДЕШЬ — ЦЕЛЕЕ КОФЕ', {
      fontFamily: 'Onest Variable, sans-serif',
      fontSize: '18px',
      color: '#596345',
    });
  }

  update(time: number, deltaMs: number): void {
    const sim = this.simulation;
    if (!sim) return;
    try {
      sim.physics.setPaused(this.bridge.mode !== 'playing');
      if (this.bridge.mode === 'playing') {
        sim.advance(deltaMs / 1000, this.bridge.input.state);
        if ((sim.finished || sim.cargo.integrity <= 0) && !this.resultSent) {
          this.resultSent = true;
          this.bridge.input.reset();
          this.bridge.setMode(sim.finished ? 'finished' : 'failed');
          if (sim.finished)
            this.bridge.emit('result', {
              seconds: sim.elapsed,
              integrity: sim.cargo.integrity,
              levelId: sim.level.id,
            });
        }
      }
      this.views.forEach((v) => v.sync(sim.physics));
      const view = this.views[0]!.view;
      this.follow?.update(
        view.x,
        view.y,
        sim.vehicle.chassis.getLinearVelocity().x,
        deltaMs / 1000,
      );
      if (time >= this.telemetryAt) {
        this.publish(deltaMs);
        this.telemetryAt = time + 100;
      }
    } catch (error) {
      this.bridge.input.reset();
      this.bridge.setMode('error');
      this.bridge.emit('error', error instanceof Error ? error.message : 'Ошибка игровой сцены');
    }
  }

  private publish(deltaMs: number): void {
    const sim = this.simulation!;
    this.bridge.emit('telemetry', {
      integrity: sim.cargo.integrity,
      seconds: sim.elapsed,
      speed: Math.abs(sim.vehicle.chassis.getLinearVelocity().x) * 3.6,
      progress: Math.max(
        0,
        Math.min(
          1,
          (sim.vehicle.chassis.getPosition().x - sim.level.start.x) /
            (sim.level.finish.x - sim.level.start.x),
        ),
      ),
      fps: deltaMs > 0 ? 1000 / deltaMs : 0,
      bodies: sim.physics.world.getBodyCount(),
      physicsMs: sim.physics.stepMs,
    });
  }
}
