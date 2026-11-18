import { PHYSICS } from '../../config/game';

export function toScreen(x: number, y: number): { x: number; y: number } {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Invalid physical position');
  return { x: x * PHYSICS.pixelsPerMeter, y: -y * PHYSICS.pixelsPerMeter };
}

export function toPhysics(x: number, y: number): { x: number; y: number } {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Invalid screen position');
  return { x: x / PHYSICS.pixelsPerMeter, y: -y / PHYSICS.pixelsPerMeter };
}
