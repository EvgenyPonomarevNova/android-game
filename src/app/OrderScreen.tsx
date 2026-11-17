import { COFFEE_ORDER, rateDelivery } from '../game/core/Orders';
import type { LevelResult } from '../platform/SaveService';
import styles from './slice.module.css';

export function OrderScreen({
  best,
  ready,
  start,
  back,
}: {
  best?: LevelResult;
  ready: boolean;
  start: () => void;
  back: () => void;
}) {
  return (
    <section className={styles.panel} aria-labelledby="order-title">
      <button className={styles.back} onClick={back}>
        ← В меню
      </button>
      <h1 id="order-title">{COFFEE_ORDER.title}</h1>
      <p>{COFFEE_ORDER.description}</p>
      <dl className={styles.details}>
        <div>
          <dt>Куда</dt>
          <dd>{COFFEE_ORDER.customer}</dd>
        </div>
        <div>
          <dt>Сохранность</dt>
          <dd>Не меньше 30%</dd>
        </div>
        <div>
          <dt>Три звезды</dt>
          <dd>90% кофе за 40 секунд</dd>
        </div>
      </dl>
      {best ? (
        <p className={styles.best}>
          Лучший заезд:{' '}
          {best.stars ?? rateDelivery({ ...best, levelId: COFFEE_ORDER.levelId }).stars} / 3 звезды
          · {Math.round(best.integrity)}% · {best.seconds.toFixed(1)} с
        </p>
      ) : null}
      <button className={styles.primary} disabled={!ready} onClick={start}>
        Взять заказ
      </button>
      <p className={styles.hint}>
        Газ — справа. Тормоз удерживай для заднего хода.
        <br />
        Наклонами держи равновесие в прыжке.
      </p>
    </section>
  );
}
