# Gebetsschutz testen — Anleitung

Stand: 9. Oktober 2026.

## Was du jetzt testen kannst

Die von mir erstellten Änderungen sind im lokalen Projekt vorhanden. In dieser
Aufgabe gab es bisher keine Veröffentlichung auf qetoret.com. Beide Schalter für
die Einrichtung sind standardmäßig ausgeschaltet.

**Die automatischen Tests und die lokale Testversion auf diesem PC kannst du
jetzt verwenden.** Abschnitt 2 erklärt die Freischaltung. Für einen echten
Handytest ist eine getrennte HTTPS-Testumgebung erforderlich.
Ein erfolgreiches Anmelden allein ist kein erfolgreicher Wiederherstellungstest:
Die zuvor gespeicherten Gebete müssen anschließend wieder lesbar sein.

## 1. Automatische Tests auf diesem PC

Öffne PowerShell und kopiere diese Befehle einzeln hinein. Die Abhängigkeiten
sind in diesem Projekt bereits installiert. Die Browserprüfung startet den auf
dem PC installierten Google Chrome im Hintergrund.

```powershell
Set-Location -LiteralPath 'C:\Users\T480s\Desktop\Ministry\projets\pray_for_me'
```

Zuerst Wiederherstellung, Verschlüsselung, Fünf-Minuten-Sperre und Oberfläche:

```powershell
npm.cmd test -- src/lib/prayerProtection.test.js src/lib/crypto/passkeyRecovery.test.js src/lib/crypto/keyManager.idle.test.js src/components/tests/PrayerProtection.test.jsx --maxWorkers=2 --testTimeout=30000
```

Danach der wichtigste automatisierte Browserablauf:

```powershell
npm.cmd run test:browser -- src/lib/prayerProtection.browser.spec.js --maxWorkers=1 --testTimeout=30000
```

**Erwartetes Ergebnis:** `Test Files ... passed` und `Tests ... passed`, ohne
`failed`. Der Browserablauf wurde mit **einem bestandenen Browsertest** geprüft.

Dieser Browsertest legt verschlüsselte Testinhalte an, entfernt die ursprünglichen
lokalen Schlüssel und stellt Gebet, Identität, historische Gruppeninhalte und
Anhang wieder her. Er prüft auch Notfallcode und Geräteentsperrung. Anmeldung,
Server und Passkey-Antworten sind simuliert; WebCrypto und IndexedDB laufen im
echten Browser. Deshalb erscheint kein echter Fingerabdruckdialog. Es werden
keine persönlichen Gebete oder Produktionsdaten benötigt.

Für alle Browserprüfungen:

```powershell
npm.cmd run test:browser -- --maxWorkers=1 --testTimeout=30000
```

Der letzte vollständige Durchlauf bestand mit **62 Tests in 16 Dateien**.

Optional kannst du das gesamte Projekt prüfen:

```powershell
npm.cmd test -- --maxWorkers=3 --testTimeout=30000
npm.cmd run typecheck
npm.cmd run lint:strict
npm.cmd run check:locales
npm.cmd run build
```

Die vollständigen Unit-Tests brauchen mehrere Minuten. Beim letzten Durchlauf
bestanden 3.555 Tests; sechs bestehende Tests zu Inhaltskatalogen und
Freigabeannahmen scheiterten. Die sechs Namen und Ursachen stehen in
[RECOVERY_RELEASE.md](RECOVERY_RELEASE.md). Sie gehören nicht zum Gebetsschutz.
Ein neuer Fehler in den gezielten Wiederherstellungstests muss untersucht werden.

## 2. Die lokale Testversion freischalten

**Diese Schritte gelten für den PC und seine getrennte lokale Testdatenbank.**
Docker Desktop muss laufen. Beim ersten Start lädt Supabase möglicherweise
Container herunter; das kann einige Minuten dauern.

Öffne PowerShell und führe diese Befehle einzeln aus:

```powershell
Set-Location -LiteralPath 'C:\Users\T480s\Desktop\Ministry\projets\pray_for_me'
npm.cmd run setup:recovery-test
npx.cmd --yes supabase --workdir .recovery-test start
npx.cmd --yes supabase --workdir .recovery-test status
```

Öffne anschließend `.recovery-test/.env.local` im Texteditor. Ersetze dort die
Platzhalter mit den Schlüsseln aus der Ausgabe der **lokalen** Testdatenbank:

| Feld | Einzutragender Wert |
|---|---|
| `VITE_SUPABASE_ANON_KEY` | Lokaler anon- oder Publishable-Schlüssel |
| `SUPABASE_ANON_KEY` | Derselbe anon-/Publishable-Schlüssel |
| `SUPABASE_SERVICE_ROLE_KEY` | Lokaler Service-Role-Schlüssel |

Falls die Ausgabe stattdessen einen Secret-Schlüssel anbietet, ersetze die
Service-Role-Zeile durch `SUPABASE_SECRET_KEY=...`. Ein geheimer Schlüssel
darf niemals in einem Feld mit `VITE_` stehen. Verwende keine Schlüssel von
qetoret.com oder einer gehosteten Datenbank und teile die Datei nicht.

