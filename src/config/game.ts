export const BUILD_VERSION = '0.5.0';
export const PHYSICS = {
  step: 1 / 60,
  maxFrame: 0.1,
  maxSteps: 6,
  pixelsPerMeter: 60,
  gravity: -9.81,
  velocityIterations: 10,
  positionIterations: 6,
} as const;

export const RACE_RULES = {
  minWorldY: -15,
  overturn: {
    minAngle: (5 * Math.PI) / 9,
    holdSeconds: 0.8,
    maxSpeed: 1,
    maxAngularSpeed: 0.75,
  },
} as const;

export const CAMERA = {
  response: 4,
  lookAhead: 0.65,
  maxLookAhead: 240,
  bounds: { x: -600, y: -1400, width: 22200, height: 2600 },
};

export interface VehicleConfig {
  id: string;
  chassis: { halfWidth: number; halfHeight: number; mass: number; friction: number };
  wheel: { radius: number; mass: number; friction: number; spacing: number; drop: number };
  suspension: { frequencyHz: number; dampingRatio: number };
  motor: {
    speed: number;
    reverseSpeed: number;
    torque: number;
    brakeTorque: number;
    torqueRise: number;
    brakeTorqueRise: number;
    reverseDelay: number;
  };
  maxSpeed: number;
  leanTorque: number;
  maxAngularSpeed: number;
  airLeanMultiplier: number;
  landingAirSeconds: number;
}

export const SCOOTER: VehicleConfig = {
  id: 'courier-scooter',
  chassis: { halfWidth: 0.85, halfHeight: 0.19, mass: 65, friction: 0.45 },
  wheel: { radius: 0.32, mass: 4, friction: 1.4, spacing: 0.68, drop: 0.44 },
  suspension: { frequencyHz: 4.5, dampingRatio: 0.9 },
  motor: {
    speed: 35,
    reverseSpeed: 10,
    torque: 80,
    brakeTorque: 95,
    torqueRise: 180,
    brakeTorqueRise: 280,
    reverseDelay: 0.15,
  },
  maxSpeed: 12,
  leanTorque: 65,
  maxAngularSpeed: 4,
  airLeanMultiplier: 1.6,
  landingAirSeconds: 0.08,
};
