# Sound direction / sonic identity

**Mood:** energetic Russian neighborhood courier comedy; bright, modern, bouncy arcade—not overly childish, no real delivery-service brand melodies.

**Music (original synth compositions):**
| File | BPM | Bars | Duration | Use |
|---|---:|---:|---:|---|
| music_menu_sunny_loop | 112 | 16 | 34.29 s | Home/menu, optimistic |
| music_ride_day_loop | 140 | 24 | 41.14 s | Gameplay, focused forward momentum |
| music_garage_funk_loop | 100 | 16 | 38.40 s | Garage and upgrades, playful groove |
| music_map_choices_loop | 116 | 16 | 33.10 s | Map/level selection, exploratory |
| music_ride_night_loop | 132 | 16 | 29.09 s | Night/advanced area variant |

**Sound effects:** short, readable synth effects. They are not recorded motorcycle sounds: use as an original stylistic audio layer for MVP. Engine speed should be mapped to actual vehicle state; don't restart the loop on frame updates. Impacts should scale with impact severity, and slosh should have cooldowns.

**Mix/loudness:** set bus volumes as in manifest; duck music moderately during big crash, never to hard silence. Lower engine during menu, no engine running during pause. Crossfade music across state changes, avoid unpleasant jumps.

**Looping:** tracks are constructed on a consistent bar grid and exported sample-aligned as WAV; OGG encodings are intended for Web Audio loop playback. Engine loops each run for exactly 2s. For browsers, do not use streaming/HTMLAudio as the sole method for precision beat-matching; preloaded WebAudio buffers reduce seams.

**Format:** 44,100 Hz, 16-bit WAV masters; OGG Vorbis music + engine + ambience. Gameplay one-shots are PCM WAV for very low trigger latency. The final runtime bundle should exclude all preview and master resources.

**License:** all compositions/sounds synthesized in this pack; no third-party audio samples or external soundfont. User may modify, remix, redistribute and use these project assets commercially. No exclusivity warranty is provided against coincidental similarity with other musical works.
