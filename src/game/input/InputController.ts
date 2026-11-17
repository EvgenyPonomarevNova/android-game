export type InputAction = 'throttle' | 'brake' | 'leanForward' | 'leanBack';
export interface ControlState {
  throttle: boolean;
  brake: boolean;
  lean: number;
}

const keys: Record<string, InputAction | undefined> = {
  ArrowUp: 'throttle',
  KeyW: 'throttle',
  ArrowDown: 'brake',
  KeyS: 'brake',
  ArrowLeft: 'leanBack',
  KeyA: 'leanBack',
  ArrowRight: 'leanForward',
  KeyD: 'leanForward',
};

export class InputController {
  private sources = new Map<string, InputAction>();
  private abort?: AbortController;
  readonly state: ControlState = { throttle: false, brake: false, lean: 0 };

  set(source: string, action: InputAction): void {
    this.sources.set(source, action);
    this.refresh();
  }

  release(source: string): void {
    this.sources.delete(source);
    this.refresh();
  }

  reset(): void {
    this.sources.clear();
    this.refresh();
  }

  private refresh(): void {
    let throttle = false,
      brake = false,
      forward = false,
      back = false;
    this.sources.forEach((action) => {
      if (action === 'throttle') throttle = true;
      if (action === 'brake') brake = true;
      if (action === 'leanForward') forward = true;
      if (action === 'leanBack') back = true;
    });
    Object.assign(this.state, { throttle, brake, lean: Number(back) - Number(forward) });
  }

  attach(onPause: () => void, onRestart: () => void, isPlaying: () => boolean): () => void {
    this.abort?.abort();
    const abort = new AbortController();
    this.abort = abort;
    const options = { signal: abort.signal };
    window.addEventListener(
      'keydown',
      (event) => {
        if (event.target instanceof HTMLElement && event.target.matches('input, select, textarea'))
          return;
        if (event.code === 'Escape') {
          if (!event.repeat) onPause();
          return;
        }
        if (!isPlaying()) return;
        if (event.code === 'KeyR' && !event.repeat) onRestart();
        const action = keys[event.code];
        if (action) {
          event.preventDefault();
          this.set(event.code, action);
        }
      },
      options,
    );
    window.addEventListener('keyup', (event) => this.release(event.code), options);
    const releasePointer = (event: PointerEvent) => this.release(`pointer:${event.pointerId}`);
    window.addEventListener('pointerup', releasePointer, options);
    window.addEventListener('pointercancel', releasePointer, options);
    window.addEventListener('blur', () => this.reset(), options);
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) this.reset();
      },
      options,
    );
    return () => {
      abort.abort();
      this.reset();
    };
  }
}
