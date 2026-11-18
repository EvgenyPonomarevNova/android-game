import { useEffect, useRef, useState, type PointerEvent, type CSSProperties } from 'react';
import type { InputAction } from '../../game/input/InputController';
import type { GameBridge } from '../../game/core/GameBridge';
import { Icon } from './Icon';
import styles from '../ui.module.css';
import type { Settings } from '../../platform/SaveService';
import { controlPreferences } from '../controlPreferences';

export function TouchControls({ bridge, settings }: { bridge: GameBridge; settings?: Settings }) {
  const layout = controlPreferences(settings);
  const pointers = useRef(new Map<number, InputAction>());
  const [held, setHeld] = useState<Set<InputAction>>(() => new Set());
  useEffect(() => {
    const active = pointers.current;
    return () => {
      for (const id of active.keys()) bridge.input.release(`pointer:${id}`);
      active.clear();
    };
  }, [bridge]);
  const hold = (event: PointerEvent<HTMLButtonElement>, action: InputAction) => {
    event.preventDefault();
    if (bridge.mode !== 'playing') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, action);
    setHeld(new Set(pointers.current.values()));
    bridge.input.set(`pointer:${event.pointerId}`, action);
  };
  const release = (event: PointerEvent<HTMLButtonElement>) => {
    bridge.input.release(`pointer:${event.pointerId}`);
    pointers.current.delete(event.pointerId);
    setHeld(new Set(pointers.current.values()));
  };
  const button = (
    action: InputAction,
    label: string,
    accessible: string,
    icon: 'leanBack' | 'forward' | 'brake',
    key: string,
    primary = false,
  ) => (
    <button
      className={`${styles.control} ${primary ? styles.gas : ''}`}
      aria-label={accessible}
      data-held={held.has(action)}
      onPointerDown={(event) => hold(event, action)}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
    >
      <kbd>{key}</kbd>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );
  return (
    <div
      className={styles.controls}
      aria-label="Управление скутером"
      data-left-handed={layout.leftHanded}
      style={{ '--control-scale': layout.scale } as CSSProperties}
    >
      <div className={styles.controlCluster} role="group" aria-label="Наклон скутера">
        <span className={styles.groupLabel}>Наклон</span>
        <div className={styles.controlGroup}>
          {button('leanBack', 'Назад', 'Наклон назад', 'leanBack', 'A')}
          {button('leanForward', 'Вперёд', 'Наклон вперёд', 'leanBack', 'D')}
        </div>
      </div>
      <div className={styles.controlCluster} role="group" aria-label="Скорость">
        <span className={styles.groupLabel}>Удерживай для движения</span>
        <div className={styles.controlGroup}>
          {button('brake', 'Тормоз', 'Тормоз / задний ход', 'brake', 'S')}
          {button('throttle', 'Газ', 'Газ', 'forward', 'W', true)}
        </div>
      </div>
    </div>
  );
}
