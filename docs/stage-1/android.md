# Этап 1: Android и QA — итог debug APK 0.2.0

17 ноября 2026, Europe/Moscow. **Исправленный coffee slice прошёл перечисленные ниже проверки на выделенном эмуляторе Game_API31.** Это проверка debug APK, не release и не тест физического телефона.

## Итоговый артефакт

| Поле | Фактическое значение |
| --- | --- |
| Исходники APK | `f01c7128b7c75bf23537e7da5d81c3efc8690aa2`, ветка `codex/game-foundation` |
| Передаваемый APK | `.local/apk/nerazley-0.2.0-debug.apk` — исправленная копия build output, вне Git |
| Build output | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Package / launcher | `com.nerazley.game` / `com.nerazley.game.MainActivity` |
| Version | `0.2.0`, versionCode `2` |
| minSdk / targetSdk | `24` / `36` |
| Размер | **5 359 140 байт** (~5.11 MiB) |
| SHA-256 APK | **`c563f2ee13a9be4cd0d6e835d3f13f9fe909fc272d75e651f589152acd3af8a2`** |
| Подпись | `apksigner verify`: v2=true, один Android Debug signer, RSA 2048 |
| Сертификат | `C=US, O=Android, CN=Android Debug` |
| SHA-256 сертификата | `9990b8112ee7448eb947d3cd629ee63f8cb6354aeaaff73bc5530dc7dab3d019` |

`doctor.ps1 -Full` прошёл перед первой сборкой. Первая `npm run android:debug` из `0b25f70` завершилась успешно, но APK отклонён по результатам устройства. После отдельного поручения интегратора выполнена **одна пересборка** из исправленного `f01c712`: `BUILD SUCCESSFUL in 6s`, 153 tasks, 27 executed / 126 up-to-date, exit 0. Всего две Android-сборки в QA-фазе, причина второй — воспроизведённый блокер. Общие lint/tests/web build интегратор проверял отдельно; Android-профиль их независимо не повторял за исключением web build в штатном Android pipeline.

Исправленная копия отдельно проверена `tools/inspect-apk.ps1`; перед завершением SHA-256 копии сравнен с build output — совпадает. Установка обеих версий выполнялась через `android-smoke.ps1 -Serial emulator-5580 -UserId 0 -InstallApk ...` с `-r`, без очистки данных; запуск отдельным `-Launch`. Установленный пакет подтвердил versionName 0.2.0 / code 2.

## Устройство и способ проверки

Только **Game_API31**, порт 5580, serial `emulator-5580`, Android 12/API 31, x86_64, Android user **0**, UID игры **10145**. До запуска список ADB-устройств был пуст; имя AVD проверено через `adb -s emulator-5580 emu avd name`. Эмулятор создан этой QA-сессией через `Start-Process -WindowStyle Hidden` с `-no-window -no-audio`. Чужие AVD и Fit mini app не использовались.

WebView **91.0.4472.114**, viewport **830×393 CSS px**, DPR **2.75**, screenshot **2280×1080**. Первый исправленный процесс PID 4753; после холодного offline-перезапуска — PID 5176. Состояния наблюдались свежими screenshot через настоящий ADB и DOM через CDP именно этого WebView. DOM `button.click()` и KeyboardEvent использовались для части сценариев; реальный touchscreen gas проверен отдельно. Эти DOM-события не доказывают аппаратный мультитач.

Captures, диагностика и локальный CDP helper находятся вне Git:

`C:/Users/AORUS/AppData/Local/NeRazley/qa/stage1-0b25f70-20261117`

Имя каталога отражает первую ревизию; **файлы с префиксами 07–27 относятся к исправленному APK f01c712**, 01–06 — к отклонённому первому APK. `apk-inspection.txt` содержит инспекцию исправленного APK, `apk-inspection-rejected-0b25f70.txt` — первого. Захваты и game-save XML не публиковались.

## Подтверждённые сценарии исправленного APK

