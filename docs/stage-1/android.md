# Этап 1: Android и QA — подготовка прогона

Дата: 17 ноября 2026, Europe/Moscow. Область: первая параллельная фаза из `docs/STAGE_1.md`, без Android-сборки и устройств.

**готов к объединённой сборке, device-test новой версии ещё не выполнялся**.

## Результат и файлы

- Добавлен `tools/android-smoke.ps1`: обязательные явные serial и Android user; проверка transport/boot/user/package/UID; без автоматического выбора устройства, ожидания boot или запуска AVD.
- Установка только через `-InstallApk`, запуск только через `-Launch`. До установки проверяется точный package `com.nerazley.game` посредством aapt2; перед действиями повторно проверяется Android user. Установка сохраняет данные (`-r`), без downgrade/grant/test-флагов. Launcher разрешается из установленного пакета и проверяется перед `am start`.
- `-CollectDiagnostics -OutputDirectory <absolute-path>` собирает только основной процесс выбранной игры: logcat с PID+UID, gfxinfo framestats, meminfo и JSON контекста. Каталог вне любого Git checkout, новая уникальная папка на каждый сбор, без junction/symlink. Список процессов не экспортируется. Смена пользователя/PID останавливает сбор; отсутствующая игра/процесс не заменяются другими целями.
- `-DryRun` проверяет параметры без SDK/ADB и без создания каталога диагностики. Команды ограничены 15 секундами, install — 60; нет фоновых ожиданий, бесконечного logcat или автоматических повторов. Таймаут завершает только текущий клиент; состояние возможной установки/запуска отмечается неизвестным в ошибке.
- Обновлён `docs/ANDROID.md`: команды раздельных install/launch/диагностики, точный порядок следующего прогона и ручная матрица полного coffee vertical slice. Включены Меню → Заказ → Заезд → успех/провал → Результат → Повтор/Продолжить, звёзды и сохранение лучшего результата после худшего заезда и повторного запуска. Также lifecycle, offline, аудиофокус, аппаратный мультитач, safe area и отдельный 30-секундный замер rAF.
- По отдельному уточнению интегратора обновлён `android/app/build.gradle`: `versionCode 2`, `versionName "0.2.0"` для отличия coffee slice от старого APK. Это только метаданные будущей сборки. Нативная логика, `tools/build-android.ps1`, общие конфиги, зависимости/lock и контракты этим профилем не изменялись. Git index/ветка/история не менялись; изменения только локальные. Этот файл — отчёт интегратору.

## Safe area: причина и решение этой фазы

Изучен локальный исходник `node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/plugin/SystemBars.java`, Capacitor **8.6.2**. `initWindowInsetsListener` устанавливается при загрузке; `injectSafeAreaCSS` (строки 263–302) выполняет `document.documentElement.style.setProperty(...)` без проверки готовности DOM. Исключение ловится JS и попадает в console как `Error injecting safe area CSS`. Это соответствует холодному старту, описанному в прежнем `docs/VALIDATION.md`.

После `onPageCommitVisible` плагин повторно читает viewport и вызывает `requestApplyInsets()`. В игре уже есть `viewport-fit=cover`, `initialViewportFitValueHint: 'cover'`, `insetsHandling: 'css'`. Hint не проверяет наличие DOM. Исходник различает WebView major 140 и более старые версии; прежний AVD использовал WebView 91.

Постоянный дефект safe area на новой версии игры сейчас не воспроизводился: устройства не запускались. Поэтому нативная логика и node_modules не патчились; изменение versionCode/versionName к safe area не относится. Следующая проверка: scoped logcat холодного старта, computed CSS и фактическая геометрия/касания после загрузки и возврата из фона, отдельно современный WebView и экран с вырезом. Удаление сообщения из лога само по себе не критерий исправления.

## Фактическая локальная проверка

