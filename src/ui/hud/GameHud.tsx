import { useEffect, useState } from 'react';
import type { GameBridge, Telemetry } from '../../game/core/GameBridge';
import { BUILD_VERSION } from '../../config/game';
import { Icon } from '../components/Icon';
import { TouchControls } from '../components/TouchControls';
import { artUrl } from '../../assets/artkit';
import styles from '../ui.module.css';

const initial: Telemetry = {
  integrity: 100,
  seconds: 0,
  speed: 0,
  progress: 0,
  fps: 0,
  bodies: 0,
  physicsMs: 0,
};
export function GameHud({
  bridge,
  showFps,
  platform,
  playing,
}: {
  bridge: GameBridge;
  showFps: boolean;
  platform: string;
  playing: boolean;
}) {
  const [stats, setStats] = useState(initial);
  useEffect(() => bridge.on('telemetry', setStats), [bridge]);
  return (
    <>
      <div className={styles.hud}>
        <div className={styles.cargo}>
          <span className={styles.cup} aria-hidden="true">
            <img src={artUrl('coffee.png')} width="40" height="44" alt="" draggable={false} />
          </span>
          <div>
            <span className={styles.small}>Кофе в пути</span>
            <strong>
              {Math.ceil(stats.integrity)}
              <small>%</small>
            </strong>
          </div>
          <meter
            min={0}
            max={100}
            low={30}
            high={60}
            optimum={100}
            value={stats.integrity}
            aria-label="Сохранность кофе"
          />
        </div>
        <div className={styles.route}>
          <span>
            Первый кофе <b>{Math.round(stats.progress * 100)}%</b>
          </span>
          <progress max="1" value={stats.progress} aria-label="Путь до финиша" />
        </div>
        <div className={styles.time}>
          <strong>
            {Math.floor(stats.seconds / 60)}:
            {String(Math.floor(stats.seconds % 60)).padStart(2, '0')}
          </strong>
          <span>{Math.round(stats.speed)} км/ч</span>
        </div>
        <button
          className={styles.iconButton}
          aria-label="Пауза"
          disabled={!playing}
          onClick={() => bridge.command('pause')}
        >
          <Icon name="pause" />
        </button>
      </div>
      {playing ? <TouchControls bridge={bridge} /> : null}
      {import.meta.env.DEV && showFps ? (
        <output className={styles.debug}>
          {stats.fps.toFixed(0)} FPS · {stats.bodies} тел · {stats.physicsMs.toFixed(2)} ms/шаг
          <br />v{BUILD_VERSION} · {platform}
        </output>
      ) : null}
    </>
  );
}
