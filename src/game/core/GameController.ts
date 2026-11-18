// Adapted from phaserjs/template-react-ts (MIT): React owns one Game instance.
import { AUTO, Game, Scale } from 'phaser';
import { Boot } from '../scenes/Boot';
import { MainMenu } from '../scenes/MainMenu';
import { Gameplay } from '../scenes/Gameplay';
import type { GameBridge, GameCommand } from './GameBridge';

export class GameController {
  private game: Game;
  private abort = new AbortController();
  private disposeCommand: () => void;
  constructor(
    parent: HTMLElement,
    private bridge: GameBridge,
  ) {
    this.game = new Game({
      type: AUTO,
      parent,
      backgroundColor: '#eee9da',
      scale: { mode: Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
      render: { antialias: true, pixelArt: false, powerPreference: 'high-performance' },
      fps: { target: 60, smoothStep: false },
      input: { keyboard: false, mouse: false, touch: false },
      audio: { noAudio: true },
      scene: [new Boot(bridge), new MainMenu(), new Gameplay(bridge)],
    });
    this.disposeCommand = bridge.on('command', (command) => this.command(command));
    const canvas = () => this.game.canvas;
    this.game.events.once('ready', () => {
      canvas().setAttribute('aria-label', 'Контракт №001 — Сюрприз на пятом');
      canvas().addEventListener(
        'webglcontextlost',
        (event) => {
          event.preventDefault();
          bridge.suspend();
          bridge.emit(
            'error',
            'Графика прервана. После восстановления продолжите или начните заново.',
          );
        },
        { signal: this.abort.signal },
      );
      canvas().addEventListener('webglcontextrestored', () => bridge.emit('error', ''), {
        signal: this.abort.signal,
      });
    });
  }

  private command(command: GameCommand): void {
    this.bridge.input.reset();
    if (command === 'start' || command === 'restart') {
      this.game.scene.stop('MainMenu');
      this.game.scene.stop('Gameplay');
      this.game.scene.start('Gameplay');
      this.bridge.setMode('playing');
    } else if (command === 'menu') {
      this.game.scene.stop('Gameplay');
      this.game.scene.start('MainMenu');
      this.bridge.setMode('menu');
    } else if (command === 'pause' && this.bridge.mode === 'playing') this.bridge.setMode('paused');
    else if (command === 'resume' && this.bridge.mode === 'paused') this.bridge.setMode('playing');
  }

  destroy(): void {
    this.disposeCommand();
    this.abort.abort();
    this.bridge.input.reset();
    this.game.destroy(true);
  }
}
