import { memo, useEffect, useRef, useState } from 'react';
import { GameBridge, type GameMode } from '../game/core/GameBridge';
import { createPlatform } from '../platform/PlatformAdapter';
import { SaveService, defaultSave, type Settings as SettingsData } from '../platform/SaveService';
import { AudioManager } from '../platform/AudioManager';
import { GameHud } from '../ui/hud/GameHud';
import { Menu } from '../ui/screens/Menu';
import { Settings } from '../ui/screens/Settings';
import { Icon } from '../ui/components/Icon';
import { BUILD_VERSION } from '../config/game';
import { OrderScreen } from './OrderScreen';
import { ResultScreen } from './ResultScreen';
import { LevelWorkshop } from './LevelWorkshop';
import { getLevelCatalog } from '../game/core/LevelCatalog';
import {
  COFFEE_ORDER,
  deliveryRecordKey,
  isBetterResult,
  rateDelivery,
  type RatedResult,
} from '../game/core/Orders';
import styles from '../ui/ui.module.css';
import sliceStyles from './slice.module.css';

const platform = createPlatform();
const saves = new SaveService(platform.storage);
const workshopMode = new URLSearchParams(window.location.search).has('editor');

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
  const [catalog] = useState(getLevelCatalog);
  const [selectedLevel, setSelectedLevel] = useState(() => catalog.levels[0]!.level);
  const audioRef = useRef<AudioManager | null>(null);
  const [mode, setMode] = useState<GameMode>('menu');
  const [screen, setScreen] = useState<'main' | 'settings' | 'garage' | 'orders'>('main');
  const [result, setResult] = useState<RatedResult | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'failed'>('saving');
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pauseSettings, setPauseSettings] = useState(false);
  const pauseSettingsRef = useRef(false);
  const previousMode = useRef<GameMode>('menu');
  const maximumProgress = useRef(0);
  const continuingCheckpoint = useRef(false);
  const [save, setSave] = useState(defaultSave);
  const saveRef = useRef(save);
  const screenRef = useRef(screen);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let disposed = false;
    // Effects are re-created by Fast Refresh/StrictMode; never reuse a disposed manager.
    const audio = new AudioManager(saveRef.current.settings);
    audioRef.current = audio;
    audio.setMode(bridge.mode);
    audio.menuScreen(screenRef.current);
    const unlockAudio = (event: Event) => {
      void audio.unlock();
      if (
        event instanceof KeyboardEvent &&
        event.code === 'KeyR' &&
        !event.repeat &&
        (bridge.mode === 'finished' || bridge.mode === 'failed')
      ) {
        event.preventDefault();
        event.stopPropagation();
        bridge.command('restart');
      }
    };
    document.addEventListener('pointerdown', unlockAudio, true);
    document.addEventListener('keydown', unlockAudio, true);
    const unsubscribers = [
      bridge.on('ready', () => setReady(true)),
      bridge.on('mode', (next) => {
        if (
          next === 'playing' &&
          previousMode.current !== 'paused' &&
          !continuingCheckpoint.current
        ) {
          maximumProgress.current = 0;
          setAttempt((count) => count + 1);
          setResult(null);
        }
        if (next === 'playing') {
          continuingCheckpoint.current = false;
          setResult(null);
        }
        previousMode.current = next;
        if (next !== 'paused') {
          pauseSettingsRef.current = false;
          setPauseSettings(false);
        }
        setMode(next);
        audio.setMode(next);
        if (next === 'menu') {
          screenRef.current = 'main';
          setScreen('main');
        }
      }),
      bridge.on('error', setMessage),
      bridge.on('impact', (impact) => audio.impact(impact)),
      bridge.on('telemetry', (stats) => {
        maximumProgress.current = Math.max(maximumProgress.current, stats.progress);
        audio.engine(
          stats.speed,
          stats.grounded ?? true,
          bridge.input.state.throttle,
          stats.stress ?? 0,
          stats.integrity,
          stats.landingId ?? 0,
          stats.landingImpact ?? 0,
        );
      }),
      bridge.on('result', (rawResult) => {
        const rules = bridge.level ? { ...COFFEE_ORDER, ...bridge.level.difficulty } : COFFEE_ORDER;
        const result = rateDelivery({ ...rawResult, progress: maximumProgress.current }, rules);
        setResult(result);
        setNewBest(false);
        if (!result.success) {
          audio.effect('failure');
          return;
        }
        audio.effect('finish');
        // Authoring runs never award or overwrite the public mission's record.
        if (workshopMode) return;
        const recordKey = deliveryRecordKey(result.levelId);
        const previous = saveRef.current.results[recordKey];
        const improved = !previous || isBetterResult(result, previous);
        setNewBest(improved);
        audio.reward(result.stars, improved);
        const next = {
          ...saveRef.current,
          results: {
            ...saveRef.current.results,
            [recordKey]: improved
              ? {
                  seconds: result.seconds,
                  integrity: result.integrity,
                  stars: result.stars,
                  score: result.score,
                  medal: result.medal ?? undefined,
                  checkpointUsed: result.checkpointUsed,
                  falls: result.falls,
                }
              : previous,
          },
        };
        saveRef.current = next;
        setSave(next);
        setSaveStatus('saving');
        void saves
          .save(next)
          .then(() => setSaveStatus('saved'))
          .catch(() => {
            setSaveStatus('failed');
            setMessage('Результат не сохранён. Проверьте свободное место.');
          });
      }),
    ];
    const detachInput = bridge.input.attach(
      () => {
        if (bridge.mode === 'playing') bridge.command('pause');
        else if (bridge.mode === 'paused') {
          if (pauseSettingsRef.current) {
            pauseSettingsRef.current = false;
            setPauseSettings(false);
            return;
          }
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
        if (pauseSettingsRef.current) {
          pauseSettingsRef.current = false;
          setPauseSettings(false);
          return;
        }
        void audio.unlock();
        bridge.command('resume');
      } else if (bridge.mode !== 'menu') bridge.command('menu');
      else if (screenRef.current !== 'main') {
        screenRef.current = 'main';
        setScreen('main');
        audio.menuScreen('main');
        audio.playSfx('ui_back');
      } else if (platform.kind === 'android')
        void import('@capacitor/app').then(({ App }) => App.minimizeApp());
    };
    let detachPlatform: (() => void) | undefined;
    void platform
      .listen(() => {
        bridge.suspend();
        audio.suspend();
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
      Object.assign(bridge.preferences, {
        cameraShake: data.settings.cameraShake,
        hints: data.settings.hints,
      });
      setLoaded(true);
      if (warning) setMessage(warning);
    });
    return () => {
      disposed = true;
      unsubscribers.forEach((off) => off());
      detachInput();
      detachPlatform?.();
      document.removeEventListener('pointerdown', unlockAudio, true);
      document.removeEventListener('keydown', unlockAudio, true);
      audio.dispose();
      if (audioRef.current === audio) audioRef.current = null;
      bridge.clear();
    };
  }, [bridge]);

  const navigate = (next: typeof screen) => {
    screenRef.current = next;
    setScreen(next);
    audioRef.current?.menuScreen(next);
    audioRef.current?.playSfx(next === 'main' ? 'ui_back' : 'ui_panel_open');
  };
  const updateSettings = (settings: SettingsData) => {
    const next = { ...saveRef.current, settings };
    saveRef.current = next;
    setSave(next);
    audioRef.current?.configure(settings);
    Object.assign(bridge.preferences, { cameraShake: settings.cameraShake, hints: settings.hints });
    audioRef.current?.playSfx('ui_click_01', 0.6);
    void saves
      .save(next)
      .catch(() => setMessage('Настройки не сохранены. Проверьте доступ к хранилищу.'));
  };
  const command = (action: 'start' | 'resume' | 'restart') => {
    if (action !== 'resume') setResult(null);
    void audioRef.current?.unlock();
    if (action !== 'resume') audioRef.current?.playSfx('ui_confirm', 0.6);
    bridge.command(action);
  };
  return (
    <div className={styles.app}>
      <GameHost bridge={bridge} />
      {mode === 'menu' ? (
        <>
          {workshopMode ? (
            <LevelWorkshop
              ready={ready && loaded}
              play={(level) => {
                bridge.selectLevel(level);
                command('start');
              }}
            />
          ) : null}
          {!workshopMode && screen === 'main' ? (
            <>
              <Menu
                ready={ready && loaded}
                play={() => {
                  setSelectedLevel(catalog.levels[0]!.level);
                  bridge.selectLevel(catalog.levels[0]!.level);
                  navigate('orders');
                }}
                navigate={navigate}
                best={save.results[deliveryRecordKey(COFFEE_ORDER.levelId)]}
              />
              {loaded ? (
                <button
                  className={sliceStyles.soundAccess}
                  onClick={() => navigate('settings')}
                  aria-label="Открыть настройки звука"
                >
                  ♪{' '}
                  {save.settings.volume === 0
                    ? 'Громкость: 0%'
                    : !save.settings.sound
                      ? 'Эффекты: выкл.'
                      : !save.settings.music
                        ? 'Музыка: выкл.'
                        : 'Звук включён'}
                </button>
              ) : null}
            </>
          ) : null}
          {!workshopMode && screen === 'settings' ? (
            <Settings
              settings={save.settings}
              update={updateSettings}
              back={() => navigate('main')}
              previewSound={() => {
                void audioRef.current?.unlock().then(() => audioRef.current?.playSfx('ui_confirm'));
              }}
            />
          ) : null}
          {!workshopMode && screen === 'orders' ? (
            <OrderScreen
              best={save.results[deliveryRecordKey(selectedLevel.id)]}
              level={selectedLevel}
              levels={catalog.levels.map((item) => item.level)}
              selectLevel={(level) => {
                setSelectedLevel(level);
                bridge.selectLevel(level);
              }}
              previousRouteBest={
                save.results['test-yard:mission-04'] ??
                save.results['test-yard:polish-03'] ??
                save.results['test-yard']
              }
              ready={ready && loaded}
              start={() => command('start')}
              back={() => navigate('main')}
            />
          ) : null}
          {!workshopMode && screen === 'garage' ? (
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
              <p className={styles.caption}>
                Газ и тормоз задают скорость. Наклоны управляют вращением в полёте. Короткий
                встречный наклон помогает выровнять скутер.
              </p>
              <button
                className={styles.primary}
                disabled={!ready || !loaded}
                onClick={() => navigate('orders')}
              >
                <Icon name="play" />
                На трассу
              </button>
            </section>
          ) : null}
          {!workshopMode && screen === 'main' ? (
            <footer className={styles.footer}>
              НЕ РАЗЛЕЙ!<span>Заказ №001 · {BUILD_VERSION}</span>
            </footer>
          ) : null}
        </>
      ) : (
        <GameHud
          bridge={bridge}
          showFps={import.meta.env.DEV && save.settings.showFps}
          settings={save.settings}
          platform={platform.kind}
          playing={mode === 'playing'}
        />
      )}
      {(mode === 'finished' || mode === 'failed') && result ? (
        <ResultScreen
          result={result}
          draft={workshopMode}
          attempt={attempt}
          newBest={newBest}
          saved={saveStatus}
          retry={() => command('restart')}
          checkpoint={() => {
            continuingCheckpoint.current = true;
            void audioRef.current?.unlock();
            bridge.command('checkpoint');
            continuingCheckpoint.current = false;
          }}
          next={() => {
            bridge.command('menu');
            navigate('orders');
          }}
        />
      ) : null}
      {mode === 'paused' && pauseSettings ? (
        <div className={styles.scrim}>
          <Settings
            settings={save.settings}
            update={updateSettings}
            back={() => {
              pauseSettingsRef.current = false;
              setPauseSettings(false);
            }}
          />
        </div>
      ) : ['paused', 'error'].includes(mode) ? (
        <div className={styles.scrim}>
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-title"
          >
            <h1 id="pause-title">{mode === 'paused' ? 'Минутка передышки' : 'Нужен перезапуск'}</h1>
            <p>
              {mode === 'paused'
                ? 'Дедлайн и физика стоят на паузе. Продолжай, когда будешь готов.'
                : 'Не удалось продолжить заезд. Начни заново — рекорд сохранён.'}
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
            {mode === 'paused' ? (
              <button
                className={styles.secondary}
                onClick={() => {
                  pauseSettingsRef.current = true;
                  setPauseSettings(true);
                }}
              >
                <Icon name="settings" />
                Настройки
              </button>
            ) : null}
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
      {!(workshopMode && mode === 'menu') ? (
        <div className={styles.rotate}>
          <Icon name="restart" />
          <strong>Поверните устройство</strong>
          <span>Так дорога будет видна лучше</span>
        </div>
      ) : null}
    </div>
  );
}