| Сценарий | Наблюдение / доказательство |
| --- | --- |
| Меню и ArtKit | Версия 0.2.0, курьер на жёлтом скутере, двор/деревья/дома, кнопки/иконки загружены. На трассе видны скутер, отдельные колёса, кофе, HUD и управление. `09-fixed-race.png/json` |
| Меню → Заказ → Заезд | «Играть» → «Кофе для соседа» → «Взять заказ» открывает HUD, 0%, 0 км/ч, 100% кофе. `08-fixed-order.json`, `09-fixed-race.json` |
| **Настоящий экранный газ** | `adb -s emulator-5580 shell input touchscreen swipe 2085 949 2085 949 2500`. Координаты взяты из текущего DOM и screenshot. Скорость выросла с 0 до **17 км/ч**, прогресс до **14%**. `10-adb-gas.png/json` |
| Успех → Результат | После настоящего ADB газа и последующего KeyboardEvent KeyW доставлено **100% кофе, 35.5 с, 1045 очков, 3 звезды**. Видимый экран и сообщение сохранения подтверждены. `12-success-result.png/json` |
| Результат → Повтор | «Попробовать ещё» открыл новый заезд: **0%, 0 км/ч, 100% кофе**, текущий таймер сброшен. `13-retry.json` |
| Провал | Совместные DOM KeyboardEvent KeyW+KeyD на 12 секунд вызвали «Скутер перевернулся», **18.4 с, 59% кофе, 0 очков, 0 звёзд**. `14-failure.png/json`. Время включает задержку до подачи ввода; это не обещание 11 секунд в любых условиях |
| Продолжить к заказам | Переход вернул экран заказа; лучший заезд остался **3/3, 100%, 35.5 с** после провала. `15-best-order.json` |
| Android Back в заезде | Настоящий `KEYCODE_BACK` открывает «Кофе подождёт», кнопки «Продолжить / Начать заново / Выйти в меню». `17-back-pause.json` |
| Явное продолжение | «Продолжить» закрывает паузу и возвращает HUD/управление. `18-resumed.json` |
| Home → возврат | После продолжения настоящий `KEYCODE_HOME` вывел Nexus Launcher; возврат через `-Launch` оставил игру на паузе с таймером 0:02, без автоматического продолжения. `19-home-paused.png/json` |
| Холодный offline-запуск | Авиарежим enabled/1; Wi-Fi отдельно отключён, `cmd wifi status`: disabled, **Active default network: none**. После `am force-stop --user 0 com.nerazley.game` подтверждено отсутствие PID; новый запуск открыл меню и заказ без сети. `20-offline-cold-menu.json`, `21-offline-record.json` |
| Рекорд после холодного запуска | Native Preferences восстановили **3/3, 100%, 35.5 с**. XML игры до/после холодного перезапуска сохранён; UI подтвердил именно этот результат. `21-offline-record.json` |
| **Offline-доставка до результата** | При остававшемся `Active default network: none` новый заезд завершился: **100% кофе, 18.2 с, 1218 очков, 3 звезды**. `23-offline-drive.json`, `24-offline-result.png/json` |
| Новый offline-рекорд после reload | Продолжить → reload WebView → Играть, всё ещё без сети: **3/3, 100%, 18.2 с**. `27-offline-restored-record.json`. Native `nerazley.save` в `27-final-game-save.xml`: seconds=18.200000000000248, integrity=100, stars=3, score=1218 |
| Smoke на настоящем ADB | Сборы `android-smoke.ps1 -CollectDiagnostics` прошли, включая финальный PID 5176. Scoped PID+UID logcat, gfxinfo и meminfo сохранены в подпапках `smoke-*`; нет глобального bugreport и логов чужих процессов |

## Найденный и устранённый блокер

Первый APK из `0b25f70960656cb0e772cb02b0b4d1ff58f30229` имел размер **5 265 570** и SHA-256 **`2851bae3fd219cce3772350cb7096d4c8011a601e82902339a9cd13c1d82b761`**. Он **отклонён**: меню/заказ открывались, но настоящий ADB tap и DOM click по «Взять заказ» оставляли экран заказа. Scoped logcat зафиксировал `TypeError: Object.hasOwn is not a function`. Исходный вызов — `src/game/levels/testLevel.ts:90`, `validateLevel`, проверка поверхности трассы.

