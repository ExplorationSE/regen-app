# Änderungen

## Version 0.3.1 (19.10.2026)
- **Neue Adresse:** Das Repository heißt jetzt `ExplorationSE/regen-app` (vorher `exse-regen`), damit auch die Adresse kein „ExSE“ mehr enthält. Die App liegt jetzt unter **https://explorationse.github.io/regen-app/**.
- **Die alte Adresse https://explorationse.github.io/exse-regen/ funktioniert nicht mehr** (GitHub Pages leitet nicht weiter, sie liefert „404“). Die unter der alten Adresse installierte App bitte vom Handy entfernen und in Chrome von der neuen Adresse neu installieren (⋮ → „App installieren“). Gespeicherter Standort und Standortfreigabe bleiben erhalten (gleicher Ursprung `explorationse.github.io`).
- Manifest-`id`, `start_url` und `scope` jetzt `/regen-app/` – dadurch ist es für Android eine neue App.
- Dokumentation (README, Änderungsprotokoll) und Homepage-Angabe des Repositorys auf die neue Adresse umgestellt.
- Fußzeile „ExplorationSE Regen · Quelle: Deutscher Wetterdienst · v0.3.1“ – „Version“ zu „v“ gekürzt (wie bei ExplorationSE Aktien), damit die Zeile mit der längeren Versionsnummer bei 360 px einzeilig bleibt.
- SW-Cache regen-v6.

## Version 0.3 (19.10.2026)
- Umbenennung: Die App heißt jetzt **„ExplorationSE Regen“** statt „ExSE Regen“ (Verwechslungsgefahr mit einer gleichnamigen Softwarefirma); die Bezeichnung „ExSE“ wurde aus App, Dokumentation, Code-Kommentaren und Hilfsskripten entfernt. Ältere Einträge in diesem Änderungsprotokoll behalten den damaligen Namen.
- Manifest: Name „ExplorationSE Regen“, Kurzname unter dem Symbol auf dem Startbildschirm „SE Regen“. Seitentitel, `application-name` und `apple-mobile-web-app-title` „ExplorationSE Regen“.
- **Unverändert:** Adresse https://explorationse.github.io/exse-regen/, Manifest-`id`, `start_url` und `scope` (`/exse-regen/`) sowie der Repository-Name – die installierte App bleibt dieselbe, der gespeicherte Standort bleibt erhalten.
- App-Symbol: Schriftzug „S.E.“ statt „ExSE“ (Marcellus, weiß), darunter wie bisher das preußischblaue Radar-Motiv. Alle Größen neu erzeugt (48–512 px, maskable, Apple-Touch-Icon, Favicons) unter neuen Dateinamen (`icons/*-v3-*`, Favicons jetzt `icons/favicon-v3-16.png`/`-32.png`), damit Browser und Android sie frisch laden.
- Fußzeile: „ExplorationSE Regen · Quelle: Deutscher Wetterdienst · Version 0.3“, ab 360 px weiterhin einzeilig.
- Schrift-Teilmenge neu erzeugt (nur die Zeichen „ExplorationSE Regen“) als `site/fonts/explorationse-regen.woff2`, eigener Schriftname „ExplorationSE Regen Subset“ (SIL OFL 1.1, reservierter Name „Marcellus“ nicht verwendet); die alte Datei `marcellus-exse-regen.woff2` entfällt.
- **Hinweis:** Damit Name und Symbol auf dem Startbildschirm wechseln, muss die App unter Umständen einmal entfernt und neu installiert werden (Chrome: ⋮ → „App installieren“).
- SW-Cache regen-v5.
- Außerdem seit 0.2.1 (nur Dokumentation): MIT-Lizenz (`LICENSE`), Hinweise zu Fremdbestandteilen (`THIRD-PARTY-NOTICES.md`) und Abschnitt „Lizenz“ im README.

## Version 0.2.1 (10.10.2026)
- Fehlerbehebung Installation auf Android: Manifest-`id` war „./“ und wurde von Chrome zu `https://explorationse.github.io/` (Ursprung) aufgelöst – keine eindeutige App-Kennung neben „ExSE Aktien“ auf demselben Ursprung. Jetzt `id`, `start_url` und `scope` = `/exse-regen/` (wie bei ExSE Aktien `/aktien-app/`).
- `orientation` „any“ (wie ExSE Aktien), Symbol-Dateinamen neu (`-v2-`), damit Chrome die Symbole frisch lädt.
- README-Formulierung korrigiert. SW-Cache regen-v4.

## Version 0.2 (10.10.2026)
- Zeitleiste in eigener Zeile über die volle Breite (Rand wie die Karte), dicke Spur (12 px), großer Regler (30 px), Berührfläche 44 px hoch, Ziehen ohne Mitscrollen (touch-action: none).
- Vergangenheit grau, Vorhersage preußischblau; Beschriftung −2 h / Jetzt / +2 h darunter.
- Abspielen und „Jetzt“ in einer kompakten Zeile links und rechts der Legende.
- SW-Cache regen-v3.

## Version 0.1 (10.10.2026)
- Erste öffentliche Testversion: DWD-Regenradar mit Animation −2 h bis +2 h im 5-Minuten-Abstand (49 Bilder, nächstliegende zuerst geladen, Wiederverwendung bei Aktualisierung), startet angehalten auf „Jetzt“, Standort, Wert am Standort, Legende, automatische Aktualisierung, RainViewer als Ausweichquelle, App-Symbol im ExSE-Stil, SW-Cache regen-v2.
