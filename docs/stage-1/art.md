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

## Sprint 02 / 0.3.0 — A-ART (DONE)

Локальные изменения переданы интегратору, профильные файлы освобождены. APK, ADB, устройства, сборки, общий QA и длинный автоплейтест не запускались. Пакеты не устанавливались, оригинальные/runtime PNG не менялись.

- `rendering/RideFeedback.ts`, `RidePresentation.ts`: ограниченная реакция отдельного rider, не всего скутера. Разгон смещает вес назад, торможение — вперёд; verticalSpeed/grounded задают подготовку в воздухе; landingId запускает одну реакцию на новое приземление. На аварии — короткое пригибание/фиксация позы, без выдуманного падения с транспорта. Физические тела остаются источником позы; добавочные углы rider ограничены −0.10..0.11 rad, вертикальное смещение до 5 локальных px. Кофе слегка покачивается внутри контейнера, который следует своему физическому телу (добавочный угол ±0.10 rad, сдвиг ±1 px).
- `vehicleArt.ts` именует child courier; `Gameplay.ts` подключает presenter, пересылает cargo:impact в bridge impact и telemetry stress/grounded. События отписываются на shutdown. Пауза замораживает дополнительное движение. После провала эффекты завершаются за ограниченное окно 450 ms, новый дорожный след уже не создаётся.
- Пул 24 частиц, жизнь 320 ms: пыль при движении по гравию/торможении и приземлении; брызги только при medium/heavy impact с loss>0, от положения горловины стакана. Нет случайных штрафов, декоративной вибрации в покое, hit-stop или изменений физики.
- `camera/FollowCamera.ts`: только heavy impact даёт затухающий визуальный толчок камеры до 2.5 CSS px за 140 ms, без вращения/zoom/вспышки. Предыдущий offset исключается из следования, чтобы тряска не накапливала дрейф. prefers-reduced-motion отключает эти движения, частицы и дополнительную реакцию rider/cup.
- `ui/hud/GameHud.tsx`, `ui.module.css`: сохранность выводится единственной shared integrityPercent, как договорено для Result/Order. Есть короткая стартовая подсказка до 4.5 s, сообщения «Перегрузка — сбавь скорость», «В воздухе — выровняй скутер наклоном», краткая причина/потеря после удара, статичное критическое предупреждение. Stress предупреждение имеет гистерезис 0.70/0.45; critical по фактической сохранности <30. Нет мигающих панелей, предупреждения не перехватывают touch. На restart HUD очищает старое сообщение. Touch callbacks/API не менялись.

Проверено ограниченно: локальный `.local/stage-1-art/check-feedback.mjs` на Node → PASS (покой, направление веса при разгоне/торможении, пределы смещений, pause freeze, однократный landing, восстановление после повторных impact, reduced motion, shared rounding). ESLint только шести изменённых TS/TSX-файлов → exit 0; Prettier только своих файлов → exit 0. Единственное короткое браузерное наблюдение на отдельном dev5181 / 900×420: стартовая подсказка читается, груз/курьер видны, короткое удержание газа не вызвало runtime errors; `.local/stage-1-art/polish-03-start.png`, `polish-03-accelerate.png`. Это не проверка полного маршрута, силы аварии, всех предупреждений или удовольствия от игры. Browser/dev закрыты после наблюдения; финальную общую проверку выполняет интегратор.

Ограничение арта: доступен один seated cutout, рюкзак/руки/голова запечены. Поэтому рюкзак следует ограниченному движению rider целиком: отдельной инерции рюкзака, IK кистей и настоящей кадровой аварии здесь нет. Возможный разрыв контакта кисти с рулём на несколько пикселей ограничен малым углом; финальным rig это не называется. Для следующей художественной фазы нужны конкретно: seated-neutral с единым hip pivot; 2 кадра разгона (корпус/руки сохраняют хват), 2 кадра торможения, 2 кадра brace/crouch для полёта/приземления, 3 кадра аварии; либо отдельные torso/head/upper-arm/forearm/hands/backpack в одном боковом ракурсе с прозрачностью и общими seat/hip/hand anchors. Нужны отдельные backpack и 2 положения креплений, если требуется независимая инерция. Без этих ресурсов не имитировать полноценную скелетную анимацию.

