# Android: сборка и установка

## Сборка

PowerShell 7, Node 22.12+, JDK 21, существующий Android SDK. Глобальные переменные не меняются.

```powershell
npm ci
. ./tools/android-env.ps1
pwsh -NoProfile -File ./tools/doctor.ps1 -Full
npm run android:debug
```

Последовательность: `build → cap sync android → gradlew assembleDebug → inspect-apk`. Результат: `android/app/build/outputs/apk/debug/app-debug.apk`, вне Git. `npm run android:sync` нужен перед ручной Gradle-сборкой после web-изменений. `dist` входит в APK; server.url/live reload не настроены.

Capacitor 8.6.2: minSdk 24 (Android 7), compile/target 36, AGP 8.13.0, Gradle wrapper 8.14.3. Нужен обновлённый System WebView с ES2022; версия ОС сама по себе этого не гарантирует. На Android 7 и планшетах фактической проверки пока нет. Gradle может докачать Build Tools 35.0.0 рядом с 36.0.0; старые пакеты не удаляются. Первая сборка требует интернет для Maven/Gradle, установленная игра — нет.

`com.nerazley.game` временный, утвердить до публикации. Название «Не Разлей!», следующая сборка coffee slice: versionName 0.2.0, versionCode 2 (пока только конфигурация; новый APK ещё не собран). Manifest: landscape и appCategory=game. System resize обрабатывают Scale.RESIZE и UI. Полноэкранность — SystemBars/WindowInsetsControllerCompat, вырезы — CSS-переменные Capacitor и env().

## Установка

Сначала проверьте serial, Android user и принадлежность устройства. Не выбирайте первый аппарат автоматически.

```powershell
. ./tools/android-env.ps1
adb devices -l
adb -s YOUR_SERIAL shell am get-current-user
pwsh -File tools/inspect-apk.ps1 -ApkPath android/app/build/outputs/apk/debug/app-debug.apk
pwsh -NoProfile -File tools/android-smoke.ps1 -Serial YOUR_SERIAL -UserId YOUR_USER_ID -InstallApk android/app/build/outputs/apk/debug/app-debug.apk
# После проверки установки — отдельный явный запуск:
pwsh -NoProfile -File tools/android-smoke.ps1 -Serial YOUR_SERIAL -UserId YOUR_USER_ID -Launch
```

Наш отдельный AVD: `emulator -avd Game_API31 -port 5580`; имя проверяйте `adb -s emulator-5580 emu avd name`. Запуск AVD выполняется отдельно, когда согласован прогон. Снимки и логи нового прогона — вне репозитория. Чужие AVD и контейнеры не используются.

## Smoke-проверка

`tools/android-smoke.ps1` требует PowerShell 7, явные `-Serial` и `-UserId`. Пакет ограничен `com.nerazley.game`; другой APK отклоняется по `aapt2 dump badging` до установки. Это проверка принадлежности пакета, не замена проверки подписи через `inspect-apk.ps1`. `-InstallApk` обновляет игру с сохранением данных (`-r`); обновление APK может затронуть этот же пакет у других пользователей устройства. Используйте выделенный тестовый профиль/аппарат.

Без дополнительных флагов скрипт проверяет только transport, `sys.boot_completed=1`, соответствие текущего Android user и наличие игры с UID этого пользователя. Он не ждёт загрузки ОС, не будит/разблокирует экран, не запускает AVD, не выбирает другой transport и не исправляет окружение автоматически. Отсутствие пакета завершает проверку ошибкой; установка выполняется только при `-InstallApk`. Запуск — только при `-Launch`, после разрешения launcher activity выбранного пакета. `Status: ok` означает подтверждение Activity Manager, а видимый экран проверяется отдельно.

```powershell
# Только локальный разбор параметров, даже без SDK и подключённого устройства:
pwsh -NoProfile -File tools/android-smoke.ps1 -Serial emulator-5580 -UserId 0 -DryRun

# Примеры для уже выбранного и подтверждённого устройства/пользователя:
pwsh -NoProfile -File tools/android-smoke.ps1 -Serial YOUR_SERIAL -UserId YOUR_USER_ID
pwsh -NoProfile -File tools/android-smoke.ps1 -Serial YOUR_SERIAL -UserId YOUR_USER_ID -CollectDiagnostics -OutputDirectory C:/Users/AORUS/AppData/Local/NeRazley/qa
```

