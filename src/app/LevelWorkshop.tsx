import { useRef, useState } from 'react';
import {
  generateLevel,
  levelBounds,
  parseLevelDocument,
  serializeLevel,
  type GenerationOptions,
  type LevelDocument,
} from '../game/authoring/LevelAuthoring';
import { getLevelCatalog } from '../game/core/LevelCatalog';
import type { LevelData } from '../game/levels/testLevel';
import styles from './workshop.module.css';

const defaults: GenerationOptions = {
  id: 'yard_draft',
  title: 'Новый двор',
  seed: 'courtyard-001',
  preset: 'trial',
  sections: 4,
  fork: true,
};
const STORAGE_KEY = 'nerazley.workshop.draft.v1';
function initialDocument(): LevelDocument {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return parseLevelDocument(raw);
  } catch {
    /* A damaged draft must not prevent opening the editor. */
  }
  return generateLevel(defaults);
}
export function LevelWorkshop({
  play,
  ready,
}: {
  play: (level: LevelData) => void;
  ready: boolean;
}) {
  const [options, setOptions] = useState(defaults);
  const [doc, setDoc] = useState(initialDocument);
  const [json, setJson] = useState(() => serializeLevel(doc));
  const [message, setMessage] = useState(
    'Черновик. Проверка геометрии не доказывает проходимость.',
  );
  const [catalog] = useState(getLevelCatalog);
  const jsonField = useRef<HTMLTextAreaElement>(null);
  const apply = (next: LevelDocument) => {
    setDoc(next);
    setJson(serializeLevel(next));
    try {
      localStorage.setItem(STORAGE_KEY, serializeLevel(next));
      setMessage('Черновик сохранён в этом браузере. Проверь обе тактики в заезде.');
    } catch {
      setMessage('Черновик открыт. Память браузера недоступна — экспортируй JSON.');
    }
  };
  const attempt = (action: () => void) => {
    try {
      action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };
  const bounds = levelBounds(doc.level);
  const x = (value: number) =>
    20 + ((value - bounds.from) / Math.max(1, bounds.to - bounds.from)) * 960;
  const y = (value: number) =>
    180 - ((value - bounds.low) / Math.max(4, bounds.high - bounds.low)) * 125;
  const points = doc.level.ground.map((p) => `${x(p[0])},${y(p[1])}`).join(' ');
  const exportFile = () => {
    const blob = new Blob([serializeLevel(doc)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.level.id}.json`;
    a.hidden = true;
    document.body.append(a);
    a.click();
    a.remove();
    // Keep the URL alive while the browser hands the file to its download UI.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setMessage('Если браузер не сохранил файл, скопируй JSON кнопкой рядом.');
  };
  const copyJson = async () => {
    const text = serializeLevel(doc);
    setJson(text);
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setMessage('JSON скопирован. Сохрани его в файл .json или вставь в другой черновик.');
    } catch {
      requestAnimationFrame(() => {
        jsonField.current?.focus();
        jsonField.current?.select();
      });
      setMessage('JSON выделен ниже. Нажми Ctrl+C или «Копировать» в меню устройства.');
    }
  };
  return (
    <main className={styles.workshop}>
      <header>
        <div>
          <span>НЕ РАЗЛЕЙ! · ИНСТРУМЕНТ АВТОРА</span>
          <h1>Мастерская маршрутов</h1>
        </div>
        <a href={import.meta.env.BASE_URL}>Вернуться в игру ↗</a>
      </header>
      <div className={styles.layout}>
        <section className={styles.controls}>
          <h2>Собрать из секций</h2>
          <label>
            ID файла
            <input
              value={options.id}
              onChange={(e) => setOptions({ ...options, id: e.target.value })}
            />
          </label>
          <label>
            Название
            <input
              value={options.title}
              onChange={(e) => setOptions({ ...options, title: e.target.value })}
            />
          </label>
          <label>
            Seed
            <input
              value={options.seed}
              onChange={(e) => setOptions({ ...options, seed: e.target.value })}
            />
            <small>Одинаковый seed даёт ту же геометрию.</small>
          </label>
          <label>
            Шаблон
            <select
              value={options.preset}
              onChange={(e) =>
                setOptions({ ...options, preset: e.target.value as GenerationOptions['preset'] })
              }
            >
              <option value="courtyard">Спокойный двор</option>
              <option value="trial">Технический триал</option>
            </select>
          </label>
          <label>
            Секций: {options.sections}
            <input
              type="range"
              min="2"
              max="10"
              value={options.sections}
              onChange={(e) => setOptions({ ...options, sections: e.target.valueAsNumber })}
            />
          </label>
          <label>
            Добавить развилку
            <input
              type="checkbox"
              checked={options.fork ?? false}
              onChange={(e) => setOptions({ ...options, fork: e.target.checked })}
            />
            <small>Шаблон первой миссии: объезд, рампа и контрольная точка.</small>
          </label>
          <button
            className={styles.primary}
            onClick={() => attempt(() => apply(generateLevel(options)))}
          >
            Сгенерировать черновик
          </button>
          <h2>Открыть существующий</h2>
          <select
            aria-label="Каталог уровней"
            value=""
            onChange={(e) => {
              const item = catalog.levels.find((l) => l.level.id === e.target.value);
              if (item) apply(JSON.parse(serializeLevel(item)) as LevelDocument);
            }}
          >
            <option value="" disabled>
              Выбрать из реестра…
            </option>
            {catalog.levels.map((item) => (
              <option key={item.level.id} value={item.level.id}>
                {item.level.name}
              </option>
            ))}
          </select>
          <label className={styles.file}>
            Импортировать JSON
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 1_000_000) {
                    setMessage('Файл больше 1 МБ.');
                    return;
                  }
                  void file
                    .text()
                    .then((text) => attempt(() => apply(parseLevelDocument(text))))
                    .catch(() => setMessage('Не удалось прочитать файл.'));
                }
              }}
            />
          </label>
          {catalog.errors.map((error) => (
            <p key={error} className={styles.warning}>
              {error}
            </p>
          ))}
        </section>
        <section className={styles.preview}>
          <div className={styles.title}>
            <div>
              <span>{doc.status === 'draft' ? 'ЧЕРНОВИК' : 'КОПИЯ УРОВНЯ ИЗ РЕЕСТРА'}</span>
              <h2>{doc.level.name}</h2>
            </div>
            <strong>{Math.round(doc.level.finish.x - doc.level.start.x)} м</strong>
          </div>
          <svg viewBox="0 0 1000 210" role="img" aria-label="Редактируемый профиль маршрута">
            <path d={`M20 205 L${points.replaceAll(' ', ' L')} L980 205Z`} fill="#22384c" />
            <polyline points={points} fill="none" stroke="#ffd12b" strokeWidth="4" />
            {(doc.level.platforms ?? []).map((platform) => (
              <polyline
                key={platform.id}
                points={platform.points.map((p) => `${x(p[0])},${y(p[1])}`).join(' ')}
                fill="none"
                stroke="#76dda7"
                strokeWidth="4"
              />
            ))}
            {doc.level.obstacles.map((o, i) => (
              <rect
                key={i}
                x={x(o.x - o.width / 2)}
                y={y(o.y + o.height / 2)}
                width={x(o.width) - x(0)}
                height={y(0) - y(o.height)}
                fill="#e69e50"
              />
            ))}
            <circle cx={x(doc.level.start.x)} cy={y(doc.level.start.y)} r="6" fill="#76dda7" />
            {doc.level.checkpoint ? (
              <circle
                cx={x(doc.level.checkpoint.x)}
                cy={y(doc.level.checkpoint.y)}
                r="5"
                fill="#91caff"
              />
            ) : null}
            <path
              d={`M${x(doc.level.finish.x)} ${y(doc.level.finish.y)}v-24h15v10h-15`}
              stroke="#eef4ff"
              fill="none"
              strokeWidth="3"
            />
          </svg>
          <ol className={styles.sections}>
            {doc.level.sections?.map((section) => (
              <li key={section.x}>
                {section.title}
                <small>{section.x} м</small>
              </li>
            ))}
          </ol>
          <p className={styles.message} role="status">
            {message}
          </p>
          <div className={styles.actions}>
            <button disabled={!ready} className={styles.primary} onClick={() => play(doc.level)}>
              {ready ? 'Проехать черновик' : 'Готовим сцену…'}
            </button>
            <button onClick={exportFile}>Скачать JSON</button>
            <button onClick={() => void copyJson()}>Копировать JSON</button>
          </div>
          <details open>
            <summary>Геометрия и параметры JSON</summary>
            <p>
              Редактируй точки, покрытия, условия и секции. Для новой трассы задай уникальный ID.
              Черновые заезды не меняют рекорды игры.
            </p>
            <textarea
              ref={jsonField}
              aria-label="JSON уровня"
              spellCheck={false}
              value={json}
              onChange={(e) => setJson(e.target.value)}
            />
            <button onClick={() => attempt(() => apply(parseLevelDocument(json)))}>
              Проверить и применить JSON
            </button>
          </details>
        </section>
      </div>
    </main>
  );
}
