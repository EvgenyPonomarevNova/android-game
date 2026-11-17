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

`com.nerazley.game` временный, утвердить до публикации. Название «Не Разлей!», versionName 0.1.0, versionCode 1. Manifest: landscape и appCategory=game. System resize обрабатывают Scale.RESIZE и UI. Полноэкранность — SystemBars/WindowInsetsControllerCompat, вырезы — CSS-переменные Capacitor и env().

## Установка

Сначала проверьте serial, Android user и принадлежность устройства. Не выбирайте первый аппарат автоматически.

```powershell
. ./tools/android-env.ps1
adb devices -l
adb -s YOUR_SERIAL shell am get-current-user
adb -s YOUR_SERIAL install -r android/app/build/outputs/apk/debug/app-debug.apk
adb -s YOUR_SERIAL shell am start --user YOUR_USER_ID -n com.nerazley.game/.MainActivity
pwsh -File tools/inspect-apk.ps1 -ApkPath android/app/build/outputs/apk/debug/app-debug.apk
```

Наш отдельный AVD: `emulator -avd Game_API31 -port 5580`; имя проверяйте `adb -s emulator-5580 emu avd name`. Снимки/логи — в `.local` либо вне репозитория. Чужие AVD и контейнеры не используются.

## Release позже

Debug и release — разные артефакты. Сейчас стандартная debug-подпись Android вне Git. Release key не создавался, release signing не настроен. До магазина: утвердить ID, создать собственный долговечный ключ вне Git, настроить signing через локальный Gradle properties/секреты CI, поднять versionCode, проверить bundleRelease/assembleRelease, подпись и офлайн-запуск. Не использовать ключи/EAS/identity Fit mini app. Без release signing результат не готов для магазина.

Фактические результаты и SHA-256: [VALIDATION.md](VALIDATION.md).
