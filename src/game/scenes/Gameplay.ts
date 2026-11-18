import { Scene, Math as PhaserMath } from 'phaser';
import { PHYSICS, RACE_RULES } from '../../config/game';
import { FollowCamera } from '../camera/FollowCamera';
import type { GameBridge, MissionState } from '../core/GameBridge';
import { Simulation } from '../core/Simulation';
import { BodyView } from '../rendering/BodyView';
import { scooterArt, wheelArt, coffeeArt } from '../rendering/vehicleArt';
import { YardBackdrop } from '../rendering/YardBackdrop';
import { surfaceAt } from '../levels/testLevel';
import { RidePresentation } from '../rendering/RidePresentation';
import { drawRouteScenery, type RouteSceneryView } from '../rendering/RouteScenery';
import { routeHeight } from '../rendering/routePresentation';
import { surpriseArt } from '../rendering/cargoArt';

export class Gameplay extends Scene {
  private simulation?: Simulation;
  private views: BodyView[] = [];
  private follow?: FollowCamera;
  private telemetryAt = 0;
  private resultSent = false;
  private backdrop?: YardBackdrop;
  private ride?: RidePresentation;
  private reducedMotion = false;
  private finishFeedbackMs = 0;
  private markers?: RouteSceneryView;
  constructor(private bridge: GameBridge) {
    super('Gameplay');
  }

  create(): void {
    const simulation = new Simulation(this.bridge.level, this.bridge.setup);
    this.simulation = simulation;
    this.views = [];
    this.telemetryAt = 0;
    this.resultSent = false;
    this.finishFeedbackMs = 0;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => {
      this.reducedMotion = preference.matches;
    };
    syncPreference();
    preference.addEventListener('change', syncPreference);
    // FollowCamera computes scroll in visible world units. Keep the zoom pivot at top-left.
    this.cameras.main.setOrigin(0, 0);
    this.cameras.main.setBackgroundColor(
      simulation.level.theme === 'rain-evening' ? 0x243961 : 0x72c6ff,
    );
    this.backdrop = new YardBackdrop(this, 0.68, simulation.level.theme);
    this.drawLevel(simulation);
    this.attachVehicleViews(simulation);
    const resize = () =>
      this.cameras.main.setZoom(Math.min(this.scale.width / 1280, this.scale.height / 720));
    resize();
    this.scale.on('resize', resize);
    const terrainPoints = [
      ...simulation.level.ground,
      ...(simulation.level.platforms ?? []).flatMap((p) => p.points),
    ];
    const xs = terrainPoints.map(([x]) => x * PHYSICS.pixelsPerMeter);
    const ys = terrainPoints.map(([, y]) => -y * PHYSICS.pixelsPerMeter);
    this.follow = new FollowCamera(this.cameras.main, {
      x: Math.min(...xs) - 900,
      y: Math.min(...ys) - 1400,
      width: Math.max(...xs) - Math.min(...xs) + 1800,
      height: Math.max(...ys) - Math.min(...ys) + 2800,
    });
    const unDamage = simulation.events.on('cargo:damaged', (event) =>
      this.bridge.emit('damage', event),
    );
    const unImpact = simulation.events.on('cargo:impact', (event) => {
      this.ride?.impact(event);
      if (event.severity === 'heavy' && !this.reducedMotion) this.follow?.impulse(1);
      this.bridge.emit('impact', event);
    });
    const offCommand = this.bridge.on('command', (command) => {
      if (command !== 'checkpoint' || !simulation.continueFromCheckpoint()) return;
      this.attachVehicleViews(simulation);
      this.resultSent = false;
      this.finishFeedbackMs = 0;
      this.follow?.reset();
      this.bridge.input.reset();
      this.publish(0);
      this.telemetryAt = this.time.now + 100;
      this.bridge.setMode('playing');
    });
    this.events.once('shutdown', () => {
      this.scale.off('resize', resize);
      unDamage();
      unImpact();
      offCommand();
      preference.removeEventListener('change', syncPreference);
      this.ride?.destroy();
      this.ride = undefined;
      simulation.dispose();
      this.views = [];
      this.backdrop = undefined;
      this.markers = undefined;
      this.simulation = undefined;
      this.bridge.input.reset();
    });
    this.publish(0);
  }

  private attachVehicleViews(sim: Simulation): void {
    this.ride?.destroy();
    this.views.forEach((view) => view.view.destroy());
    this.views = [];
    const chassis = scooterArt(this, sim.vehicle.config, this.bridge.setup);
    this.views.push(new BodyView(sim.vehicle.chassis, chassis));
    const wheels = sim.vehicle.wheels.map((body) => {
      const wheel = wheelArt(this, body, this.bridge.setup);
      this.views.push(new BodyView(body, wheel));
      return wheel;
    });
    const coffee = sim.level.cargo === 'coffee' ? coffeeArt(this, sim.cargo.body) : undefined;
    const bundle = coffee
      ? { view: this.add.container(0, 0, [coffee]), drinks: coffee }
      : surpriseArt(this, sim.cargo.body, sim.level.cargo === 'hot-meal');
    if (this.bridge.setup.parts.cargo_mount === 'reinforced_mount') {
      const box = this.add.graphics().lineStyle(2, 0xf4a95b).strokeRoundedRect(-15, -21, 30, 42, 3);
      box.lineBetween(-9, -21, -9, 21).lineBetween(9, -21, 9, 21);
      bundle.view.addAt(box, 0);
    }
    this.views.push(new BodyView(sim.cargo.body, bundle.view));
    this.ride = new RidePresentation(this, chassis, bundle.drinks, bundle.view, wheels[0]!);
    this.ride.reset(sim.vehicle.motion.landingId);
  }

