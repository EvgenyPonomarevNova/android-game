import { COFFEE_ORDER, deliveryAdvice, MEDAL_NAMES, type RatedResult } from '../game/core/Orders';
import { integrityPercent } from '../shared/GameFeedback';
import styles from './slice.module.css';
import { CHALLENGES, SKILLS } from '../config/career';
import { CONTRACTS } from '../game/core/Contracts';
import { starterChoiceAvailable } from '../game/core/Career';
import type { CareerState, RewardReceipt } from '../shared/Progression';

const failures: Record<string, string> = {
  'cargo-destroyed': 'Заказ не пережил удар',
  'cargo-rejected': 'Сохранность ниже условия',
  deadline: 'Время доставки истекло',
  cold: 'Заказ успел остыть',
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
  reward,
  career,
  garage,
}: {
  result: RatedResult;
  newBest: boolean;
  saved: 'saving' | 'saved' | 'failed';
  retry: () => void;
  next: () => void;
  attempt?: number;
  checkpoint?: () => void;
  draft?: boolean;
  reward?: RewardReceipt;
  career?: CareerState;
  garage?: () => void;
}) {
  const progress = result.success ? 100 : Math.min(99, Math.round((result.progress ?? 0) * 100));
  const contract = CONTRACTS.find((c) => c.levelId === result.levelId);
  const gift = !draft && career && starterChoiceAvailable(career);
  return (
    <div className={styles.scrim}>
      <section
        className={styles.result}
        data-outcome={result.success ? 'success' : 'failure'}
        data-career={!draft && (result.success || !!reward)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <p className={styles.eyebrow}>
          {draft ? 'ТЕСТ ЧЕРНОВИКА' : `КОНТРАКТ №${contract?.number ?? '—'}`} · ПОПЫТКА {attempt}
        </p>
        <h1 id="result-title">
          {result.success
            ? 'Заказ доставлен!'
            : (failures[result.reason ?? ''] ?? 'Ещё одна попытка?')}
        </h1>
        <div className={styles.resultBody}>
          <div className={styles.resultSummary}>
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
              {result.temperature !== undefined && (
                <span>
                  Температура: {Math.round(result.temperature)}°C
                  {result.rules?.minimumTemperature !== undefined
                    ? ` · минимум ${result.rules.minimumTemperature}°C`
                    : ''}
                </span>
              )}
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
                      {
                        {
                          cake: 'Мини-торт',
                          drinks: 'Два напитка',
                          noodles: 'Две порции лапши',
                          soup: 'Суп',
                        }[part.id]
                      }{' '}
                      · {Math.round(part.weight * 100)}% оценки
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
          </div>
          <div className={styles.resultCareer}>
            {!draft && reward && (
              <section className={styles.reward} aria-label="Награда за заезд">
                <div>
                  <strong>+{reward.coins} монет</strong>
                  <strong>+{reward.xp} XP</strong>
                  {reward.newLevel !== null && <strong>Уровень {reward.newLevel}</strong>}
                </div>
                <p>«{reward.review}»</p>
                {reward.reputationAfter !== null && (
                  <small>Репутация: {reward.reputationAfter.toFixed(1)} ★</small>
                )}
                {reward.challenges.length > 0 && (
                  <p>{reward.challenges.map((id) => `✓ ${CHALLENGES[id].name}`).join(' · ')}</p>
                )}
                {reward.unlockedSkills.length > 0 && (
                  <p>
                    Открыты навыки: {reward.unlockedSkills.map((id) => SKILLS[id].name).join(', ')}.
                    Включи их в профиле.
                  </p>
                )}
              </section>
            )}
            {gift && garage && (
              <aside className={styles.resultGift}>
                <div>
                  <strong>Первое улучшение — бесплатно</strong>
                  <p>
                    Мягкая подвеска для неровностей или всепогодные шины для мокрого асфальта.
                    Альтернативу позже можно купить за монеты.
                  </p>
                </div>
                <button className={styles.secondary} disabled={saved !== 'saved'} onClick={garage}>
                  Выбрать в гараже →
                </button>
              </aside>
            )}
            <p className={styles.hint}>
              {draft
                ? 'Тестовый заезд не меняет игровые рекорды.'
                : result.success
                  ? saved === 'saving'
                    ? 'Сохраняем результат и награду…'
                    : saved === 'saved'
                      ? 'Результат и карьера сохранены.'
                      : 'Награда не зачислена. Повтори сохранение в уведомлении или продолжи без неё.'
                  : 'Рекорд не потерян. Попробуй пройти этот участок иначе.'}
            </p>
          </div>
        </div>
        {!result.success && result.checkpointAvailable && checkpoint ? (
          <button className={styles.checkpoint} onClick={checkpoint}>
            Продолжить с контрольной точки{' '}
            <small>Один раз · −15% сохранности · максимум бронза · время сохраняется</small>
          </button>
        ) : null}
        <div className={styles.resultActions}>
          <button
            autoFocus
            className={styles.primary}
            disabled={!draft && result.success && saved === 'saving'}
            onClick={retry}
          >
            {result.success ? 'Улучшить результат' : 'Ещё попытка'}{' '}
            <span aria-hidden="true">↻</span>
          </button>
          <button
            className={styles.secondary}
            disabled={!draft && result.success && saved === 'saving'}
            onClick={next}
          >
            {draft
              ? 'В мастерскую'
              : result.success && saved === 'failed'
                ? 'Дальше без награды'
                : 'К контрактам'}
          </button>
        </div>
        <span className={styles.retryHint}>R — быстрый повтор</span>
      </section>
    </div>
  );
}
