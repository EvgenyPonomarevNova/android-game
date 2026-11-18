import { CHALLENGES, SKILLS } from '../../config/career';
import { CONTRACTS } from '../../game/core/Contracts';
import type { CareerState, SkillId } from '../../shared/Progression';
import { integrityPercent } from '../../shared/GameFeedback';
import { CareerSummary } from '../components/CareerSummary';
import styles from '../career.module.css';

export function ProfileScreen({
  career,
  busy,
  toggleSkill,
  back,
}: {
  career: CareerState;
  busy: boolean;
  toggleSkill: (id: SkillId) => void;
  back: () => void;
}) {
  const earned = [...new Set(Object.values(career.contracts).flatMap((c) => c.challenges))];
  return (
    <main className={styles.screen} aria-labelledby="profile-title">
      <header className={styles.header}>
        <button onClick={back}>← На смену</button>
        <div>
          <p>ЛИЧНОЕ ДЕЛО</p>
          <h1 id="profile-title">Профиль курьера</h1>
        </div>
        <span>Район 01 · локальная карьера</span>
      </header>
      <CareerSummary career={career} />
      <div className={styles.profileGrid}>
        <section className={styles.profilePane}>
          <h2>Заказы и мастерство</h2>
          <p className={styles.muted}>Успешных доставок: {career.successfulDeliveries}</p>
          {CONTRACTS.map((c) => {
            const best = career.contracts[c.levelId];
            return (
              <article className={styles.record} key={c.levelId}>
                <small>КОНТРАКТ №{c.number}</small>
                <h3>{c.title}</h3>
                {best?.completions ? (
                  <>
                    <strong className={styles.gold}>
                      {'★'.repeat(best.bestStars)}
                      {'☆'.repeat(3 - best.bestStars)}
                    </strong>
                    <p>
                      {integrityPercent(best.bestIntegrity)}% · {best.bestSeconds.toFixed(1)} с
                      {best.bestTemperature !== undefined
                        ? ` · ${Math.round(best.bestTemperature)}°C`
                        : ''}
                    </p>
                    <small>Выполнено: {best.completions}</small>
                  </>
                ) : (
                  <p className={styles.muted}>Успешной доставки пока нет.</p>
                )}
              </article>
            );
          })}
          <h2>Выполненные испытания</h2>
          {earned.length ? (
            <div className={styles.achievements}>
              {earned.map((id) => (
                <article key={id}>
                  <strong>✓ {CHALLENGES[id].name}</strong>
                  <small>{CHALLENGES[id].description}</small>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.muted}>После доставки здесь появятся заслуженные достижения.</p>
          )}
        </section>
        <section className={styles.profilePane}>
          <h2>Навыки</h2>
          <p className={styles.muted}>
            Открытые навыки включаются вручную и действуют со следующего заезда.
          </p>
          {(Object.keys(SKILLS) as SkillId[]).map((id) => {
            const skill = SKILLS[id],
              unlocked = career.unlockedSkills.includes(id),
              enabled = career.enabledSkills.includes(id);
            const measured =
              id === 'soft_landing'
                ? career.mastery.cleanLandings
                : career.mastery.balancedSections;
            return (
              <article className={styles.skill} key={id}>
                <div>
                  <h3>{skill.name}</h3>
                  <span className={unlocked ? styles.gold : styles.muted}>
                    {unlocked ? 'Открыт' : 'Закрыт'}
                  </span>
                </div>
                <p>{skill.description}</p>
                <small>{skill.requirement}</small>
                <small>
                  Лучший заезд: {Math.min(measured, skill.threshold)} / {skill.threshold}
                </small>
                <button
                  className={styles.secondary}
                  role="switch"
                  aria-checked={enabled}
                  disabled={!unlocked || busy}
                  onClick={() => toggleSkill(id)}
                >
                  {unlocked
                    ? enabled
                      ? 'Включён · выключить'
                      : 'Выключен · включить'
                    : 'Нужно выполнить условие'}
                </button>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
