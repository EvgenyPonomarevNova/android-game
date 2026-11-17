import type { RatedResult } from '../game/core/Orders';
import styles from './slice.module.css';

const failures: Record<string, string> = {
  'cargo-destroyed': 'Кофе разлился. Перед кочками отпускай газ.',
  'cargo-rejected': 'Доехали, но кофе осталось слишком мало. Нужна сохранность от 30%.',
  overturned: 'Скутер перевернулся. Наклоняйся в сторону приземления.',
  'out-of-bounds': 'Слетели с маршрута. Притормози перед трамплином.',
};
export function ResultScreen({
  result,
  saved,
  retry,
  next,
}: {
  result: RatedResult;
  saved: 'saving' | 'saved' | 'failed';
  retry: () => void;
  next: () => void;
}) {
  return (
    <div className={styles.scrim}>
      <section
        className={styles.result}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <h1 id="result-title">{result.success ? 'Кофе доставлен!' : 'Не довезли…'}</h1>
        <div className={styles.stars} aria-label={`${result.stars} из 3 звёзд`}>
          {[1, 2, 3].map((n) => (
            <svg
              key={n}
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill={n <= result.stars ? '#ffd12b' : '#d9d5cb'}
              stroke="#192437"
              strokeWidth="1.2"
            >
              <path d="m12 2 3 6.5 7 1-5 5 1.2 7-6.2-3.3L5.8 21l1.2-6.5-5-5 7-1Z" />
            </svg>
          ))}
        </div>
        <p>
          {result.success
            ? result.stars === 3
              ? 'Ни капли суеты. Отличная доставка!'
              : 'Заказ принят! Попробуй довезти ещё аккуратнее.'
            : (failures[result.reason ?? ''] ??
              'Ничего, следующий кофе доедет. Попробуем ещё раз?')}
        </p>
        <dl className={styles.details}>
          <div>
            <dt>Кофе</dt>
            <dd>{Math.round(result.integrity)}%</dd>
          </div>
          <div>
            <dt>Время</dt>
            <dd>{result.seconds.toFixed(1)} с</dd>
          </div>
          <div>
            <dt>Очки</dt>
            <dd>{result.score}</dd>
          </div>
        </dl>
        <p className={styles.hint}>
          {result.success
            ? saved === 'saving'
              ? 'Сохраняем результат…'
              : saved === 'saved'
                ? 'Лучший результат сохранён на устройстве.'
                : 'Не удалось сохранить результат. Можно продолжить играть.'
            : 'Лучший результат остался с тобой.'}
        </p>
        <button autoFocus className={styles.primary} onClick={retry}>
          Попробовать ещё
        </button>
        <button className={styles.secondary} onClick={next}>
          Продолжить к заказам
        </button>
      </section>
    </div>
  );
}
