import type { PointerEvent } from 'react';
import type { InputAction } from '../../game/input/InputController';
import type { GameBridge } from '../../game/core/GameBridge';
import { Icon } from './Icon';
import styles from '../ui.module.css';

export function TouchControls({ bridge }: { bridge: GameBridge }) {
  const hold = (event: PointerEvent<HTMLButtonElement>, action: InputAction) => {
    event.preventDefault();
    if (bridge.mode !== 'playing') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    bridge.input.set(`pointer:${event.pointerId}`, action);
  };
  const release = (event: PointerEvent<HTMLButtonElement>) =>
    bridge.input.release(`pointer:${event.pointerId}`);
  const button = (
    action: InputAction,
    label: string,
    icon: 'leanBack' | 'forward' | 'brake',
    primary = false,
  ) => (
    <button
      className={`${styles.control} ${primary ? styles.gas : ''}`}
      aria-label={label}
      onPointerDown={(event) => hold(event, action)}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );
  return (
    <div className={styles.controls} aria-label="Управление скутером">
      <div className={styles.controlGroup}>
        {button('leanBack', 'Назад наклон', 'leanBack')}
        {button('leanForward', 'Вперёд наклон', 'leanBack')}
      </div>
      <p className={styles.keyHint}>
        W / S — газ и тормоз
        <br />A / D — наклон · R — заново
      </p>
      <div className={styles.controlGroup}>
        {button('brake', 'Тормоз / назад', 'brake')}
        {button('throttle', 'Газ', 'forward', true)}
      </div>
    </div>
  );
}
