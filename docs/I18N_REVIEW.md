# Localization Review

Pray4Me ships a full UI in **16 languages**. French (`fr`) is the bundled
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
