# Multilingual relationship-resource discovery

**Audience:** Pray4Me product, pastoral, safety, and localization reviewers  
**Research date:** 2026-08-28  
**Scope:** The 16 configured app locales (`fr`, `en`, `de`, `pt`, `zh`, `es`, `hi`, `ja`, `sw`, `am`, `id`, `tl`, `ko`, `ru`, `ar`, `fa`) and the three relationship plans that currently declare resource topics.  
**Assumption:** “All other languages” means every language the app can currently select, not every language in the world.

## Direct answer

The safest product behavior is app-language first, then English only when that language has no relevant approved result. English should be preselected but visible, removable, and always labelled on cards. Fallback results should not be mixed into a shelf that already has a local-language match.

The search found eleven first-party localized editions of three already-approved resources. They can inherit the existing resource-level content/safety review because they are publisher-confirmed editions, while their edition titles and links remain independently verified. Two broader multilingual studies were also relevant, but they cover sexuality, intimacy, or disputed marriage roles; they were added only as invisible `needs_review` records.

## Discovery and validation method

1. Started from the ten displayable catalogue resources and the plan topic taxonomy.
2. Searched each configured locale for official publisher, author, ministry, national-library, or government-library evidence.
3. Preferred a direct localized publisher/ministry page. Retail listings, summaries, scraped PDFs, and guessed translated titles were rejected.
4. For a live edition, required an exact localized title, author, publisher, HTTPS URL, and verification date.
5. For a new work, recorded it as `needs_review`; sensitive topics also require both named content and safety sign-offs before display.

## Locale gap matrix

| Locale | Live additions | Review-only or unresolved leads | Decision |
|---|---|---|---|
| `en` | Existing catalogue retained | FDM marriage study | Default fallback, removable |
| `fr` | Keller, Allberry | None needed for this pass | Live |
| `de` | Keller, Ortlund | Allberry publisher catalogue evidence was less direct | Live verified editions only |
| `pt` | Keller, Ortlund | None needed for this pass | Live |
| `es` | Keller, Allberry, Ortlund | FDM marriage study | Live books; study review-only |
| `ja` | Keller, Ortlund | None | Live |
| `zh` | None | Shepherds Global Classroom; Traditional Chinese Keller edition lacks a current first-party product page and does not clearly match the app's Simplified-Chinese locale | Review-only course; English fallback |
| `hi` | None | FDM and Shepherds Global Classroom | Review-only; English fallback |
| `sw` | None | FDM marriage study | Review-only; English fallback |
| `am` | None | FDM marriage study | Review-only; English fallback |
| `tl` | None | Shepherds Global Classroom; a licensed Taglish *Gentle and Lowly* study guide is not a full Tagalog edition | Review-only; English fallback |
| `id` | None | Perkantas lists Allberry with the English title, but the page does not clearly establish the edition language or official localized title | Hold; English fallback |
| `ko` | None | Keller/Duranno is strongly corroborated, but the publisher product page rejected automated verification | Hold for manual link check; English fallback |
| `ru` | None | A Russian Ortlund edition was found only through a distributor/store page, not a canonical publisher page | Hold; English fallback |
| `ar` | None | No trustworthy first-party relationship-plan resource found in the bounded search | English fallback |
| `fa` | None | No trustworthy first-party relationship-plan resource found in the bounded search | English fallback |

## Live-edition source ledger

| Claim | Primary source | Publisher / authority | Access notes |
|---|---|---|---|
| Keller has multiple international editions | https://timothykeller.com/books/the-meaning-of-marriage | Official author site | Lists publishers for French, German, Portuguese, Spanish, Chinese, Indonesian, Japanese, and Korean editions |
| French Keller title and edition | https://editionscle.com/vie-chretienne/222-le-mariage-edition-brochee-9782358430432.html | Éditions Clé | Exact title, authors, original title, ISBN, and publication data |
| German Keller title and edition | https://brunnen-verlag.de/191305/ehe.html | Brunnen Verlag | Exact title/subtitle, authors, ISBN, and 2026 edition date |
| Portuguese Keller title and edition | https://www.vidanova.com.br/livros/significado-do-casamento-o | Vida Nova | Exact title, author, and publisher product page |
| Spanish Keller title and edition | https://www.bhpublishinggroup.com/product/el-significado-del-matrimonio-2/ | B&H Publishing | Exact Spanish title and author |
| Japanese Keller title and edition | https://www.wlpm.or.jp/pub/?sh_cd=96747 | いのちのことば社 | Exact title, authors, translator, date, and ISBN |
| French Allberry title and edition | https://blfstore.com/products/7-mensonges-sur-le-celibat | BLF Éditions | Exact title, author, original title, publisher, and ISBN |
| Spanish Allberry title and edition | https://bhespanol.bhpublishinggroup.com/product/7-mitos-sobre-la-solteria-2/ | B&H Español | Exact title and author |
| German Ortlund title and edition | https://www.3lverlag.de/kategorien/1815-guetig-und-sanft.html | 3L Verlag | Exact title, original title, author, and ISBN |
| Portuguese Ortlund title and edition | https://thomasnelson.com.br/products/manso-e-humilde-dane-c-ortlund | Thomas Nelson Brasil | Exact title on publisher page; some product-template metadata failed to render |
| Spanish Ortlund title and edition | https://bhespanol.bhpublishinggroup.com/product/manso-y-humilde-2/ | B&H Español | Exact title and author |
| Japanese Ortlund title and edition | https://www.wlpm.or.jp/pub/?sh_cd=113670 | いのちのことば社 | Exact title, author/translator, date, and ISBN |

## Review-only source ledger

| Candidate | Locales | Primary sources | Why it is not live |
|---|---|---|---|
| *Marriage Is a Ministry* | `en`, `es`, `hi`, `sw`, `am` | https://fdm.world/resources/marriage/ plus the ministry's `/languages/<language>/` pages | Five-part workbook includes intimacy and marriage-role material; requires pastoral/content and safety reviews |
| *Christian Family* | `zh`, `hi`, `tl` | https://courses.shepherdsglobal.org/simplified-chinese/christian-family, https://courses.shepherdsglobal.org/hindi/christian-family, https://courses.shepherdsglobal.org/tagalog/christian-family | Fifteen-lesson course covers singleness, marriage preparation, sexuality, family, and parenting; requires content and safety reviews |

## Limitations and follow-up

- This was a bounded discovery pass, not proof that no resource exists. Arabic, Persian, Russian, Indonesian, Korean, and Chinese should be re-searched periodically with local-language reviewers.
- A canonical link proves an edition exists; it does not prove translation quality or pastoral suitability.
- Before approving either study, reviewers should assess coercion/abuse framing, disputed role claims, consent, sexual counsel, crisis referrals, and whether the resource permits appropriate pastoral, clinical, legal, or safeguarding help.
- Manually recheck the Duranno Korean product page and the Indonesian Perkantas colophon before adding those editions.
