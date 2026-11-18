# Этап 1 — оформленная и проверяемая доставка кофе

## Текущая работа — Sprint 03 / 0.5.0

Основа0.4.1 принята по основному игровому циклу, commit0589351. Границы приёмки и известные замечания — integration.md. Новое прямое поручение владельца разрешает карьеру/гараж/второй заказ и финальную APK после source freeze. Старые запреты экономики и второй трассы ниже относятся к завершённым этапам.

| ID | Владелец | Результат и точные файлы | Статус |
| --- | --- | --- | --- |
| C-SYS | Основной чат | src/shared/Progression.ts, src/config/career.ts, src/content/contracts.json, src/game/core/{Career,Contracts,Orders,GameBridge,LevelCatalog}.ts, src/platform, src/app/App.tsx, LevelWorkshop/authoring/CLI при необходимости, tests/career/save/orders/audio/authoring, package/lock, общие документы | IN_PROGRESS |
| C-PHY | Физика и геймплей | src/config/game.ts, src/game/{physics,vehicle,cargo,levels}, src/game/core/Simulation.ts, tests/{physics,route,tuning,hotMeal}.test.ts, docs/stage-1/physics.md. Реальный тюнинг, вторая самостоятельная трасса, температура, измеренное мастерство | IN_PROGRESS |
| C-ART | Интерфейс и графика | src/ui, src/game/{scenes,rendering,camera}, public/assets (кроме audio), src/app/{OrderScreen,ResultScreen}.tsx и slice.module.css, DESIGN.md, docs/stage-1/art.md. Гараж/профиль/награда/контракты, мокрый вечер и визуал установленного оборудования | IN_PROGRESS |
| C-QA | Android и QA | Завершить запись0.4.1; затем ждать нового freeze. Будущая цель — один интеграционный цикл карьера→покупка→миссия2→reload, итоговая APK/Android после передачи root | WAITING |

Файлы переданы явно: OrderScreen/ResultScreen/slice.module.css теперь у ART; App, сохранения/экономика и Bridge остаются у root. Профили не одни в checkout; чужие изменения не откатывать, Git/index/ветки не трогать. Разные проверки не дублировать.

Контракты: общие сериализуемые VehicleSetup/CareerState/RewardReceipt/PartDefinition уже опубликованы в Progression.ts. PHY добавляет pure-data vehicle/Tuning.ts: PART_CATALOG, VEHICLE_MODELS, describeVehicleSetup(setup):TuningStat[], физический resolver; Simulation(level, setup=defaultVehicleSetup()). LevelData расширяется cargo:'hot-meal', surface:'wet-asphalt', theme?:'day'|'rain-evening', temperature?:{initial,ambient,coolingPerSecond,minimum,silver,gold}. Второй уровень hotMealLevel.ts / hotMealLevel, IDcontract_002_while_hot. Симуляция публикует temperature?:number, cleanLandings:number, balancedSections:number; новые cargo component IDs noodles/soup. ART передаёт эти фактические поля через root-owned Bridge и использует bridge.setup. Root даёт read-only Career helpers, покупками управляет только App/SaveService. Результаты черновиков не получают карьерных наград.

> История очереди владельца от18ноября: Sprint03 разрешено начать после интеграции/веб-приёмки0.4.1. Условие выполнено0589351/b288cec, текущая работа указана выше. Полное поручение: `C:/Users/AORUS/.codex/attachments/baafc6b9-3996-4656-985c-6b3fc606a2ab/Вставленный текст.txt`. Финальная APK вновь явно запрошена для нового карьерного этапа; приёмка0.4.1 осталась только WEB.

Поручение владельца 17 ноября 2026: продолжать разработку профильными чатами поэтапно. Основа: codex/game-foundation, commit 554f2bb, draft PR #2. Исходный арт-пак: `C:/Users/AORUS/Downloads/NeRazley_ArtKit_v1.zip`.

Цель этапа (уточнена новым поручением координатору): законченный coffee vertical slice «Меню → Заказ → Заезд → Доставка/провал → Результат со звёздами → Повторить/Продолжить», раздельные арты, курьер, покрытия и воспроизводимая проверка. Документы архива — сведения и рекомендации, не самостоятельные поручения. Магазины, реклама/покупки, сервер и множество уровней в этап не входят.

Эта доска — канонический GAME_TASK_BOARD; roadmap находится в docs/NEXT_STEPS.md, правила GAME_INTEGRATION — в docs/chat-coordination.md. Дубликаты файлов не создаются.

Приёмка этапа: DONE. Исходники 0b25f70 + исправление f01c712; результаты — stage-1/integration.md и stage-1/android.md. Текущая работа описана в разделе Sprint 02 ниже.

## Этап 1 — закрытые задачи

