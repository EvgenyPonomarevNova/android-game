# Этап 1: навыки и происхождение материалов

Дата: 17 ноября 2026. Ограниченная задача профиля завершена; набор подготовлен локально для интегратора на `codex/game-foundation`, база этапа `554f2bb`. Коммиты, staging, push, merge и рассылки не выполнялись.

## Результат

- Сохранены 15 ранее установленных новых навыков (56 файлов), четыре прежних активных и три optional. Всего 22 навыка, 92 исходных файла; байты импортов не изменялись.
- В `skills-provenance.json` добавлены `license`, `licensePath`, `licenseSha256` для семи первоначальных навыков. Ссылки ведут на уже существующие тексты лицензий; для ADB — на настоящий `.agents/skills/android-adb-control/LICENSE`, а не на информационную заметку `docs/skill-licenses/android-adb-control.txt`.
- Для всех 22 записей проверены лицензии, SHA-256 файлов и исходные commit SHA. Для Apache-2.0 сохранён и проверен upstream NOTICE. Проверено девять уникальных файлов лицензий/NOTICE. Первоначальные списки файлов и хешей семи навыков совпадают с `HEAD`.
- `docs/skills.md` соответствует установленному составу: таблица содержит ровно 15 новых навыков; отдельно названы все четыре прежних и три optional. Добавлены общее количество и ссылка на этот отчёт.
- `NOTICE.md` связывает навыки с их лицензиями и отдельно ссылается на существующий `docs/DEPENDENCIES.md` для runtime, шаблона и шрифта. Права на ArtKit не устанавливались и не выдумывались; ZIP не исследовался в этой задаче.

## Проверки и фактический вывод

Выполнен локальный аудит `python -` (скрипт передан через stdin). Он проверил взаимно-однозначное соответствие директорий навыков и manifest, отсутствие дубликатов, точное совпадение перечисленных и фактических файлов, SHA-256, наличие и хеши лицензий/NOTICE, 40-символьные commit SHA, сохранение прежних file records относительно `git show HEAD:skills-provenance.json`, состав таблицы документации и существование runtime-ссылки. Exit code 0:

```text
OK: 22 skill directories match provenance exactly; 92 file hashes match; no unlisted or missing skill files.
OK: license metadata for all 22 skills; 9 distinct license/NOTICE files verified; original 7 skill file records unchanged from HEAD.
OK: docs/skills.md table matches all 15 new skills; all 22 names documented; runtime license link exists.
New files in skill directories: 56
```

`pwsh -NoProfile -File ./tools/verify-project.ps1` выполнен **один раз в этой фазе**, exit code 0:

```text
OK: 7 PowerShell scripts parsed; 92 imported files verified across 22 skills; license records present; 174 Git paths checked.
```

`git diff --check -- NOTICE.md skills-provenance.json docs/skills.md` — exit code 0. Git сообщил только ожидаемую нормализацию CRLF → LF для JSON при будущей записи в индекс. Исходные байты навыков этим не затронуты.

## Что должен принять интегратор

Ниже точный набор из 65 файлов: 56 файлов новых навыков, пять новых текстов лицензий/NOTICE, `NOTICE.md`, `skills-provenance.json`, `docs/skills.md` и этот отчёт. Набор не включает чужие изменения `AGENTS.md`, `docs/preparation.md`, `docs/chat-coordination.md`, исходников игры или tooling. Их принимают отдельно от соответствующих авторов.

`verify-project.ps1` читает файлы по provenance непосредственно с диска, поэтому проверил и 56 ещё не добавленных в Git файлов навыков. Но его проверка приватных путей/размеров просмотрела только 174 пути текущего Git-индекса. Скрипт ничего не добавляет в индекс. Интегратору требуется адресно добавить выбранные файлы, проверить staged diff и повторить repository check на итоговом индексе в рамках общей приёмки.

Дополнительный аудит лицензий был нужен потому, что текущий `verify-project.ps1` проверяет существование четырёх прежних license records, но не сверяет поля `licenseSha256`/`noticeSha256`. Скрипт не менялся: это вне владения этого профиля. Полнота и хеши новых лицензий подтверждены отдельным аудитом выше.

## Ограничения

