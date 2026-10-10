# Landing-page listening

The existing landing page offers an optional **He Answers Prayers** YouTube
experience immediately after the hero and before Zechariah's story. The hero's
primary prayer invitation stays in place. Silence remains the initial experience.

## Recordings

Both supplied links are recordings of **He Answers Prayers**. A labelled chooser
distinguishes their creators, using metadata verified through YouTube's public
oEmbed endpoint:

- **Chords of Light Music** — `Z5YubX-PfNQ` (the initial choice requested in the brief).
  https://www.youtube.com/watch?v=Z5YubX-PfNQ
- **Adi Eze of Africa** — `t3R9KRZlWGA`.
  https://www.youtube.com/watch?v=t3R9KRZlWGA

Only video ids are retained; radio and playlist parameters are omitted. No song
audio is extracted, downloaded, proxied or stored.

## Implementation

- `LandingMusicInvitation.jsx` presents a local CSS preview, recording chooser,
  watch action, permanent external fallback, and the existing prayer CTA.
- `useLandingMusic.js` owns only whether the visible iframe is mounted. It has no
  connection to the prayer-session audio engine or its saved preferences.
- No iframe, thumbnail, YouTube SDK or media request occurs before an explicit
  watch action, including in low-data mode. The disclosure explains that choosing
  to watch connects to YouTube and may share information about the visit.
- One official `youtube-nocookie.com` iframe is displayed, with native controls,
  keyboard access, inline playback and fullscreen. `autoplay=0` leaves playback
  to the visitor. The referrer policy preserves the origin required by YouTube.
- Closing or switching recordings removes the iframe. Switching requires a new
  watch action. Hidden tabs and `pagehide` close it; returning never restarts it.
- Every prayer or sign-in entry removes the iframe synchronously before the
  existing handler runs, preserving circle and prompt arguments. Page unmount
  also removes the iframe. There is no fade, delay or extra modal.
- The external link remains available before and after opening the player.
  Browsers do not reliably expose cross-origin iframe failures through load or
  error events, so the page does not make a false playback-success claim.
- The section uses Qetoret tokens and shared buttons in both themes, with logical
  CSS properties for RTL and 44px controls. The player uses 16:9 with a 200px
  minimum height on narrow phones to keep YouTube controls usable.
- All eleven UI copy keys are supplied in the sixteen landing dictionaries.
  Translation drafts still require native editorial review.

The former hero control and first-party instrumental placeholder have been
replaced; `LandingMusicControl.jsx` and landing-only APIs in
`backgroundAudio.js` are removed. The existing prayer instrumentals and local
assets remain available. Prayer playback fixes from the previous implementation
are retained, and their tests now exercise prayer tracks. The guest flow's
existing silent first session continues to preserve the remembered track.

Development and production CSPs allow only the privacy-enhanced YouTube frame
origin. No external playback script or new dependency is required.

The song is optional encouragement, never spiritual authority or a promise that
every petition will be granted. Copy follows `QETORET_IDENTITY.md`, directing the
visitor toward prayer and trust in God's timing.

## Verification

Coverage is in `LandingPage.music.test.jsx`, `LandingPage.test.jsx`,
`landing/copy.test.js`, `backgroundAudio.playback.test.js`,
`backgroundAudio.test.js`, and `PrayerMusicControl.test.jsx`.

On 10 October 2026, focused checks passed for both recordings, explicit player
loading, zero autoplay, visible native-control configuration, persistent blocked
player fallback, retained keyboard focus, all prayer and sign-in entries, circle
prompt forwarding, page lifecycle, saved preferences, and Arabic RTL copy.

Headless Chrome checks passed for desktop light/dark, 390px mobile and 320px
Arabic dark layouts, including a player at least 200x200px, 44px controls, no
horizontal overflow, and a silent guest prayer after listening with a saved piano
preference. Both real YouTube recordings exposed their native Play video action,
remained paused on embed load, and began playback only after an explicit native
play action. Local QA scripts, screenshots and measurements are in the ignored
`design-qa/landing-youtube/` directory.

Final repository checks passed:

- `npm test -- --maxWorkers=2`: 307 files, 3,744 tests.
- Guest-prayer browser suite: 2 tests.
- Strict lint, TypeScript checking, locale parity and content audit (no new findings).
- Production build and `git diff --check`. The build retains its existing chunk-size warning.
Remaining limitations: YouTube controls recording availability, regional access
and embedding permission. The permanent external link covers unavailable
embeds. Native translations and iOS Safari still need a human pass before
release. This change does not deploy the app.
