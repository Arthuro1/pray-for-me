# Christian terminology

Machine-readable glossaries live in `src/content-quality/glossary/<locale>.json`.
All initial entries are editorial drafts awaiting native review, including EN,
FR and DE. The remaining thirteen languages have draft terminology so reviewers
start with context; they are not certified translations.

Each concept has `preferred`, `allowed`, `avoid`, `example` and `note` fields.
Examples illustrate usage, not Bible quotations. Approved alternatives depend
on context and denomination; do not enforce theological uniformity by search
and replace. Only explicit `avoid` phrases are checked automatically, with word
boundaries. The checker cannot prove meaning or naturalness.

German examples: prayer request → Gebetsanliegen; answered prayer → erhörtes
Gebet / Gebetserhörung; intercession → Fürbitte; testimony → Zeugnis;
renunciation → Lossagung; update on a prayer → Neuigkeit; prayer journal →
Gebetstagebuch (tab: Journal); thanksgiving → Danksagung.
French examples: sujet de prière; prière exaucée; intercession; témoignage;
nouvelles d'un sujet de prière (not "mise à jour", which is for the app);
action de grâces; renonciation.
Swahili: prayer request → hitaji la maombi ("ombi la maombi" is a calque).
Discernment means weighing a situation prayerfully, not predicting God's will.

When native feedback changes a term, update its example and note, review uses
in context, rerun the content checks, and reset affected reviews to needs-review.
Only a named human can mark a glossary human-approved with a review date.
