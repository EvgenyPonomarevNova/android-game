import type { LevelResult } from '../../platform/SaveService';
import type { ContractDefinition } from '../../game/core/Contracts';
import { starterChoiceAvailable } from '../../game/core/Career';
import { PART_CATALOG, VEHICLE_MODELS } from '../../game/vehicle/Tuning';
import type { CareerState, VehicleSetup } from '../../shared/Progression';
import { integrityPercent } from '../../shared/GameFeedback';
import { Icon, CakeMark, CoffeeMark } from '../components/Icon';
import ui from '../ui.module.css';
import styles from '../hub.module.css';
import { CareerSummary } from '../components/CareerSummary';
import { VehiclePreview } from '../components/VehiclePreview';

export function Menu({
  ready,
  play,
  navigate,
  best,
  career,
  contract,
  setup,
}: {
  ready: boolean;
  play: () => void;
  navigate: (screen: 'garage' | 'profile' | 'settings' | 'orders') => void;
  best?: LevelResult;
  career: CareerState;
  contract: ContractDefinition;
  setup: VehicleSetup;
}) {
  const gift = starterChoiceAvailable(career);
  const vehicle = VEHICLE_MODELS.find((v) => v.id === setup.vehicleId)!;
  const equipped = Object.values(setup.parts).map(
    (id) => PART_CATALOG.find((p) => p.id === id)!.name,
  );
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
      <CareerSummary career={career} />
      <div className={styles.body}>
        <section className={styles.scene} aria-label="Курьер и установленный транспорт">
          <div className={styles.preview}>
            <VehiclePreview
              setup={setup}
              cargo={contract.theme === 'rain-evening' ? 'hot-meal' : 'surprise'}
            />
          </div>
          <div className={styles.vehicle}>
            <strong>{vehicle.name}</strong>
            <span>{equipped.join(' · ')}</span>
            {gift && <button onClick={() => navigate('garage')}>Подарок в гараже →</button>}
          </div>
        </section>
        <article className={styles.contract} aria-labelledby="hub-order-title">
          <div className={styles.contractBody}>
            <p className={styles.orderLabel}>
              ЗАКАЗ №{contract.number} · {contract.difficultyLabel}
            </p>
            <h2 id="hub-order-title">{contract.title}</h2>
            <div className={styles.cargoLine}>
              <span>
                {contract.theme === 'rain-evening' ? (
                  <span aria-hidden="true">♨</span>
                ) : (
                  <>
                    <CakeMark />
                    <CoffeeMark />
                  </>
                )}
                {contract.cargoLabel}
              </span>
              <strong>
                {contract.rewardCoins} ●<small>первая доставка</small>
              </strong>
            </div>
            <p className={styles.story}>«{contract.dispatcher}»</p>
            <p className={styles.conditions}>{contract.description}</p>
            {best ? (
              <p className={styles.best}>
                <strong>{medalName ?? 'Доставлено'}</strong>
                <span>
                  {integrityPercent(best.integrity)}% · {best.seconds.toFixed(1)} с — личный рекорд
                </span>
              </p>
            ) : (
              <p className={styles.firstRun}>
                Первая доставка: {contract.rewardCoins} монет + {contract.rewardXp} XP. Медали и
                испытания дают бонусы.
              </p>
            )}
          </div>
          <button className={ui.primary} disabled={!ready} onClick={play}>
            <Icon name="play" />
            {ready ? 'Взять заказ' : 'Загружаем район…'}
          </button>
        </article>
      </div>
      <nav className={styles.nav} aria-label="Главное меню">
        <button onClick={() => navigate('orders')} disabled={!ready}>
          <Icon name="forward" />
          Заказы
        </button>
        <button onClick={() => navigate('garage')}>
          <Icon name="garage" />
          Гараж{gift ? ' · подарок' : ''}
        </button>
        <button onClick={() => navigate('profile')}>
          <span aria-hidden="true">★</span>Профиль
        </button>
        <button onClick={() => navigate('settings')}>
          <Icon name="settings" />
          Настройки
        </button>
      </nav>
    </main>
  );
}
