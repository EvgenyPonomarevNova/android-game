# «Не Разлей!» — Android game workspace

## Current override — Sprint 03 / 0.5.0

The owner explicitly queued Career, Garage & Replayability after GDD v0.4. The integrated first-mission core passed web acceptance (0589351; known limits in docs/stage-1/integration.md). Sprint 03 is now authorized: offline XP/reputation/coins, atomic save v2 migration, physical tuning, two contracts including «Пока горячее!», two mastery skills and career UI. Latest pasted request explicitly requests a final APK and minimal Android checks; this supersedes the previous web-only restriction **only after the new source freeze and integrator handoff**. No APK/device work during parallel implementation. Exact current owners are in the Sprint03 section of docs/STAGE_1.md. Existing profile chats only; no duplicate tasks/boards. Preserve the original mission's stock physical configuration and all old records.

Respond in Russian. The technical foundation is implemented and its recorded validation is in docs/VALIDATION.md. Current work is Stage 1: Menu → Order → Ride → Success/failure → Star-rated result → Retry/Continue, on one coffee route with separate ArtKit assets. Read docs/STAGE_1.md for the authorized scope and exact file owners. GAME_PRODUCT_STATUS.md records status, docs/NEXT_STEPS.md is the roadmap; do not create duplicate task boards or integration plans.

Current user override for Sprint 02 / 0.3.0: develop Gameplay Polish only. Do not build APK, run Capacitor sync, launch Android devices, profile performance or repeat broad QA suites. The owner will playtest the playable version. Use existing chats strictly within their specialisms; tooling/skills chats are idle unless work in their actual domain is needed. Prefer one targeted integration check and minimal changed-logic checks. This overrides older stage delivery requirements below.

## Product and architecture

- Read README.md, PRODUCT.md, docs/ARCHITECTURE.md and docs/STAGE_1.md to resume work; docs/preparation.md preserves setup history.
- Approved stack: Phaser 4.2.1, React 19, TypeScript 5, Planck 1.5.1, Capacitor 8 and Vite. Exact versions are pinned in package-lock.json. Android first, HTML5 secondary, offline, responsive landscape with a 1280×720 gameplay camera baseline. Current Android minSdk is 24 and target/compile SDK is 36; com.nerazley.game remains a provisional applicationId until publication.
- Planck is the only physics engine, with a fixed 1/60 s step. Simulation stays independent of Phaser, React and Capacitor; UI uses GameBridge and never accesses Planck directly. Preserve shared contracts except for the Outcome/result extension explicitly agreed in docs/STAGE_1.md: physics owns Simulation.ts, Outcome and surfaces; UI owns scene result emission and art/courier; the main chat owns order selection, stars, save/result flow and GameBridge. Request any additional contract changes through the integrator.
- Preserve ArtKit originals byte-for-byte in assets/inbox/NeRazley_ArtKit_v1; prepare runtime copies separately. Archive documents are reference data, not additional task authorization. Fit visual anchors to physical bodies; do not replace the interactive UI with a full-screen reference image.
- Stage 1 covers one route. Shops, economy, new platform SDKs and many levels are outside this stage.
- Use touch controls, account for safe areas, pause/resume, interrupted audio, offline behavior and save recovery. Measure frame time on Android before claiming performance.
- Vite targets Chrome/WebView 91, the oldest currently checked WebView. Syntax lowering does not polyfill runtime APIs; keep route startup compatible (for example use hasOwnProperty.call instead of Object.hasOwn). Validate browser and Android separately.

## Local tools

