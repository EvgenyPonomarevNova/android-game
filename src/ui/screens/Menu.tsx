import type { LevelResult } from '../../platform/SaveService';
import { COFFEE_ORDER } from '../../game/core/Orders';
import { integrityPercent } from '../../shared/GameFeedback';
import { Icon, CakeMark, CoffeeMark } from '../components/Icon';
import ui from '../ui.module.css';
import styles from '../hub.module.css';

export function Menu({
  ready,
  play,
  navigate,
  best,
}: {
  ready: boolean;
  play: () => void;
  navigate: (screen: 'garage' | 'settings') => void;
  best?: LevelResult;
}) {
  const deadline = COFFEE_ORDER.deadlineSeconds;
  const medal =
    best?.medal ??
    (best?.stars === 3
      ? 'gold'
      : best?.stars === 2
        ? 'silver'
        : best?.stars === 1
          ? 'bronze'
          : undefined);
  const medalName = medal
    ? { gold: 'Золото', silver: 'Серебро', bronze: 'Бронза' }[medal]
    : undefined;
  return (
    <main className={styles.hub}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <strong>НЕ РАЗЛЕЙ!</strong>
          <span>РАЙОН 01 / СПАЛЬНЫЙ</span>
        </div>
        <h1>НА СМЕНЕ</h1>
      </header>
      <div className={styles.body}>
        <section className={styles.scene} aria-label="Курьер и базовый скутер">
          <div className={styles.vehicle}>
            <strong>Дворик-50</strong>
            <span>Базовая комплектация</span>
          </div>
        </section>
        <article className={styles.contract} aria-labelledby="hub-order-title">
          <div className={styles.contractBody}>
            <p className={styles.orderLabel}>ЗАКАЗ №001 · ТЕХНИЧНЫЙ МАРШРУТ</p>
            <h2 id="hub-order-title">{COFFEE_ORDER.title}</h2>
            <div className={styles.cargoLine}>
              <span>
                <CakeMark />
                <CoffeeMark />
                Торт + 2 напитка
              </span>
              <strong>
                {Math.floor(deadline / 60)}:{String(deadline % 60).padStart(2, '0')}
              </strong>
            </div>
            <p className={styles.story}>
              «Праздник через три минуты. Двор перекрыт. Успеешь объехать?»
            </p>
            <p className={styles.conditions}>
              Довези не меньше {COFFEE_ORDER.minimumIntegrity}% заказа. Выбирай: нижний объезд или
              верхний прыжок.
            </p>
            {best ? (
              <p className={styles.best}>
                <strong>{medalName ?? 'Доставлено'}</strong>
                <span>
                  {integrityPercent(best.integrity)}% · {best.seconds.toFixed(1)} с — личный рекорд
                </span>
              </p>
            ) : (
              <p className={styles.firstRun}>Первый заказ ждёт своего курьера.</p>
            )}
          </div>
          <button className={ui.primary} disabled={!ready} onClick={play}>
            <Icon name="play" />
            {ready ? 'Взять заказ' : 'Загружаем район…'}
          </button>
        </article>
      </div>
      <nav className={styles.nav} aria-label="Главное меню">
        <button onClick={play} disabled={!ready}>
          <Icon name="forward" />
          Заказы
        </button>
        <button onClick={() => navigate('settings')}>
          <Icon name="settings" />
          Настройки
        </button>
      </nav>
    </main>
  );
}
