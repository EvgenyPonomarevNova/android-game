import { Icon } from '../components/Icon';
import styles from '../ui.module.css';

export function Menu({
  ready,
  play,
  navigate,
}: {
  ready: boolean;
  play: () => void;
  navigate: (screen: 'garage' | 'settings') => void;
}) {
  return (
    <main className={styles.menu}>
      <h1 className={styles.logo}>
        НЕ
        <br />
        <span>РАЗЛЕЙ!</span>
      </h1>
      <p className={styles.tagline}>
        Город спешит.
        <br />А кофе лучше довезти целым.
      </p>
      <div className={styles.menuActions}>
        <button className={styles.primary} disabled={!ready} onClick={play}>
          <Icon name="play" />
          {ready ? 'Играть' : 'Загружаем город…'}
        </button>
        <div className={styles.secondaryActions}>
          <button className={styles.secondary} onClick={() => navigate('garage')}>
            <Icon name="garage" />
            Гараж
          </button>
          <button className={styles.secondary} onClick={() => navigate('settings')}>
            <Icon name="settings" />
            Настройки
          </button>
        </div>
      </div>
      <p className={styles.caption}>Первый кофе · Дворовый маршрут</p>
    </main>
  );
}
