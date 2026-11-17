# «Не Разлей!» — технический фундамент

## Цель
Рабочий офлайн-прототип Phaser 4.2.1 / React 19 / Planck 1.5.1, Android debug APK и проверяемая документация. Без полноценной игры и финальной графики.

## Next Step
Этап 1 принят. Следующая очередь Gameplay Polish A-PHY/A-ART/A-SYS/A-QA описана в docs/STAGE_1.md; новые задачи ещё не запущены.

### Phase 6: Этап 1 — арты, физика и QA
**Status:** complete
- Раздать профильные задачи по docs/STAGE_1.md; получить первые статусы.
- Интегрированы профильные изменения; 32 теста, web build и полный цикл браузера/Android пройдены. Итоговая APK 0.2.0 — в .local/apk; факты в docs/stage-1/integration.md и android.md.

### Phase 1: Окружение и зависимости
**Status:** complete
- Прочитаны задание, README, preparation, CONTRIBUTING; SDK/JDK доступны.
- Ветка codex/game-foundation; существующие инструменты сохраняются.

### Phase 2: Физика и игровой мост
**Status:** complete
- Fixed step, интерполяция, транспорт, груз, уровень, ввод, камера, ресурсы.

### Phase 3: React и платформенные службы
**Status:** complete
- Меню, HUD, пауза, настройки, сохранения, lifecycle и Android Back.

### Phase 4: Android и проверки
**Status:** complete
- Typecheck, lint, build, целевые тесты, браузер, APK, доступное ADB-устройство.

### Phase 5: Документация и Git
**Status:** complete
- Практические инструкции, APK metadata, ограничения и исходники в Git.

## Решения
- Утверждённый пользователем стек; npm; временный com.nerazley.game; landscape.
- Без Docker и сетевых сервисов; разработка распределена между существующими профильными чатами. ArtKit принят как первый визуальный проход.
- Исходные арты assets/inbox не изменяются; device captures и APK вне Git.

## Ошибки
- У Phaser 4 нет GameConfig.resolution: оставлен штатный буфер 1 CSS pixel без умножения на DPR; Vector2 обязателен в Graphics points.
- Vite 8 использует Rolldown codeSplitting вместо object manualChunks.
- Неверный импорт поднабора Fontsource; исправление по фактическим exports пакета.
- Тест мгновенной скорости одного лёгкого закреплённого груза поглощается joint; проверяется реальное падение всего транспорта.
- CDP touch injection в WebView 91 не создаёт input events; для фактического одиночного касания использован ADB touchscreen. Одновременные источники проверены модульно, аппаратный мультитач не сертифицирован.
