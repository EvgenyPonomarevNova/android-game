export const BUILD_VERSION = '0.1.0';
export const PHYSICS = {
  step: 1 / 60,
  maxFrame: 0.1,
  maxSteps: 6,
  pixelsPerMeter: 60,
  gravity: -9.81,
  velocityIterations: 10,
  positionIterations: 6,
} as const;

export const CAMERA = {
  response: 4,
  lookAhead: 0.65,
  maxLookAhead: 240,
  bounds: { x: -600, y: -1400, width: 6500, height: 2600 },
};

export interface VehicleConfig {
  id: string;
  chassis: { halfWidth: number; halfHeight: number; mass: number; friction: number };
  wheel: { radius: number; mass: number; friction: number; spacing: number; drop: number };
  suspension: { frequencyHz: number; dampingRatio: number };
  motor: { speed: number; reverseSpeed: number; torque: number; brakeTorque: number };
  maxSpeed: number;
  leanTorque: number;
  maxAngularSpeed: number;
}

export const SCOOTER: VehicleConfig = {
  id: 'courier-scooter',
  chassis: { halfWidth: 0.85, halfHeight: 0.19, mass: 65, friction: 0.45 },
  wheel: { radius: 0.32, mass: 4, friction: 1.4, spacing: 0.68, drop: 0.44 },
  suspension: { frequencyHz: 5, dampingRatio: 0.8 },
  motor: { speed: 35, reverseSpeed: 12, torque: 50, brakeTorque: 95 },
  maxSpeed: 12,
  leanTorque: 65,
  maxAngularSpeed: 4,
};
