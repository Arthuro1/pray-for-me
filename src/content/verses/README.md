# Scripture text sources and permissions

The JSON files in this directory contain excerpts from the editions identified
below. Scripture retains its source's copyright and license. The application's
MIT license does not replace those terms.

The bundle builder extracts verse bodies, removes USFM/HTML presentation markup,
section headings, notes, marked editorial cross-references and printed alternative
verse labels, and normalizes whitespace. It does not translate, paraphrase, or
rewrite Scripture wording.
References use the application's Western chapter and verse numbering; verified
source mappings account for edition-specific Psalm numbering.

The deployed attribution page is [`public/scripture-sources.html`](../../../public/scripture-sources.html).
Its language anchors (`#fr`, `#en`, and so on) are linked from the displayed edition
labels. This ledger describes the bundled editions; live YouVersion passages are
attributed to the edition returned by that separate source.

## Edition ledger

| Language | Edition | Text source | Attribution and permissions |
| --- | --- | --- | --- |
| French (`fr`) | Louis Segond 1910 (LSG) | [Bolls Bible `FRLSG`](https://bolls.life/get-text/FRLSG/) | Louis Segond 1910 text; [public domain edition notice](https://ebible.org/fraLSG/copyright.htm). |
| English (`en`) | World English Bible (WEB) | [Bolls Bible `WEB`](https://bolls.life/get-text/WEB/) | Public domain text; [World English Bible name and trademark terms](https://ebible.org/eng-web/copyright.htm). |
| German (`de`) | Lutherbibel 1912 (LUT) | [Bolls Bible `LUT`](https://bolls.life/get-text/LUT/) | Luther 1912 text; [public domain edition notice](https://ebible.org/deu1912/copyright.htm). |
| Chinese (`zh`) | Chinese Union Version, Simplified, 1919 (和合本) | [GetBible `cus`](https://api.getbible.net/v2/cus.json) | Public domain, as identified in the [GetBible edition catalog](https://api.getbible.net/v2/translations.json). |
| Korean (`ko`) | Korean Revised Version (개역한글) | [Bolls Bible `KRV`](https://bolls.life/get-text/KRV/) | Korean Revised Version text. The [GetBible edition catalog](https://api.getbible.net/v2/translations.json) identifies this translation as public domain. |
| Arabic (`ar`) | Smith & Van Dyke (SVD; فان دايك) | [Bolls Bible `SVD`](https://bolls.life/get-text/SVD/) | Smith & Van Dyke text; [Van Dyck edition notice](https://ebible.org/arb-vd/copyright.htm) identifies the translation as public domain. |
| Persian (`fa`) | Persian Old Version 1895 (POV; ترجمه قدیم) | [eBible.org `pesOPV`](https://ebible.org/pesOPV/), [USFM archive](https://ebible.org/Scriptures/pesOPV_usfm.zip) | [Public domain notice](https://ebible.org/pesOPV/copyright.htm). |
| Hindi (`hi`) | Hindi Indian Revised Version 2019 (IRV) | [eBible.org `hin2017`](https://ebible.org/hin2017/), [USFM archive](https://ebible.org/Scriptures/hin2017_usfm.zip) | © 2017, 2018, 2019 Bridge Connectivity Solutions; [CC BY-SA 4.0](https://ebible.org/hin2017/copyright.htm). |
| Japanese (`ja`) | Japanese Kougo-yaku 1954/55 (口語訳) | [eKotoba](https://ekotoba.org/), [Kougo1955 text](https://ekotoba.org/data/Kougo1955_Japanese.txt) | The source identifies the 1955 edition as public domain. |
| Spanish (`es`) | Reina-Valera 1909 (RVR1909) | [GetBible `valera`](https://api.getbible.net/v2/valera.json) | The [source catalog](https://api.getbible.net/v2/translations.json) identifies the Scripture text as public domain. Strong's-number annotations are excluded. |
| Portuguese (`pt`) | Bíblia Livre (Livre) | [GetBible `livre`](https://api.getbible.net/v2/livre.json), [Bíblia Livre project](https://sites.google.com/site/biblialivre/) | © Diego Santos, Mario Sérgio, e Marco Teles. [Creative Commons Attribution 3.0 Brazil](https://creativecommons.org/licenses/by/3.0/br/), as identified by this source. |
| Russian (`ru`) | Synodal Translation 1876 (Синод.) | [GetBible `synodal`](https://api.getbible.net/v2/synodal.json) | Public domain, as identified in the [source catalog](https://api.getbible.net/v2/translations.json). Verified Psalm mappings preserve the Western references used by the app. |
| Tagalog (`tl`) | Ang Dating Biblia 1905 (ADB) | [GetBible `tagalog`](https://api.getbible.net/v2/tagalog.json) | Philippine Bible Society (1905); e-text typed by Richard and Dolores Long. Public domain, as identified in the [source catalog](https://api.getbible.net/v2/translations.json). |
| Indonesian (`id`) | Alkitab Yang Terbuka (AYT) | [eBible.org `indayt`](https://ebible.org/indayt/) | © 2011-2024 YLSA-AYT; noncommercial redistribution with attribution. Full notice below. |
| Amharic (`am`) | Unlocked Literal Bible, version 7.2 (ULB) | [Door43 `STR/am_ulb`](https://git.door43.org/STR/am_ulb) | Door43 World Missions Community; CC BY-SA 4.0. Full notice below. |
| Swahili (`sw`) | Unlocked Literal Bible, version 7.6 (ULB) | [Door43 `Door43-Catalog/sw_ulb`](https://git.door43.org/Door43-Catalog/sw_ulb) | Door43 World Missions Community; CC BY-SA 4.0. Full notice below. |

The World English Bible name identifies faithful copies of that translation.
Formatting normalization does not change its wording.

Portuguese excerpts retain the source's CC BY 3.0 Brazil attribution terms.
Credit: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio, e Marco Teles,
<https://sites.google.com/site/biblialivre/>. The GetBible `livre` distribution
identifies version 1.0.1 dated 2017-08-17; this is not relabelled as the separately
published 2018 edition.

## Hindi — Indian Revised Version (IRV), 2019

Copyright © 2017, 2018, 2019 Bridge Connectivity Solutions.
Translation by Bridge Connectivity Solutions. Contributor: Bridge Connectivity
Solutions Pvt. Ltd. Source: [eBible.org `hin2017`](https://ebible.org/hin2017/).
The resource identifier contains `2017`; the edition title identifies 2019.

The [source permissions](https://ebible.org/hin2017/copyright.htm) provide the text
under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).
Redistribution must include copyright and source information. Changes must be
identified without implying endorsement, and applicable contributions must retain
the same license. The bundled excerpts retain CC BY-SA 4.0; only presentation
normalization described above is applied.

## Indonesian — Alkitab Yang Terbuka (AYT)

Copyright © 2011-2024 YLSA-AYT. Language: bahasa Indonesia.

- Publisher: [Yayasan Lembaga SABDA (YLSA)](https://ylsa.org/).
- Edition and text: [AYT on eBible.org](https://ebible.org/indayt/).
- Machine-readable source: [AYT USFM archive](https://ebible.org/Scriptures/indayt_usfm.zip).
- Complete copyright and permissions: [AYT copyright page](https://ebible.org/indayt/copyright.htm).

The source expressly permits sharing and redistribution of this translation or
extracts in any format provided the copyright and source information are included
and the work is not used for commercial purposes. It identifies
[Creative Commons Attribution-NoDerivatives 4.0](https://creativecommons.org/licenses/by-nd/4.0/)
and separately states the noncommercial condition. These excerpts are included
under that noncommercial redistribution permission, with Scripture wording
preserved. AYT and Alkitab Yang Terbuka are trademarks associated with YLSA-AYT.

## Amharic — Unlocked Literal Bible (ULB), version 7.2

Creator: Door43 World Missions Community. Publisher: Door43.
Source manifest issued and modified 2020-12-27; checking level 3.

- Original work available at [Door43](https://door43.org/).
- Text and edition metadata: [Amharic ULB repository](https://git.door43.org/STR/am_ulb).
- Source license: [Amharic ULB LICENSE.md](https://git.door43.org/STR/am_ulb/src/branch/master/LICENSE.md).
- License: [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).

The source permits copying, redistribution and adaptation, including commercial
use, with attribution and ShareAlike. The redistributed Scripture excerpts retain
CC BY-SA 4.0. Any applicable contributions to the Scripture text must be
distributed under the same license. Inclusion does not imply endorsement.

## Swahili — Unlocked Literal Bible (ULB), version 7.6

Creator: Door43 World Missions Community. Publisher: Door43.
Source manifest issued and modified 2020-06-15; checking level 3.

- Original work available at [Door43](https://door43.org/).
- Text and edition metadata: [Swahili ULB repository](https://git.door43.org/Door43-Catalog/sw_ulb).
- Source license: [Swahili ULB LICENSE.md](https://git.door43.org/Door43-Catalog/sw_ulb/src/branch/master/LICENSE.md).
- License: [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).
- Additional edition attribution: [eBible.org Swahili ULB copyright page](https://ebible.org/swhulb/copyright.htm), copyright © 2019 Door43 World Missions Community.

The source permits copying, redistribution and adaptation, including commercial
use, with attribution and ShareAlike. The redistributed Scripture excerpts retain
CC BY-SA 4.0. Any applicable contributions to the Scripture text must be
distributed under the same license. Inclusion does not imply endorsement.
