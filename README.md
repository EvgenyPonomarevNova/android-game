# Не Разлей!

Офлайн 2D-аркада о доставке хрупких грузов на скутере. Текущая веб-итерация 0.4.1 следует утверждённому GDD v0.4: «Сюрприз на пятом», мини-торт и два напитка, нижний объезд и верхний прыжок, дедлайн 180 с, медали и однократная контрольная точка. Курьер и двор используют ArtKit; физика — Planck с фиксированным шагом. Старые кофейные рекорды сохранены отдельно. XP, монеты и тюнинг пока только спроектированы для P1; в UI нет фиктивных наград.

Последнее указание владельца от 18 ноября: **только WEB, APK не собирать**. Проверенная Android 0.4.0 остаётся исторической основой и не доказывает работу новых изменений на Android. Фактический статус и ограничения — в [интеграции](docs/stage-1/integration.md), [QA](docs/stage-1/android.md) и [статусе продукта](GAME_PRODUCT_STATUS.md).

AudioKit подключён: локальная музыка меню/гаража/заказов/заезда, три слоя двигателя, UI, удары, потеря кофе и результаты. Прежние настройки сохранены; для новых данных музыка и эффекты включены, общая громкость 65%. Переключатели и проверка звука доступны в «Настройках». Оригиналы набора лежат в `assets/inbox/NeRazley_AudioKit_RUNTIME`, runtime — в `public/assets/audio`. Все звуки поставляются вместе с веб-сборкой, внешние аудиосервисы не используются.

## Запуск

Node.js 22.12+ (локально 24.18), npm и PowerShell 7 для Android-скриптов.

```powershell
npm ci
npm run dev
```

Клавиатура: W/↑ — газ, S/↓ — тормоз, затем задний ход; A/← и D/→ — наклон; Esc — пауза; R — заново. На телефоне экранные кнопки поддерживают одновременное удержание. Основная ориентация landscape.

Мастерская уровней: добавьте `?editor=1` к адресу игры. Выберите seed/шаблон/число секций и развилку, сгенерируйте черновик, отредактируйте JSON и проедьте его. Импорт/экспорт работают локально; последний черновик восстанавливается в этом браузере. Тестовые заезды не меняют игровые рекорды. Через терминал:

```powershell
npm run level:new -- --id yard_draft --title "Новый двор" --seed 42 --preset trial --sections 4 --fork true
npm run level:check -- .local/levels/yard_draft.json
```

Генератор создаёт JSON и SVG без перезаписи существующих файлов. После проверки обеих тактик, ошибок и рестарта можно установить `status: "published"` и добавить JSON в `src/content/levels`: реестр и выбор контракта подхватят его без редактирования сцены. В P0 опубликована только первая миссия. Валидация геометрии не гарантирует проходимость; финальные пороги медалей определяются заездами.

| Команда | Результат |
| --- | --- |
| `npm run build` | TypeScript и production web в `dist/` |
| `npm run preview` | Статический просмотр `dist/` без backend |
| `npm run typecheck` | Строгая проверка TypeScript |
| `npm run lint` | ESLint |
| `npm run test` | Тесты физики, управления, трассы и сохранений |
| `npm run format:check` | Проверка Prettier приложения и конфигов |
| `npm run android:sync` | Web build → Capacitor sync |
| `npm run android:debug` | Web build → sync → Gradle → проверка APK |
| `pwsh -File tools/doctor.ps1 -Full` | SDK/JDK и инструменты |
| `pwsh -File tools/verify-project.ps1` | Скрипты, навыки, лицензии и Git-индекс |

Android APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Нужны существующий SDK и JDK 21; `. ./tools/android-env.ps1` разрешает их для текущего процесса. SDK не дублируется. Первый Gradle build скачивает официальные зависимости. Установленное приложение сервер и интернет не использует.

## Стек и структура

Phaser **4.2.1**, React **19.3.1**, TypeScript **5.9.3**, Planck **1.5.1** (`planck`), Vite **8.3.8**, Capacitor **8.6.2**, Preferences **8.0.1**, App **8.1.2**, Vitest **5.1.0**, CSS Modules. Версии закреплены в `package-lock.json`.

- `src/app` — React root; `src/ui` — меню, настройки, гараж, HUD и управление.
- `src/game` — сцены, мост, симуляция, физика, скутер, груз, уровни и рендеринг.
- `src/platform` — Web/Android, сохранения и звук; `src/config` — параметры.
- `assets/inbox` — оригинальные арты; `src/assets` — правила runtime-экспорта.
- `android` — Capacitor-проект; `tools` и `.github` — сохранённая инфраструктура.

## Документы

[Архитектура](docs/ARCHITECTURE.md) · [Android и APK](docs/ANDROID.md) · [Следующий этап](docs/NEXT_STEPS.md) · [Окружение](docs/preparation.md) · [Git](CONTRIBUTING.md) · [Профильные чаты](docs/TEAM.md)

[Состояние продукта](GAME_PRODUCT_STATUS.md) · [Доска текущего этапа](docs/STAGE_1.md) · [Интеграция](docs/chat-coordination.md)

Основа адаптирована из [официального template-react-ts](https://github.com/phaserjs/template-react-ts), ревизия `c7265972c856906cacf1f2892d8565d64a358d34`. Демо-ресурсы и отправка статистики шаблона не перенесены. MIT сохранена в `docs/third-party`. Docker и серверные сервисы не запускаются.

## Доставка и права

Изменения — через PR и обязательный Verify repository; main не переписывается. CI проверяет исходники и web build; Android APK собирается локально.

`com.nerazley.game` — временный applicationId; утвердить до публикации. Debug APK не является release. Release-ключ не создан. Ключи, APK, SDK и снимки устройств вне Git. Собственный код: [LICENSE](LICENSE); сторонние материалы: [NOTICE.md](NOTICE.md), [DEPENDENCIES.md](docs/DEPENDENCIES.md).
