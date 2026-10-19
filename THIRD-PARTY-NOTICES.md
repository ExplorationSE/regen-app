# Hinweise zu Fremdbestandteilen

Der eigene Code von ExplorationSE Regen steht unter der MIT-Lizenz (siehe [LICENSE](LICENSE)). Die folgenden Bestandteile stammen von Dritten und unterliegen ihren eigenen Lizenzen bzw. Nutzungsbedingungen. Es werden keine Bibliotheken über ein CDN nachgeladen; MapLibre liegt lokal in `site/vendor/`. Kartenstil, Kacheln und Radardaten werden zur Laufzeit von den unten genannten Diensten geladen.

## Mitgelieferte Software und Schriften

| Bestandteil | Datei | Lizenz | Hinweise |
|---|---|---|---|
| MapLibre GL JS 6.13.0, © 2023 MapLibre contributors | `site/vendor/maplibre-gl.mjs`, `maplibre-gl-worker.mjs`, `maplibre-gl.css` | BSD-3-Clause | Volltext inkl. enthaltener Fremdteile: `site/vendor/MAPLIBRE-LICENSE.txt` |
| darin enthalten: Mapbox GL JS (bis v1.13), glfx.js (© 2011 Evan Wallace), d3-color (© 2010–2016 Mike Bostock) u. a. | in MapLibre eingebunden | BSD-3-Clause, MIT, ISC (siehe `MAPLIBRE-LICENSE.txt`) | |
| Schrift Marcellus, © 2012 Brian J. Bonislawsky DBA Astigmatic (AOETI) | `site/fonts/explorationse-regen.woff2` (Teilmenge „ExplorationSE Regen“) | SIL Open Font License 1.1 | Lizenztext: `site/fonts/OFL.txt`; veränderte Fassung unter eigenem Namen „ExplorationSE Regen Subset“ (siehe `site/fonts/LIESMICH.txt`) |

## Karten- und Wetterdaten (nicht von der MIT-Lizenz erfasst)

| Quelle | Verwendung | Bedingungen |
|---|---|---|
| Deutscher Wetterdienst (`maps.dwd.de` GeoServer/WMS) | Radar, Niederschlagsvorhersage, Wert am Standort | GeoNutzV bzw. CC BY 4.0; Quellenvermerk „Quelle: Deutscher Wetterdienst“ (in der Fußzeile) |
| RainViewer (`api.rainviewer.com`) | Radar außerhalb Deutschlands | nur private/Bildungsnutzung, Nennung mit Link (auf der Karte und in der Fußzeile) |
| OpenFreeMap, Stil „Dark“ (`tiles.openfreemap.org`) | Grundkarte | Nennung „OpenFreeMap © OpenMapTiles Data from OpenStreetMap“ (unten rechts auf der Karte) |
| OpenMapTiles-Schema | Kachelschema der Grundkarte | CC BY 4.0 / BSD-3-Clause, Nennung über die Kartenattribution |
| OpenStreetMap-Mitwirkende | Kartendaten | Open Database License (ODbL) 1.0, Nennung „© OpenStreetMap“ (Kartenattribution) |
