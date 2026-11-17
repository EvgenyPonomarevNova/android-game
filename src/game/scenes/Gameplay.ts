import { Scene, Math as PhaserMath } from 'phaser';
import { PHYSICS } from '../../config/game';
import { FollowCamera } from '../camera/FollowCamera';
import type { GameBridge } from '../core/GameBridge';
import { Simulation } from '../core/Simulation';
import { BodyView } from '../rendering/BodyView';
import { scooterArt, wheelArt, coffeeArt } from '../rendering/vehicleArt';
import { YardBackdrop } from '../rendering/YardBackdrop';
import { surfaceAt } from '../levels/testLevel';

export class Gameplay extends Scene {
  private simulation?: Simulation;
  private views: BodyView[] = [];
  private follow?: FollowCamera;
  private telemetryAt = 0;
  private resultSent = false;
  private backdrop?: YardBackdrop;
  constructor(private bridge: GameBridge) {
    super('Gameplay');
  }

  create(): void {
    const simulation = new Simulation();
    this.simulation = simulation;
    this.views = [];
    this.telemetryAt = 0;
    this.resultSent = false;
    // FollowCamera computes scroll in visible world units. Keep the zoom pivot at top-left.
    this.cameras.main.setOrigin(0, 0);
    this.cameras.main.setBackgroundColor(0x72c6ff);
    this.backdrop = new YardBackdrop(this, 0.68);
    this.drawLevel(simulation);
    const chassis = scooterArt(this);
    this.views.push(new BodyView(simulation.vehicle.chassis, chassis));
    simulation.vehicle.wheels.forEach((body) => {
      const wheel = wheelArt(this, body);
      this.views.push(new BodyView(body, wheel));
    });
    const coffee = coffeeArt(this, simulation.cargo.body);
    this.views.push(new BodyView(simulation.cargo.body, coffee));
    const resize = () =>
      this.cameras.main.setZoom(Math.min(this.scale.width / 1280, this.scale.height / 720));
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
      this.backdrop = undefined;
      this.simulation = undefined;
      this.bridge.input.reset();
    });
    this.publish(0);
  }

  private drawLevel(sim: Simulation): void {
    const g = this.add.graphics().setDepth(-10);
    // Geometry comes from the level; the surface textures only dress those segments.
    const scale = PHYSICS.pixelsPerMeter;
    const points = sim.level.ground.map(([x, y]) => new PhaserMath.Vector2(x * scale, -y * scale));
    g.fillStyle(0x424c60);
    g.fillPoints(
      [...points, new PhaserMath.Vector2(4800, 900), new PhaserMath.Vector2(-900, 900)],
      true,
    );
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]!;
      const b = points[i]!;
      const cuts = [
        a.x,
        b.x,
        ...(sim.level.surfaces ?? []).flatMap((s) => [s.from * scale, s.to * scale]),
      ].filter((x) => x >= a.x && x <= b.x);
      const xs = [...new Set(cuts)].sort((x, y) => x - y);
      for (let j = 1; j < xs.length; j++) {
        const x = xs[j - 1]!;
        const endX = xs[j]!;
        const y = a.y + (b.y - a.y) * ((x - a.x) / (b.x - a.x));
        const endY = a.y + (b.y - a.y) * ((endX - a.x) / (b.x - a.x));
        const texture =
          surfaceAt(sim.level, (x + endX) / 2 / scale) === 'gravel' ? 'gravel' : 'road';
        this.add
          .tileSprite(x, y, Math.hypot(endX - x, endY - y), 80, texture)
          .setOrigin(0)
          .setRotation(Math.atan2(endY - y, endX - x))
          .setDepth(-9);
      }
    }
    const edge = this.add.graphics().setDepth(-8);
    edge.lineStyle(3, 0x192437).strokePoints(points);
    sim.level.obstacles.forEach((o) => {
      edge
        .fillStyle(0xffd12b)
        .fillRoundedRect(
          (o.x - o.width / 2) * scale,
          -(o.y + o.height / 2) * scale,
          o.width * scale,
          o.height * scale,
          2,
        );
    });
    const finishX = sim.level.finish.x * PHYSICS.pixelsPerMeter;
    const finishY = -sim.level.finish.y * PHYSICS.pixelsPerMeter;
    g.lineStyle(5, 0x192437).lineBetween(finishX, finishY, finishX, finishY - 190);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 5; col++)
        g.fillStyle((row + col) % 2 ? 0x192437 : 0xffd12b).fillRect(
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
  }

  update(time: number, deltaMs: number): void {
    const sim = this.simulation;
    if (!sim) return;
    try {
      sim.physics.setPaused(this.bridge.mode !== 'playing');
      if (this.bridge.mode === 'playing') {
        sim.advance(deltaMs / 1000, this.bridge.input.state);
        if (sim.outcome && !this.resultSent) {
          this.resultSent = true;
          this.bridge.input.reset();
          this.bridge.setMode(sim.outcome.success ? 'finished' : 'failed');
          this.bridge.emit('result', {
            seconds: sim.elapsed,
            integrity: sim.cargo.integrity,
            levelId: sim.level.id,
            success: sim.outcome.success,
            reason: sim.outcome.reason,
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
      this.backdrop?.update();
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