Die URLs und Schalter sind in der erzeugten Datei bereits richtig eingestellt.
Starte die freigeschaltete Testversion:

```powershell
npm.cmd run dev:recovery-test
```

Lass das Fenster offen und öffne **http://localhost:5173** in einem neuen
Chrome- oder Edge-Browserprofil, das nur für diesen Test verwendet wird.
Diese genaue Adresse ist erforderlich. Lege über die E-Mail-/Passwort-Registrierung
ein neues Testkonto an; die lokale Konfiguration verlangt keine E-Mail-Bestätigung.
Dein echtes qetoret.com-Konto ist in dieser getrennten Datenbank nicht vorhanden.
Die Datenbankoberfläche liegt unter http://127.0.0.1:55423.

Auf diesem PC wurden die getrennte Datenbank und ihre lokalen Schlüssel am
9. Oktober 2026 bereits eingerichtet. Solange der Entwicklungsserver läuft,
kannst du die Testadresse direkt öffnen.

Für einen späteren Start genügen der Supabase-Startbefehl und
`npm.cmd run dev:recovery-test`; die Einstellungen bleiben erhalten. Beende den
Entwicklungsserver mit Strg+C. Die lokale Datenbank kannst du mit
`npx.cmd --yes supabase --workdir .recovery-test stop` anhalten; ihre Daten bleiben
erhalten. Weitere Fehlerhilfen stehen in
[RECOVERY_LOCAL_TEST.md](RECOVERY_LOCAL_TEST.md).

Für Abschnitt 4 kann auf diesem PC zunächst ein zweites frisches Browserprofil
als Gerät B dienen. Das prüft die Code-Wiederherstellung unabhängig vom ersten
Profil, ersetzt aber keinen echten Test nach Verlust eines Handys.
`localhost` auf einem Handy bezeichnet das Handy selbst. Gerätetests auf zwei
physischen Geräten brauchen daher weiterhin eine gezielt konfigurierte
HTTPS-Testadresse und Testdatenbank. Der lokale Entwicklungsserver enthält auch
nicht den Produktions-Cache für einen Offline-Neustart; die Offline-Prüfungen
unten gelten für die spätere HTTPS-/PWA-Testversion.

Nutze für die folgenden Schritte ein eigenes
Testkonto und ein eigenes normales Browserprofil. Verwende für die dauerhafte
Einrichtung und den Offline-Test kein Inkognitofenster, dessen Daten beim
Schließen verschwinden können. Lösche keine Daten deines echten Gebetskontos
und verwende dort keine Option zum Leeren oder Neubeginnen.

## 3. Testdaten und Notfallcode zuerst

1. Melde dich auf Gerät A mit dem Testkonto an. Stelle die Sprache auf Deutsch.
2. Lege ein Gebet namens „Wiederherstellungstest A“ mit einem eindeutig
   wiedererkennbaren Text an. Ergänze einen Gebetspunkt mit Bibelreferenz,
   eine Aktualisierung und einen kleinen Anhang.
3. Warte auf die Synchronisierung. Notiere die Inhalte, die nachher wieder
   vorhanden sein müssen. Für einen Gruppen-Test verwende nur eine Testgruppe.
4. Öffne **Einstellungen → Privatsphäre & Sicherheit → Gebetsschutz**.
5. Wähle **„Notfallcode erstellen“**. Klicke im geöffneten Dialog nochmals
   **„Notfallcode erstellen“**, um den Code tatsächlich zu erzeugen.
6. Bewahre den Code getrennt von Gerät A auf, beispielsweise auf Papier.
   Gib den gespeicherten Code in das Eingabefeld ein und klicke
   **„Gespeicherten Code testen“**.

**Bestanden:** Die Wiederherstellungsprüfung ist abgeschlossen und der Code
wird als **„Auf diesem Gerät getestet“** angezeigt. Bei „Überprüfung erforderlich“
oder ausstehender Synchronisierung ist die Einrichtung noch nicht abgeschlossen.

## 4. Wichtigster Test: Gerät verloren, Notfallcode vorhanden

1. Schalte Gerät A aus. Lass dessen Browserdaten unverändert.
2. Öffne die Testadresse auf Gerät B in einem neuen Browserprofil, das das
   Testkonto noch nie benutzt hat. Melde dich mit demselben Testkonto an.
3. Die Anmeldung darf nicht allein die alten verschlüsselten Gebete öffnen.
   Es muss eine Wiederherstellung erforderlich sein.
4. Wähle **„Notfallcode zur Wiederherstellung“**, gegebenenfalls den richtigen
   Code-Eintrag, und gib den separat gespeicherten Code ein.
5. Prüfe das alte Gebet, Text, Aktualisierung, Gebetspunkt/Bibelreferenz und
   Anhang. Öffne den Anhang wirklich. Prüfe gegebenenfalls ältere Gruppeninhalte.

