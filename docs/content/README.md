# Content quality workflow

The catalogue covers UI dictionaries, landing copy, plan localized fields and
teaching/guides/Gospel prose. It excludes private user content and Scripture
bundles. Missing authored translations are recorded as findings; they do not
change runtime fallbacks or plan release gates.

```sh
npm run check:locales
npm run check:content
npm run check:content -- --details
npm run review:translations -- --lang de --surface landing
npm run review:translations -- --lang fr
npm run review:translations -- --all
```

Review packages are JSON batches of 40 entries in ignored `reports/content-review/`.
They include source, target, glossary, screen, purpose, style guide, translator
instructions and a separate critic pass. Use them manually in ChatGPT/Codex or
give them to a reviewer. No API calls, credentials or paid usage are required.
No script overwrites application copy or grants approvals. Sensitive translations
ask for an English back-translation. Apply accepted wording manually in a PR.

## Review metadata and CI

Each locale/surface bundle in `review-status.json` has content and English source
SHA-256 hashes. `needs-review` is an honest initial state; `ai-reviewed` is not
human approval. `human-approved` requires reviewer, date, nativeLanguageReview,
and christianReview for sensitive prose. Changed approved text or changed source
fails CI until its review is reset or a human approves the new exact content.
Existing runtime approval files are preserved independently.

After intentional edits, run `npm run check:content -- --sync-metadata` to add new
bundles and reset changed reviews. This operation cannot grant approval.
Review the diff before committing.

CI fails for new findings and invalid metadata. Existing issues are recorded in
`baseline.json` by exact locale/key/rule/source/text fingerprint, so editing text
cannot silently inherit an exception. Short-control limits, long untranslated
matches and repeated prose are review signals, not theological judgments.

Only after reviewing accepted legacy findings, run
`npm run check:content -- --write-baseline`. Never run it automatically in CI.
The resulting baseline diff must be reviewed; a baseline is not an approval.

## Wording reports

Settings → Support → Report wording opens a catalogue of authored text in the
selected language. Choose the screen, search for the phrase, select it, and
optionally suggest a correction. Search is local. Nothing reads prayer records,
DOM selection, screenshots, route parameters, names or email addresses.
Reports store the selected locale, catalogue key/screen/text, issue category,
optional correction, timestamp/status and the reporter's account id for access
control. Users are reminded not to enter private information in a correction.

Apply the wording-report migration through the normal deployment workflow.
Grant designated editors `app_metadata.content_reviewer = true` through a trusted
server/admin tool, preserving other metadata. Never use user_metadata for this
role. Refresh the editor's session after changing the role. Settings then offers
Review wording reports, with status filters and pagination. Database policies
enforce this role independently of the UI. Editors can change status only;
resolving a report does not edit copy, update a glossary or approve content.
An accepted report should lead to a reviewed source/glossary PR, then be resolved.
Until the migration is applied, the interface shows a retryable submission error.

Database permission design follows the [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).