  private missionState(sim: Simulation): MissionState {
    return {
      cargoComponents:
        sim.level.cargo !== 'coffee'
          ? sim.cargo.components.map((part) => ({ ...part }))
          : undefined,
      checkpointUsed: sim.checkpointUsed,
      checkpointAvailable: sim.checkpointAvailable,
      falls: sim.falls,
      routeChoice: sim.routeChoice,
      temperature: sim.temperature,
      cleanLandings: sim.cleanLandings,
      balancedSections: sim.balancedSections,
      wetSurface: surfaceAt(sim.level, sim.vehicle.chassis.getPosition().x) === 'wet-asphalt',
      remainingSeconds:
        sim.level.difficulty.deadlineSeconds === undefined
          ? undefined
          : Math.max(0, sim.level.difficulty.deadlineSeconds - sim.elapsed),
    };
  }

  private drawLevel(sim: Simulation): void {
    const g = this.add.graphics().setDepth(-10);
    // Geometry comes from the level; the surface textures only dress those segments.
    const scale = PHYSICS.pixelsPerMeter;
    const points = sim.level.ground.map(([x, y]) => new PhaserMath.Vector2(x * scale, -y * scale));
    const bottom = Math.max(...points.map((p) => p.y)) + 1800;
    g.fillStyle(0x424c60);
    g.fillPoints(
      [
        ...points,
        new PhaserMath.Vector2(points[points.length - 1]!.x, bottom),
        new PhaserMath.Vector2(points[0]!.x, bottom),
      ],
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
        const surface = surfaceAt(sim.level, (x + endX) / 2 / scale);
        const texture =
          surface === 'gravel' ? 'gravel' : surface === 'wet-asphalt' ? 'wet-asphalt' : 'road';
        this.add
          .tileSprite(x, y, Math.hypot(endX - x, endY - y), 80, texture)
          .setOrigin(0)
          .setRotation(Math.atan2(endY - y, endX - x))
          .setDepth(-9);
        if (surface === 'wet-asphalt' && endX - x > 150 && Math.abs(endY - y) < 25) {
          this.add
            .ellipse(
              (x + endX) / 2,
              (y + endY) / 2 + 9,
              Math.min(110, (endX - x) * 0.35),
              9,
              0x9dc8db,
              0.42,
            )
            .setRotation(Math.atan2(endY - y, endX - x))
            .setDepth(-8);
        }
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
    this.add.text(finishX - 25, finishY - 230, 'ДОСТАВКА', {
      fontFamily: 'Onest Variable, sans-serif',
      fontSize: '20px',
      color: '#252a2a',
      fontStyle: 'bold',
    });
    this.markers = drawRouteScenery(this, sim.level);
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
          // Flush the terminal snapshot before mode/result listeners render the summary.
          this.publish(deltaMs);
          this.telemetryAt = time + 100;
          this.bridge.setMode(sim.outcome.success ? 'finished' : 'failed');
          this.bridge.emit('result', {
            ...this.missionState(sim),
            seconds: sim.elapsed,
            integrity: sim.cargo.integrity,
            levelId: sim.level.id,
            success: sim.outcome.success,
            reason: sim.outcome.reason,
          });
        }
      }
      this.views.forEach((v) => v.sync(sim.physics));
      const accident =
        sim.outcome?.reason === 'overturned' ||
        sim.outcome?.reason === 'out-of-bounds' ||
        sim.outcome?.reason === 'cargo-destroyed';
      const visualActive =
        this.bridge.mode === 'playing' ||
        (this.bridge.mode === 'failed' && this.finishFeedbackMs < 450);
      if (this.bridge.mode === 'failed') this.finishFeedbackMs += deltaMs;
      const velocityX = sim.vehicle.chassis.getLinearVelocity().x;
      this.ride?.update(
        sim.vehicle.motion,
        sim.cargo.stress,
        sim.outcome ? 0 : velocityX,
        surfaceAt(sim.level, sim.vehicle.chassis.getPosition().x) === 'gravel',
        accident,
        visualActive ? deltaMs / 1000 : 0,
        this.reducedMotion,
        surfaceAt(sim.level, sim.vehicle.chassis.getPosition().x) === 'wet-asphalt',
      );
      const view = this.views[0]!.view;
      const lookDistance =
        Math.sign(velocityX || 1) * Math.max(2, Math.min(8, Math.abs(velocityX) * 0.65));
      const aheadHeight = routeHeight(
        sim.level,
        sim.vehicle.chassis.getPosition().x + lookDistance,
        sim.vehicle.chassis.getPosition().y,
      );
      // Don't aim at the bottom of a fatal pit while the rider must see its landing lip.
      const terrainY =
        aheadHeight > RACE_RULES.minWorldY + 2
          ? -aheadHeight * PHYSICS.pixelsPerMeter
          : view.y + 60;
      this.follow?.update(
        view.x,
        view.y,
        velocityX,
        deltaMs / 1000,
        visualActive,
        this.reducedMotion,
        terrainY,
        this.bridge.preferences.cameraShake,
      );
      this.markers?.setCheckpoint(sim.checkpointUsed, sim.checkpointAvailable);
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
      ...this.missionState(sim),
      integrity: sim.cargo.integrity,
      stress: sim.cargo.stress,
      grounded: sim.vehicle.motion.grounded,
      landingId: sim.vehicle.motion.landingId,
      landingImpact: sim.vehicle.motion.landingImpact,
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