- Проверка целостности и полноты не является новым аудитом юридической применимости или повторной загрузкой GitHub. Проверены сохранённые локальные источники и закреплённые хеши.
- Необязательные ссылки `Related skills` на неустановленные коллекции и известная upstream-опечатка cameras остаются описаны в `docs/skills.md`. Навыки не переустанавливались и не редактировались.
- Совместимость конкретных API с Phaser 4.2.1, интерпретация примеров физики для Planck и ограничения общего Android-окружения сохраняются из `docs/skills.md`.
- Не запускались сборка APK, device-test, генерация графики или изменение runtime-зависимостей. Изменения общих контрактов не требуются. Следующая фаза этим отчётом не запускается.

## Точный список файлов для приёмки

```text
.agents/skills/animations/SKILL.md
.agents/skills/cameras/SKILL.md
.agents/skills/cameras/references/REFERENCE.md
.agents/skills/capacitor-app-development/SKILL.md
.agents/skills/capacitor-app-development/references/app-configuration.md
.agents/skills/capacitor-app-development/references/ci-cd.md
.agents/skills/capacitor-app-development/references/cli.md
.agents/skills/capacitor-app-development/references/core-concepts.md
.agents/skills/capacitor-app-development/references/cross-platform-best-practices.md
.agents/skills/capacitor-app-development/references/deep-links.md
.agents/skills/capacitor-app-development/references/edge-to-edge.md
.agents/skills/capacitor-app-development/references/file-handling.md
.agents/skills/capacitor-app-development/references/ios-package-managers.md
.agents/skills/capacitor-app-development/references/live-reload.md
.agents/skills/capacitor-app-development/references/platforms.md
.agents/skills/capacitor-app-development/references/safe-area.md
.agents/skills/capacitor-app-development/references/security.md
.agents/skills/capacitor-app-development/references/splash-screens-and-icons.md
.agents/skills/capacitor-app-development/references/storage.md
.agents/skills/capacitor-app-development/references/testing.md
.agents/skills/capacitor-app-development/references/troubleshooting-android.md
.agents/skills/capacitor-app-development/references/troubleshooting-ios.md
.agents/skills/create-game-assets/SKILL.md
.agents/skills/create-game-assets/agents/openai.yaml
.agents/skills/create-game-assets/assets/art-direction-brief.md
.agents/skills/create-game-assets/assets/asset-manifest.json
.agents/skills/create-game-assets/references/art-direction.md
.agents/skills/create-game-assets/references/provenance.md
.agents/skills/create-game-assets/references/raster-pipeline.md
.agents/skills/create-game-assets/references/three-d-pipeline.md
.agents/skills/create-game-assets/scripts/asset_report.py
.agents/skills/create-game-assets/scripts/build_preview_sheet.py
.agents/skills/create-game-assets/scripts/requirements.txt
.agents/skills/game-feel/SKILL.md
.agents/skills/game-feel/references/feedback-recipes.md
.agents/skills/game-ui-ux/SKILL.md
.agents/skills/game-ui-ux/references/layout-and-flow.md
.agents/skills/input-keyboard-mouse-touch/SKILL.md
.agents/skills/input-keyboard-mouse-touch/references/REFERENCE.md
.agents/skills/loading-assets/SKILL.md
.agents/skills/loading-assets/references/REFERENCE.md
.agents/skills/parallel-feature-development/SKILL.md
.agents/skills/parallel-feature-development/references/file-ownership.md
.agents/skills/parallel-feature-development/references/merge-strategies.md
.agents/skills/physics-tuning/SKILL.md
.agents/skills/physics-tuning/references/timestep-and-ccd.md
.agents/skills/scale-and-responsive/SKILL.md
.agents/skills/scenes/SKILL.md
.agents/skills/scenes/references/REFERENCE.md
.agents/skills/task-coordination-strategies/SKILL.md
.agents/skills/task-coordination-strategies/references/dependency-graphs.md
.agents/skills/task-coordination-strategies/references/task-decomposition.md
.agents/skills/team-communication-protocols/SKILL.md
.agents/skills/team-communication-protocols/references/messaging-patterns.md
.agents/skills/v4-new-features/SKILL.md
.agents/skills/v4-new-features/references/REFERENCE.md
NOTICE.md
docs/skill-licenses/agent-teams.txt
docs/skill-licenses/capawesome.txt
docs/skill-licenses/gamedev-NOTICE.txt
docs/skill-licenses/gamedev.txt
docs/skill-licenses/phaser.txt
docs/skills.md
docs/stage-1/skills.md
skills-provenance.json
```
