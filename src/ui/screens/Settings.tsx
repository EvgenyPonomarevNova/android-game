import { useRef, useState, type CSSProperties } from 'react';
import { defaultSave, type Settings as SettingsData } from '../../platform/SaveService';
import { BUILD_VERSION } from '../../config/game';
import { controlPreferences } from '../controlPreferences';
import { Icon } from '../components/Icon';
import ui from '../ui.module.css';
import styles from '../settings.module.css';

type Section = 'sound' | 'controls' | 'comfort' | 'info';
type Flag = 'sound' | 'music' | 'showFps' | 'leftHanded' | 'hints';
type Slider =
  'volume' | 'musicVolume' | 'effectsVolume' | 'engineVolume' | 'controlScale' | 'cameraShake';
const sections: { id: Section; title: string }[] = [
  { id: 'sound', title: 'Звук' },
  { id: 'controls', title: 'Управление' },
  { id: 'comfort', title: 'Комфорт' },
  { id: 'info', title: 'Информация' },
];

export function Settings({
  settings,
  update,
  back,
  previewSound,
}: {
  settings: SettingsData;
  update: (next: SettingsData) => void;
  back: () => void;
  previewSound?: () => void;
}) {
  const [section, setSection] = useState<Section>('sound');
  const previousVolume = useRef(settings.volume > 0 ? settings.volume : 0.65);
  const layout = controlPreferences(settings);
  const toggle = (key: Flag, title: string, description: string) => (
    <label className={styles.toggle}>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-label={title}
        checked={settings[key]}
        onChange={(e) => update({ ...settings, [key]: e.target.checked })}
      />
    </label>
  );
  const slider = (key: Slider, title: string, min = 0, max = 1, step = 0.05) => (
    <div className={styles.slider}>
      <label htmlFor={`pref-${key}`}>
        {title}
        <output>{Math.round(settings[key] * 100)}%</output>
      </label>
      <input
        id={`pref-${key}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={settings[key]}
        aria-valuetext={`${Math.round(settings[key] * 100)} процентов`}
        onChange={(e) => {
          if (key === 'volume' && e.target.valueAsNumber > 0)
            previousVolume.current = e.target.valueAsNumber;
          update({ ...settings, [key]: e.target.valueAsNumber });
        }}
      />
    </div>
  );
  const reset = () => {
    const d = defaultSave().settings;
    if (section === 'sound')
      update({
        ...settings,
        sound: d.sound,
        music: d.music,
        volume: d.volume,
        musicVolume: d.musicVolume,
        effectsVolume: d.effectsVolume,
        engineVolume: d.engineVolume,
      });
    if (section === 'controls')
      update({ ...settings, leftHanded: d.leftHanded, controlScale: d.controlScale });
    if (section === 'comfort') update({ ...settings, cameraShake: d.cameraShake, hints: d.hints });
  };
  return (
    <section className={styles.sheet} aria-labelledby="settings-title">
      <header className={styles.header}>
        <button className={styles.back} onClick={back} autoFocus>
          <Icon name="back" />
          Назад
        </button>
        <h1 id="settings-title">Настройки</h1>
      </header>
      <div className={styles.body}>
        <nav className={styles.sections} aria-label="Разделы настроек">
          {sections.map((item) => (
            <button
              key={item.id}
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => setSection(item.id)}
            >
              {item.title}
            </button>
          ))}
        </nav>
        <div className={styles.content} key={section} data-section={section}>
          <h2>{sections.find((s) => s.id === section)!.title}</h2>
          {section === 'sound' ? (
            <>
              <button
                className={styles.master}
                aria-pressed={settings.volume === 0}
                onClick={() => {
                  if (settings.volume > 0) {
                    previousVolume.current = settings.volume;
                    update({ ...settings, volume: 0 });
                  } else update({ ...settings, volume: previousVolume.current });
                }}
              >
                <span>{settings.volume === 0 ? 'Весь звук выключен' : 'Звук включён'}</span>
                <strong>
                  {settings.volume === 0 ? 'Вернуть громкость' : 'Выключить весь звук'}
                </strong>
              </button>
              {slider('volume', 'Общая громкость')}
              {toggle('music', 'Музыка', 'Фоновая музыка меню и поездки')}
              {slider('musicVolume', 'Громкость музыки')}
              {toggle('sound', 'Эффекты и двигатель', 'Звуки управления, столкновений и скутера')}
              {slider('effectsVolume', 'Громкость эффектов')}
              {slider('engineVolume', 'Громкость двигателя')}
              {previewSound ? (
                <button
                  className={ui.primary}
                  onClick={previewSound}
                  disabled={
                    !settings.sound || settings.volume === 0 || settings.effectsVolume === 0
                  }
                >
                  Проверить звук
                </button>
              ) : null}
            </>
          ) : null}
          {section === 'controls' ? (
            <>
              {toggle('leftHanded', 'Газ слева', 'Меняет местами блок движения и блок наклона')}
              {slider('controlScale', 'Размер кнопок', 0.85, 1.2, 0.05)}
              <div
                className={styles.preview}
                data-left-handed={layout.leftHanded}
                style={{ '--preview-scale': layout.scale } as CSSProperties}
                aria-label="Предпросмотр раскладки управления"
              >
                <div className={styles.previewGroup}>
                  <span>
                    <Icon name="leanBack" />
                  </span>
                  <span>
                    <Icon name="leanBack" />
                  </span>
                  <small>Наклон</small>
                </div>
                <div className={styles.previewGroup}>
                  <span>
                    <Icon name="brake" />
                  </span>
                  <span className={styles.previewGas}>
                    <Icon name="forward" />
                  </span>
                  <small>Тормоз / газ</small>
                </div>
              </div>
              <p className={styles.note}>
                Это предпросмотр расположения. В заезде можно удерживать газ и наклон одновременно.
              </p>
              <dl className={styles.keys}>
                <div>
                  <dt>W / ↑</dt>
                  <dd>Газ</dd>
                </div>
                <div>
                  <dt>S / ↓</dt>
                  <dd>Тормоз, затем задний ход</dd>
                </div>
                <div>
                  <dt>A / D</dt>
                  <dd>Наклон назад / вперёд</dd>
                </div>
                <div>
                  <dt>Esc / R</dt>
                  <dd>Пауза / повторить</dd>
                </div>
              </dl>
            </>
          ) : null}
          {section === 'comfort' ? (
            <>
              {slider('cameraShake', 'Тряска камеры')}
              <p className={styles.note}>
                0% отключает толчки камеры при сильном ударе. Системное уменьшение движения также
                отключает декоративные эффекты.
              </p>
              {toggle('hints', 'Подсказки по маршруту', 'Советы на секциях и перед приземлением')}
            </>
          ) : null}
          {section === 'info' ? (
            <>
              <dl className={styles.info}>
                <div>
                  <dt>Не Разлей!</dt>
                  <dd>Веб-версия {BUILD_VERSION}</dd>
                </div>
                <div>
                  <dt>Данные</dt>
                  <dd>Прогресс и настройки сохраняются в этом браузере.</dd>
                </div>
                <div>
                  <dt>Материалы</dt>
                  <dd>
                    NeRazley ArtKit и AudioKit, предоставленные для проекта. Шрифт Onest — SIL Open
                    Font License.
                  </dd>
                </div>
              </dl>
              {import.meta.env.DEV
                ? toggle('showFps', 'Счётчик кадров', 'Диагностика версии для разработки')
                : null}
            </>
          ) : null}
        </div>
      </div>
      <footer className={styles.footer}>
        <span>Применяется сразу · сохраняется автоматически</span>
        {section !== 'info' ? <button onClick={reset}>Сбросить этот раздел</button> : null}
      </footer>
    </section>
  );
}
