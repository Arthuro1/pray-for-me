# Localization Review

Praystead ships a full UI in **16 languages**. French (`fr`) is the bundled
fallback and the canonical key set; English (`en`) is the source most strings
were authored in. Several locales were **AI-authored and have not yet had a
native pass** — for content this personal (prayer, "answered", "encrypted"), a
clumsy translation quietly erodes trust, so a human review matters.

## Two layers: structure (automated) vs. quality (human)

### 1. Structure — machine-checked, runs in CI

```bash
npm run check:locales            # summary; exits non-zero on any hard failure
npm run check:locales -- --details   # also lists every offending key
```

It verifies the invariants a machine *can* judge, and that silently degrade the
UX when wrong:

| Check | Why it matters |
|---|---|
| **missing keys** | A key absent from a locale falls back to **French** at runtime — e.g. a Korean user sees a stray French sentence. |
| **placeholder drift** | If `{name}`/`{n}` tokens don't match the reference, the user sees a literal `{n}` or a blank slot. |
| **empty / wrong-type values** | Blank strings, or a structured value (like the `days` weekday array) with the wrong shape. |
| **extra keys** | Dead strings, or a typo'd key that never resolves (warning, not a failure). |

This gate is wired into `.github/workflows/ci.yml`, so a PR that adds an English
string without adding it to every locale fails CI instead of shipping a
half-translated screen.

#### Two bundles, two references

The checker covers **both** translated bundles, and they do not work the same way:

| Bundle | Reference | Runtime fallback |
|---|---|---|
| `src/i18n/locales/*.js` (the app UI) | `fr` | per **key** — a missing key silently renders the French string |
| `src/pages/landing/locales/landing-*.js` (marketing) | `en` | per **file** — there is **no** per-key fallback |

The landing page does not use `t()`. `src/pages/landing/copy.js` swaps in one
whole dictionary per language, so whatever a locale's file holds is exactly what
that reader sees: a missing key renders `undefined`, and a short array simply
renders fewer items. That is why the landing copy is flattened to leaf paths
(`content.faqs[3].q`) and array indices count as keys — eight locales once
shipped three FAQ entries while everyone else saw five, with every test green.

The landing table also prints an **"english-left?"** column (a value byte-identical
to the English source). `icon` and `color` are excluded — a lucide name and a hex
value are structural and identical in every language by design.

### 2. Quality — needs a native speaker

The checker also prints a per-locale **"untranslated?"** count — strings that are
byte-identical to *both* the French and English source (a strong hint the string
was never actually translated). It's a pointer, not a verdict: real quality
(tone, theological wording, natural phrasing) can only be judged by a person.

## Doing a native-review pass

Export a per-language worksheet — one row per key with the English and French
source next to the target — hand it to a native speaker, and fold corrections
back into `src/i18n/locales/<lang>.js`:

```bash
npm run check:locales -- --worksheet sw > docs/i18n-review/review-sw.csv
```

Pre-generated worksheets for the **lowest-confidence** locales (per project
history: Amharic, Swahili, Tagalog) live in [`docs/i18n-review/`](./i18n-review/).

### Suggested priority

1. **am, sw, tl** — flagged as the least-confident AI translations.
2. Locales with the highest **"untranslated?"** counts in the checker output.
3. The newest feature strings — search `src/i18n/locales/en.js` for the
   `AI-authored — pending native review` section comments and start there; once a
   section is reviewed for a language, drop the marker.

Landing-page marketing copy lives separately in
`src/pages/landing/locales/` and is reviewed the same way by hand.

## Content layers the key checker does NOT cover

`check:locales` guards `src/i18n/locales/*.js`. Three content layers live
outside it, are authored rather than generated at runtime, and fall back through
`pick()` instead of failing loudly — so they need their own review pass:

| Layer | Files | State |
|---|---|---|
| Grow-tab teaching (guides, theology, gospel journey) | `src/content/teaching/translations/<kind>/<lang>.json` | AI-authored overlays, native review pending |
| Guided-plan **day titles** | inline in `src/content/prayerPlans.js` and `src/content/plans/*Days.js` | authored in all 16 languages |
| Guided-plan **prose** (reflections, prayer prompts, self-prompts, practices, role reflections, intro / biblical / completion) | source `en` + `fr`, overlays in `src/content/plans/translations/<lang>.json` | all 16 present; the 14 overlays are AI-drafted and need a native pass |

A language with no plan overlay is not broken — every field falls back to the
authored English. It simply reads in English, which is worth fixing but never
worth blocking on. Overlay *structure* is machine-checked
(`src/content/plans/translationFiles.test.js`); only the wording needs a person.

### Reviewing a plan translation

Review for **meaning**, not parity. Specifically, for "Preparing in Prayer"
(`docs/PRAYER_PLANS.md`):

- the plan must not promise marriage in *any* language — check that no
  translation has quietly turned "a person you may one day marry" into "your
  future husband/wife";
- singleness must read as a full Christian life, not a waiting room;
- the purity and sexuality wording must not become shaming;
- the husband/wife reflections must not pick up a cultural stereotype the source
  deliberately avoids;
- prayer prompts must not read as Scripture quotations.

Scripture references are **not** translated in these files — they resolve
through `BOOK_NAMES` and the verse pipeline — so a reviewer should never see, or
add, Bible text here.