В примере DryRun `0` — тестовый аргумент, не предположение о пользователе реального устройства. Для реального прогона замените оба `YOUR_*` на явно подтверждённые значения. Диагностику снимайте после наблюдения нужного состояния игры; при необходимости выполните отдельный `-Launch`.

Диагностика создаёт уникальную папку `smoke-<time>-<guid>` вне любого Git checkout и отклоняет пути через symlink/junction. Сохраняются `preflight.json`, последние до 600 сообщений logcat с фильтрами основного PID и UID игры, `gfxinfo framestats` и `meminfo` этого PID. PID выбирается по точному имени игры **и** UID пользователя; таблица всех процессов не сохраняется. Повторно проверяются пользователь и PID. Если процесс завершился/сменился либо команда не поддерживается, прогон останавливается; оставшиеся файлы считаются частичными. Файлы содержат serial и диагностические данные игры: не публикуйте их автоматически.

Скрипт не снимает экран/XML, не читает сохранения, не собирает глобальные логи/bugreport и процессы WebView renderer. При падении до сбора он не подменяет данные системным crash-буфером. Обычная команда ограничена 15 секундами, установка — 60. При таймауте прекращается только SDK-клиент; состояние попытки установки/запуска неизвестно, автоматического повтора нет. Не выполняются очистка данных/logcat, force-stop, настройка сети, ADB forwarding, перезапуск сервера ADB или изменение глобальных настроек.

