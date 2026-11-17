import type { Settings as SettingsData } from '../../platform/SaveService';
import { Icon } from '../components/Icon';
import styles from '../ui.module.css';

export function Settings({
  settings,
  update,
  back,
}: {
  settings: SettingsData;
  update: (next: SettingsData) => void;
  back: () => void;
}) {
  return (
    <section className={styles.panel} aria-labelledby="settings-title">
      <button className={styles.back} onClick={back}>
        <Icon name="back" />В меню
      </button>
      <h1 id="settings-title">Настройки</h1>
      <label className={styles.setting}>
        Звуки
        <input
          type="checkbox"
          checked={settings.sound}
          onChange={(e) => update({ ...settings, sound: e.target.checked })}
        />
      </label>
      <label className={styles.setting}>
        Музыка
        <input
          type="checkbox"
          checked={settings.music}
          onChange={(e) => update({ ...settings, music: e.target.checked })}
        />
      </label>
      <label className={styles.setting}>
        Громкость
        <input
          aria-label="Громкость"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.volume}
          onChange={(e) => update({ ...settings, volume: e.target.valueAsNumber })}
        />
      </label>
      {import.meta.env.DEV ? (
        <label className={styles.setting}>
          Показатели FPS
          <input
            type="checkbox"
            checked={settings.showFps}
            onChange={(e) => update({ ...settings, showFps: e.target.checked })}
          />
        </label>
      ) : null}
      <p className={styles.caption}>Настройки сохраняются на этом устройстве.</p>
    </section>
  );
}
