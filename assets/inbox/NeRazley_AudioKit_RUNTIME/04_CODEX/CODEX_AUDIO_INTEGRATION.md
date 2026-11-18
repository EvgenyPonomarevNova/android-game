# CODEX — AudioKit v1 integration into «Не Разлей!» (Phaser 4 + React)

You are the project's main coordinator. Integrate this pack into the **existing** repo; do not reinitialize or rearchitect the project. Keep the current Android app ID, Capacitor configuration and working gameplay stable.

## Inputs
- `README_FIRST.md`, `04_CODEX/audio_manifest.json`, `05_DOCS/sound_design.md`
- `01_MUSIC/ogg/*.ogg`, `02_ENGINE/ogg/*.ogg`, `03_SFX/**/*.wav`, and `03_SFX/ambience/*.ogg`.

## Deliverables
1. Copy the **runtime assets only** under `public/assets/audio/`, preserving stable relative categories. **Exclude WAV music masters, engine WAV and previews from Android build**.
2. Add a typed `AudioKeys` list generated or validated against audio_manifest.json and preload the resources once in the existing Phaser boot flow. Avoid duplicate loaders and audio instances on level restarts.
3. Create a lightweight `GameAudioService` with `playSfx`, `startMusic`, `stopMusic`, `setBusVolume`, `setMuted`, `pause`, `resume` and `dispose`. Handle browser first-gesture audio unlock. Use Phaser's existing sound manager. No extra middleware, server, or audio engine.
4. Implement buses logically via group volumes or manual sound bookkeeping: music, engine, ambience, vehicle, cargo, gameplay, UI and reward. Persist user music/SFX mute and volume using the existing SaveService; default recommended bus volumes live in the manifest. Changes take effect immediately.
5. Menu: loop `music_menu_sunny_loop`, garage: `music_garage_funk_loop`, level selection: `music_map_choices_loop`. Gameplay: loop `music_ride_day_loop` (night track reserved for future). On results, fade down the level music; use `delivery_success` or `delivery_failed` once. Use 250–600 ms smooth crossfade on scene changes. During gameplay, music at steady volume, no hard restarting at each pause.
6. Engine: at most ONE 3-layer engine sound system (`engine_idle_loop`, `engine_cruise_loop`, `engine_fast_loop`). Change volume/pitch smoothly from *actual vehicle speed and throttle*, preferably with smoothing/hysteresis; avoid triggering `engine_accelerate` every frame. Don't restart or stack engine loops on every level restart. Stop/fade them on fail, result and leaving gameplay. `engine_start` once at beginning.
7. Connect events to SFX: button click/back/confirm; start countdown; safe/hard landing by physical impulse threshold; skid by wheel slippage; hit light/medium/heavy by genuine impact severity; cargo slosh and spill events with sensible per-event cooldowns; cargo warning once per threshold crossing; checkpoint; reward/stars; delivery result. Do not spam sound every frame and do not fake physics events.
8. Use Web Audio playback when available for seamless OGG loops. Keep audio assets local so Android APK runs completely offline. Handle Android pause/resume and app blur without engine hanging or duplicate loops. Avoid playing UI sounds while app is backgrounded.
9. Basic QA: browser and Android debug build, mute and pause, 3 consecutive level restarts without multiplied sounds, repeated collision no SFX flood, offline playback. Verify sound on **real phone** if attached; don't claim device testing if unavailable.
10. Final report: files changed, key bindings, default mix, paths to actual APK/build, what was verified, blockers. Minimum needed checks only.

## Mapping
| Game event | Suggested sound |
|---|---|
| UI primary | ui_click_01 |
| UI back | ui_back |
| Order accept | ui_confirm |
| Countdown | countdown_tick / countdown_go |
| Level start | engine_start, level_start |
| Airborne / jump | whoosh_jump |
| Safe / hard landing | land_safe / land_hard |
| Hard brake / wheel skid | brake_short / tire_skid_short |
| Minor / medium / major crash | collision_small / collision_medium / collision_heavy |
| Cargo shaken | coffee_slosh_small / coffee_slosh_big |
| Cargo damaged | coffee_splash_light / coffee_spill |
| Cargo critical | cargo_danger (rate limit) |
| Cargo destroyed | cargo_destroyed |
| Success / failure | delivery_success / delivery_failed |
| 1–3 stars | star_one / star_two / star_three |
| New PB | new_record |
| Coin awarded | coin_pickup / reward_claim |

**Before coding:** inspect existing sound hooks so you don't make two systems. Integrate the actual manifest's file paths and keys. This is a runtime audio implementation request; the audio files themselves are already in the archive.
