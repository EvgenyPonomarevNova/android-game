import { COFFEE_ORDER, deliveryAdvice, MEDAL_NAMES, type RatedResult } from '../game/core/Orders';
import { integrityPercent } from '../shared/GameFeedback';
import styles from './slice.module.css';

const failures: Record<string, string> = {
  'cargo-destroyed': 'Заказ не пережил удар',
  'cargo-rejected': 'Сохранность ниже условия',
  deadline: 'Не успел к празднику',
  overturned: 'Не удержал равновесие',
  'out-of-bounds': 'За пределами маршрута',
};
export function ResultScreen({
  result,
  newBest,
  saved,
  retry,
  next,
  attempt = 1,
  checkpoint,
  draft = false,
}: {
  result: RatedResult;
  newBest: boolean;
  saved: 'saving' | 'saved' | 'failed';
  retry: () => void;
  next: () => void;
  attempt?: number;
  checkpoint?: () => void;
  draft?: boolean;
}) {
  const progress = result.success ? 100 : Math.min(99, Math.round((result.progress ?? 0) * 100));
  return (
    <div className={styles.scrim}>
      <section
        className={styles.result}
        data-outcome={result.success ? 'success' : 'failure'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <p className={styles.eyebrow}>
          {draft ? 'ТЕСТ ЧЕРНОВИКА' : 'МИССИЯ 01'} · ПОПЫТКА {attempt}
        </p>
        <h1 id="result-title">
          {result.success
            ? 'Заказ доставлен!'
            : (failures[result.reason ?? ''] ?? 'Ещё одна попытка?')}
        </h1>
        <div className={styles.resultBody}>
          {newBest ? <p className={styles.record}>↗ Новый личный рекорд</p> : null}
          {!draft && result.medal ? (
            <p className={styles.medal} data-medal={result.medal}>
              {MEDAL_NAMES[result.medal]}
            </p>
          ) : null}
          {result.success && !draft ? (
            <div className={styles.stars} aria-label={`${result.stars} из 3 звёзд`}>
              {[1, 2, 3].map((n) => (
                <svg
                  key={n}
                  style={{ animationDelay: `${n * 65}ms` }}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill={n <= result.stars ? '#ffd12b' : '#3c4f67'}
                  stroke="#b8c8da"
                  strokeWidth="1.2"
                >
                  <path d="m12 2 3 6.5 7 1-5 5 1.2 7-6.2-3.3L5.8 21l1.2-6.5-5-5 7-1Z" />
                </svg>
              ))}
            </div>
          ) : (
            <div className={styles.runProgress}>
              <div>
                <strong>{progress}% маршрута</strong>
                <span>до следующей попытки — один клик</span>
              </div>
              <progress aria-label="Пройденная часть маршрута" max="100" value={progress} />
            </div>
          )}
          <dl className={styles.resultStats}>
            <div>
              <dt>Сохранность</dt>
              <dd>
                {integrityPercent(result.integrity)}
                <small>%</small>
              </dd>
            </div>
            <div>
              <dt>Время</dt>
              <dd>
                {result.seconds.toFixed(1)}
                <small>с</small>
              </dd>
            </div>
            <div>
              <dt>{draft ? 'Падений' : result.success ? 'Очки' : 'Нужно довезти'}</dt>
              <dd>
                {draft
                  ? (result.falls ?? 0)
                  : result.success
                    ? result.score
                    : (result.rules?.minimumIntegrity ?? COFFEE_ORDER.minimumIntegrity)}
                <small>{result.success || draft ? '' : '%'}</small>
              </dd>
            </div>
          </dl>
          <div className={styles.runDetails}>
            <span>Падений: {result.falls ?? 0}</span>
            <span>{result.checkpointUsed ? 'С контрольной точки' : 'Без продолжения'}</span>
            {result.routeChoice ? (
              <span>{result.routeChoice === 'safe' ? 'Нижний объезд' : 'Короткий прыжок'}</span>
            ) : null}
          </div>
          {result.cargoComponents?.length ? (
            <details className={styles.cargoDetails}>
              <summary>Что доехало до подъезда</summary>
              {result.cargoComponents.map((part) => (
                <div key={part.id}>
                  <span>
                    {part.id === 'cake' ? 'Мини-торт' : 'Два напитка'} ·{' '}
                    {Math.round(part.weight * 100)}% оценки
                  </span>
                  <strong>{integrityPercent(part.integrity)}%</strong>
                </div>
              ))}
            </details>
          ) : null}
          <p className={styles.advice}>
            {draft
              ? 'Проверь аккуратный и рискованный проход, ошибки и рестарт. Один успешный заезд ещё не означает готовность уровня.'
              : deliveryAdvice(result)}
          </p>
          <p className={styles.hint}>
            {draft
              ? 'Тестовый заезд не меняет игровые рекорды.'
              : result.success
                ? saved === 'saving'
                  ? 'Сохраняем результат…'
                  : saved === 'saved'
                    ? 'Личный рекорд сохранён.'
                    : 'Не удалось сохранить результат. Играть можно дальше.'
                : 'Рекорд не потерян. Попробуй пройти этот участок иначе.'}
          </p>
        </div>
        {!result.success && result.checkpointAvailable && checkpoint ? (
          <button className={styles.checkpoint} onClick={checkpoint}>
            Продолжить с контрольной точки{' '}
            <small>Один раз · −15% сохранности · максимум бронза · время сохраняется</small>
          </button>
        ) : null}
        <div className={styles.resultActions}>
          <button autoFocus className={styles.primary} onClick={retry}>
            {result.success ? 'Улучшить результат' : 'Ещё попытка'}{' '}
            <span aria-hidden="true">↻</span>
          </button>
          <button className={styles.secondary} onClick={next}>
            {draft ? 'В мастерскую' : 'К миссии'}
          </button>
        </div>
        <span className={styles.retryHint}>R — быстрый повтор</span>
      </section>
    </div>
  );
}
