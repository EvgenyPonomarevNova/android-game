# Android game workspace

The owner is preparing an Android game and will provide the idea and artwork later.
Respond in Russian. The current milestone is tooling preparation, not game implementation.

## Product and architecture

- Read README.md and docs/preparation.md to resume work.
- Select the engine, package ID, orientation and minimum Android version after receiving the game concept. Existing Expo skills are optional, not an engine decision.
- Start with one playable core loop. Keep gameplay rules separate from rendering, input, audio and persistence where the chosen engine allows it.
- Preserve original artwork in assets/inbox; create optimized runtime assets separately after selecting the engine.
- Use touch controls, account for safe areas, pause/resume, interrupted audio, offline behavior and save recovery. Measure frame time on Android before claiming performance.

## Local tools

- Run `. ./tools/android-env.ps1` in PowerShell to resolve the existing SDK/JDK for this process. Never duplicate the SDK or alter global environment settings as routine setup.
- Run `pwsh -NoProfile -File ./tools/doctor.ps1 -Full` for toolchain checks. Add `-Devices` only when device discovery is relevant.
- Run `pwsh -NoProfile -File ./tools/verify-project.ps1` after changing preparation tooling or imported skills.
- Tools are shared with Fit mini app. Do not update/remove shared packages, terminate unrelated containers, alter its emulator or change its repository as part of this game.

## Project skills

- `.agents/skills/game-design/SKILL.md`: core loop, progression and playtesting.
- `.agents/skills/android-adb-control/SKILL.md`: device interaction. Read its `references/adb-commands.md` before ADB device commands; always target an explicit serial with `-s`. Store screenshots/UI XML outside Git; use a dedicated game emulator for future tests.
- `.agents/skills/systematic-debugging/SKILL.md`: diagnose concrete failures before making fixes.
- `.agents/skills/verification-before-completion/SKILL.md`: support completion claims with actual command output.
- `.agents/optional-skills/` contains Expo overview, animation and EAS store skills from Fit mini app. Read only if Expo/React Native is actually chosen. Consult matching official versioned docs before changing those APIs.
- General skills available in Codex remain available; copying every global skill is unnecessary.

## Delivery

- This is an independent Git repository on main. GitHub credentials are shared at the user-account level. Do not reuse the fitness repository's remote, app identity, EAS project, update endpoint or signing key.
- Keep secrets, keystores, APKs, SDKs, device captures and generated caches outside Git. A future game release needs its own durable signing key stored outside this repository.
- Build the game with the chosen engine's supported build/export pipeline. The current CI checks preparation scripts and skill integrity only; it does not build an APK.
- Debug and release builds are different deliverables. For an APK handoff report package, version, SHA-256, size, signature verification and actual device-test status.
- Run checks appropriate to the change. Do not report a device test, successful build or deployed game without evidence.