App/OrderScreen/ResultScreen/Orders/AudioManager/Bridge, физика, зависимости и общие конфиги этим чатом не менялись. Рекомендация интегратору: краткую причину провала брать из outcome.reason, отображать сохранность через shared integrityPercent, не считать округлённое число входом в звёзды. Нового общего контракта не требуется. Следующую фазу не начинаю.

Интеграционное уточнение: при `sim.outcome` сцена принудительно вызывает `publish(deltaMs)` перед `setMode` и `result`; следующий периодический publish отложен на 100 ms. HUD получает итоговую сохранность до открытия результата. Дополнительный тестовый цикл по поручению интегратора не запускался.

## 18 ноября — первая миссия, визуальная доработка (DONE)

Решение после уточнения владельца: «Заказ №001 — Кофе на пятый», тёплая кремовая карточка + графит + жёлтый акцент; скутер ArtKit справа. Меню: доставка/настройки/краткое управление, без входа в гараж-заглушку. Настройки сохраняют sound/music/volume/showFps и прежний API; optional previewSound будет подключён root. Компактный HUD и подсказки по фактическому прогрессу sections; дорога и камера рассчитываются по полной геометрии уровня. Общие события/App/Order/Result/звук/физику не меняю. Визуальный осмотр — отдельный порт 5186, без полного QA.

### Передача 18 ноября: «Кофе на пятый»

Профильная реализация DONE, файлы освобождены для интеграции. Финальное оформление повторяет root Order/Result: flat #fff7e8 / #192437 / #ffd12b, radius24, мягкая тень, короткое pressed-смещение. Авторские скутер/курьер/двор сохранены. Меню содержит только доставку, настройки и раскрываемое управление; входа в гараж-заглушку нет. Надпись кнопки теперь «Начать доставку». App и соседние экраны не менялись.

**Настройки:** прежние settings/update/back сохранены, optional previewSound согласован и подключается root. Независимые sound/music, общая громкость с процентом, просмотр управления, showFps и автоматическое сохранение прежним потоком. Header/кнопка назад и footer остаются видимыми; средняя область прокручивается на низких экранах. Проверка звука показывается только при переданном callback и доступна при включённых SFX/громкости. FPS теперь виден при сохранённом showFps и в production, без внутренних тел/версий/мс в игровом HUD.

**HUD и управление:** компактная верхняя полоса, маршрут с точками секций, сохранность и время. Порог берётся из testLevel.difficulty.minimumIntegrity (никаких фиксированных 30). Уроки используют actual progress → sections.x; показываются в начале каждой секции, а не по таймеру первой кочки. Удержание нескольких touch-кнопок видно независимо; release/cancel/lost capture и cleanup отпускают только соответствующие pointer IDs. Основные маркеры Icon встроены из векторных оригиналов ArtKit; форма кофе — из ArtKit coffee. Критичные контролы больше не зависят от внешних PNG-запросов. Этим устранён наблюдавшийся промежуточный broken-image вид без маскировки пустых иконок.

**Сцена:** земля заполняет всю фактическую ground, вместо фиксированных 4800/−900. Камера получает bounds всей геометрии, сглаженное упреждение, небольшую поправку на дорогу впереди; не вращается вместе с переворотом и не наводится в дно смертельной ямы. Маркеры и подсказки читают optional sections; текущие 7 ситуаций не захардкожены. Уступы/гравий соответствуют физике. Реальные края глубокого провала отмечены жёлтым, противоположный участок и плоские выходы после спуска — спокойной зелёной линией; это подсветка геометрии, не обещание автоматического безопасного приземления. Двор дополнен скамейками, фонарями, оградой и тихими гаражными силуэтами позади дороги.

Добавлены четыре runtime PNG в public/assets/route (bench/street-lamp/yard-fence/arrow-sign) из неизменённых originals. В manifest.json записаны источник, source/runtime SHA-256 и alpha-bbox crop; новая лицензия не приписана. Boot загружает этот небольшой набор через rendering/routeAssets.ts. Новые файлы rendering/routePresentation.ts и RouteScenery.ts держат визуальные метаданные/геометрию. Согласованные optional telemetry landingId/landingImpact пересылаются из vehicle.motion, новые приземления в графике не вычисляются.

