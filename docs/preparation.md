# Подготовка Android-игры

Дата: 17 ноября 2026, Europe/Moscow. Источник практик: локальный проект `C:/Users/AORUS/Desktop/Fit mini app` (RepForge / fit-quest).

## Готовое окружение

| Компонент | Фактический результат |
| --- | --- |
| Android SDK | Используется существующий `C:/Users/AORUS/AppData/Local/RepForgeAndroid` |
| Java | Microsoft OpenJDK 21.0.13.0.2, существующий JDK внутри SDK |
| Platform Tools | 37.0.1; ADB запускается |
| Command-line Tools | 23.0.0; доступен Android CLI |
| Android Platform | Добавлен `platforms;android-36` из официального репозитория Google |
| Build Tools | Добавлен `build-tools;36.0.0`: aapt2, apksigner, zipalign |
| Эмулятор | 37.2.13, ускорение WHPX доступно |
| Отдельный AVD | Создан `Game_API31`, Pixel 4, Android 12 / API 31, x86_64; используется уже установленный системный образ |
| Git | 2.55.0, отдельный локальный репозиторий `main` |
| GitHub CLI | Существующая авторизация работает; новый remote ещё не назначен |
| Docker | Docker Desktop запущен; Engine 29.8.1 отвечает, Compose 5.5.1 доступен |
| Node.js | 24.18.0; доступен при выборе JS-инструментов |

API 36 — установленный пакет инструментов, а API 31 — тестовая ОС эмулятора. Это не решение о targetSdk/minSdk будущей игры. NDK, CMake, Gradle и экспортные шаблоны устанавливаются в версиях, требуемых выбранным движком; его пока нет.

## Что перенесено

В `.agents/skills`: `game-design`, `android-adb-control`, `systematic-debugging`, `verification-before-completion`.

В `.agents/optional-skills`: `expo-overview`, `expo-animation`, `eas-app-stores`. Это запас для возможного выбора Expo/React Native, не зависимость игры.

Лицензии сохранены в `docs/skill-licenses/`; исходные ревизии и SHA-256 всех 36 перенесённых файлов записаны в `skills-provenance.json`. Использована текущая локальная копия скиллов, без обновления исходного фитнес-проекта.

Переняты практики отдельной подписи приложения, проверки APK, явного выбора ADB-устройства, хранения ключей и device-артефактов вне Git, проверки результата реальными командами. Правила записаны в `AGENTS.md`.

## Выполненная проверка

- `tools/doctor.ps1 -Full -Devices`: SDK/JDK, Git, ADB, CLI, Platform, Build Tools, Docker/Compose и GitHub доступны.
- `tools/verify-project.ps1`: разбор четырёх PowerShell-скриптов, проверка SHA-256 36 файлов в семи скиллах и наличия лицензий.
- `tools/inspect-apk.ps1` проверен на существующем APK RepForge: `apksigner verify` подтвердил подпись v2, `aapt2` прочитал манифест, размер и SHA-256 получены. Повреждённый APK корректно отклонён. Это проверка нового инструмента на готовом файле, не сборка игры.
- Собственный `Game_API31` запущен без окна на порту 5580: проверены имя AVD, `sys.boot_completed=1` и Android API 31. После проверки остановлен. Приложения не устанавливались; телефон и AVD RepForge не использовались.
- Локальные отчёты и логи находятся в игнорируемом `.local/`. Workflow GitHub Actions подготовлен, но не выполнялся в облаке.

## Команды на будущее

```powershell
. ./tools/android-env.ps1
pwsh -NoProfile -File ./tools/doctor.ps1 -Full
pwsh -NoProfile -File ./tools/verify-project.ps1
emulator -avd Game_API31
```

SDK/JDK определяются автоматически. Для другого расположения можно создать игнорируемый `.local/android.json` с полями `sdkRoot` и `javaHome`. Скрипт меняет переменные только текущего процесса.

Контейнеры игры, Dockerfile и Android build workflow появятся под конкретный стек. Существующий Dockerfile RepForge запускает фитнес-API и не является Android-сборщиком. Репозиторий `fit-quest`, EAS project ID, package `com.fitquest.app`, фитнес-данные, ключи и серверные endpoints не используются как идентичность игры.

## Следующий шаг

Получить идею и арты, выбрать движок под игровой цикл и визуал, определить название/package ID, ориентацию и поддержку устройств. Затем создать первый играбельный прототип и собрать его APK. Сервер, сеть, аналитика и монетизация добавляются только если нужны задумке.

Официальные справочники для управления пакетами: [Android CLI](https://developer.android.com/tools/agents/android-cli), [SDK Manager и имена пакетов](https://developer.android.com/tools/sdkmanager). Применён уже установленный Android CLI; загрузки выполнены с `dl.google.com`.
