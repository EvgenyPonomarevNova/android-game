import { Box, Circle, Vec2, WheelJoint, type Body } from 'planck';
import type { VehicleConfig } from '../../config/game';
import type { ControlState } from '../input/InputController';
import type { PhysicsWorld } from '../physics/PhysicsWorld';

export interface Vehicle {
  readonly chassis: Body;
  readonly wheels: readonly Body[];
  readonly config: VehicleConfig;
  drive(input: ControlState): void;
}

/** A new vehicle can implement this small contract with its own geometry. */
export class Scooter implements Vehicle {
  readonly chassis: Body;
  readonly wheels: Body[] = [];
  readonly joints: WheelJoint[] = [];
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
    const braking = input.brake && speed > 0.6;
    const atDriveLimit = !input.brake && input.throttle && speed >= this.config.maxSpeed;
    const atReverseLimit = input.brake && speed <= -this.config.maxSpeed / 2;
    // Brake takes priority over throttle, including above the propulsion limit.
    // Set the final state once: enable/disable setters wake the whole joint island.
    rear.enableMotor((input.throttle || input.brake) && !atDriveLimit && !atReverseLimit);
    rear.setMaxMotorTorque(braking ? motor.brakeTorque : motor.torque);
    // Y-up: clockwise wheel rotation drives right.
    rear.setMotorSpeed(braking ? 0 : input.brake ? motor.reverseSpeed : -motor.speed);
    if (
      input.lean !== 0 &&
      (Math.abs(this.chassis.getAngularVelocity()) < this.config.maxAngularSpeed ||
        Math.sign(input.lean) !== Math.sign(this.chassis.getAngularVelocity()))
    )
      this.chassis.applyTorque(input.lean * this.config.leanTorque, true);
  }
}
