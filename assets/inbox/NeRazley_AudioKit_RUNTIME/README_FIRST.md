# «НЕ РАЗЛЕЙ!» — AudioKit v1

**Original synthesized audio for the mobile courier physics arcade.** This archive contains production-ready audio files, loop metadata, playable preview, and a clear Phaser/Codex integration task. All music is newly composed for this project; all effects are synthesized from waveforms/noise, not sampled from films, games, brands, or songs.

## What is inside
- `01_MUSIC/ogg/` — **5 stereo BGM loops**: sunny menu, daytime ride, garage funk, map, night ride.
- `01_MUSIC/wav_masters/` — uncompressed 44.1 kHz/16-bit originals of the five songs.
- `02_ENGINE/ogg/` — **3 seamless engine loops**: idle, cruise, fast.
- `02_ENGINE/wav/` — engine WAV loop masters.
- `03_SFX/` — **UI, gameplay, cargo, vehicle, reward** one-shots in WAV + 2 looping ambience WAV/OGG.
- `04_CODEX/audio_manifest.json` — manifest: keys, paths, loops, volume recommendations.
- `04_CODEX/CODEX_AUDIO_INTEGRATION.md` — detailed Codex integration prompt.
- `05_DOCS/` — sound design, licenses and full inventory.
- `06_PREVIEW/` — short demo montage in MP3 and WAV.

## Use in Phaser 4
Copy **OGG music**, **OGG engine**, **WAV one-shots**, and **OGG ambience** to `public/assets/audio/` without nesting the original pack root. Use the manifest to generate load calls. Do not bundle uncompressed music masters into APK to avoid bloat.

The audio is synthesized rather than recorded. It is an original *first production pass* intended for immediate integration and tuning; engine and impact effects can later be replaced with recorded/foley audio if wanted.

## Recommended mix
`music 0.28`, `engine 0.38`, `ambience 0.12`, `ui 0.62`, `vehicle 0.60`, `cargo 0.66`, `gameplay 0.65`, `reward 0.72` (relative to master = 1). These are starting settings; tune after real-phone listening.

**No ads or real delivery-service sound trademarks.**
