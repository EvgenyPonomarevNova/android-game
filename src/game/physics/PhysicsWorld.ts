import { World, Vec2, type Body } from 'planck';
import { PHYSICS } from '../../config/game';

interface Pose {
  x: number;
  y: number;
  angle: number;
}
interface Track {
  body: Body;
  previous: Pose;
  current: Pose;
}

/** Meters, kg, seconds; Y points up. No renderer or platform dependencies. */
export class PhysicsWorld {
  readonly world = new World(Vec2(0, PHYSICS.gravity));
  private tracks = new Map<Body, Track>();
  private deferred: Array<() => void> = [];
  private accumulator = 0;
  private paused = false;
  alpha = 0;
  stepMs = 0;
  ticks = 0;

  track(body: Body): Body {
    const pose = this.read(body);
    this.tracks.set(body, { body, previous: { ...pose }, current: { ...pose } });
    return body;
  }

  private read(body: Body): Pose {
    const { x, y } = body.getPosition();
    const angle = body.getAngle();
    if (![x, y, angle].every(Number.isFinite)) throw new Error('Non-finite physics transform');
    return { x, y, angle };
  }

  pose(body: Body, out: Pose): Pose {
    const track = this.tracks.get(body);
    if (!track) return Object.assign(out, this.read(body));
    const { previous: p, current: c } = track;
    out.x = p.x + (c.x - p.x) * this.alpha;
    out.y = p.y + (c.y - p.y) * this.alpha;
    // Angles are continuous in Planck; do not wrap through zero here.
    out.angle = p.angle + (c.angle - p.angle) * this.alpha;
    return out;
  }

  /** Contact callbacks may queue mutations; never mutate a locked world. */
  defer(operation: () => void): void {
    this.deferred.push(operation);
  }

  advance(delta: number, before: (dt: number) => void, after: (dt: number) => void): number {
    if (this.paused || !Number.isFinite(delta) || delta <= 0) return 0;
    this.accumulator = Math.min(this.accumulator + delta, PHYSICS.maxFrame);
    let steps = 0;
    const start = performance.now();
    while (!this.paused && this.accumulator + 1e-10 >= PHYSICS.step && steps < PHYSICS.maxSteps) {
      this.tracks.forEach((t) => Object.assign(t.previous, t.current));
      before(PHYSICS.step);
      this.world.step(PHYSICS.step, PHYSICS.velocityIterations, PHYSICS.positionIterations);
      // Consume the tick before callbacks: a terminal outcome can pause and
      // clear the accumulator from inside after(), including during catch-up.
      this.accumulator -= PHYSICS.step;
      this.tracks.forEach((t) => Object.assign(t.current, this.read(t.body)));
      const pending = this.deferred;
      this.deferred = [];
      pending.forEach((operation) => operation());
      after(PHYSICS.step);
      this.ticks++;
      steps++;
    }
    this.alpha = this.paused ? 1 : Math.max(0, Math.min(1, this.accumulator / PHYSICS.step));
    this.stepMs = steps ? (performance.now() - start) / steps : this.stepMs;
    return steps;
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    this.accumulator = 0;
    this.alpha = 1;
    this.tracks.forEach((t) => Object.assign(t.previous, t.current));
  }

  destroyBody(body: Body): void {
    this.defer(() => {
      this.tracks.delete(body);
      this.world.destroyBody(body);
    });
  }

  dispose(): void {
    if (this.world.isLocked()) throw new Error('Cannot dispose a locked world');
    for (let body = this.world.getBodyList(); body;) {
      const next = body.getNext();
      this.world.destroyBody(body);
      body = next;
    }
    this.tracks.clear();
    this.deferred = [];
    this.accumulator = 0;
    this.ticks = 0;
  }
}
