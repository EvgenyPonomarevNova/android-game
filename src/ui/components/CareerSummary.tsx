import { levelProgress } from '../../game/core/Career';
import type { CareerState } from '../../shared/Progression';
import styles from '../career.module.css';

export function CareerSummary({ career }: { career: CareerState }) {
  const progress = levelProgress(career.xp);
  return (
    <div className={styles.summary}>
      <div>
        <small>Уровень {progress.level}</small>
        <strong>{career.xp} XP</strong>
        <progress
          value={progress.required ? progress.current : 1}
          max={progress.required || 1}
          aria-label="Опыт до следующего уровня"
        />
        <small>
          {progress.nextAt === null
            ? 'Высший уровень этой главы'
            : `${progress.current} / ${progress.required} XP до уровня ${progress.level + 1}`}
        </small>
      </div>
      <div>
        <small>Монеты</small>
        <strong className={styles.gold}>
          {career.coins} <span aria-hidden="true">●</span>
        </strong>
      </div>
      <div>
        <small>Репутация</small>
        <strong>{career.reputation === null ? '—' : `${career.reputation.toFixed(1)} ★`}</strong>
        <small>
          {career.reputation === null
            ? 'Формируется после доставки'
            : `Успешных доставок: ${career.successfulDeliveries}`}
        </small>
      </div>
    </div>
  );
}
