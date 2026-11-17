# Этап 1 — интерфейс и графика

Статус: DONE, локальные файлы переданы интегратору. 17 ноября 2026. Следующую фазу не начинаю. Коммитов, push, Android/production build и cap sync из этого чата не было.

## Результат

- Безопасно импортированы все 374 entry ZIP в новый `assets/inbox/NeRazley_ArtKit_v1`. Перед извлечением каждый путь проверен на absolute/drive/.., обратный слеш, symlink, дубликаты и выход из корня. Скрипты архива не запускались. Повторное побайтовое сравнение с ZIP: 374/374.
- Archive SHA-256: `0bafdfb6e32b653f11c055f4e918e5385e1c8019a1f50aa66477a981344b0392`.
- Runtime — 34 отдельных ресурса в `public/assets/artkit`; полная карта исходников/размеров/hash/преобразований: `src/assets/artkit-manifest.json`. Loader подключает только 10 изображений сцены; UI использует отдельные элементы ArtKit и настоящий React-текст. Целые reference-экраны не используются.
- Корпус без колёс + два независимых wheel_side + кофе + статичный seated courier. BodyView поддерживает Sprite, Planck не менялся. Курьер привязан к chassis, без фиктивной кадровой анимации. Убраны отдельный фрагмент вырезки слева и запечённая тень корпуса только в runtime-копиях.
- Четыре слоя двора, параллакс 0/0.08/0.18/0.30. Дорога строится из level.ground; разрезается по X-границам surfaces и оформляется asphalt/gravel. Препятствие рисуется по точному физическому прямоугольнику, без декоративного увеличения collider.
- Menu/HUD/пауза/настройки используют ArtKit-кнопки и панели. Menu props, pointer capture/release/cancel callbacks, имена состояний сохранены. Safe area и responsive CSS сохранены.
- Gameplay обрабатывает sim.outcome: один result на успех и провал; finished/failed через outcome.success; success/reason передаются в result. Simulation/GameBridge/App/GameController не редактировались этим чатом.

## Файлы

Новые: исходный каталог ArtKit; `public/assets/artkit`; `src/assets/artkit.ts`, `artkit-manifest.json`; `src/game/rendering/vehicleArt.ts`, `YardBackdrop.ts`. Изменены: `BodyView.ts`; сцены `Boot.ts`, `MainMenu.ts`, `Gameplay.ts`; `src/ui/components/Icon.tsx`, `screens/Menu.tsx`, `hud/GameHud.tsx`, `ui.module.css`; `src/app/global.css`; `src/assets/README.md`; `DESIGN.md`; этот отчёт. fonts.css и TouchControls.tsx не менялись. Чужие файлы, зависимости, lock, общие конфиги и Git-индекс не менялись.

## Якоря и масштаб

Все координаты ниже относятся к исходному локальному арту/контейнеру при 60 px/m; BodyView умножает на PHYSICS.pixelsPerMeter/60.

| Ресурс      | Runtime размер  | Якорь / правило                                                                                                  |
| ----------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| scooter.png | 700×318         | axleX 170/535, midpoint 352.5; scale=2*SCOOTER.wheel.spacing*60/365; originY=286−drop*60/scale                   |
| wheel.png   | 200×200         | центр 100/100; размер diameter из CircleShape тела                                                               |
| coffee.png  | 260×280         | cup центр 116/151; размеры cup source 139×211 соответствуют локальному AABB fixture без skin; steam декоративный |
| courier.png | 274×361         | crop source x=40..314; origin 100/235; position −14/−4; uniform scale 0.33 внутри chassis                        |
| yard-*.webp | 1536×768 каждый | sky заполняет viewport, far/mid/near — horizon; камера origin 0/0 в Gameplay для корректного zoom+FollowCamera   |
| buttons     | см. manifest    | nine-slice 42 top/bottom, 46 left/right; UI задаёт hit area                                                      |
| panels      | см. manifest    | cream 48, game_hud 35; текст остаётся HTML                                                                       |

## Проверки и фактический результат

- Просмотрены gameplay preview JPG, исходный assets_contact_sheet, PNG корпуса, seated courier и контактный лист восьми AI-ресурсов. Затем действительно просмотрен `.local/stage-1-art/runtime-contact.png` (34 ресурса).
- Изолированное окружение `.local/art-venv` с Pillow13; общие Python/npm-пакеты не обновлялись.
- `asset_report.py <все 34 runtime files> --json` → exit 0, `.local/stage-1-art/asset-report.json`.
- `asset_report.py <корпус,колесо,кофе,курьер,far,mid,near> --require-alpha --json` → exit 0, `.local/stage-1-art/alpha-report.json`.
- Повторная проверка размеров и SHA-256 runtime+source → 34 файла; сравнение исходников с ZIP → 374/374. В manifest technical_checks_passed=true означает только эти технические проверки.
- Prettier выполнен только по своим изменённым исходникам. Полный typecheck/lint/tests/build сериализует интегратор, эти результаты из чужого чата не заявляются как собственная проверка.
- Отдельный Vite dev 127.0.0.1:5181 и изолированный browser session. Чистый финальный запуск: меню → заказ → сцена → пауза → продолжить → пауза → меню; errors=[] после цикла. Визуально просмотрены 900×420 и 1600×900: HUD/кнопки/пауза не обрезаны, дорога и курьер видимы. До/после и финальные captures в `.local/stage-1-art`: before-menu-900, before-scene-900; menu-900, scene-900, pause-900, menu-wide, scene-wide, pause-wide.
- Во время активного HMR был black Canvas с Vertex Shader failed / BatchHandlerTileSprite. Чистый отдельный браузер после стабилизации файлов ошибок не показал. Отдельная ошибка чтения размера cup (`getVertexCount`) устранена через публичный computeAABB(identity), реально перепроверен старт Gameplay. Атрибуты meter low/high/optimum исправлены на числа.

## Ограничения и передача

- Это первый визуальный проход, не финальная кадровая анимация. Вырезка courier детальнее векторного окружения; фигура на 900×420 небольшая, мелкая мимика не игровой сигнал. Статичное тело водителя не имеет отдельной физики. Частицы/новые механики не добавлены.
- Источник сведений о правах — переданный владельцем `10_FOR_CODEX/LICENSE_NOTES.md`; независимая лицензия пакету не выдумана. Перед публичным релизом владелец подтверждает права на переданный материал.
- Аппаратный мультитач, GPU memory/frame time, 60 FPS, APK и Android-устройство здесь не проверялись. Callbacks не менялись, но это не сертификация мультитача.
- Общий браузерный цикл успех/провал, полную сборку, Android и публикацию принимает интегратор. Результаты успеха/провала из его чата здесь не дублируются как собственные.
- Новые изменения общих контрактов не нужны. Важное уже принятое уточнение: sim.finished terminal; использовать только sim.outcome.success для результата. После DONE исходники этого профиля освобождены для интеграции.
