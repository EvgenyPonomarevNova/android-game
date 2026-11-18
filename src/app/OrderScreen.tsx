import { COFFEE_ORDER, rateDelivery } from '../game/core/Orders';
import { testLevel, type LevelData } from '../game/levels/testLevel';
import type { LevelResult } from '../platform/SaveService';
import { integrityPercent } from '../shared/GameFeedback';
import styles from './slice.module.css';

export function OrderScreen({
  best,
  previousRouteBest,
  ready,
  start,
  back,
  level = testLevel,
  levels = [testLevel],
  selectLevel,
}: {
  best?: LevelResult;
  previousRouteBest?: LevelResult;
  ready: boolean;
  start: () => void;
  back: () => void;
  level?: LevelData;
  levels?: readonly LevelData[];
  selectLevel?: (level: LevelData) => void;
}) {
  const order = { ...COFFEE_ORDER, ...level.difficulty, title: level.name, levelId: level.id };
  const firstContract = level.id === testLevel.id;
  const cargoLabel = level.cargo === 'surprise' ? 'Мини-торт + два напитка' : 'Горячий кофе';
  const from = level.start.x,
    to = level.finish.x;
  const points = [
    [from, level.ground[0]![1]],
    ...level.ground.filter(([x]) => x > from && x < to),
    [to, level.finish.y],
  ];
  // Deep out-of-bounds pits are shown schematically so rideable relief stays readable.
  const low = Math.max(-4, Math.min(...points.map((point) => point[1]!)));
  const high = Math.max(
    ...points.map((point) => point[1]!),
    ...(level.platforms ?? []).flatMap((platform) => platform.points.map((point) => point[1])),
  );
  const previewY = (y: number) => 88 - ((Math.max(low, y) - low) / Math.max(1, high - low)) * 64;
  const line = points
    .map(([x, y]) => `${16 + ((x! - from) / (to - from)) * 568},${previewY(y!)}`)
    .join(' ');
  return (
    <div className={styles.scrim}>
      <section className={`${styles.panel} ${styles.orderPanel}`} aria-labelledby="order-title">
        <button className={styles.back} onClick={back}>
          ← В меню
        </button>
        <div className={styles.orderBody}>
          {levels.length > 1 && selectLevel ? (
            <label className={styles.levelPicker}>
              Контракт
              <select
                value={level.id}
                onChange={(event) => {
                  const selected = levels.find((item) => item.id === event.target.value);
                  if (selected) selectLevel(selected);
                }}
              >
                {levels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className={styles.orderGrid}>
            <div>
              <p className={styles.eyebrow}>
                {firstContract ? 'КОНТРАКТ №001' : 'КОНТРАКТ'} · СПАЛЬНЫЙ РАЙОН
              </p>
              <h1 id="order-title">{order.title}</h1>
              <p className={styles.lead}>
                {firstContract
                  ? order.description
                  : `Новый маршрут через дворы. Довези заказ, выбирая скорость и контролируя баланс.`}
              </p>
              <div className={styles.destination}>
                <span>ЗАКАЗ</span>
                <strong>
                  {cargoLabel} → {firstContract ? order.customer : 'точка доставки'}
                </strong>
              </div>
              <p className={styles.hint}>
                Дедлайн — {order.deadlineSeconds} с.{' '}
                {level.cargo === 'surprise'
                  ? 'Торт — 60% оценки, напитки — 40%.'
                  : 'Береги кофе на неровностях.'}{' '}
                {firstContract
                  ? 'На базовом «Дворике-50» доступно золото.'
                  : 'Цели медалей указаны справа.'}
              </p>
            </div>
            <div className={styles.routeCard}>
              <div className={styles.routeHeading}>
                <strong>Схема маршрута</strong>
                <span>{Math.round(to - from)} м</span>
              </div>
              <svg
                className={styles.routePreview}
                viewBox="0 0 600 110"
                role="img"
                aria-label="Профиль высоты трассы от старта до финиша"
              >
                <path
                  d={`M 16 106 L ${line.replaceAll(' ', ' L ')} L 584 106 Z`}
                  fill="#ffd12b33"
                />
                <polyline
                  points={line}
                  fill="none"
                  stroke="#ffd12b"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="16" cy={previewY(points[0]![1]!)} r="6" fill="#387449" />
                {(level.platforms ?? []).map((platform) => (
                  <polyline
                    key={platform.id}
                    points={platform.points
                      .map(([x, y]) => `${16 + ((x - from) / (to - from)) * 568},${previewY(y)}`)
                      .join(' ')}
                    fill="none"
                    stroke="#79dda4"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                ))}
                <path
                  d={`M584 ${previewY(level.finish.y)}v-28h-24v14h24`}
                  fill="#ffd12b"
                  stroke="#b8c8da"
                  strokeWidth="3"
                />
              </svg>
              <div className={styles.routeEnds}>
                <span>{level.fork ? 'Жёлтый: нижний объезд' : 'Старт'}</span>
                <span>{level.fork ? 'Зелёный: короткий прыжок' : 'Доставка'}</span>
              </div>
              <div className={styles.starGoals}>
                <p>
                  <span>★</span>
                  <strong>Бронза · доставить</strong>
                  <small>
                    от {order.minimumIntegrity}% · до {order.deadlineSeconds} с
                  </small>
                </p>
                <p>
                  <span>★★</span>
                  <strong>Серебро · без продолжения</strong>
                  <small>
                    от {order.goodIntegrity}% · до {order.silverSeconds} с
                  </small>
                </p>
                <p>
                  <span>★★★</span>
                  <strong>Золото · чисто и быстро</strong>
                  <small>
                    {order.excellentIntegrity}% · до {order.targetSeconds} с
                  </small>
                </p>
              </div>
            </div>
          </div>
          {best ? (
            <p className={styles.best}>
              Личный рекорд:{' '}
              <strong>
                {best.stars ?? rateDelivery({ ...best, levelId: order.levelId }).stars}/3 ★ ·{' '}
                {integrityPercent(best.integrity)}% заказа · {best.seconds.toFixed(1)} с
              </strong>
            </p>
          ) : null}
          {previousRouteBest ? (
            <details className={styles.legacy}>
              <summary>Архив кофейной миссии</summary>
              <p>
                {integrityPercent(previousRouteBest.integrity)}% кофе ·{' '}
                {previousRouteBest.seconds.toFixed(1)} с. Этот результат сохранён отдельно.
              </p>
            </details>
          ) : null}
        </div>
        <div className={styles.orderActions}>
          <p className={styles.controlHint}>
            <kbd>W</kbd>
            <kbd>S</kbd> скорость <span>·</span> <kbd>A</kbd>
            <kbd>D</kbd> баланс
            <br />
            <small>На сенсорном экране — две педали и два наклона.</small>
          </p>
          <button className={styles.primary} disabled={!ready} onClick={start}>
            {ready ? 'На маршрут →' : 'Готовим маршрут…'}
          </button>
        </div>
      </section>
    </div>
  );
}
