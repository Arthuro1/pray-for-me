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

| Lang | Your altar | Carry this prayer | Intercession Circle | Kingdom & Mission | Testimony |
|---|---|---|---|---|---|
| en | Your altar | Carry this prayer | Intercession Circle | Kingdom & Mission | Testimony |
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
Authorities circle is "Regierende" (de) and "上に立つ人々" (ja) to stay neutral.

### Redesign copy (AI-drafted 2026-10-06 — needs native review)

New interface strings from the UI redesign, drafted in all 16 locales with the
vocabulary above. Review them in context (Today, the prayer session, Settings):

| Key | English source |
|---|---|
| `forPersonLabel` | For {name} |
| `altarPrayedThrough` | You have prayed through today's altar. |
| `emptyTodayTitle` | Begin with what is on your heart. |
| `emptyTodaySub` | Bring one prayer before God. Your altar can begin small. |
| `explorePlan` | Explore a prayer plan |
| `aiDataPrefsTitle` | What the AI receives |
| `aiDataPrefsSub` | The prayer title is always sent. Choose whether to include the description and the latest update. |

`sessionDoneTitle` lost its 🙏 in every locale (no emoji as interface art); the
eight `aiPreview*` strings were restored verbatim from 78f6c6b. Korean
`forPersonLabel` uses the "을(를)" fallback because the name is unknown.
