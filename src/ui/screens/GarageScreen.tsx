import { useState } from 'react';
import { careerLevel, currentSetup, starterChoiceAvailable } from '../../game/core/Career';
import { PAINTS, PART_PRICES, VEHICLE_LEVELS, VEHICLE_PRICES } from '../../config/career';
import { PART_CATALOG, VEHICLE_MODELS, describeVehicleSetup } from '../../game/vehicle/Tuning';
import {
  STOCK_PARTS,
  type CareerState,
  type PaintId,
  type PartId,
  type StarterPart,
  type TuningSlot,
  type VehicleId,
  type VehicleSetup,
} from '../../shared/Progression';
import { VehiclePreview } from '../components/VehiclePreview';
import { CareerSummary } from '../components/CareerSummary';
import styles from '../career.module.css';

const slots: Record<TuningSlot, string> = {
  engine: 'Двигатель',
  suspension: 'Подвеска',
  tires: 'Шины',
  cargo_mount: 'Короб',
};
const fmt = (n: number) => Number(n.toFixed(2)).toLocaleString('ru-RU');
export function GarageScreen({
  career,
  busy,
  buyPart,
  equipPart,
  claimStarter,
  buyVehicle,
  selectVehicle,
  buyPaint,
  selectPaint,
  back,
}: {
  career: CareerState;
  busy: boolean;
  buyPart: (id: PartId) => void;
  equipPart: (id: PartId) => void;
  claimStarter: (id: StarterPart) => void;
  buyVehicle: (id: VehicleId) => void;
  selectVehicle: (id: VehicleId) => void;
  back: () => void;
  buyPaint: (id: PaintId) => void;
  selectPaint: (id: PaintId) => void;
}) {
  const [slot, setSlot] = useState<TuningSlot>('suspension');
  const [partId, setPart] = useState<PartId>();
  const [modelId, setModel] = useState<VehicleId>(career.selectedVehicle);
  const current = currentSetup(career);
  const fitted = { ...STOCK_PARTS, ...career.equippedByVehicle[modelId] };
  const part =
    PART_CATALOG.find((p) => p.id === partId && p.slot === slot) ??
    PART_CATALOG.find((p) => p.id === fitted[slot])!;
  const preview: VehicleSetup = {
    vehicleId: modelId,
    parts: { ...fitted, [slot]: part.id },
    skills: current.skills,
    paint: career.paint,
  };
  const stats = describeVehicleSetup(current),
    nextStats = describeVehicleSetup(preview);
  const owned = career.ownedParts.includes(part.id),
    selectedModel = career.selectedVehicle === modelId;
  const model = VEHICLE_MODELS.find((m) => m.id === modelId)!;
  const gift = starterChoiceAvailable(career);
  const giftPart = gift && (part.id === 'soft_suspension' || part.id === 'allweather_tires');
  const modelOwned = career.ownedVehicles.includes(modelId);
  const installed = selectedModel && current.parts[slot] === part.id;
  const level = careerLevel(career.xp);
  return (
    <main className={styles.screen} aria-labelledby="garage-title">
      <header className={styles.header}>
        <button onClick={back}>← На смену</button>
        <div>
          <p>МАСТЕРСКАЯ РАЙОНА</p>
          <h1 id="garage-title">Гараж</h1>
        </div>
        <span>Установка сохраняется сразу</span>
      </header>
      <CareerSummary career={career} />
      <div className={styles.garageGrid}>
        <section className={styles.showcase} aria-label="Предпросмотр комплектации">
          <div className={styles.modelTabs}>
            {VEHICLE_MODELS.map((m) => (
              <button
                key={m.id}
                aria-pressed={modelId === m.id}
                onClick={() => {
                  setModel(m.id);
                  setPart(undefined);
                }}
              >
                {m.name}
                {career.selectedVehicle === m.id ? ' · в заезде' : ''}
              </button>
            ))}
          </div>
          <div className={styles.vehicleArt}>
            <VehiclePreview setup={preview} />
          </div>
          <div className={styles.modelInfo}>
            <h2>{model.name}</h2>
            <p>{model.description}</p>
            {!selectedModel && (
              <button
                className={styles.secondary}
                disabled={
                  busy ||
                  (!modelOwned &&
                    (career.coins < VEHICLE_PRICES[modelId] || level < VEHICLE_LEVELS[modelId]))
                }
                onClick={() => (modelOwned ? selectVehicle(modelId) : buyVehicle(modelId))}
              >
                {modelOwned
                  ? 'Выбрать для заезда'
                  : level < VEHICLE_LEVELS[modelId]
                    ? `Откроется на уровне ${VEHICLE_LEVELS[modelId]} · ${VEHICLE_PRICES[modelId]} монет`
                    : `Купить за ${VEHICLE_PRICES[modelId]} монет`}
              </button>
            )}
            <p className={styles.muted}>
              {selectedModel
                ? 'На превью — выбранная деталь. В заезд попадёт установленная комплектация.'
                : 'Сначала выбери этот транспорт для заезда, затем устанавливай детали.'}
            </p>
            <div className={styles.paints} aria-label="Окраска корпуса">
              {(Object.keys(PAINTS) as PaintId[]).map((id) => {
                const p = PAINTS[id],
                  owned = career.ownedPaints.includes(id);
                return (
                  <button
                    key={id}
                    aria-pressed={career.paint === id}
                    disabled={busy || career.paint === id || (!owned && career.coins < p.price)}
                    onClick={() => (owned ? selectPaint(id) : buyPaint(id))}
                  >
                    <i style={{ background: p.color }} />
                    <span>
                      {p.name}
                      <small>
                        {career.paint === id
                          ? 'Выбрано'
                          : owned
                            ? 'Выбрать'
                            : `Купить · ${p.price} монет`}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        <section className={styles.workbench} aria-label="Оборудование">
          <div className={styles.scroll}>
            {gift && (
              <aside className={styles.gift}>
                <p className={styles.eyebrow}>ПЕРВЫЙ ЗАКАЗ ВЫПОЛНЕН</p>
                <h2>Одна деталь — за счёт мастерской</h2>
                <p>
                  Выбери подвеску или всепогодные шины. Альтернативу позже можно купить за монеты.
                </p>
                <div className={styles.giftChoices}>
                  {(['soft_suspension', 'allweather_tires'] as const).map((id) => {
                    const p = PART_CATALOG.find((p) => p.id === id)!;
                    return (
                      <div key={id}>
                        <strong>{p.name}</strong>
                        <small>{p.benefit}</small>
                        <small>{p.tradeoff}</small>
                        <button
                          className={styles.secondary}
                          disabled={busy}
                          onClick={() => claimStarter(id)}
                        >
                          Забрать и установить
                        </button>
                      </div>
                    );
                  })}
                </div>
              </aside>
            )}
            <nav className={styles.slotTabs} aria-label="Узел транспорта">
              {(Object.keys(slots) as TuningSlot[]).map((s) => (
                <button
                  key={s}
                  aria-pressed={slot === s}
                  onClick={() => {
                    setSlot(s);
                    setPart(undefined);
                  }}
                >
                  {slots[s]}
                </button>
              ))}
            </nav>
            <div className={styles.parts}>
              {PART_CATALOG.filter((p) => p.slot === slot).map((p) => (
                <button key={p.id} aria-pressed={p.id === part.id} onClick={() => setPart(p.id)}>
                  <strong>{p.name}</strong>
                  <span>
                    {fitted[slot] === p.id
                      ? 'Установлено'
                      : career.ownedParts.includes(p.id)
                        ? 'В наличии'
                        : `${PART_PRICES[p.id]} монет`}
                  </span>
                </button>
              ))}
            </div>
            <div className={styles.partDescription}>
              <h2>{part.name}</h2>
              <p className={styles.benefit}>{part.benefit}</p>
              <p>{part.tradeoff}</p>
            </div>
            <div className={styles.comparison}>
              <div className={styles.statHeader}>
                <span>Реальные параметры</span>
                <span>В заезде → превью</span>
              </div>
              {nextStats.filter((s) => s.value !== stats.find((x) => x.id === s.id)?.value)
                .length === 0 ? (
                <p className={styles.muted}>Параметры совпадают с установленной комплектацией.</p>
              ) : null}
              {nextStats.map((s) => {
                const old = stats.find((x) => x.id === s.id)!;
                const changed = Math.abs(old.value - s.value) > 0.00001;
                return (
                  <div key={s.id} data-changed={changed}>
                    <span>{s.label}</span>
                    <strong>
                      {changed ? `${fmt(old.value)} → ` : ''}
                      {fmt(s.value)} <small>{s.unit}</small>
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
          <footer className={styles.actions}>
            <span>
              {!selectedModel
                ? 'Выбери транспорт слева'
                : installed
                  ? 'Эта деталь уже установлена'
                  : giftPart
                    ? 'Первый подарок · монеты сохранятся'
                    : owned
                      ? 'Повторная установка бесплатна'
                      : career.coins < PART_PRICES[part.id]
                        ? `Не хватает ${PART_PRICES[part.id] - career.coins} монет`
                        : `Останется ${career.coins - PART_PRICES[part.id]} монет`}
            </span>
            <button
              className={styles.primary}
              disabled={
                busy ||
                !selectedModel ||
                installed ||
                (!owned && !giftPart && career.coins < PART_PRICES[part.id])
              }
              onClick={() =>
                giftPart
                  ? claimStarter(part.id as StarterPart)
                  : owned
                    ? equipPart(part.id)
                    : buyPart(part.id)
              }
            >
              {busy
                ? 'Сохраняем…'
                : installed
                  ? 'Установлено'
                  : giftPart
                    ? 'Забрать и установить'
                    : owned
                      ? 'Установить'
                      : `Купить и установить · ${PART_PRICES[part.id]}`}
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}