Ошибка сначала записана в этот отчёт и передана интегратору. Интегратор заменил вызов на `Object.prototype.hasOwnProperty.call`, добавил регрессионную проверку без Object.hasOwn и target chrome91; его отдельная проверка — 32/32 теста. Android-профиль игру и зависимости не менял и runtime polyfill не вводил. На исправленном APK заезд, успех, провал и offline повторно проверены на **том же WebView 91**. Итоговая ссылка/копия выше относятся только к исправленному hash `c563…`.

Неблокирующее наблюдение для будущей UI-полировки: на экране провала HUD показывает **60%**, итоговая таблица **59%** (`14-failure.png`). Требуется согласовать отображение округлённой сохранности; это не мешало завершению и сохранению результата.

## Safe area и границы доказательств

Ранее локально исследован Capacitor Android **8.6.2**, `SystemBars.java`: `injectSafeAreaCSS` обращается к `document.documentElement.style` без DOM guard; ошибка ловится JavaScript. После `onPageCommitVisible` запрашиваются insets повторно. Это объясняет известное стартовое сообщение из прежнего фундамента; native-код/node_modules не патчились.

На проверенном AVD после загрузки `--safe-area-inset-*` равны 0px по четырём сторонам; один Canvas, document scroll равен viewport. На просмотренных menu/race/result экранах нет обрезанного управления; газ нажимается реальным touchscreen input. В сохранённом `final-logcat.txt` не найдены `Error injecting safe area`, TypeError, FATAL EXCEPTION или Fatal signal. Это ограниченный снимок лога основного PID, не обещание отсутствия любых ошибок на других устройствах.

**Не проверены:** физический телефон, аппаратный мультитач, cutout/современный WebView, Android 7, планшет, аудиофокус/звонки и реальное звучание (`-no-audio`, сохранённые sound/music=false), WebGL context recovery, повреждённое сохранение новой версии. Frame-time профиль этого APK не снимался; **60 FPS не подтверждены**. DOM-комбинация клавиш и факт успешного ADB swipe не заменяют аппаратный мультитач. Release signing, AAB и публикация не выполнялись.

## Восстановление окружения и изменения

Исходные состояния выбранного AVD: airplane_mode_on=0, wifi_on=1, mobile_data=1, Android user=0. Для offline изменены только авиарежим и Wi-Fi. Перед остановкой восстановлены **0 / 1 / 1**, пользователь остался 0; `cmd wifi status` подтвердил подключение к AndroidWifi, появился active default network 101. Мобильные данные отдельно не менялись.

Созданные forwarding удалены по точным портам: 54183 (первый процесс), 51526 (исправленный первый процесс), 54386 (холодный offline-процесс). Перед остановкой `adb -s emulator-5580 forward --list` пуст. ADB server не перезапускался. После проверки имени Game_API31 выполнен только `adb -s emulator-5580 emu kill`; окончательное исчезновение serial проверено отдельно. Установленное приложение и его тестовый рекорд намеренно оставлены в dedicated AVD; данные не очищались.

В QA-фазе Android-профиль менял только этот отчёт и игнорируемые/внешние артефакты. cap sync/Gradle выполнялись штатным pipeline; исходники игры, зависимости, signing и общие конфиги этим профилем не менялись. Коммиты, push, смена ветки и операции с Git index не выполнялись. Последующие store/release/реальные устройства — отдельная фаза.

## Подготовка инструмента — сохранённая история

Предыдущий статус подготовки: «готов к объединённой сборке, device-test новой версии ещё не выполнялся»; он заменён фактической приёмкой выше. В подготовке были добавлены `tools/android-smoke.ps1`, сценарии в `docs/ANDROID.md` и метаданные Android 0.2.0/code2 по поручению интегратора. Native safe-area логика не менялась.

Тогда прошли Parser, 23 локальных/mock сценария без SDK/ADB, проверка native process runner с локальным pwsh, `verify-project.ps1` (8 скриптов, 92 файла, 22 навыка). В текущей фазе smoke дополнительно проверен настоящим transport/user/package/UID и сбором диагностики. Команды следующего воспроизводимого прогона и границы автоматизации описаны в `docs/ANDROID.md`.
