# Android Game

[![Repository checks](https://github.com/EvgenyPonomarevNova/android-game/actions/workflows/tooling.yml/badge.svg?branch=main)](https://github.com/EvgenyPonomarevNova/android-game/actions/workflows/tooling.yml)
[![Platform: Android](https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white)](https://developer.android.com/games)
[![Stage: preparation](https://img.shields.io/badge/stage-preparation-64748b)](#состояние-проекта)

Основа для самостоятельной Android-игры: инструменты разработки, воспроизводимые проверки и понятный процесс доставки изменений.

**Рабочее название — Android Game.** Концепция и арты готовятся. Движок, механики и визуальное направление будут выбраны под игру.

[Начать работу](#быстрый-старт) · [Правила разработки](CONTRIBUTING.md) · [Окружение](docs/preparation.md) · [Задачи](https://github.com/EvgenyPonomarevNova/android-game/issues)

## Состояние проекта

| Этап | Статус |
| --- | --- |
| Android SDK, Java и инструменты проверки APK | Подготовлены и проверены локально |
| Отдельный эмулятор Android 12 | Создан; первый запуск проверен |
| GitHub, CI и правила внесения изменений | Настроены |
| Концепция, арты и выбор движка | Следующий этап |
| Играбельный прототип и первый APK | После выбора концепции |

## Быстрый старт

Для разработки Android сейчас используется Windows и PowerShell 7. Проверки самого репозитория также работают на Linux в GitHub Actions.

```powershell
git clone https://github.com/EvgenyPonomarevNova/android-game.git
cd android-game
pwsh -NoProfile -File ./tools/verify-project.ps1
```

Для локальной Android-разработки нужны JDK, Android SDK с Platform Tools, Command-line Tools, платформой `android-36` и Build Tools `36.0.0`:

```powershell
. ./tools/android-env.ps1
pwsh -NoProfile -File ./tools/doctor.ps1
```

`ANDROID_HOME` и `JAVA_HOME` задают расположение инструментов. Локальные переопределения можно сохранить в игнорируемом `.local/android.json`. Скрипт меняет окружение только текущего процесса.

## Инструменты

| Команда | Назначение |
| --- | --- |
| `pwsh -File ./tools/verify-project.ps1` | Синтаксис скриптов, целостность скиллов, лицензии и состав файлов в Git |
| `pwsh -File ./tools/doctor.ps1 -Full` | SDK/JDK, Git, Android Tools, Docker и авторизация GitHub |
| `pwsh -File ./tools/doctor.ps1 -Devices` | Дополнительно проверить наличие ADB-устройств |
| `pwsh -File ./tools/inspect-apk.ps1 -ApkPath C:/builds/game.apk` | Проверить подпись APK, прочитать манифест, размер и SHA-256 |
| `emulator -avd Game_API31` | Запустить подготовленный локальный эмулятор |

Эмулятор `Game_API31` создаётся отдельно на машине разработчика; клонирование репозитория не устанавливает SDK и AVD. Подробности — в [описании окружения](docs/preparation.md).

## Структура

```text
.agents/          Скиллы разработки и необязательные материалы Expo/EAS
.github/          CI, шаблоны задач и pull request, Dependabot, CODEOWNERS
assets/inbox/     Исходные арты и референсы
docs/             Окружение и лицензии сторонних материалов
tools/            Диагностика, проверки репозитория и инспекция APK
```

## Разработка

Изменения проходят через небольшие pull request. Заголовки следуют [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), например `feat(gameplay): add touch movement`. Перед слиянием обязательны проверки; squash сохраняет одно завершённое изменение в истории `main`.

CI выполняет проверку репозитория и соглашений о коммитах. Сборка и тесты игры будут добавлены после выбора движка. Docker используется при необходимости; серверных зависимостей у проекта пока нет.

## Материалы и права

Исходные арты помещаются в [assets/inbox](assets/inbox/README.md), игровые экспорты будут храниться отдельно. APK, SDK, кеши и ключи подписи исключены из Git.

Права на собственный код и оригинальные материалы сохраняются за автором: [LICENSE](LICENSE). Сторонние скиллы распространяются по своим лицензиям: [NOTICE.md](NOTICE.md). Сообщения об уязвимостях — через [приватный канал GitHub](SECURITY.md).