Изменены только src/ui/**, src/game/rendering/RouteScenery.ts, routePresentation.ts, routeAssets.ts, src/game/scenes/Boot.ts, Gameplay.ts, src/game/camera/FollowCamera.ts, новый public/assets/route и этот отчёт. MainMenu/ArtKit сцены сохранены; original artwork, physics/level/config, App, Bridge, AudioManager, package/lock, Git-индекс не менялись этим профилем.

**Реальные проверки:**

- Prettier только изменённых профильных файлов — exit0. Targeted ESLint 11 TS/TSX-файлов — exit0.
- `.local/stage-1-art/check-mission-ui.mjs` — PASS: границы всех секций и hints, fallback без sections, интерполяция всей ground, камера за прежней границей 6500px, freeze на паузе. Это проверка визуальной логики, не проходимости.
- asset_report.py четырёх новых runtime PNG с require-alpha — exit0. git diff --check по профильным путям — без ошибок whitespace.
- Механический design detector выполнен один раз: одна warning о нижней inset-тени primary 3px. Это сознательно сохранённая согласованная деталь root Order/Result; предупреждение не подтверждает/не опровергает качество.
- Один короткий отдельный сеанс dev5186: меню 960×540; настройки, начало заезда и пауза 740×360. Все четыре снимка реально просмотрены. Browser errors=[]; broken images DOM=[]. Пауза имеет полноценную светлую карточку и читаемые кнопки. Визуально осмотрено начало трассы, не вся длинная миссия. Громкость/музыка сохранения при осмотре не менялись, тест звука не запускался.
- Полный typecheck/build/QA/маршрут не дублировались; финальная интеграция и QA остаются root. APK/ADB/эмулятор/профилирование/зависимости/git stage/commit/push не запускались.

Реальные локальные снимки (вне Git):

![Меню 960×540](C:/Users/AORUS/Desktop/game/.local/stage-1-art/mission18-menu.png)

![HUD и начало маршрута 740×360](C:/Users/AORUS/Desktop/game/.local/stage-1-art/mission18-ride.png)

[Настройки 740×360](C:/Users/AORUS/Desktop/game/.local/stage-1-art/mission18-settings.png), [Пауза 740×360](C:/Users/AORUS/Desktop/game/.local/stage-1-art/mission18-pause.png).

Ограничения: кадры/rig rider не добавлены, запечённый рюкзак не отделён. Дальние опасности и камера подтверждены данными/локальной логикой, но не человеческим прохождением. Проходимость и интересность не заявляются по снимкам. Частота кадров и аппаратный мультитач не сертифицировались. Браузер и собственный dev5186 закрыты, чужие QA-порты 5183/5190 не запускались/не останавливались. Следующую фазу не начинаю.

## GDD v04 / 0.4.1 — A-ART (DONE)

Прочитаны README_FOR_CODEX, execution prompt, текст GDD, data первого контракта; визуальные hub/settings/route references и PDF просмотрены. Реализация P0 в прежнем стеке: горизонтальный «На смене», герой/скутер слева, реальный контракт справа; только Заказы/Настройки и необязательный read-only осмотр без тюнинга. Медаль только из optional best, без фиктивных монет/XP/карьеры. Настройки разделами со всеми согласованными полями; предпросмотр раскладки без физсцены. Игровая камера1280×720 сохраняется. Сначала независимые Hub/Settings, геометрию развилки не выдумываю.

### Передача GDD v04 / 0.4.1 — WEB

Профильная UI/rendering часть DONE, исходники освобождены. Это не объявление всего P0/игровой миссии принятыми: общая сборка, полный маршрут, checkpoint и оценка владельца остаются интегратору/QA. APK, sync, устройства, зависимости и Git-операции этим чатом не запускались.

**Хаб «НА СМЕНЕ».** Настоящий горизонтальный React UI в тёмной navy/жёлтой палитре GDD: район 01, авторский курьер/скутер слева, карточка реального CONTRACT_ORDER через совместимый COFFEE_ORDER alias справа, CTA «Взять заказ». Дедлайн и минимум груза читаются из заказа. Только работающие Заказы/Настройки; денег, XP, карьеры и тюнинга на экране нет. Menu сохраняет ready/play/navigate, optional best:LevelResult показывает только переданную настоящую медаль/рекорд. Взаимодействие «Осмотреть» не добавлялось, поэтому обещания рабочего гаража нет. На 740×360 содержимое карточки прокручивается, CTA закреплён. MainMenu переставляет существующий ArtKit в левую часть; ни один экранный mock не служит UI-фоном.

**Настройки.** Новый settings.module.css и экран с Звук/Управление/Комфорт/Информация. Старые settings/update/back/previewSound сохранены. Работают общая громкость (mute через volume=0 с восстановлением уровня), отдельные musicVolume/effectsVolume/engineVolume, прежние sound/music; leftHanded и controlScale 0.85..1.2 с предпросмотром без собственной физсцены; cameraShake и hints. Только DEV показывает showFps. Не добавлены фиктивные вибрация, качество, FPS limiter и сброс прогресса. Изменения передаются прежнему update; сброс затрагивает только текущий раздел. На низком landscape управление/preview стоят рядом; длинные разделы прокручиваются внутри, header/back/reset остаются доступными. Звук в паузе не разблокируется: preview отсутствует, если root не передал callback.

**Управление и HUD.** GameHud получил совместимый optional settings; TouchControls применяет левую схему и размер через ограниченную controlPreferences и CSS, сохраняя pointer capture/release/cancel/lost capture. HUD/подсказки читают bridge.level ?? testLevel, а не принудительно штатную карту в authoring preview. Сохранность суммарного заказа/торта/напитков выводится shared integrityPercent; проценты не участвуют в пересчёте физики. Дедлайн берётся из telemetry remainingSeconds или фактической level.difficulty.deadlineSeconds; отдельного таймера нет. Без дедлайна черновик показывает elapsed «В пути». Видны фактический выбор пути и применение КТ; hints управляет инструкциями, предупреждения об уроне остаются. FPS overlay также только DEV. Тряска камеры читает bridge.preferences.cameraShake каждый update: 0 отключает, reduced-motion имеет приоритет.

**Физически привязанная графика.** Два новых alpha-cropped runtime PNG cake/drinks из ArtKit originals, с hashes/provenance в public/assets/cargo/manifest.json; исходники не правились. Две визуальные части занимают одно AABB физического cargo, отдельные физические тела не выдуманы. Напитки получают лёгкую реакцию, торт следует общей физической позе; всплеск начинается у мирового положения напитков. Камера1280×720 сохранена. Ground — полная нижняя дорога; optional platforms рисуются отдельными тонкими настилами по points/surface, без заливки вниз и без блокирования объезда. Fork/его информационный знак и checkpoint-флаг читаются из LevelData, а не из GDD-метров. Камера выбирает верхнюю поверхность только когда высота курьера позволяет к ней приблизиться. У редакторского черновика без fork/platforms/checkpoint эти элементы не появляются.

**Продолжение с checkpoint.** Gameplay слушает command checkpoint и вызывает continueFromCheckpoint текущей Simulation. При true уничтожает прежние динамические view/частицы, заново создаёт BodyView и RidePresentation для новых sim.physics/vehicle/cargo, сбрасывает resultSent/feedback/камеру, публикует фактическое состояние и включает playing. elapsed не обнуляется; новая попытка не создаётся. EventBus остаётся один, command/impact/damage subscriptions снимаются на shutdown. В telemetry и финальный result передаются cargoComponents (снимок значений), checkpointUsed/Available, falls, routeChoice, remainingSeconds; landingId/landingImpact остаются физическими измерениями. remainingSeconds вычислен как deadlineSeconds−elapsed, поскольку текущая Simulation не предоставляет одноимённого getter; это представление уже измеренного времени, не отдельная игровая логика.

**Файлы:** src/ui/screens/Menu.tsx, Settings.tsx; новые src/ui/hub.module.css, settings.module.css, controlPreferences.ts; src/ui/components/Icon.tsx, TouchControls.tsx; src/ui/hud/GameHud.tsx и ui.module.css; src/game/scenes/Boot.ts, MainMenu.ts, Gameplay.ts; rendering/cargoArt.ts (новый), RideFeedback.ts, RidePresentation.ts, RouteScenery.ts, routePresentation.ts; camera/FollowCamera.ts; public/assets/cargo; этот отчёт. Root App/Order/Result/slice/Save/Bridge/Audio, физика/level/config, authoring и общие зависимости этим чатом не менялись.

**Фактически проверено:**

- Прочитаны README_FOR_CODEX, execution prompt, весь релевантный текст GDD и JSON заказа. PDF22 страницы отрендерены системным bundled pdftoppm и просмотрены контактным листом; отдельные hub/settings/route PNG просмотрены в полном размере. Это references, не UI-ассеты.
- ESLint15 изменённых профильных TS/TSX → exit0; форматирование своих файлов Prettier → exit0. Общий typecheck/build/QA не запускался.
- `.local/stage-1-art/check-gdd-ui.mjs` → PASS: старые defaults/пределы размеров управления и сторона; нижняя/верхняя высота камеры; границы шести sections; сброс RideFeedback с сохранённым landingId. Это не тест физической проходимости.
- Два новых runtime PNG: asset_report.py require-alpha → exit0, .local/stage-1-art/gdd41-asset-report.json. Design detector по новым экранам/модулям → exit0, [] (не доказательство художественного качества).
- Один короткий целевой сеанс на собственном dev5186: хаб1600×900/740×360; Звук900×420, Управление900×420 и740×360, старт/пауза740×360. Все перечисленные снимки действительно просмотрены. Preview по переключателю «Газ слева» получил computed flexDirection=row-reverse, после снимка этот раздел сброшен. Runtime errors=[]; broken images DOM=[]. Звуки на слух, реальные 4 касания и полный заезд не проверялись.
- Дальняя развилка и продолжение с КТ реализованы по точному контракту и просмотрены в исходниках; в этом коротком браузерном сеансе не проходились. Результаты чужих PHY/QA-прогонов не выдаются за собственную проверку.

Реальные локальные снимки вне Git:

![Хаб НА СМЕНЕ 1600×900](C:/Users/AORUS/Desktop/game/.local/stage-1-art/gdd41-hub.png)

![Управление и предпросмотр 740×360](C:/Users/AORUS/Desktop/game/.local/stage-1-art/gdd41-settings-controls-small.png)

![HUD торта/напитков и дедлайна](C:/Users/AORUS/Desktop/game/.local/stage-1-art/gdd41-ride.png)

[Хаб740×360](C:/Users/AORUS/Desktop/game/.local/stage-1-art/gdd41-hub-small.png), [Звук900×420](C:/Users/AORUS/Desktop/game/.local/stage-1-art/gdd41-settings-sound.png), [Левая схема](C:/Users/AORUS/Desktop/game/.local/stage-1-art/gdd41-settings-left-handed.png), [Пауза740×360](C:/Users/AORUS/Desktop/game/.local/stage-1-art/gdd41-pause.png).

Ограничения сохраняются: один cutout rider с запечённым рюкзаком, без нового rig/кадров. На игровом масштабе отдельные части груза малы, поэтому их состояние дополнительно читается в HUD. Денег/XP/рабочего гаража нет, P1 сюда не перенесён. Совместимость с новыми объектами checkpoint потребует общего реального прогона. Нельзя по локальным снимкам объявлять игру интересной людям, проверенной на Android или подтвердить аппаратный multitouch/производительность. Браузер и собственный dev5186 закрыты. Следующую фазу не начинаю.
# Sprint 03 / C-ART — DONE, готово к интеграции

Исходники C-ART завершены, свои файлы освобождены. GarageScreen также принимает buyPaint/selectPaint; корпус красится отдельно от курьера в превью и заезде. Экономика и сохранения остаются у root. Свои сервер5186 и browser career-art закрыты.

Последняя адресная правка перед интеграцией: фиксированная цена120 убрана из пояснений первого подарка в ResultScreen и GarageScreen; теперь «Альтернативу позже можно купить за монеты». Цены конкретных карточек по-прежнему из PART_PRICES. После правки ESLint этих2 файлов → exit0, Prettier check → All matched files use Prettier code style!, exit0. Скриншоты подтверждают композицию до этой небольшой текстовой замены. Root отдельно принял исправленный temperature HUD1280/740. Новых косметических работ профиль не начинает.

Владение: UI, сцены/рендеринг/камера, runtime-графика, OrderScreen/ResultScreen/slice.module.css. Экономику и сохранения изменяет только root; физические параметры — PHY. Чужие правки сохраняются.

API для интеграции: Menu получает career:CareerState, contract:ContractDefinition, setup:VehicleSetup; navigate('orders'|'garage'|'profile'|'settings'). GarageScreen: career,busy,buyPart,equipPart,claimStarter,buyVehicle,selectVehicle,back. ProfileScreen: career,busy,toggleSkill,back. OrderScreen: прежние props + career. ResultScreen: прежние props + reward?:RewardReceipt,career?:CareerState,garage?:()=>void. Первый подарок показывается на результате и выбирается в гараже без цепочки модальных окон. Покупка и подарок устанавливаются root атомарно; UI не начисляет награды.

Читаемые источники: Career helpers, Contracts, Tuning PART_CATALOG/VEHICLE_MODELS/describeVehicleSetup. Gameplay использует bridge.setup; передаёт измеренные temperature/cleanLandings/balancedSections/wetSurface и noodles/soup. Проверка — адресный ESLint и собственный просмотр 1280×720/узкого landscape; без общей сборки, Android, APK и повторного QA.

## Реализовано

- Хаб показывает настоящие уровень/XP/монеты/репутацию, текущую модель и установленные детали, следующий доступный контракт, первый подарок и переходы Заказы/Гараж/Профиль/Настройки. Phaser MainMenu оставляет двор; React собирает транспорт из отдельных игровых ArtKit-частей и текущего setup.
- GarageScreen/career.module.css: все11 деталей/4 узла и2 модели, польза/цена/компромисс, числа из describeVehicleSetup «в заезде → превью», установка/покупка/недостаток монет/уровень доступа. Бесплатный первый выбор — подвеска либо всепогодные шины; вторая остаётся платной. Покупки и подарок вызывают root callbacks. Три окраски корпуса покупаются/выбираются реально.
- ProfileScreen: реальные рекорды/доставки/репутация, только заслуженные испытания, два навыка с условиями/измеренным лучшим заездом и ручным включением. Будущие модели/умения не изображены работающими.
- OrderScreen: данные Contracts, выбор двух карточек с доступностью, груз/иллюстрации/адрес/сложность/первая награда, реальные требования медалей, температура; закрытый заказ можно изучить, начать нельзя.
- ResultScreen: измерения и детерминированный совет слева, фактический RewardReceipt/отзыв/навыки/первый подарок справа. Подарок ведёт в гараж. При saving успешного результата переходы временно выключены, награда не рисуется до receipt. При failed явно «Награда не зачислена» и «Дальше без награды»; есть root notice для повтора записи. UI ничего не начисляет.
- Gameplay использует Simulation(level,bridge.setup), реальный VehicleConfig и детали внешнего вида; checkpoint сохраняет перебиндовку новых тел. Температура/мастерство/wetSurface проходят через MissionState. Cargo поддерживает noodles/soup. Вечерний ArtKit-параллакс, мокрая дорога/декоративные лужи на мокрых сегментах, ограниченные брызги шин с прежним reduced-motion/паузой.
- Исправление QA «белая линия в воздухе»: дорожная PNG имеет прозрачный верх20px, поэтому прежние17px настила были прозрачны. Теперь есть сплошная основа32px, видимое покрытие с поправкой UV, край/нижняя балка/жёлтые метки. Геометрия платформы и нижнего объезда не менялась.

Файлы: src/ui/{screens/Menu,GarageScreen,ProfileScreen; components/CareerSummary,VehiclePreview; hud/GameHud; career,hub,ui.module.css}; src/app/{OrderScreen,ResultScreen}.tsx,slice.module.css; src/game/scenes/{Boot,MainMenu,Gameplay}; rendering/{equipmentStyle,eveningAssets,vehicleArt,cargoArt,YardBackdrop,RouteScenery,RidePresentation}; public/assets/career и cargo/{noodles.png,soup.svg}; DESIGN.md. Камеру/физику/сохранения/App/зависимости/Git-индекс профиль не менял.

Runtime: 4 вечерних WebP1536×768, мокрая плитка, cropped noodles PNG, простой авторский soup SVG в палитре набора (отдельного супа в ArtKit нет). Manifest содержит7 записей/SHA. Исходные6 файлов ArtKit сравнивались с записанными source_sha256 и не изменены. Новый полный транспорт/rig не создавался: Тягач-80 использует тот же ArtKit-силуэт с усилением рамы; механическая модель настоящая у PHY. Цвет — мягкое умножение только корпуса, не курьера.

## Собственная проверка, 18 ноября

- Адресный ESLint18 своих TS/TSX → exit0. После последней правки Menu отдельно ESLint → exit0. Prettier check22 своих файлов → All matched files use Prettier code style!, exit0.
- Промежуточный tsc выявил собственные типы OrderScreen/vehicleArt — исправлены; повторный вывод содержал только root Orders.ts и tests/career.test.ts. Root сообщил об их исправлении. Общий tsc/build повторно не запускался по его просьбе; окончательное подтверждение — интеграционный цикл root.
- Одна изолированная UI-сессия dev5186. Исходный save:0XP/0монет/формирующаяся репутация; контракт2 закрыт, disabled Start проверен assertion. Для состояний после доставки использован явный fixture через настоящие defaultSave/settleDelivery (это не пройденный заезд). Реальными кнопками: подарок soft_suspension без списания150монет → mint40 → city_tires100 → баланс10; balance_sense включён вручную. После reload assertion подтвердил баланс10, инвентарь/установку/paint mint/включённый навык. Отрицательной/повторной покупки не делалось.
- Реальный Gameplay на локальном визуальном стенде: temperature≈92, wetSurface=true, cleanLandings=0, balancedSections=0, components=[noodles,soup] — assertion PASS. Трасса не проходилась. Для крупного вида платформы стенд меняет только точку старта у развилки; это также не приёмка прохождения.
- Температура и hints=true: DOM intersection=false в1280×720 (temperature right206, hint left230) и740×360 (right158, left170). Снимки просмотрены. Узкий гараж: scrollHeight656/clientHeight129; описание/плюс/минус видны при scrollTop105, нижние числа при527; конец scroll-area и начало закреплённого footer совпадают на y272, контент не потерян под кнопкой.
- Result fixture использует настоящий ResultScreen + рассчитанный receipt; saved/pending просмотрены, в pending оба перехода disabled и reward отсутствует. Скриншоты не означают настоящее прохождение. Runtime errors пусты; broken images=[] в хабе, в стенде0. Временный preview во время разработки исправлялся после ошибки относительного пути; только финальные снимки считаются результатом. HMR во время параллельных правок может пересоздать Phaser при сохранённом React mode: итоговые scene-снимки сделаны после свежего старта отдельного стенда.

Просмотренные локальные доказательства (вне Git):

- [Гараж1280](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-mint-soft-1280.png), [первый подарок](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-gift-1280.png), [узкий гараж — описание](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-garage-small-description.png), [узкий гараж — нижние числа](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-garage-small-stats.png).
- [Хаб740](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-hub-small.png), [профиль1280](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-profile-1280.png), [профиль740](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-profile-small.png), [контракт1280](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-contract-1280.png), [закрытый заказ](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-locked-small.png).
- [Мокрый Gameplay1280](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-wet-1280.png), [HUD740](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-wet-small.png), [настил у развилки](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-platform-beam.png), [результат1280](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-result-1280.png), [результат740](C:/Users/AORUS/Desktop/game/.local/stage-1-art/career-result-small.png). Result/scene-файлы явно помечены UI fixture/визуальный стенд.

Следующее у root: единая интеграционная проверка финального revision и приёмка реальных миссий/покупок/наград/reload. Также GameController.ts (root-owned) пока задаёт canvas aria-label только контракта001: нужно брать выбранный level.name. Дальнейшая Android/APK/производительность/мультитач/звук не проверялись этим профилем. Проходимость обеих трасс и стоимость эффектов по этим снимкам не заявляются.
