# Qetoret content style

English is the semantic source of truth. French remains the app's bundled
fallback and canonical UI key set. Keep the runtime fallback behavior intact.

- Give each sentence a purpose. Prefer one clear idea and concrete words.
- Marketing describes a benefit. Put implementation details in help or privacy.
- Avoid repeating benefits, privacy assurances and language counts on one screen.
- Address ordinary Christians warmly; welcome readers exploring Christianity.
- Preserve each locale's register (see Register below).
- Use familiar Christian vocabulary from the locale glossary in context. Its
  preferred term is not a command to replace every synonym mechanically.
- Preserve doctrinal intent. Flag theological ambiguity for a human reviewer.
- God's faithfulness does not grow through app use; our record of it grows.
- Do not promise healing, marriage, deliverance, certainty or a particular outcome.
- Preserve uncertainty, consent, safety guidance and the dignity of singleness.
- A reflection develops one spiritual point; a prayer prompt leads into prayer;
  a practice gives a concrete action. Remove mere restatements of the title.
- Keep biblical quotations and references unchanged. Never generate text that
  appears to be Scripture. Clearly distinguish devotional prose from quotation.
- Preserve placeholders, list order, plan day numbers and stable identifiers.
- Do not imply that the app speaks for God or replaces pastoral care.
- Never write "(s)" plurals. Use a label and a number ("Prayers for today: 3")
  or the locale's real plural forms.
- If a line adds nothing on its screen, delete it (in the JSX and all 16 locales)
  rather than polishing it.

## Register

- French: **vous** for controls, settings, privacy, the landing page and
  notifications; **tu** in devotional prose (plan reflections, prompts,
  prayers, teaching) and in AI output.
- German: **du** everywhere. The nav tab is "Journal"; sentences say
  "Gebetstagebuch". The vault secret is a "Passphrase"; only the account
  login is a "Passwort".
- Chinese (`zh`) is Simplified, mainland usage. `check:content` fails on
  Traditional-only characters.

## Vocabulary

Public positioning: "Rooted in Scripture and shaped by a living faith in Jesus
Christ, Qetoret welcomes Christians from different church traditions who desire
to grow in prayer." Preserve the place of the reader's local church, its pastors
and fellowship. This welcome does not imply that every tradition has the same
theological vocabulary or endorses every teaching in the app.

Write for Pentecostal and charismatic Christians first, in words other
evangelicals also recognise: the Holy Spirit's present work, prayer and
fasting, testimony, deliverance and renunciation. This is the editorial
perspective for devotional material; do not describe it as denominationally
neutral or require readers to identify with that tradition. The locale glossaries hold
the agreed terms; the AI proxy receives the same list through the generated
`api/_aiGlossary.js` (`npx vitest run api/aiGlossary.test.js -u` after editing
a glossary). Redeploy the API after regenerating it.

## Privacy and language claims

- For prayer AI suggestions, explain the same choice in public help and consent:
  the prayer title is sent after consent; details and the latest update are
  optional. The request also includes the reader's language and, for prayer
  recommendations, their selected guidance option. The reader reviews the
  outgoing text before each prayer request.
  Name the configured recipient (Claude by Anthropic, or Qetoret's private
  service) and the Qetoret server that handles the request. Text explicitly
  chosen for translation also goes to that service. Consent can be withdrawn
  at any time in Settings, preventing future requests; it cannot recall text
  already sent.
- Describe navigation as available in 16 languages, without implying equal
  devotional coverage or completed native review. Longer teaching and prayer
  plan content may fall back to English or French. Marketing translations in
  Swahili, Amharic, Indonesian, Tagalog, Korean, Russian, Arabic and Persian
  are marked as in progress in the language menu. Translation completion and
  human linguistic approval are separate facts; do not present one as the other.

## Signed plans

A plan signed by a named reviewer may be corrected on main and stays live. Add
or extend its `rereviewPending` note in `src/content/reviews/` with the date
and what changed. Never edit the sign-off itself; only the reviewer clears the
note by re-approving.

## Review sequence

1. Clarify English source wording and document ambiguous passages.
2. Give the translator the screen, purpose, audience, length and glossary.
3. In a separate critic pass, assess meaning, naturalness, terminology, theology,
   length, repetition and literal-English phrasing. Back-translate sensitive prose.
4. A human accepts or edits proposals. Native editorial review is required for
   marketing approval; sensitive material requires a native Christian reviewer.
5. Record the reviewer, date and exact content/source hashes for human approval.

AI review can produce `pass` or `needs-review` findings, never human approval.
Existing release approvals and this editorial workflow serve different purposes.
Do not claim that pre-existing owner sign-offs are independent native reviews.
