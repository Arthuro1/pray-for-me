# The curated resource catalogue ("Go deeper")

A plan day may offer one to three external resources — a book, an article, a
podcast, a teaching, a video, a study, a prayer guide. They sit at the very
bottom of the day, folded away, and the plan is complete without them.

**Nothing in this catalogue reaches a user until a human has verified and
approved it.** That is not a policy note; it is enforced by the resolver.

---

## Why the shipped catalogue currently shows nothing

`src/content/resources/catalogue.js` ships as a **curation worksheet**: real,
well-known titles and authors, seeded so a curator has somewhere to start. Every
entry is `status: 'needs_review'` and carries no URL, because:

- recommending reading to someone praying about marriage is a pastoral act, and
- nothing here was looked up at runtime, so no URL, ISBN, publisher page or
  translated edition may be asserted as fact by this repo.

Until a curator verifies an entry and flips it to `approved`, the app shows **no
"Go deeper" section at all** — not an apology, not an empty state. That is the
correct behaviour, and `src/lib/resources.test.js` asserts that the shipped
catalogue renders nothing.

---

## The model

```js
{
  id: 'keller-meaning-of-marriage',   // stable; referenced by replacementResourceId
  type: 'book',                       // RESOURCE_TYPES
  originalLanguage: 'en',             // the language it was written/produced in
  topics: ['marriage', 'covenant'],   // RESOURCE_TOPICS
  lifeStages: ['single', 'engaged'],  // LIFE_STAGES
  status: 'needs_review',             // draft | needs_review | approved | retired
  replacementResourceId: null,        // set when retiring something with a successor
  description: { en: '…', fr: '…' },  // OUR one sentence on why it fits — localized
  editions: {
    en: { title, author, publisher, url, available: true, lastVerifiedAt: '2026-08-26' },
    de: { …a verified German edition, or the key is simply absent… },
  },
}
```

Taxonomy, types, life stages and statuses live in
`src/content/resources/topics.js`. Keep the taxonomy small and flat — a tag
nobody uses is worse than no tag.

### `description` is ours, not the publisher's

One short sentence, written by us, saying why this fits *this* subject. Never a
copied publisher blurb. It is a localized field like the rest of our content
(`{ en, fr, … }`) and resolves through `pick()`.

---

## Multilingual: locales are not translations of each other

The goal is **not** "translate the English list". It is: give a reader a
trustworthy resource on this subject *in a language they can actually use*.

A German reader may be offered a completely different, German-authored book by a
different author than an English reader gets on the same topic — and that is
**preferred** over a translation.

### The fallback hierarchy (`src/lib/resources.js`)

1. An approved resource **originally in the reader's language**.
2. A **verified edition** (translation) in the reader's language.
3. A resource in a **fallback language the reader explicitly enabled**.

A non-English reader is never quietly filled with English. Fallback languages
come from the reader's own "Resource languages" preference
(Settings → Appearance & language), stored on the device under
`pfm_resource_langs`; the app language is always included and cannot be removed,
so the default needs no configuration.

Every card names its **type and its language**, so a fallback-language
recommendation is obvious before it is opened.

### Never fabricate an edition

If a book has no verified German, Arabic, Korean or Swahili edition, **do not
add one**. Do not translate a title, invent an ISBN, guess a publisher, or
construct a URL. Leave the language key out; the resolver will simply not offer
that resource to that reader.

AI may help a curator *discover candidates*. Publication always requires a human.

---

## What the resolver guarantees

`resolveResources({ topics, lifeStage, languages, boostTopics, limit, catalogue })`

- only `status: 'approved'` entries;
- only editions with a `lastVerifiedAt` date and not marked `available: false`;
- only entries whose topics overlap the day's `resourceTopics`;
- only entries whose `lifeStages` include the plan's `lifeStage` (when declared);
- ranked by the language hierarchy above, then by topic fit;
- the reader's **growth areas** boost ranking only — they can never pull an
  off-topic resource in;
- capped at 3, and usually one is enough;
- `[]` when nothing qualifies, so the caller omits the section.

---

## Review workflow

```
draft ──► needs_review ──► approved ──► retired
                              ▲            │
                              └── re-verify┘
```

**To approve an entry**

1. Read enough of it to stand behind it pastorally and theologically.
2. Confirm the title, author and publisher against the actual edition.
3. Find the **canonical** URL — publisher, author, or ministry page. Not a
   retailer. Pray4Me is not a bookstore. (Purchase links, if ever added, stay
   secondary and region-aware.)
4. Write the one-sentence `description` in en + fr.
5. Set `lastVerifiedAt` on that edition and `status: 'approved'`.

**To add a locale**

Add only a language key you have personally verified exists. It may be a
translated edition of an existing entry, or — better — a separate entry created
in that language.

**To retire an entry**

Set `status: 'retired'`. If there is a successor, set `replacementResourceId`.
Retired entries never render; `replacementFor()` follows the successor.

**Link maintenance**

`lastVerifiedAt` is the re-check clock. Re-verify periodically; anything that has
gone dead should be retired rather than left to 404. A broken resource must
never block the prayer plan — it simply disappears from the day.

---

## Role-specific and disputed material

Resources attached to husband/wife reflections need the same theological review
as the reflections themselves (see `docs/PRAYER_PLANS.md`). Where Christian
traditions differ on marriage roles, do not approve a resource that presents one
disputed interpretation as the settled Christian position.

---

## Privacy

Resource recommendations are resolved **entirely on the device** from a bundled
catalogue. No topic, no plan day, no preference and no reader identifier is sent
anywhere to produce them. Opening one emits `resource_opened` with **no
properties** — not the id, the title, the topic, or the language.
