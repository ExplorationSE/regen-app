# ExplorationSE Regen

**Aktuelle Version:** 0.3.1 (19.10.2026) – siehe [CHANGELOG.md](CHANGELOG.md)  
**Live:** https://explorationse.github.io/regen-app/

Regenradar als Web-App (PWA) für das Android-Handy (Chrome): aktuelle Regenkarte, zentriert auf den eigenen Standort, mit Animation der letzten 2 Stunden und Vorhersage für die nächsten 2 Stunden.

## Funktionen
- Regenkarte des **Deutschen Wetterdienstes** (WMS-Layer `dwd:Niederschlagsradar`, RV-Produkt, 1 km, alle 5 Minuten), Bildabstand 5 Minuten von −2 h bis +2 h (49 Bilder, nächstliegende zuerst geladen, bereits geladene Bilder werden bei der Aktualisierung wiederverwendet)
- Standort per GPS mit Markierung, Knopf zum Zentrieren; letzter Standort wird gespeichert
- Zeile „Am Standort“: trocken / leichter, mäßiger, starker Regen, „Regen ab ca. …“ bzw. „trocken ab ca. …“ (DWD GetFeatureInfo, Zeitreihe am Standort)
- Zeitleiste über die volle Breite mit großem Regler (gut mit dem Finger zu ziehen), Abspielen/Anhalten links und Knopf „Jetzt“ rechts neben der Legende, Anzeige „Stand“ (Zeit des letzten Radarbilds)
- Automatische Aktualisierung alle 5 Minuten und beim Zurückkehren in die App
- Legende in mm/h (Farbstufen des DWD)
- Außerhalb des DWD-Gebiets oder bei DWD-Ausfall: RainViewer (nur Vergangenheit, ohne Vorhersage)
- Seite scrollt nicht (getestet 360×800 und 412×915)
- Fußzeile „ExplorationSE Regen · Quelle: Deutscher Wetterdienst · v…“ (Versionsnummer kurz „v“ wie bei ExplorationSE Aktien), Name in der Schrift Marcellus wie im App-Symbol „S.E.“, ab 360 px einzeilig

## Datenquellen und Lizenzen
| Quelle | Verwendung | Bedingungen |
|---|---|---|
| Deutscher Wetterdienst, `https://maps.dwd.de/geoserver/dwd/wms` | Radarbilder, Vorhersage, Wert am Standort | frei, ohne Schlüssel; GeoNutzV bzw. CC BY 4.0, Quellenvermerk „Quelle: Deutscher Wetterdienst“ (in der Fußzeile) |
| OpenFreeMap „Dark“ (`tiles.openfreemap.org`) | Grundkarte (Vektorkacheln) | frei, ohne Schlüssel; Nennung „OpenFreeMap © OpenMapTiles Data from OpenStreetMap“ (unten rechts auf der Karte) |
| RainViewer (`api.rainviewer.com/public/weather-maps.json`) | Ausweichquelle außerhalb Deutschlands | nur private/Bildungsnutzung, max. Zoom 7, 100 Anfragen/min je IP, keine Vorhersage (seit 01.01.2026); Nennung mit Link |
| MapLibre GL JS 6.13.0 | Kartendarstellung | BSD-3-Clause, `site/vendor/MAPLIBRE-LICENSE.txt` |
| Marcellus (Teilmenge „ExplorationSE Regen“) | Name in der Fußzeile | SIL OFL 1.1, `site/fonts/` |

Hinweis: Die früher übliche CARTO-Grundkarte (`basemaps.cartocdn.com`) liefert seit 25.09.2026 ohne API-Schlüssel nur noch den Hinweis „API KEY REQUIRED“ und wird deshalb nicht verwendet.

## Lizenz

- **Eigener Code:** MIT-Lizenz, © 2026 Stefan Eilers – siehe [LICENSE](LICENSE).
- **Fremdbestandteile** (MapLibre GL JS, BSD-3-Clause; Schrift Marcellus, SIL OFL 1.1): siehe [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
- **Daten** von Deutschem Wetterdienst, RainViewer, OpenFreeMap/OpenMapTiles und OpenStreetMap (ODbL) fallen **nicht** unter die MIT-Lizenz und unterliegen weiterhin den Bedingungen der jeweiligen Anbieter.

## Aufbau
```
site/            # statische Web-App (wird auf GitHub Pages veröffentlicht)
  index.html, app.js, sw.js, manifest.webmanifest
  icons/         # PNG-Symbole (Dateinamen -v3-) 48–512 px, separate maskable-Symbole, Apple-Touch-Icon, Favicons
  fonts/         # Marcellus-Teilmenge (OFL)
  vendor/        # MapLibre GL JS (selbst gehostet)
tools/
  make-icon.py   # erzeugt site/icon.svg (Schriftzug „S.E.“ als Pfade)
  render-icons.js# rendert die PNG-Symbole und icon-preview.png
  shot.js        # Test in Headless-Chromium mit simuliertem Standort
```

## Lokal testen
```
cd site && python3 -m http.server 8091
node tools/shot.js 412 915 screenshot.png 52.52 13.405 more
```

## Installation auf dem Handy
In Chrome https://explorationse.github.io/regen-app/ öffnen, Standort erlauben, dann Menü ⋮ → „Zum Startbildschirm hinzufügen“ bzw. „App installieren“. Auf dem Startbildschirm heißt die App „SE Regen“ (voller Name „ExplorationSE Regen“ in der App-Übersicht).

**Hinweis zu Version 0.3:** Mit 0.3 haben sich Name („ExplorationSE Regen“ statt „ExSE Regen“) und Symbol („S.E.“) geändert. Zeigt der Startbildschirm noch den alten Namen oder das alte Symbol, die App entfernen und über Chrome neu installieren.

**Hinweis zu Version 0.3.1 – neue Adresse:** Seit 0.3.1 liegt die App unter https://explorationse.github.io/regen-app/ (Repository `ExplorationSE/regen-app`, vorher `exse-regen`). Die alte Adresse https://explorationse.github.io/exse-regen/ funktioniert nicht mehr. Eine unter der alten Adresse installierte App bitte entfernen und von der neuen Adresse neu installieren. Gespeicherter Standort und Standortfreigabe bleiben erhalten, weil beide Adressen auf demselben Ursprung `explorationse.github.io` liegen.

## Veröffentlichung
GitHub Pages über den Workflow `.github/workflows/pages.yml` (veröffentlicht den Ordner `site/` bei jedem Push auf `main`).

## Hinweis zur Installation (Manifest)
`id`, `start_url` und `scope` sind absolut auf `/regen-app/` gesetzt (bis 0.3: `/exse-regen/`). Beide Apps (ExplorationSE Aktien und ExplorationSE Regen) liegen auf demselben Ursprung `explorationse.github.io`; eine relative `id` („./“) wird laut Spezifikation relativ zum Ursprung aufgelöst und ergab `https://explorationse.github.io/` – das ist keine eindeutige App-Kennung und hat in Version 0.1/0.2 die Installation auf Android verhindert.