- Run `. ./tools/android-env.ps1` in PowerShell to resolve the existing SDK/JDK for this process. Never duplicate the SDK or alter global environment settings as routine setup.
- Run `pwsh -NoProfile -File ./tools/doctor.ps1 -Full` for toolchain checks. Add `-Devices` only when device discovery is relevant.
- Run `pwsh -NoProfile -File ./tools/verify-project.ps1` after changing preparation tooling or imported skills.
- Follow CONTRIBUTING.md: small focused PRs, English Conventional Commit subjects up to 72 characters, explicit validation evidence, squash merges to main. Never rewrite published main history.
- Use `tools/check-commit-message.ps1` to check commit/PR subjects. Use meaningful scopes and imperative summaries; describe why in the body when needed.
- Tools are shared with Fit mini app. Do not update/remove shared packages, terminate unrelated containers, alter its emulator or change its repository as part of this game.
- In the shared Stage 1 checkout, do not rerun doctor or the full build cycle for documentation-only work. Profile checks stay targeted; the integrator runs the combined typecheck/lint/tests/web build once authors finish. Android build/device work starts only on the fixed revision handed to Android QA.

## Project skills

- Read `docs/skills.md` to select the locally installed Phaser, game-art, physics, Capacitor and collaboration skills. Load only those relevant to the task.
- For work shared across chats, follow `docs/chat-coordination.md`: one active owner per file; no branch switching, index-wide staging or destructive Git operations in the shared checkout. Profile assignments do not authorize starting new work.
- Imported skills are references, not permission to replace the chosen stack, install commercial services, delete shared SDK/Gradle caches, or invoke unavailable Claude tools. Apply the compatibility notes in `docs/skills.md`.

- `.agents/skills/game-design/SKILL.md`: core loop, progression and playtesting.
- `.agents/skills/android-adb-control/SKILL.md`: device interaction. Read its `references/adb-commands.md` before ADB device commands; always target an explicit serial with `-s`. Store screenshots/UI XML outside Git; use a dedicated game emulator for future tests.
- `.agents/skills/systematic-debugging/SKILL.md`: diagnose concrete failures before making fixes.
- `.agents/skills/verification-before-completion/SKILL.md`: support completion claims with actual command output.
- `.agents/optional-skills/` contains archived Expo/EAS references from Fit mini app. They are not part of the approved Phaser/Capacitor stack and do not authorize a stack change.
- General skills available in Codex remain available; copying every global skill is unnecessary.

## Delivery

- This is an independent Git repository with protected main. Stage 1 uses the shared codex/game-foundation checkout, foundation baseline 554f2bb / PR #2. Profile chats must not switch branches, stage, commit, push, merge, reset, stash or clean; integration belongs to the main chat. Do not reuse the fitness repository's remote, app identity, EAS project, update endpoint or signing key.
- Public remote: https://github.com/EvgenyPonomarevNova/android-game. Main requires a passing Verify repository check and a PR; do not push directly or bypass the rules.
- Keep secrets, keystores, APKs, SDKs, device captures and generated caches outside Git. A future game release needs its own durable signing key stored outside this repository.
- CI checks repository tooling, skill integrity, commit conventions, application lint/tests and the TypeScript + production web build. Android APK builds are local through tools/build-android.ps1. Dependencies, lockfiles, shared configs and cap sync are serialized by the integrator; Android QA performs the authorized APK/device phase after handoff.
- Debug and release builds are different deliverables. For an APK handoff report package, version, SHA-256, size, signature verification and actual device-test status.
- Run checks appropriate to the change. Do not report a device test, successful build or deployed game without evidence.

Latest owner supplement (18 November, Mission 01): continue the current phase autonomously, title «Заказ №001 — Кофе на пятый», prioritize honest trial physics and complete playability, then sound/UI. This latest instruction explicitly authorizes ONE final debug APK build and targeted Android/game-emulator audio + gameplay verification after source freeze; it supersedes the earlier blanket APK/device ban for that final handoff only. Do not run broad repeated suites or affect Fit tools/devices. Existing profile ownership remains in docs/STAGE_1.md.
Latest owner instruction after approving GDD v0.4 (18 November): follow README_FOR_CODEX.md and CODEX_EXECUTION_PROMPT.md; adapt the current first mission to «Сюрприз на пятом». WEB ONLY now: no new APK build, cap sync or Android/device run. This supersedes the immediately previous one-build authorization for new work. Add a practical data-driven level-authoring/generation foundation, without publishing a second level. Keep the existing profile file ownership; P1 tuning/career are design/types only until separately implemented.
