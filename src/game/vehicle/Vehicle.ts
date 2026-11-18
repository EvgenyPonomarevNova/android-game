import { Box, Circle, Vec2, WheelJoint, type Body } from 'planck';
import { PHYSICS, type VehicleConfig } from '../../config/game';
import type { VehicleMotion } from '../../shared/GameFeedback';
import type { ControlState } from '../input/InputController';
import type { PhysicsWorld } from '../physics/PhysicsWorld';

export interface Vehicle {
  readonly chassis: Body;
  readonly wheels: readonly Body[];
  readonly config: VehicleConfig;
  readonly motion: VehicleMotion;
  drive(input: ControlState): void;
}

/** A new vehicle can implement this small contract with its own geometry. */
export class Scooter implements Vehicle {
  readonly chassis: Body;
  readonly wheels: Body[] = [];
  readonly joints: WheelJoint[] = [];
  supportedWheelCount = 0;
  readonly motion: VehicleMotion = {
    grounded: false,
    accelerationX: 0,
    verticalSpeed: 0,
    landingImpact: 0,
    landingId: 0,
  };
  private previousVelocity = { x: 0, y: 0 };
  private airborneSeconds = 0;
  private motorTorque = 0;
  private reverseWait = 0;
  private reversing = false;
  constructor(
    physics: PhysicsWorld,
    x: number,
    y: number,
    readonly config: VehicleConfig,
  ) {
    const { chassis: c, wheel: w } = config;
    this.chassis = physics.track(
      physics.world.createDynamicBody({ position: Vec2(x, y), angularDamping: 0.4 }),
    );
    this.chassis.createFixture(Box(c.halfWidth, c.halfHeight), {
      density: c.mass / (4 * c.halfWidth * c.halfHeight),
      friction: c.friction,
      filterGroupIndex: -1,
    });
    // Rider/handlebar mass is part of the same rigid body.
    this.chassis.createFixture(Box(0.12, 0.35, Vec2(0.52, 0.45)), {
      density: 8,
      friction: 0.3,
      filterGroupIndex: -1,
    });
    for (const offset of [-w.spacing, w.spacing]) {
      const wheel = physics.track(
        physics.world.createDynamicBody({ position: Vec2(x + offset, y - w.drop) }),
      );
      wheel.createFixture(Circle(w.radius), {
        density: w.mass / (Math.PI * w.radius ** 2),
        friction: w.friction,
        restitution: 0,
        filterGroupIndex: -1,
      });
      const joint = physics.world.createJoint(
        new WheelJoint(
          {
            enableMotor: offset < 0,
            maxMotorTorque: config.motor.torque,
            motorSpeed: 0,
            frequencyHz: config.suspension.frequencyHz,
            dampingRatio: config.suspension.dampingRatio,
          },
          this.chassis,
          wheel,
          wheel.getPosition(),
          Vec2(0, 1),
        ),
      );
      if (!joint) throw new Error('Wheel joint creation failed');
      this.wheels.push(wheel);
      this.joints.push(joint);
    }
  }

  drive(input: ControlState): void {
    const speed = this.chassis.getLinearVelocity().x;
    const rear = this.joints[0]!;
    const { motor } = this.config;
    const previouslyReversing = this.reversing;
    if (!input.brake) {
      this.reverseWait = 0;
      this.reversing = false;
    } else if (!this.reversing) {
      this.reverseWait = speed <= 0.25 ? this.reverseWait + PHYSICS.step : 0;
      this.reversing = speed < -0.25 || this.reverseWait >= motor.reverseDelay;
    }
    if (this.reversing && !previouslyReversing) this.motorTorque = 0;
    const braking = input.brake && !this.reversing;
    const atDriveLimit = !input.brake && input.throttle && speed >= this.config.maxSpeed;
    const atReverseLimit = input.brake && speed <= -this.config.maxSpeed / 2;
    // Brake takes priority over throttle, including above the propulsion limit.
    // Set the final state once: enable/disable setters wake the whole joint island.
    rear.enableMotor((input.throttle || input.brake) && !atDriveLimit && !atReverseLimit);
    const targetTorque =
      input.throttle || input.brake ? (braking ? motor.brakeTorque : motor.torque) : 0;
    const rise = (braking ? motor.brakeTorqueRise : motor.torqueRise) * PHYSICS.step;
    this.motorTorque += Math.max(-rise, Math.min(rise, targetTorque - this.motorTorque));
    rear.setMaxMotorTorque(this.motorTorque);
    // Y-up: clockwise wheel rotation drives right.
    rear.setMotorSpeed(braking ? 0 : input.brake ? motor.reverseSpeed : -motor.speed);
    if (
      input.lean !== 0 &&
      (Math.abs(this.chassis.getAngularVelocity()) < this.config.maxAngularSpeed ||
        Math.sign(input.lean) !== Math.sign(this.chassis.getAngularVelocity()))
    )
      this.chassis.applyTorque(
        input.lean *
          this.config.leanTorque *
          (this.motion.grounded ? 1 : this.config.airLeanMultiplier),
        true,
      );
  }

  /** Called once after each solver tick, before cargo and gameplay feedback. */
  afterStep(dt: number): void {
    const velocity = this.chassis.getLinearVelocity();
    let grounded = false;
    this.supportedWheelCount = 0;
    for (const wheel of this.wheels) {
      let supported = false;
      for (let edge = wheel.getContactList(); edge; edge = edge.next) {
        const { contact, other } = edge;
        if (!other || other.getType() !== 'static' || !contact.isTouching() || !contact.isEnabled())
          continue;
        const a = contact.getFixtureA(),
          b = contact.getFixtureB();
        if (a.isSensor() || b.isSensor()) continue;
        const manifold = contact.getWorldManifold(null);
        if (!manifold || contact.getManifold().pointCount === 0) continue;
        const up = a.getBody() === wheel ? -manifold.normal.y : manifold.normal.y;
        if (up > 0.3) {
          grounded = true;
          supported = true;
        }
      }
      if (supported) this.supportedWheelCount++;
    }
    if (grounded) {
      if (this.airborneSeconds >= this.config.landingAirSeconds) {
        this.motion.landingId++;
        this.motion.landingImpact = Math.max(0, -this.previousVelocity.y);
      }
      this.airborneSeconds = 0;
    } else this.airborneSeconds += dt;
    this.motion.grounded = grounded;
    this.motion.accelerationX = (velocity.x - this.previousVelocity.x) / dt;
    this.motion.verticalSpeed = velocity.y;
    this.previousVelocity.x = velocity.x;
    this.previousVelocity.y = velocity.y;
  }
}
