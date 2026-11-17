# Сторонние материалы

Скиллы в `.agents/` перенесены из локального проекта Fit Mini App. Их происхождение, исходные ревизии и SHA-256 файлов записаны в [skills-provenance.json](skills-provenance.json). Они сохраняют собственные лицензии; корневой `LICENSE` не заменяет их условия.

| Материалы | Исходный проект | Лицензия |
| --- | --- | --- |
| `android-adb-control` | [robbin/android-adb-control](https://github.com/robbin/android-adb-control) | [MIT](.agents/skills/android-adb-control/LICENSE) |
| `game-design` | [sickn33/agentic-awesome-skills](https://github.com/sickn33/agentic-awesome-skills) | [MIT](docs/skill-licenses/game-design.txt) |
| `systematic-debugging`, `verification-before-completion` | [obra/superpowers](https://github.com/obra/superpowers) | [MIT](docs/skill-licenses/superpowers.txt) |
| Необязательные скиллы Expo/EAS | [expo/skills](https://github.com/expo/skills) | [MIT](docs/skill-licenses/expo.txt) |

Локальная проверка целостности: `pwsh -NoProfile -File ./tools/verify-project.ps1`.