1. PowerShell Parser: `tools/android-smoke.ps1` — **0 ошибок**. Настоящий `pwsh -NoProfile -NonInteractive -File tools/android-smoke.ps1 -Serial emulator-5580 -UserId 0 -DryRun` вернул `mode: dry-run`, все действия `False`, `sdkInvoked: False`. Serial/user здесь только тестовые аргументы.
2. Безопасный локальный harness: `pwsh -NoProfile -NonInteractive -File C:/Users/AORUS/AppData/Local/Temp/nerazley-smoke-stage1-8a6142.ps1` — **exit 0**. Он подставляет функцию ответа SDK в временную копию скрипта и исключает загрузку android-env. Проверены 23 сценария: read-only по умолчанию; user 10; DryRun без SDK; offline; boot=0; другой/сменившийся user; отсутствие пакета; неправильный UID; явный install; отказ другому APK; явный launch; отказ чужой activity; scoped diagnostics; отсутствие/перезапуск процесса; отказ пути внутри игры/другого Git checkout; отсутствие/относительный output; output без opt-in; метасимволы serial; отсутствующий APK. Для всех подставных ADB-вызовов проверено наличие точного `-s`; install/launch отсутствуют без соответствующих параметров.
3. Тот же harness выполнил исходную функцию `Invoke-GameProcess` с безвредным локальным `pwsh`: получен ожидаемый stdout; exit 7 корректно отвергнут. SDK/ADB не исполнялись. Нативный timeout и реальные ответы Android этой проверкой не подтверждены.
4. `pwsh -NoProfile -File ./tools/verify-project.ps1` — **exit 0**:

   ```text
   OK: 8 PowerShell scripts parsed; 92 imported files verified across 22 skills; license records present; 174 Git paths checked.
   ```

5. `git diff --check -- tools/android-smoke.ps1 docs/ANDROID.md docs/stage-1/android.md` — **exit 0**, замечаний нет. Для новых неиндексированных файлов отдельно проверены синтаксис и отсутствие пробелов на концах строк; содержимое не добавлялось в индекс.
6. После уточнения версии локально сверены `versionName 0.2.0`/`versionCode 2` в Gradle с `version 0.2.0` в package.json и обоими корневыми полями package-lock.json — **OK**. Gradle не запускался; фактическую версию нового APK проверит будущая инспекция артефакта. Повторный `git diff --check` включает `android/app/build.gradle`.

Локальные mock-артефакты последнего запуска: `C:/Users/AORUS/AppData/Local/Temp/nerazley-smoke-local-818601bca67e4cf79b4ced7634e2712f`. Это искусственные ответы, не данные Android-устройства, не доказательство device-test.

## Передача следующей фазе

Интегратор сначала завершает авторов web-кода, согласует поведение «Продолжить» для одного маршрута, запускает общие проверки и передаёт стабильную ревизию/состав локальных изменений. Изменения общих контрактов от Android-профиля сейчас не требуются. Порядок и команды — раздел «Следующий согласованный прогон Этапа 1» в `docs/ANDROID.md`.

После отдельного поручения: одна объединённая debug-сборка → инспекция конкретного APK → выбор и проверка выделенного устройства/user → отдельные install и launch → визуальная приёмка полного цикла → диагностика → ручные lifecycle/offline/multitouch/frame-time проверки → отчёт с новым hash/размером/подписью и честным разделением AVD/телефона. На этой фазе APK, AAB, установка, cap sync, запуск AVD, ADB, doctor с обнаружением устройств и изменение сетевых настроек **не выполнялись**. Прежние результаты из VALIDATION не засчитываются новой версии. Release signing и магазин остаются за границами этапа.

Справочники команд: [Android dumpsys](https://developer.android.com/tools/dumpsys), [исходник Android logcat с UID-фильтром](https://android.googlesource.com/platform/system/logging/+/c47b22f3dffa9325b054e172dba737712afc771f/logcat/logcat.cpp). Источником анализа Capacitor был установленный локальный 8.6.2, а не upstream main.
