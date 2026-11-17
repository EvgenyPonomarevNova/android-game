import { EventBus } from '../../shared/EventBus';
import { InputController } from '../input/InputController';
import type { CargoDamage } from '../cargo/Cargo';

export type GameMode = 'menu' | 'playing' | 'paused' | 'finished' | 'failed' | 'error';
export type GameCommand = 'start' | 'pause' | 'resume' | 'restart' | 'menu';
export interface Telemetry {
  integrity: number;
  seconds: number;
  speed: number;
  progress: number;
  fps: number;
  bodies: number;
  physicsMs: number;
}
interface BridgeEvents {
  command: GameCommand;
  mode: GameMode;
  telemetry: Telemetry;
  ready: undefined;
  error: string;
  damage: CargoDamage;
  result: {
    seconds: number;
    integrity: number;
    levelId: string;
    success?: boolean;
    reason?: string;
  };
}
export class GameBridge extends EventBus<BridgeEvents> {
  readonly input = new InputController();
  mode: GameMode = 'menu';
  command(command: GameCommand): void {
    this.emit('command', command);
  }
  setMode(mode: GameMode): void {
    this.mode = mode;
    this.emit('mode', mode);
  }
  suspend(): void {
    this.input.reset();
    if (this.mode === 'playing') this.command('pause');
  }
}
