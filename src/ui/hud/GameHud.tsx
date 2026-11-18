import { useEffect, useRef, useState } from 'react';
import type { GameBridge, Telemetry } from '../../game/core/GameBridge';
import { Icon, CoffeeMark, CakeMark } from '../components/Icon';
import { TouchControls } from '../components/TouchControls';
import { integrityPercent, type CargoImpact } from '../../shared/GameFeedback';
import styles from '../ui.module.css';
import { testLevel } from '../../game/levels/testLevel';
import { routeGuide } from '../../game/rendering/routePresentation';
import type { Settings } from '../../platform/SaveService';

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
  playing,
  settings,
}: {
  bridge: GameBridge;
  showFps: boolean;
  platform: string;
  playing: boolean;
  settings?: Settings;
}) {
  const [stats, setStats] = useState(initial);
  const latest = useRef(initial);
  const [impact, setImpact] = useState<(CargoImpact & { at: number }) | null>(null);
  const [stressHigh, setStressHigh] = useState(false);
  useEffect(() => {
    const offTelemetry = bridge.on('telemetry', (next) => {
      latest.current = next;
      setStats(next);
      // Hysteresis prevents a warning from flickering around a single threshold.
      setStressHigh((shown) => (shown ? (next.stress ?? 0) > 0.45 : (next.stress ?? 0) >= 0.7));
    });
    const offImpact = bridge.on('impact', (event) =>
      setImpact({ ...event, at: latest.current.seconds }),
    );
    const offCommand = bridge.on('command', (command) => {
      if (command === 'checkpoint') {
        setImpact(null);
        setStressHigh(false);
      }
      if (command === 'start' || command === 'restart') {
        latest.current = initial;
        setStats(initial);
        setImpact(null);
        setStressHigh(false);
      }
    });
    return () => {
      offTelemetry();
      offImpact();
      offCommand();
    };
  }, [bridge]);
  const percent = integrityPercent(stats.integrity);
  const level = bridge.level ?? testLevel;
  const guide = routeGuide(level, stats.progress);
  const minimum = level.difficulty.minimumIntegrity;
  const hints = settings?.hints ?? bridge.preferences.hints;
  const critical = stats.integrity < minimum + 10;
  const components = stats.cargoComponents ?? [];
  const hasComponents = components.length > 0;
  const hot = level.cargo === 'hot-meal';
  const temperature = stats.temperature ?? level.temperature?.initial;
  const cold =
    hot && temperature !== undefined && temperature < (level.temperature?.minimum ?? 0) + 8;
  const remaining =
    stats.remainingSeconds ??
    (level.difficulty.deadlineSeconds === undefined
      ? undefined
      : Math.max(0, level.difficulty.deadlineSeconds - stats.seconds));
  const clock = Math.max(
    0,
    remaining === undefined ? Math.floor(stats.seconds) : Math.ceil(remaining),
  );
  const recent =
    impact && stats.seconds >= impact.at && stats.seconds - impact.at < 0.9 ? impact : null;
  const loss = integrityPercent(recent?.loss ?? 0);
  const impactText = recent
    ? `${recent.severity === 'heavy' ? 'Сильный удар' : recent.severity === 'medium' ? 'Удар' : 'Лёгкий толчок'}${loss > 0 ? ` · −${loss}% ${hasComponents ? 'заказа' : 'кофе'}` : recent.loss > 0 ? (hasComponents ? ' · груз повреждён' : ' · немного кофе пролилось') : ''}`
    : '';
  const warning =
    stats.integrity <= 0
      ? 'Заказ потерян'
      : critical
        ? `Береги груз — для доставки нужно ${minimum}%`
        : impactText ||
          (stressHigh
            ? 'Сбавь скорость перед следующим приземлением'
            : hints && stats.grounded === false && stats.progress > 0.015
              ? 'Выровняй колёса по дороге перед приземлением'
              : '');
  const feedback =
    warning ||
    (cold
      ? 'Еда остывает — выбирай короткий путь'
      : hints && playing && guide.showHint
        ? guide.current.hint
        : '');
  return (
    <>
      <div
        className={`${styles.hud} ${hasComponents ? styles.hudBundle : ''} ${hot ? styles.hudHot : ''}`}
      >
        <div
          className={styles.cargo}
          data-components={hasComponents}
          data-condition={critical ? 'critical' : stressHigh ? 'stress' : 'normal'}
        >
          <span className={styles.cup} aria-hidden="true">
            {hot ? (
              <span className={styles.hotMark}>♨</span>
            ) : hasComponents ? (
              <CakeMark />
            ) : (
              <CoffeeMark />
            )}
          </span>
          <div>
            <span className={styles.small}>Сохранность</span>
            <strong>
              {percent}
              <small>%</small>
            </strong>
          </div>
          {hasComponents ? (
            <div className={styles.cargoParts}>
              {components.map((part) => (
                <span key={part.id}>
                  {{ cake: 'Торт', drinks: 'Напитки', noodles: 'Лапша', soup: 'Суп' }[part.id]}{' '}
                  <b>{integrityPercent(part.integrity)}%</b>
                </span>
              ))}
            </div>
          ) : null}
          {hot && temperature !== undefined && (
            <div className={styles.temperature} data-cold={cold}>
              <span>Температура</span>
              <strong>{Math.round(temperature)}°C</strong>
              <meter
                aria-label="Температура заказа"
                min={level.temperature?.ambient ?? 0}
                max={level.temperature?.initial ?? 90}
                low={level.temperature?.minimum ?? 0}
                value={temperature}
              />
            </div>
          )}
          <meter
            min={0}
            max={100}
            low={minimum}
            high={Math.min(100, minimum + 25)}
            optimum={100}
            value={stats.integrity}
            aria-label="Сохранность заказа"
          />
        </div>
        <div className={styles.route}>
          <span>
            <strong>{guide.current.title}</strong>
            <b>{Math.round(stats.progress * 100)}%</b>
          </span>
          <div className={styles.routeMap}>
            <progress max={1} value={stats.progress} aria-label="Путь до доставки" />
            {guide.sections.map((section, index) => (
              <i
                key={`${section.x}:${section.title}`}
                data-passed={index <= guide.index}
                title={section.title}
                style={{
                  left: `${((section.x - level.start.x) / (level.finish.x - level.start.x)) * 100}%`,
                }}
              />
            ))}
          </div>
          <small>
            {stats.routeChoice === 'safe'
              ? 'Нижний объезд'
              : stats.routeChoice === 'risky'
                ? 'Верхний прыжок'
                : `Секция ${guide.index + 1} / ${guide.sections.length}`}
            {stats.checkpointUsed
              ? ' · КТ использована'
              : stats.checkpointAvailable
                ? ' · Доступна КТ'
                : ''}
          </small>
        </div>
        <div className={styles.time} data-urgent={remaining !== undefined && remaining <= 30}>
          <span>{remaining === undefined ? 'В пути' : 'Осталось'}</span>
          <strong>
            {Math.floor(clock / 60)}:{String(clock % 60).padStart(2, '0')}
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
      {feedback ? (
        <div
          className={`${styles.feedback} ${critical ? styles.feedbackCritical : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <Icon name={critical || stressHigh ? 'brake' : 'forward'} />
          <div>
            <strong>{warning ? 'Береги заказ' : guide.current.title}</strong>
            <span>{feedback}</span>
          </div>
        </div>
      ) : null}
      {playing ? <TouchControls bridge={bridge} settings={settings} /> : null}
      {import.meta.env.DEV && showFps ? (
        <output className={styles.debug} aria-label="Кадры в секунду">
          {stats.fps.toFixed(0)} FPS
        </output>
      ) : null}
    </>
  );
}
