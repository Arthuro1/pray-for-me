# Background prayer instrumentals

These files are the optional background atmospheres for **Hands-free Prayer Mode**.
They are served from the app's own origin (`/audio/…`) — no external music service
is ever contacted, and no prayer content is sent anywhere.

## What to add

Drop these files here to enable the corresponding atmosphere. They are **optional**:
the app ships working without any of them (Silence is the default, and the
"Soft pad" option is synthesised on-device with the Web Audio API, so a non-silent
choice always works even with this folder empty).

| Atmosphere            | Expected file            | Notes                          |
| --------------------- | ------------------------ | ------------------------------ |
| Soft piano            | `soft-piano.mp3`         | gentle, sparse, no melody hook |
| Ambient worship pad   | `ambient-pad.mp3`        | slow evolving pad              |
| Rain / nature         | `nature.mp3`             | rain or soft nature ambience   |

The track ids and filenames are defined in
[`src/lib/audio/backgroundAudio.js`](../../src/lib/audio/backgroundAudio.js)
(`AUDIO_TRACKS`). If a file is missing or fails to load, that track gracefully
falls back to the generated "Soft pad" instead of failing the session.

## Requirements

- **Instrumental only — no lyrics.** Lyrics distract from the spoken prayer guide
  and add licensing complexity.
- **Loopable.** Each track loops continuously; author it to loop cleanly.
- **Calm and non-startling.** No sudden swells or percussion hits (this may play
  while the user is driving). Keep the dynamic range gentle.
- **Format:** `.mp3` (widely supported). `.ogg` / `.m4a` / `.wav` are also cached
  offline by the service worker if you change the `src` in `AUDIO_TRACKS`.

## Licensing — READ BEFORE ADDING FILES

Only add audio the app has the **legal right to use**. Acceptable sources:

- original instrumentals created for the app,
- properly licensed royalty-free tracks (keep the licence/receipt on record),
- public-domain or permissively licensed tracks (e.g. CC0), with attribution kept
  where the licence requires it.

**Do not** add commercial worship songs, copyrighted instrumentals, or streaming
worship tracks unless a valid licence is held. When in doubt, leave the file out —
Silence and the generated pad are always available.

Record the source and licence of each file you add (e.g. in this folder or your
asset log) so the provenance is auditable.