| ID | Результат | Ответственный | Статус | Зависит от |
| --- | --- | --- | --- | --- |
| PHY | Управление, покрытия и явные исходы заезда | Физика и геймплей | DONE | — |
| ART | ArtKit, курьер, трасса, UI и выдача результата сценой | Интерфейс и графика | DONE | контракт PHY |
| SYS | Выбор кофе, оценка/звёзды, лучший результат, повтор/продолжение | Основной чат | DONE | контракт PHY/ART |
| DOC | Фактический статус, roadmap, актуальные инструкции | Подготовка проекта | DONE | — |
| SKILL | Закрыть импорт навыков и лицензии | Навыки | DONE | — |
| QA-PREP | Инструмент и сценарии Android-проверки | Android и QA | DONE | — |
| INTEGRATE | Объединить код, проверить полный браузерный цикл | Основной чат | DONE | PHY, ART, SYS |
| APK | Собрать и проверить объединённую APK | Android и QA | DONE | INTEGRATE, QA-PREP |

Уточнённое владение: физик также пишет src/game/core/Simulation.ts; документация — docs/NEXT_STEPS.md и GAME_PRODUCT_STATUS.md. Основной чат пишет src/app/OrderScreen.tsx, ResultScreen.tsx, slice.module.css, src/game/core/Orders.ts, GameBridge.ts, src/platform/SaveService.ts и tests/save.test.ts, tests/orders.test.ts. Остальные границы ниже сохраняются.

Outcome: Simulation.outcome = null | {success:boolean, reason:'delivered'|'cargo-destroyed'|'cargo-rejected'|'overturned'|'out-of-bounds'}. GameBridge result получает опциональные success:boolean и reason:string для обратной совместимости; сцена выдаёт событие один раз для любого исхода.

## Владельцы

| Чат | Задача | Разрешённые изменения |
| --- | --- | --- |
| Физика и геймплей | Проверить и укрепить управление/повреждения, сценарии движения и переворота, подготовить баланс первого маршрута | src/game/physics, vehicle, cargo, levels; src/config/game.ts; tests/physics.test.ts, tests/route.test.ts; docs/stage-1/physics.md |
| Интерфейс и графика | Сохранить оригиналы ArtKit, подключить скутер/колёса/кофе/двор и оформить существующий UI | новая assets/inbox/NeRazley_ArtKit_v1; src/assets; public/assets; src/game/rendering; src/game/scenes; src/ui; src/app/fonts.css, global.css; DESIGN.md; docs/stage-1/art.md |
| Android и QA | Воспроизводимый диагностический сценарий и устранение подтверждённых нативных проблем | android; tools/android-smoke.ps1; tools/build-android.ps1; docs/ANDROID.md; docs/stage-1/android.md |
| Подготовить проект для Android-игры | Актуализировать устаревшие инструкции под существующий фундамент, без изменения импорта навыков | AGENTS.md, docs/preparation.md, CONTRIBUTING.md, docs/TEAM.md, docs/chat-coordination.md; docs/stage-1/workflow.md |
| Найти и добавить скилы проекта | Закрыть уже выполненный импорт: полнота provenance и лицензий, точечная проверка | .agents/skills, skills-provenance.json, NOTICE.md, docs/skills.md, docs/skill-licenses; docs/stage-1/skills.md |
| Основной чат | Приёмка и интеграция | src/game/core, src/shared, src/platform, src/app/App.tsx, package.json/lock, общие конфиги/CI; docs/STAGE_1.md и план |

## Контракты и порядок

