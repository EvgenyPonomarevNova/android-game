import { EventBus } from '../../shared/EventBus';
import { InputController } from '../input/InputController';
import type { CargoDamage } from '../cargo/Cargo';
import type { CargoImpact } from '../../shared/GameFeedback';
import type { LevelData } from '../levels/testLevel';

export type GameMode = 'menu' | 'playing' | 'paused' | 'finished' | 'failed' | 'error';
export type GameCommand = 'start' | 'pause' | 'resume' | 'restart' | 'menu' | 'checkpoint';
export interface MissionState {
  cargoComponents?: readonly { id: 'cake' | 'drinks'; integrity: number; weight: number }[];
  checkpointUsed?: boolean;
  checkpointAvailable?: boolean;
  falls?: number;
  routeChoice?: 'safe' | 'risky' | null;
  remainingSeconds?: number;
}
export interface Telemetry extends MissionState {
  integrity: number;
  seconds: number;
  speed: number;
  progress: number;
  fps: number;
  bodies: number;
  physicsMs: number;
  stress?: number;
  grounded?: boolean;
  landingId?: number;
  landingImpact?: number;
}
interface BridgeEvents {
  command: GameCommand;
  mode: GameMode;
  telemetry: Telemetry;
  ready: undefined;
  error: string;
  damage: CargoDamage;
  impact: CargoImpact;
  result: MissionState & {
    seconds: number;
    integrity: number;
    levelId: string;
    success?: boolean;
    reason?: string;
  };
}
export class GameBridge extends EventBus<BridgeEvents> {
  readonly input = new InputController();
  readonly preferences = { cameraShake: 0.65, hints: true };
  /** An authoring preview may supply a draft; normal play uses the default contract. */
  level?: LevelData;
  selectLevel(level?: LevelData): void {
    this.level = level;
  }
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