**Bestanden:** Die ursprünglichen Inhalte sind unverändert lesbar, während
Gerät A ausgeschaltet bleibt. Es wurde weder „Neu anfangen“ gewählt noch ein
neues Verschlüsselungspasswort verlangt. Ein leeres Journal ist kein Erfolg.

## 5. Passkey und Geräteentsperrung

1. Schalte Gerät A wieder ein und entsperre deine Testgebete.
2. Öffne den Gebetsschutz und wähle **„Passkey hinzufügen“**. Bestätige die
   Betriebssystemdialoge. Mehrere Bestätigungen während der Einrichtung sind normal.
3. Prüfe, dass die Wiederherstellungsprüfung abgeschlossen wurde.
   „Nicht unterstützt“ oder „Überprüfung erforderlich“ gilt nicht als Erfolg.
4. Unter **„Mit dem Gerät entsperren“** wählst du den Passkey und den getesteten
   Notfallcode. Gib den Code erneut ein und klicke
   **„Geräteentsperrung verwenden“**. Bestätige die Geräteprüfung.
5. Prüfe die Anzeige **„Geräteentsperrung aktiviert“**.

Fingerabdruck, Gesicht oder Geräte-PIN sind zulässige Ergebnisse. Das
Betriebssystem wählt die Methode; ein PIN-Dialog ist kein Fehler.

| Prüfung | Vorgehen | Erwartung |
|---|---|---|
| Neuladen | Seite neu laden, am PC etwa mit F5 | Gebete bleiben bis zur Entsperrung gesperrt |
| Neustart | Tab schließen und Testadresse erneut öffnen | Erneute Geräteentsperrung erforderlich |
| Inaktivität | Sechs Minuten keine Klicks oder Tastatureingaben in Qetoret | Erneute Entsperrung erforderlich |
| Abbrechen | Geräteprüfung öffnen und abbrechen | Gebete bleiben gesperrt; erneuter Versuch möglich |
| Offline | App und Gebete zuvor online laden; Sitzung behalten; alle Internetverbindungen ausschalten, neu laden und „Geräteentsperrung verwenden“ wählen | Auf dem bereits eingerichteten Gerät entsperren und gespeicherte Gebete lesen können |

Für den Offline-Test muss die App bereits zwischengespeichert sein, die Sitzung
noch verfügbar sein und der verwendete Passkey-Anbieter ohne Netz mitmachen.
Nicht abmelden und keine Browserdaten löschen. Eine neue Geräteanmeldung oder
Wiederherstellung auf Gerät B benötigt weiterhin Internet. Auf dem Handy muss
neben WLAN auch Mobilfunk aus sein, etwa im Flugmodus.

Nach Neuladen oder Sperren ist **„Wiederherstellungsprüfung erfasst“** statt
**„Auf diesem Gerät getestet“** normal: Der zweite Text bezeichnet eine Prüfung
in der aktuellen entsperrten Sitzung.

## 6. Passkey auf einem zweiten Gerät prüfen

Nutze auf Gerät B ein weiteres frisches Browserprofil, damit dort nicht bereits
der durch den Notfallcode wiederhergestellte Schlüssel liegt. Gerät A bleibt aus.
Melde dich online an und wähle den Passkey-Eintrag, normalerweise
**„Passkey verwenden“** mit Erstellungsdatum.

**Bestanden:** Die alten Inhalte werden wieder lesbar, ohne Gerät A einzuschalten
oder den Notfallcode zu benutzen. Wenn der Browser einen QR-Code zeigt und Gerät A
zum Bestätigen braucht, ist das kein Nachweis für Wiederherstellung nach Verlust
von Gerät A. Wenn der Passkey-Anbieter diesen Ablauf nicht unterstützt, halte
das Ergebnis fest; der unabhängig getestete Notfallcode bleibt der Rückweg.

## 7. Zwei wichtige Fehlerfälle

- Gib auf einem frischen Profil absichtlich einen falschen Notfallcode ein.
  Die Wiederherstellung muss scheitern. Danach muss der richtige Code weiterhin
  funktionieren; die alten Inhalte dürfen nicht verschwinden.
- Ändere auf Gerät A offline den Titel des Testgebets. Lass die App sperren,
  entsperre sie und ändere anschließend die Beschreibung. Stelle das Netz wieder
  her und prüfe die Synchronisierung. **Beide Änderungen** müssen erhalten bleiben.

Notiere zu jedem Gerät: Gerät/Betriebssystem, Browser, Passkey-Anbieter,
getesteter Ablauf, „bestanden“ oder „fehlgeschlagen“ und genaue Meldung.
Notiere niemals den Notfallcode oder andere Geheimnisse im Fehlerbericht.

Eine erfolgreiche Prüfung gilt zunächst nur für diese getestete Kombination.
Vor der öffentlichen Freischaltung fehlen weiterhin unabhängige Sicherheitsprüfung,
vollständige Supabase-Datenbanktests und die Geräteprüfungen aus
[RECOVERY_RELEASE.md](RECOVERY_RELEASE.md). Der eigene QR-Gerätetransfer ist
noch nicht implementiert und gehört nicht zu diesem Testablauf.
