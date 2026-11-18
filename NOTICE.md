# Сторонние материалы

Скиллы в `.agents/` перенесены из локального проекта Fit Mini App и установлены непосредственно из GitHub. Их происхождение, исходные ревизии и SHA-256 файлов записаны в [skills-provenance.json](skills-provenance.json). Они сохраняют собственные лицензии; корневой `LICENSE` не заменяет их условия.

| Материалы | Исходный проект | Лицензия |
| --- | --- | --- |
| `android-adb-control` | [robbin/android-adb-control](https://github.com/robbin/android-adb-control) | [MIT](.agents/skills/android-adb-control/LICENSE) |
| `game-design` | [sickn33/agentic-awesome-skills](https://github.com/sickn33/agentic-awesome-skills) | [MIT](docs/skill-licenses/game-design.txt) |
| `systematic-debugging`, `verification-before-completion` | [obra/superpowers](https://github.com/obra/superpowers) | [MIT](docs/skill-licenses/superpowers.txt) |
| Необязательные скиллы Expo/EAS | [expo/skills](https://github.com/expo/skills) | [MIT](docs/skill-licenses/expo.txt) |
| 7 навыков Phaser 4 | [phaserjs/phaser](https://github.com/phaserjs/phaser) | [MIT](docs/skill-licenses/phaser.txt) |
| `physics-tuning`, `game-feel`, `game-ui-ux`, `create-game-assets` | [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) | [Apache-2.0](docs/skill-licenses/gamedev.txt), [upstream NOTICE](docs/skill-licenses/gamedev-NOTICE.txt) |
| `capacitor-app-development` | [capawesome-team/skills](https://github.com/capawesome-team/skills) | [MIT](docs/skill-licenses/capawesome.txt) |
| `parallel-feature-development`, `task-coordination-strategies`, `team-communication-protocols` | [wshobson/agents](https://github.com/wshobson/agents) | [MIT](docs/skill-licenses/agent-teams.txt) |

Локальная проверка целостности: `pwsh -NoProfile -File ./tools/verify-project.ps1`.

Источники runtime-зависимостей, шаблона Phaser React TS и шрифта Onest перечислены отдельно в [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md). Лицензии навыков не определяют права на ArtKit; этот документ таких прав не устанавливает.
