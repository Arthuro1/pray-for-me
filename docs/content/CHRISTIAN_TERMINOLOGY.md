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

## Qetoret vocabulary (AI-drafted 2026-10-06 — needs native review)

The rebrand added a small, fixed vocabulary (docs/QETORET_IDENTITY.md §10).
These are the renderings chosen for meaning and denominational neutrality, not
word for word. "Altar" is a metaphor for a person's life of prayer, never a
ritual object; "carry" means taking a request into one's own intercession.
Native reviewers: change a cell here first, then the locale files.

| Lang | Your altar | Carry this prayer | Intercession circle | Kingdom & Mission | Testimony |
|---|---|---|---|---|---|
| en | Your altar | Carry this prayer | Intercession circle | Kingdom & Mission | Testimony |
| fr | Votre autel | Porter cette prière | Cercle d'intercession | Royaume et mission | Témoignage |
| de | Dein Altar | Dieses Gebet mittragen | Fürbittekreis | Reich Gottes & Mission | Zeugnis |
| es | Tu altar | Llevar esta oración | Círculo de intercesión | Reino y misión | Testimonio |
| pt | Seu altar | Levar em oração | Círculo de intercessão | Reino e missão | Testemunho |
| zh | 你的祭坛 | 为此代祷 | 代祷圈 | 神的国与使命 | 见证 |
| ja | 祭壇 | この祈りをとりなす | とりなしのサークル | 御国と宣教 | 証し |
| ko | 제단 | 이 기도 품기 | 중보의 원 | 하나님 나라와 선교 | 간증 |
| ru | Ваш алтарь | Нести эту молитву | Круг ходатайства | Царство и миссия | Свидетельство |
| hi | आपकी वेदी | इस प्रार्थना को उठाएँ | मध्यस्थता का घेरा | राज्य और मिशन | गवाही |
| sw | Madhabahu yako | Beba ombi hili | Duara la maombezi | Ufalme na utume | Ushuhuda |
| am | መሠዊያዎ | ይህን ጸሎት ይያዙ | የምልጃ ክበብ | መንግሥቱና ተልዕኮ | ምስክርነት |
| id | Mezbah Anda | Doakan pokok ini | Lingkaran syafaat | Kerajaan dan misi | Kesaksian |
| tl | Ang iyong altar | Pasanin ang panalanging ito | Bilog ng pamamagitan | Kaharian at misyon | Patotoo |
| ar | مذبحك | احمل هذه الصلاة | دائرة الشفاعة | الملكوت والإرسالية | شهادة |
| fa | مذبح شما | شفاعت برای این دعا | دایرهٔ شفاعت | ملکوت و مأموریت | شهادت |

Notes: Russian uses "алтарь" (common in evangelical speech) in the UI and the
Synodal "жертвенник курения" for the altar of incense in Exodus/Luke; Persian
renders "carry" as intercession because a literal "carry" reads oddly; the
Authorities circle is "Regierende" (de) and "上に立つ人々" (ja) to stay neutral;
the third circle is "Meine Nächsten" in German (chosen by the product owner,
2026-10-07; "Meine Menschen" read unnaturally).

### Altar, carry, circle: one hierarchy (2026-10-07)

Three metaphors used together in one workflow overload it. Each has one job:

- **Altar** — the primary spiritual metaphor: a person's life of prayer before
  God ("Your altar today", "Tend your altar", "everything on your altar").
- **Circle** — organization and formation: where a prayer sits, and the
  teaching on the circle pages. As a field it is a plain label, "Intercession
  circle", never a question such as "Where are you carrying this?".
- **Carry** — used selectively, where taking responsibility to intercede is
  the point: "Carry this prayer" on a group request, "Prayers you're
  carrying", "Carried since …", and formation teaching ("Love carries
  burdens"). Routine actions use ordinary verbs: pray, pray for, bring before
  God, remember in prayer ("Pray for my household", "Pray for a nation", "What
  would you like to keep praying about?").

Never "carry your altar" or "pray my altar circle by circle": the meaning is
bringing everything on one's altar before God ("You have brought everything on
your altar before God", "Pray for everything on my altar").

### Translate the meaning, not the metaphor

"Carry" need not become a literal verb of physical carrying. Depending on the
language, natural Christian phrasing may be: intercede for, remember in prayer,
bring before God, pray faithfully for, hold in prayer (de: "im Gebet
mittragen", "vor Gott bringen"; fr: "porter dans la prière", "porter devant
Dieu" are established). Russian's "Вы принесли к Богу всё, что на вашем
алтаре" ("you have brought to God everything on your altar") is the model:
the sense, idiomatically. Every string in this file that is not English or
French source remains an AI draft until a native Christian reviewer checks it
in context — nothing here is certified.

### Redesign copy (AI-drafted 2026-10-06 — needs native review)

New interface strings from the UI redesign, drafted in all 16 locales with the
vocabulary above. Review them in context (Today, the prayer session, Settings):

| Key | English source |
|---|---|
| `forPersonLabel` | For {name} |
| `altarPrayedThrough` | You have prayed for everything on today's altar. |
| `emptyTodayTitle` | Begin with what is on your heart. |
| `emptyTodaySub` | Bring one prayer before God. Your altar can begin small. |
| `explorePlan` | Explore a prayer plan |
| `aiDataPrefsTitle` | What the AI receives |
| `aiDataPrefsSub` | The prayer title is always sent. Choose whether to include the description and the latest update. |
| `circleDesc_self` … `circleDesc_kingdom` | Personal prayer and formation · Family and household · Friends and relationships · Church and ministry · Leaders and governments · Cities, countries and peoples · Gospel, justice, mercy and God’s purposes |
| `tendSub` | Some prayers have been resting for a while. |
| `tendQuestion` | What would you like to do with this prayer now? |
| `carryingLabel` | Carrying (the "Carry this prayer" button once pressed) |
| `rememberLabel` | Remember (gold label over the testimony step; reuses each locale's `aboutMove_remember` verb) |

`sessionDoneTitle` lost its 🙏 in every locale (no emoji as interface art); the
eight `aiPreview*` strings were restored verbatim from 78f6c6b. Korean
`forPersonLabel` uses the "을(를)" fallback because the name is unknown.
`carryingLabel` replaces `carryingThisPrayer`, and `tendSub` replaces
`tendIntro` (both removed). `carryingLabel` follows each locale's "carry" verb
above (fa: in intercession; zh/ja: interceding).