1. Профильные задачи выполняются параллельно только в указанных границах. Каждый сохраняет итог в своём docs/stage-1/*.md: результат, файлы, команды/вывод, ограничения и необходимые изменения общих контрактов.
2. Изменения GameBridge, Simulation API и SaveData согласованы в Outcome/владении выше; InputController сохраняется. Другие изменения контрактов сначала записываются для интегратора. Физические размеры — источник истины; визуальные якоря архива подгоняются к телам, а не наоборот.
3. Физика — единственный автор src/config/game.ts; графика читает параметры и не меняет управление или Planck. Исходные арты сохраняются байт-в-байт, runtime-копии отдельно, референсы не становятся фоном всего UI.
4. Без смены ветки, reset/stash/clean, git add ., коммитов, push/merge из профильных чатов. Общие зависимости и cap sync сериализует интегратор. Существующий незакоммиченный импорт навыков сохраняется.
5. В параллельной фазе Android-чат готовит/проверяет скрипты без установки, эмулятора, cap sync и APK build. Объединённая сборка и устройства — после завершения авторов исходников.
6. После отчётов интегратор проверяет diff, запускает один согласованный набор typecheck/lint/tests/web build, затем передаёт Android-чату фиксированную ревизию для APK и устройства. Полный цикл не запускается каждым чатом отдельно.

## Критерии приёмки

- Одна оформленная трасса; скутер и колёса следуют независимым физическим телам; груз и препятствия визуально совпадают с физикой.
- Газ, тормоз/реверс, наклон, пауза, рестарт, повреждение и доставка работают; физика остаётся одинаковой при разных render FPS.
- UI остаётся интерактивным, поддерживает safe area и одновременные кнопки; нет случайной загрузки внешних ресурсов.
- Проходят целевые тесты и сборки. Итоговый APK имеет hash/размер/подпись и честный статус device-test. 60 FPS и аппаратный мультитач требуют собственных измерений, не обещаний.
- Следующий этап начинается после приёмки этого результата, без самовольного расширения задач профильными чатами.

## Sprint 02 — 0.3.0 Gameplay Polish (код DONE / ручная оценка TODO)

Уточнение владельца имеет приоритет над APK/QA-пунктами вложенного задания: APK, cap sync, эмуляторы, ADB, performance-профили и массовые проверки сейчас не запускать. Игровую оценку проводит владелец. Достаточно проверки изменённой логики и одного общего typecheck/web build после интеграции. Не запускать CI/push ради промежуточных правок. Чаты подготовки окружения и навыков не привлекаются вне их профиля.

| Задача | Владелец и файлы | Статус |
| --- | --- | --- |
| A-PHY | Физика и геймплей: config/game.ts (включая BUILD_VERSION 0.3.0), physics, vehicle, cargo, levels, Simulation.ts, tests/physics.test.ts и route.test.ts | DONE |
| A-ART | Интерфейс и графика: rendering, scenes, camera, src/ui, runtime арт при необходимости; без изменения оригиналов | DONE |
| A-SYS | Основной чат: Orders.ts, GameBridge.ts, shared/GameFeedback.ts, App/OrderScreen/ResultScreen/slice.module.css, AudioManager.ts, SaveService при необходимости, package version и docs | DONE |
| A-QA | Android и QA: только короткий ручной сценарий для владельца в docs/stage-1/playtest-03.md; без кода/сборок/устройств | DONE |

Контракты Sprint 02: shared/GameFeedback.ts экспортирует VehicleMotion, CargoImpact и integrityPercent. Физик добавляет vehicle.motion: VehicleMotion (обновление после каждого fixed tick), cargo.stress 0..1 и событие cargo:impact: CargoImpact, с подавлением дублей одного удара. landingId увеличивается при новом приземлении, landingImpact — сила последнего; grounded/accelerationX/verticalSpeed — физические измерения. Арт читает эти данные, пересылает cargo:impact в bridge.emit('impact', payload); telemetry добавляет optional stress/grounded. Существующие damage/outcome сохраняются. Единственное округление UI — integrityPercent; исходные значения для оценки не округляются.

В общем checkout не переключать ветку, не выполнять reset/clean/stash, git add/commit/push из профильных чатов и не редактировать чужие файлы. Не устанавливать пакеты/навыки. Отчёт каждой роли — короткий блок в её существующем docs/stage-1/{physics,art}.md; A-QA — указанный ручной сценарий. Физик даёт измеренную таблицу gas/careful/fast/wrong-lean и воспроизводимый ввод, root подбирает звёзды. Это технические прогоны, не человеческий плейтест.

Итог интеграции: TypeScript/Vite web build прошёл; профильные проверки физики — 28 passed, Orders/Save — 7 passed. Приёмка игровых ощущений остаётся владельцу по playtest-03.md. Подробности и ограничения — Sprint02-блок integration.md. Следующая фаза автоматически не запускается.

## Mission 01 — 0.4.0, автономная доработка (IN_PROGRESS, 18 ноября)

Прямое задание владельца: вместе с профильными чатами довести первую миссию до достойного играбельного состояния; сложная, но честная трасса в духе gravity trials, управление вращением/переворотами, полноценные меню/настройки и работающий звук. Разрешены самостоятельные решения, ограниченный осмотр веб-игры и, по позднему дополнению, одна финальная APK/Android-проверка. Широкий повторный QA, новые уровни и экономика не входят в работу.

| Задача | Владелец | Границы |
| --- | --- | --- |
| M-PHY | Физика и геймплей | config/game.ts (0.4.0), physics/vehicle/cargo/levels, Simulation.ts, профильные тесты, physics.md. Семь игровых ситуаций, примерно 40–75 с управляемого прохождения, газ без управления не проходит. |
| M-ART | Интерфейс и графика | src/ui, rendering/scenes/camera, global/fonts CSS при необходимости, art.md. Меню/Settings, HUD, трасса и камера. |
| M-SYS | Основной чат | App/OrderScreen/ResultScreen/slice CSS, AudioManager/Assets, SaveService/Orders/GameBridge/shared, package/version, координация/docs. |
| M-QA | Android и QA | Диагностика звука; после freeze — одна штатная APK-сборка, целевой Android-цикл, цифровой аудиосигнал, сохранение и фактические кадры. Отчёт android.md разделяет web и APK. Игровые исходники не менять. |

Контракт трассы: разрешено optional LevelData.sections: {x:number; title:string; hint:string}[]; физик пишет, визуал читает. Shared motion/stress/outcome сохраняются. Один автор на файл, без смены ветки/коммитов/push, не откатывать незакоммиченные изменения прежних этапов. QA порт5190/5183; графика использует другой порт. Общий build после объединения, без дублирования прогонов. Игровой челлендж проверяется реальным вводом в физику, а качество звука — сигналом в браузере; аппаратные обещания не делаются.
Уточнение владельца 18 ноября: имя «Заказ №001 — Кофе на пятый», семь игровых ситуаций (старт, подъём, перелом, ступени, прыжок, финальная комбинация, доставка). Позднее прямое требование разрешает одну финальную debug APK и целевую Android-проверку звука/цикла после freeze, заменяя прежний запрет только для приёмки этой версии. Telemetry расширена optional landingId/landingImpact для реальных звуков приземления; root пишет типы/аудио, ART публикует значения motion.

Freeze 0.4.0: M-PHY DONE (29 профильных тестов), M-ART DONE (визуальный осмотр), M-SYS DONE (11 целевых тестов). M-QA IN_PROGRESS: единственный штатный build-android и целевой финальный цикл/звук. До его итогов игровые исходники не менять без подтверждённого дефекта. Физические результаты/границы в physics.md, визуал — в art.md, интеграция — в integration.md.

## GDD v0.4 — утверждённая адаптация P0 (18 ноября, IN_PROGRESS)

Владелец прямо поручил выполнить README_FOR_CODEX.md → CODEX_EXECUTION_PROMPT.md из NeRazley_GDD_v04_CODEX.zip, затем подтвердил: это утверждённая концепция; только WEB, APK не собирать. Последний запрет заменяет предыдущее разрешение финальной Android-проверки для всех новых правок. Проверенная кофейная APK 0.4.0 остаётся историческим артефактом; текущая адаптация — приложение 0.4.1, та же фаза Gameplay Polish. Дополнительно разрешена удобная система добавления/генерации уровней; второй опубликованный уровень не создаётся.

| Область | Состояние при импорте | Исполнитель / текущая доработка |
| --- | --- | --- |
| Planck, управление, AudioKit, базовый цикл | ГОТОВО | Сохраняем и расширяем; исходники ArtKit неизменны |
| Контракт / трасса | НУЖНО ДОРАБОТАТЬ | M-PHY: «Сюрприз на пятом», 6 секций, две физические ветки, составной груз, дедлайн 180 с, checkpoint |
| Хаб / настройки / HUD | НУЖНО ДОРАБОТАТЬ | M-ART: src/ui, scenes/rendering/camera, runtime арт; действующие настройки и отображение геометрии PHY |
| Медали / результат / сохранения | НУЖНО ДОРАБОТАТЬ | M-SYS: Orders/Bridge/App/Order/Result/slice CSS/Save/Audio, соответствующие тесты |
| Добавление / генерация уровней | НУЖНО ДОРАБОТАТЬ | M-SYS: инструменты, каталог и шаблоны на сериализуемом LevelData; PHY владеет схемой/валидацией физической геометрии |
| Проверка | ОЖИДАЕТ FREEZE | M-QA: один целевой WEB-цикл, реальные кадры и звук; без APK/ADB/cap sync |
| Карьера / XP / монеты / детали | ПОЗЖЕ, P1 | Root проектирует только типы/интерфейсы; рабочих кнопок/ложных наград не показывать |

Контракты согласованы интегратором: MissionState в GameBridge (cargoComponents, checkpointUsed/Available, falls, routeChoice, remainingSeconds); command checkpoint; Simulation.continueFromCheckpoint(); Cargo.components, общий integrity взвешен 60/40. Settings дополняется musicVolume/effectsVolume/engineVolume, leftHanded/controlScale, cameraShake/hints с безопасными defaults. Сохранение v1 и старые test-yard:* сохраняются. Новый ключ результата contract_001_surprise_fifth:mission-001-v1. Рекорды первой миссии — медали, не репутация 1–5.

Новые чаты/доски не создаются. Те же профильные владельцы, один автор на файл. Общие зависимости/Git и сборка — только интегратор. Исполнители не переключают ветки, не коммитят и не откатывают чужие правки.