`gfxinfo` — вспомогательная диагностика Android UI, не доказательство частоты кадров WebGL-игры. Android описывает этот инструмент в [официальном справочнике dumpsys](https://developer.android.com/tools/dumpsys). Для frame time нужны отдельные замеры WebView/Phaser на реальном устройстве.

## Следующий согласованный прогон Этапа 1

Сборку запускает Android-профиль только после передачи интегратором стабильного состояния и результатов общих web-проверок. В первой параллельной фазе выполняется только подготовка инструмента.

1. Зафиксировать переданную ревизию и состав локальных изменений. Выполнить `. ./tools/android-env.ps1`, `pwsh -NoProfile -File tools/doctor.ps1 -Full`, затем один `npm run android:debug`. Скрипт сборки выполняет web build, cap sync, Gradle и инспекцию APK. Записать package, versionName/versionCode, SHA-256, размер и подпись; результаты старого APK не переносить на новый.
2. Выбрать отдельный `Game_API31` или согласованный физический аппарат. При необходимости запустить только этот AVD отдельной командой выше. Выполнить `adb devices -l`, для выбранного serial — `adb -s YOUR_SERIAL shell am get-current-user`, на эмуляторе также `adb -s YOUR_SERIAL emu avd name`. Проверить принадлежность, профиль и разблокировку вручную. Smoke не заменяет эту проверку.
3. Проверить APK через `inspect-apk.ps1`, выполнить отдельный smoke с `-InstallApk`, убедиться в `Success` и отсутствии ошибки проверки пакета. Выполнить отдельный `-Launch`, затем визуально проверить правильный экран. Снять исходную диагностику командой с `-CollectDiagnostics` выше.
4. Пройти сценарии в таблице. Для каждого записывать «прошёл/не прошёл/не проверен», условия и наблюдаемый результат. Отдельно снять диагностику после заезда; каждый запуск создаёт новую папку. Снимки при необходимости делать только на экране игры и хранить вне Git.
5. Повторить критические сценарии на физическом Android: аппаратный мультитач, прерывания и frame time. Отделить результат эмулятора от телефона. После проверки восстановить только настройки, которые были явно изменены для этого теста; не останавливать чужие устройства/сервисы. Сохранить отчёт в `docs/stage-1/android.md`.

| Ручная проверка | Ожидаемое наблюдение |
| --- | --- |
| Меню → Заказ → Заезд → успех → Результат | Выбран кофе; доставка приводит к результату со звёздами, показатели согласованы с заездом |
| Заезд → провал → Результат → Повтор | Провал отображён; повтор сбрасывает текущий заезд, управление остаётся доступным |
| Результат → Продолжить | Переход соответствует принятому контракту одного маршрута; без добавления магазина/экономики |
| Лучший результат | Получить лучший результат, затем худший; лучший не ухудшается и сохраняется после повторного запуска приложения |
| Pause/Back, Home/возврат, блокировка/разблокировка | Симуляция и звук останавливаются; возврат оставляет паузу до явного продолжения; удерживаемые кнопки отпускаются |
| Прерывание аудио | На тестовом аппарате вызвать согласованное прерывание аудиофокуса; нет наложения/дублирования, звук соответствует состоянию паузы и настройке |
| Offline | На выделенном устройстве вручную записать и изменить состояние сети; холодный запуск, заказ, заезд, результат и сохранение работают без сети; восстановить прежнее состояние |
| Multitouch | На физическом экране одновременно удерживать газ и наклон, отпускать независимо; нет залипания после отмены касания, паузы или ухода в фон. Одиночный ADB tap/swipe это не доказывает |
| Safe area/resize | Проверить landscape, вырез, жестовую/кнопочную навигацию, появление системных панелей и возврат из фона; элементы видны и нажимаются по всей области |
| Frame time | На реальном устройстве отдельно записать модель/API/WebView, частоту экрана, условия и не менее 30 секунд активной трассы: median/p95/max интервалов rAF и долю интервалов >16.7/33.3 ms. rAF — интервал вызовов, не полное GPU-время; для причины задержек нужен отдельный профиль. `gfxinfo` и гладкость на глаз не подтверждают 60 FPS |

На debug WebView замер rAF можно сделать через DevTools выбранного процесса, без изменения игры и постоянного ADB forwarding. Во время активного заезда выполнить в Console; это отдельный ручной замер, smoke его не выполняет:

```javascript
(() => {
  const samples = [];
  const started = performance.now();
  let previous;
  requestAnimationFrame(function sample(now) {
    if (previous !== undefined) samples.push(now - previous);
    previous = now;
    if (now - started < 30000) return requestAnimationFrame(sample);
    const sorted = samples.slice().sort((a, b) => a - b);
    const percentile = (p) => sorted[Math.ceil(p * sorted.length) - 1];
    console.log(JSON.stringify({
      count: samples.length, medianMs: percentile(0.5), p95Ms: percentile(0.95),
      maxMs: sorted[sorted.length - 1], over16_7: samples.filter((v) => v > 16.7).length / samples.length,
      over33_3: samples.filter((v) => v > 33.3).length / samples.length,
    }));
  });
})();
```

Не сворачивать приложение во время замера. При остановке/перезагрузке страницы замер неполон. Время работы DevTools и характер debug-сборки указывать в отчёте. Кнопки и заезд продолжают проверяться вручную.

## Известное сообщение safe area при старте

`docs/VALIDATION.md` фиксирует у старого APK `Error injecting safe area CSS` до появления `documentElement`. В локальном `@capacitor/android` **8.6.2**, `capacitor/src/main/java/com/getcapacitor/plugin/SystemBars.java`, метод `injectSafeAreaCSS` (строки 263–302) вызывает `evaluateJavascript` со строкой `document.documentElement.style.setProperty(...)` без проверки готовности DOM. Исключение ловится внутри JavaScript и выводится в console; это объясняет стартовое сообщение, но само по себе не доказывает crash или неверные insets после загрузки.

`initWindowInsetsListener` устанавливается при загрузке плагина; `handleOnStart` добавляет `onPageCommitVisible`, который проверяет viewport и вызывает `requestApplyInsets()` повторно. Текущий `index.html` содержит `viewport-fit=cover`; конфигурация уже задаёт `initialViewportFitValueHint: 'cover'` и `insetsHandling: 'css'`. Значение hint влияет на начальную обработку viewport, но не добавляет DOM guard. Локальный исходник также различает WebView до/после major 140; старый эмулятор из прежнего отчёта имел WebView 91. Не переносить его результат safe area на современный телефон с вырезом.

Сейчас native-код и `node_modules` не меняются: нет воспроизведённого постоянного дефекта на новой версии игры. На следующем прогоне снять scoped logcat холодного запуска, проверить computed CSS `--safe-area-inset-*`/геометрию UI после загрузки и после возврата из фона на старом и современном WebView. Только повторяемое неправильное положение/перекрытие управления требует отдельного ограниченного исправления; не отключать insets и не добавлять плагины ради удаления сообщения из лога.

## Release позже

Debug и release — разные артефакты. Сейчас стандартная debug-подпись Android вне Git. Release key не создавался, release signing не настроен. До магазина: утвердить ID, создать собственный долговечный ключ вне Git, настроить signing через локальный Gradle properties/секреты CI, поднять versionCode, проверить bundleRelease/assembleRelease, подпись и офлайн-запуск. Не использовать ключи/EAS/identity Fit mini app. Без release signing результат не готов для магазина.

Фактические результаты и SHA-256: [VALIDATION.md](VALIDATION.md).
