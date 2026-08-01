# Testing

Three layers, fastest first.

## 1. Unit + integration (jsdom) — `npm test`

The bulk of the suite (~980 tests). Vitest + Testing Library under jsdom. Per the
project convention, each file that needs a DOM declares `// @vitest-environment
jsdom` at the top and does manual `cleanup()`. Fast, no browser, runs on every
push. This is where store logic, component behavior, crypto units, and
offline-queue logic are covered.

## 2. Real-browser E2E (Chromium) — `npm run test:browser`

`*.browser.spec.{js,jsx}` files run in real Chromium via
`@vitest/browser-playwright` (`vitest.browser.config.js`). Use this layer **only
for things jsdom can't faithfully do**:

- **Web Crypto / SubtleCrypto** against the real implementation.
- **IndexedDB**, including structured-clone of non-extractable `CryptoKey`s.
- Real layout / focus / event behavior.

Current specs:

| Spec | What it proves in a real browser |
|------|----------------------------------|
| `src/lib/pwaInstall.browser.spec.js` | PWA install eligibility + `beforeinstallprompt` handling |
| `src/lib/journalSearch.browser.spec.js` | Journal search in a real DOM |
| `src/components/GuestPrayerFlow.browser.spec.jsx` | The guest prayer is stored as **decrypt-only ciphertext** (real AES-GCM + IndexedDB), and the capture→session flow renders end to end |
| `src/lib/accountIsolation.browser.spec.js` | Account A's IndexedDB snapshot and legacy user cache are gone before Account B is taken offline |

`GuestPrayerFlow.browser.spec.jsx` is the first spec to **render a React
component** in browser mode — `vitest.browser.config.js` dedupes React so
`@testing-library/react` shares one React instance (without it the hooks
dispatcher is null). Follow that spec's shape for future component E2E.

Runs in the ordered application CI gate after strict lint, typecheck, locale
validation, and unit tests, and before the production build. Diagnostics are
uploaded when the job fails.

### Why the guest flow is the E2E anchor

It's the one non-trivial flow that is **completely secret-free** — no Supabase,
no Anthropic, no network at all (see the module header in
`src/lib/guestPrayerDraft.js`). So it runs in CI with zero credentials while still
exercising the real privacy-critical crypto path.

## 3. Database schema tests — `npm run test:db`

After `supabase start` and a clean `supabase db reset`, pgTAP asserts RLS,
protected table grants, protected RPC execution, group-key relationships, quota
privacy, and fixed `SECURITY DEFINER` search paths. CI rebuilds from zero for
every push/PR.

## 4. Authenticated staging E2E (follow-up)

Flows past sign-in (E2EE unlock/recovery, offline-queue replay, community share
fan-out) need a real Supabase session, so they can't run credential-free. To add
them:

1. Provision a disposable Supabase project (or local `supabase start`).
2. Put its URL + anon key in a `.env.e2e` (git-ignored) and a CI secret.
3. Add `*.browser.spec.jsx` files that drive the authenticated shell, seeding a
   test user via the anon key. Reuse the render/dedupe setup already in place.

Keep these in the `browser-e2e` job, gated on the secret being present so forks
without it still get a green pipeline.
