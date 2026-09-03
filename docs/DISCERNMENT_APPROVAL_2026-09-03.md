# Freigabe — Paul, 3. September 2026

Die ausdrückliche Anweisung des Nutzers lautet:
« resourcen und plan freigeben unter der Name Paul ».

Diese Anweisung erteilt die Freigabe für den hier vorbereiteten Plan und die
zugehörige Ressourcenauswahl. Sie wird unter **Paul**, Datum **2026-09-03**,
eingetragen. Sie behauptet keine zusätzlich durchgeführte unabhängige oder
muttersprachliche Prüfung. Die zuvor dokumentierten Grenzen der Übersetzungs-
und Quellenprüfung bleiben Teil der Entstehungsgeschichte.

## Plan und Sprachen

`discernment28`, Version 1, ist für die normale Nutzung freigegeben:
28 Tage, vier Abschnitte, Einleitung, Gebete, Übungen und Abschluss.
Die Freigabe umfasst Theologie, Schutz der Personen und die vollständigen
aktuellen Fassungen in **fr, en, de, pt, zh, es, hi, ja, sw, am, id, tl, ko,
ru, ar und fa**. Der Plan benötigt in einer entsprechend gebauten App keinen
Parameter `?planPreview=1` mehr.

Der eigene Freigabedatensatz liegt in
`src/content/reviews/paulDiscernment20260903.js`. Die frühere Freigabe der vier
anderen Pläne wird nicht nachträglich erweitert. Die Liste der Sprachen und
Ressourcen ist abgeschlossen; künftige Inhalte werden nicht automatisch erfasst.

## Ressourcen

Die Auswahl umfasst **13 Ressourcen**: sechs wiederverwendete Einträge und
sieben neue Einträge. Die neuen Ressourcen tragen jeweils die Inhalts- und
Sicherheitsfreigabe von Paul. Bereits vorhandene Freigaben behalten ihr Datum;
die beiden Chapman-Einträge erhalten zusätzlich die namentlichen Signaturen.

| Eintrag | Verfügbare geprüfte Ausgaben / Verwendung |
|---|---|
| `keller-meaning-of-marriage` | Bestehende Ausgaben; Bedeutung und Verantwortung der Ehe |
| `chapman-things-before-married` | en, es; Gespräche bei einer erwogenen Beziehung |
| `chapman-five-love-languages-singles` | en, de, es, pt; Kommunikation und Freundschaft |
| `allberry-7-myths-singleness` | en, fr, es; Wert des Lebens ohne Ehe |
| `fdm-marriage-is-a-ministry` | en, es, hi, sw, am; ergänzende Auseinandersetzung mit dem Eheleben |
| `shepherds-global-christian-family` | en, fr, es, pt, ar, sw zusätzlich zu zh, hi, tl; besonders Lektionen 5 und 6 |
| `bibleproject-wisdom-proverbs` | [en](https://bibleproject.com/videos/wisdom-proverbs/), [es](https://bibleproject.com/es/videos/la-sabiduria-de-proverbios/); biblische Weisheit |
| `bibleproject-holy-spirit` | [en](https://bibleproject.com/videos/holy-spirit/); der Heilige Geist im biblischen Zusammenhang |
| `alpha-pre-marriage-course` | [en](https://www.bible.com/reading-plans/22661-the-pre-marriage-course), [de](https://www.bible.com/de/reading-plans/22661-the-pre-marriage-course), [es](https://www.bible.com/es/reading-plans/22661-the-pre-marriage-course), [pt](https://www.bible.com/pt/reading-plans/22661-the-pre-marriage-course); fünf Tage als freiwillige Gesprächshilfe |
| `gotquestions-found-spouse` | [en](https://www.gotquestions.org/know-found-spouse.html), [ko](https://www.gotquestions.org/Korean/Korean-know-found-spouse.html), [fa](https://www.gotquestions.org/Farsi/Farsi-perfect-spouse.html); Kennenlernen und gemeinsame Prioritäten |
| `gotquestions-christian-girlfriend` | [id](https://www.gotquestions.org/Indonesia/perempuan-pacar-kristen.html); ergänzender Artikel mit männlicher Ansprache |
| `gotquestions-dating-choice` | [en](https://www.gotquestions.org/dating-choice.html); zusätzliche Perspektive bei mehreren möglichen Beziehungen |
| `lifechurch-dateable` | [en](https://www.bible.com/reading-plans/11133-dateable), [es](https://www.bible.com/es/reading-plans/11133-dateable); optional, mit jugendorientiertem Ton |

Die Verlags- und Anbieterseiten der neuen Einträge sowie der sechs ergänzten
SGC-Ausgaben wurden am 3. September erneut abgefragt. Die Quellen stehen direkt
in den Ausgabenfeldern. Die Links führen zu konkreten Videos, Artikeln oder
Kursen. Vorhandene Bücher werden nicht dupliziert, und ihre Prüfzeitpunkte
werden nicht ohne erneute Prüfung überschrieben.

Die russische SGC-Seite konnte bei dieser Abfrage nicht geöffnet werden;
sie wird deshalb nicht als neu verifizierte Ausgabe eingetragen. Gleiches
gilt für weitere BibleProject-Sprachen, für die bisher nur ein Sprachportal
und kein konkretes Video ausgewählt wurde. Das ist keine Aussage, dass diese
Angebote für Leser nicht erreichbar wären. Der allgemeine Ressourcenkatalog
hat durch den persischen Artikel nun in allen 16 App-Sprachen mindestens eine
anzeigbare Ausgabe; nicht jede Ressource existiert in jeder Sprache.

## Technische Wirkung

Die bestehenden Freigabe- und Linkfilter bleiben unverändert. Nicht freigegebene
zukünftige Inhalte und Ausgaben ohne geprüften Link werden weiterhin ausgefiltert.
Ressourcen erscheinen je nach Tagesthema, Lebenssituation und gewählten Sprachen
im vorhandenen Abschnitt zum Weiterlesen. Der lokale Vergleichsleser zeigt den
Freigabestatus ebenfalls an; neu erzeugen mit
`node scripts/build-discernment-review.mjs`.

Diese Änderung gibt den Inhalt im Projekt frei. Ein Deployment wird dadurch
nicht ausgelöst.

Geprüft: 302 Tests in zwölf betroffenen Testdateien, darunter die normalen
Startaktionen auf Deutsch und Persisch, die Sichtbarkeit ohne Vorschau,
sämtliche Freigaben, die 13 Ressourcen und die persische Sprachauswahl.
Lint, Typprüfung und Produktionsbuild sind erfolgreich. Die bekannte
Buildwarnung zu einem JavaScript-Paket über 500 kB bleibt bestehen.
