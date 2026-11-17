import { memo, useEffect, useRef, useState } from 'react';
import { GameBridge, type GameMode } from '../game/core/GameBridge';
import { createPlatform } from '../platform/PlatformAdapter';
import { SaveService, defaultSave, type Settings as SettingsData } from '../platform/SaveService';
import { AudioManager } from '../platform/AudioManager';
import { GameHud } from '../ui/hud/GameHud';
import { Menu } from '../ui/screens/Menu';
import { Settings } from '../ui/screens/Settings';
import { Icon } from '../ui/components/Icon';
import styles from '../ui/ui.module.css';

const platform = createPlatform();
const saves = new SaveService(platform.storage);

const GameHost = memo(function GameHost({ bridge }: { bridge: GameBridge }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let controller: import('../game/core/GameController').GameController | undefined;
    void import('../game/core/GameController')
      .then(({ GameController }) => {
        if (!disposed && host.current) controller = new GameController(host.current, bridge);
      })
      .catch((error: unknown) => bridge.emit('error', String(error)));
    return () => {
      disposed = true;
      controller?.destroy();
    };
  }, [bridge]);
  return <div ref={host} className={styles.canvas} />;
});

export function App() {
  const [bridge] = useState(() => new GameBridge());
  const [audio] = useState(() => new AudioManager(defaultSave().settings));
  const [mode, setMode] = useState<GameMode>('menu');
  const [screen, setScreen] = useState<'main' | 'settings' | 'garage'>('main');
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [save, setSave] = useState(defaultSave);
  const saveRef = useRef(save);
  const screenRef = useRef(screen);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let disposed = false;
    const unsubscribers = [
      bridge.on('ready', () => setReady(true)),
      bridge.on('mode', (next) => {
        setMode(next);
        audio.setActive(next === 'playing');
        if (next === 'menu') {
          screenRef.current = 'main';
          setScreen('main');
        }
      }),
      bridge.on('error', setMessage),
      bridge.on('damage', () => audio.effect('damage')),
      bridge.on('result', (result) => {
        audio.effect('finish');
        const next = {
          ...saveRef.current,
          results: {
            ...saveRef.current.results,
            [result.levelId]: { seconds: result.seconds, integrity: result.integrity },
          },
        };
        saveRef.current = next;
        setSave(next);
        void saves
          .save(next)
          .catch(() => setMessage('Результат не сохранён. Проверьте свободное место.'));
      }),
    ];
    const detachInput = bridge.input.attach(
      () => {
        if (bridge.mode === 'playing') bridge.command('pause');
        else if (bridge.mode === 'paused') {
          void audio.unlock();
          bridge.command('resume');
        }
      },
      () => bridge.command('restart'),
      () => bridge.mode === 'playing',
    );
    const back = () => {
      if (bridge.mode === 'playing') bridge.command('pause');
      else if (bridge.mode === 'paused') {
        void audio.unlock();
        bridge.command('resume');
      } else if (bridge.mode !== 'menu') bridge.command('menu');
      else if (screenRef.current !== 'main') {
        screenRef.current = 'main';
        setScreen('main');
      } else if (platform.kind === 'android')
        void import('@capacitor/app').then(({ App }) => App.minimizeApp());
    };
    let detachPlatform: (() => void) | undefined;
    void platform
      .listen(() => {
        bridge.suspend();
        audio.setActive(false);
      }, back)
      .then((detach) => {
        if (disposed) detach();
        else detachPlatform = detach;
      })
      .catch(() => setMessage('Системные события недоступны. Используйте кнопку паузы.'));
    void saves.load().then(({ data, warning }) => {
      if (disposed) return;
      saveRef.current = data;
      setSave(data);
      audio.configure(data.settings);
      setLoaded(true);
      if (warning) setMessage(warning);
    });
    return () => {
      disposed = true;
      unsubscribers.forEach((off) => off());
      detachInput();
      detachPlatform?.();
      audio.dispose();
      bridge.clear();
    };
  }, [bridge, audio]);

  const navigate = (next: typeof screen) => {
    screenRef.current = next;
    setScreen(next);
  };
  const updateSettings = (settings: SettingsData) => {
    const next = { ...saveRef.current, settings };
    saveRef.current = next;
    setSave(next);
    audio.configure(settings);
    void saves
      .save(next)
      .catch(() => setMessage('Настройки не сохранены. Проверьте доступ к хранилищу.'));
  };
  const command = (action: 'start' | 'resume' | 'restart') => {
    void audio.unlock();
    audio.effect('start');
    bridge.command(action);
  };
  return (
    <div className={styles.app}>
      <GameHost bridge={bridge} />
      {mode === 'menu' ? (
        <>
          {screen === 'main' ? (
            <Menu ready={ready && loaded} play={() => command('start')} navigate={navigate} />
          ) : null}
          {screen === 'settings' ? (
            <Settings
              settings={save.settings}
              update={updateSettings}
              back={() => navigate('main')}
            />
          ) : null}
          {screen === 'garage' ? (
            <section className={styles.panel}>
              <button className={styles.back} onClick={() => navigate('main')}>
                <Icon name="back" />В меню
              </button>
              <h1>Гараж</h1>
              <h2>Скутер курьера</h2>
              <p>
                Два колеса, мягкая подвеска
                <br />и один очень важный кофе.
              </p>
              <p className={styles.caption}>Другой транспорт появится на следующем этапе.</p>
              <button
                className={styles.primary}
                disabled={!ready || !loaded}
                onClick={() => command('start')}
              >
                <Icon name="play" />
                На трассу
              </button>
            </section>
          ) : null}
          <footer className={styles.footer}>
            НЕ РАЗЛЕЙ!<span>Прототип · 0.1.0</span>
          </footer>
        </>
      ) : (
        <GameHud
          bridge={bridge}
          showFps={save.settings.showFps}
          platform={platform.kind}
          playing={mode === 'playing'}
        />
      )}
      {['paused', 'finished', 'failed', 'error'].includes(mode) ? (
        <div className={styles.scrim}>
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-title"
          >
            <h1 id="pause-title">
              {mode === 'paused'
                ? 'Кофе подождёт'
                : mode === 'finished'
                  ? 'Доставлено!'
                  : mode === 'failed'
                    ? 'Кофе не доехал'
                    : 'Нужен перезапуск'}
            </h1>
            <p>
              {mode === 'paused'
                ? 'Выдохни. Город никуда не денется.'
                : mode === 'finished'
                  ? 'Первый маршрут позади. Как насчёт ещё одной поездки?'
                  : 'Попробуй сбавить скорость и держать равновесие.'}
            </p>
            {mode === 'paused' ? (
              <button autoFocus className={styles.primary} onClick={() => command('resume')}>
                <Icon name="play" />
                Продолжить
              </button>
            ) : null}
            <button className={styles.secondary} onClick={() => command('restart')}>
              <Icon name="restart" />
              Начать заново
            </button>
            <button className={styles.back} onClick={() => bridge.command('menu')}>
              Выйти в меню
            </button>
          </section>
        </div>
      ) : null}
      {message ? (
        <div className={styles.notice} role="status">
          <span>{message}</span>
          <button aria-label="Закрыть сообщение" onClick={() => setMessage('')}>
            ×
          </button>
        </div>
      ) : null}
      <div className={styles.rotate}>
        <Icon name="restart" />
        <strong>Поверните устройство</strong>
        <span>Так дорога будет видна лучше</span>
      </div>
    </div>
  );
}
