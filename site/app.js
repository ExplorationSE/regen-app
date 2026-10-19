// ExplorationSE Regen – Regenradar mit Vorhersage, zentriert auf den Standort
// Daten: Deutscher Wetterdienst (WMS-Layer dwd:Niederschlagsradar, RV-Produkt 1 km, 5-minütig, Analyse + Vorhersage bis +2 h)
// Ausweichquelle außerhalb des DWD-Gebiets: RainViewer (nur Vergangenheit, max. Zoom 7)
import * as maplibregl from './vendor/maplibre-gl.mjs';
const WMS = 'https://maps.dwd.de/geoserver/dwd/wms';
const CAPS = 'https://maps.dwd.de/geoserver/dwd/Niederschlagsradar/ows?service=WMS&version=1.3.0&request=GetCapabilities';
const LAYER = 'dwd:Niederschlagsradar';
const DWD_BOX = { s: 45.7, w: 1.5, n: 56.2, e: 18.7 };       // Abdeckung laut GetCapabilities
const STEP = 5, PAST = 120;                                     // Bildabstand 5 min, 2 h Vergangenheit
const REFRESH = 5 * 60e3, PLAY_MS = 350, END_PAUSE = 1400, OPACITY = 0.78;
const ZOOM = 7.5;                                               // Startzoom am Standort (ca. 120 km Breite)
const DEF = { lat: 51.16, lon: 10.45, z: 6 };                   // Deutschland, falls kein Standort
const $ = id => document.getElementById(id);
const hm = d => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
const num = (v, d = 1) => v.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>';
// DWD-Farbstufen (aus GetLegendGraphic), mm/h
const DWD_LEG = [[.1, '#33ffff'], [.2, '#1acc9a'], [.4, '#019934'], [1, '#4db31b'], [2, '#99cc01'], [3, '#cce601'], [5, '#ffff01'], [7.5, '#ffc401'], [10, '#ff8901'], [15, '#ff4501'], [30, '#fe0000'], [45, '#e5004c'], [75, '#cc0098'], [100, '#6600cb'], [150, '#0000fe']];

const S = { src: 'dwd', frames: [], idx: 0, nowIdx: 0, playing: false, timer: null, ref: null, end: null, pos: null, loadedAt: 0, gen: 0, box: null, ctrl: null, cache: new Map() };

// ---------- Karte (MapLibre GL, Grundkarte OpenFreeMap „Dark“, ohne Schlüssel) ----------
const STYLE = 'https://tiles.openfreemap.org/styles/dark';
const BLANK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const saved = JSON.parse(localStorage.getItem('regen.pos') || 'null');
const map = new maplibregl.Map({
  container: 'map', style: STYLE, center: saved ? [saved.lon, saved.lat] : [DEF.lon, DEF.lat], zoom: saved ? ZOOM : DEF.z,
  minZoom: 4, maxZoom: 12, dragRotate: false, pitchWithRotate: false, touchPitch: false, renderWorldCopies: false,
  attributionControl: { compact: false }, fadeDuration: 0
});
map.touchZoomRotate.disableRotation(); map.keyboard.disableRotation();
map.setMissingStyleImageResolver(id => { if (!map.hasImage(id)) map.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) }); }); // fehlende Symbole im Kartenstil still ersetzen
const mapReady = new Promise(res => map.on('load', () => {
  const firstSymbol = (map.getStyle().layers.find(l => l.type === 'symbol') || {}).id; // Radar unter den Ortsnamen
  map.addSource('radar', { type: 'image', url: BLANK, coordinates: [[0, 1], [1, 1], [1, 0], [0, 0]] });
  map.addLayer({ id: 'radar', type: 'raster', source: 'radar', paint: { 'raster-opacity': OPACITY, 'raster-fade-duration': 0, 'raster-resampling': 'linear' } }, firstSymbol);
  S.firstSymbol = firstSymbol; res();
}));
let shownUrl = null;
function setRadarImage(url, coords) {
  const src = map.getSource('radar'); if (!src) return;
  if (url === shownUrl && !coords) return; shownUrl = url;
  src.updateImage(coords ? { url, coordinates: coords } : { url });
}
const meEl = document.createElement('div'); meEl.className = 'me'; meEl.innerHTML = '<i class="pulse"></i><i></i>';
let meMarker = null;
function setMarker(pos) {
  if (!meMarker) meMarker = new maplibregl.Marker({ element: meEl }).setLngLat([pos.lon, pos.lat]).addTo(map);
  else meMarker.setLngLat([pos.lon, pos.lat]);
}

// ---------- Hilfen ----------
function msg(t) { const m = $('msg'); m.textContent = t || ''; m.style.display = t ? 'block' : 'none'; }
function state(t, cls) { $('stateTxt').textContent = t; $('dot').className = 'dot' + (cls ? ' ' + cls : ''); }
const inDWD = p => p && p.lat > DWD_BOX.s + .3 && p.lat < DWD_BOX.n - .3 && p.lon > DWD_BOX.w + .3 && p.lon < DWD_BOX.e - .3;
const iso = d => d.toISOString().replace(/\.\d{3}Z$/, '.000Z');

// ---------- Standort ----------
function locate(center) {
  return new Promise(res => {
    if (!navigator.geolocation) { $('here').textContent = 'Standort nicht verfügbar'; return res(null); }
    navigator.geolocation.getCurrentPosition(p => {
      const pos = { lat: p.coords.latitude, lon: p.coords.longitude };
      S.pos = pos; localStorage.setItem('regen.pos', JSON.stringify(pos));
      setMarker(pos);
      if (center) map.jumpTo({ center: [pos.lon, pos.lat], zoom: Math.max(map.getZoom(), ZOOM) });
      res(pos);
    }, err => {
      if (saved && !S.pos) { S.pos = saved; setMarker(saved); }
      $('here').textContent = err.code === 1 ? 'Standortfreigabe fehlt – bitte in Chrome erlauben' : 'Standort derzeit nicht ermittelbar';
      res(S.pos);
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 120000 });
  });
}

// ---------- Zeitleiste ----------
function buildTicks() {
  const n = S.frames.length - 1, t = $('ticks'); t.innerHTML = '';
  if (n < 1) return;
  const marks = [[0, labelRel(S.frames[0])], [S.nowIdx, 'Jetzt'], [n, labelRel(S.frames[n])]];
  for (const [i, txt] of marks) {
    if (i !== S.nowIdx && Math.abs(i - S.nowIdx) < 2) continue;
    const s = document.createElement('span'); s.textContent = txt; s.style.left = (i / n * 100) + '%';
    if (i === S.nowIdx) s.className = 'now'; else if (i === 0) s.style.transform = 'none'; else if (i === n) s.style.transform = 'translateX(-100%)';
    t.appendChild(s);
  }
  const p = S.nowIdx / n * 100; // Vergangenheit grau, Vorhersage preußischblau
  $('slider').style.setProperty('--trk', `linear-gradient(90deg,#30363d 0 ${p}%,#1f5f8b ${p}% 100%)`);
  $('slider').max = n;
}
function labelRel(f) {
  const m = Math.round((f.t - S.ref) / 60e3);
  if (m === 0) return 'Jetzt';
  const a = Math.abs(m), s = m < 0 ? '−' : '+';
  return a % 60 === 0 ? `${s}${a / 60} h` : a > 60 ? `${s}${Math.floor(a / 60)} h ${a % 60} min` : `${s}${a} min`;
}
function showFrame(i) {
  if (!S.frames.length) return;
  S.idx = Math.max(0, Math.min(S.frames.length - 1, i));
  const f = S.frames[S.idx];
  $('slider').value = S.idx;
  $('frameTime').textContent = hm(f.t) + ' Uhr';
  const k = $('frameKind'), rel = labelRel(f);
  if (f.t > S.ref) { k.textContent = 'Vorhersage ' + rel; k.className = 'fc'; }
  else { k.textContent = rel === 'Jetzt' ? 'Radar · aktuell' : 'Radar ' + rel; k.className = ''; }
  if (S.src === 'dwd') { if (f.url) setRadarImage(f.url); }
  else S.rvLayers.forEach((id, j) => map.setPaintProperty(id, 'raster-opacity', j === S.idx ? OPACITY : 0));
}
function setPlaying(on) {
  S.playing = on; clearTimeout(S.timer);
  $('play').innerHTML = on ? ICON_PAUSE : ICON_PLAY; $('play').title = on ? 'Anhalten' : 'Abspielen';
  if (on) tick(true);
}
function tick(first) {
  if (!S.playing) return;
  let next = first && S.idx >= S.frames.length - 1 ? 0 : S.idx + 1;
  if (!first) {
    if (next >= S.frames.length) next = 0;
    let guard = 0; while (S.src === 'dwd' && !S.frames[next].url && guard++ < S.frames.length) next = (next + 1) % S.frames.length;
    showFrame(next);
  } else showFrame(first && S.idx >= S.frames.length - 1 ? 0 : S.idx);
  S.timer = setTimeout(() => tick(false), S.idx === S.frames.length - 1 ? END_PAUSE : S.idx === S.nowIdx ? PLAY_MS * 2 : PLAY_MS);
}

// ---------- DWD ----------
async function dwdTimes() {
  const r = await fetch(CAPS + '&_=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('Capabilities ' + r.status);
  const x = new DOMParser().parseFromString(await r.text(), 'text/xml');
  let ref = null, end = null;
  for (const d of x.getElementsByTagName('Dimension')) {
    const n = d.getAttribute('name');
    if (n === 'REFERENCE_TIME') ref = new Date(d.getAttribute('default'));
    if (n === 'time') { const p = d.textContent.trim().split('/'); if (p.length >= 2) end = new Date(p[1]); }
  }
  if (!ref || isNaN(ref)) throw new Error('Keine Referenzzeit');
  if (!end || isNaN(end) || end < ref) end = ref;
  return { ref, end };
}
const RM = 6378137, mx = lon => RM * lon * Math.PI / 180, my = lat => RM * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
const ilon = x => x / RM * 180 / Math.PI, ilat = y => (2 * Math.atan(Math.exp(y / RM)) - Math.PI / 2) * 180 / Math.PI;
function viewBox() {
  // Bildausschnitt in EPSG:3857: sichtbarer Bereich plus 50 % Rand je Seite, damit Verschieben ohne Nachladen geht
  const b = map.getBounds(), c = map.getContainer();
  const x0 = mx(b.getWest()), x1 = mx(b.getEast()), y0 = my(b.getSouth()), y1 = my(b.getNorth());
  const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, X0 = Math.round(x0 - dx), X1 = Math.round(x1 + dx), Y0 = Math.round(y0 - dy), Y1 = Math.round(y1 + dy);
  const w = c.clientWidth * 2, h = c.clientHeight * 2, scale = Math.min(1, 1600 / Math.max(w, h)); // Obergrenze für die Bildgröße
  const W = ilon(X0), E = ilon(X1), N = ilat(Y1), Sd = ilat(Y0);
  return { z: map.getZoom(), ext: { W, E, N, S: Sd }, coords: [[W, N], [E, N], [E, Sd], [W, Sd]], bbox: [X0, Y0, X1, Y1].join(','), W: Math.round(w * scale), H: Math.round(h * scale) };
}
function frameUrl(f, box) {
  const q = new URLSearchParams({ SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetMap', FORMAT: 'image/png', TRANSPARENT: 'true', LAYERS: LAYER, STYLES: '', CRS: 'EPSG:3857', BBOX: box.bbox, WIDTH: box.W, HEIGHT: box.H, TIME: iso(f.t) });
  if (f.t > S.ref) q.set('REFERENCE_TIME', iso(S.ref)); // Vorhersage aus dem aktuellsten Lauf
  return WMS + '?' + q;
}
async function loadImages() {
  // lädt alle Bilder für den aktuellen Ausschnitt, zuerst „Jetzt“, dann nach außen
  const gen = ++S.gen; if (S.ctrl) S.ctrl.abort(); const ctrl = S.ctrl = new AbortController();
  const box = S.box = viewBox(); let placed = false;
  // Bereits geladene Bilder (gleicher Ausschnitt, gleiche Zeit, gleicher Lauf) wiederverwenden, Rest freigeben
  const key = f => box.bbox + '|' + box.W + 'x' + box.H + '|' + iso(f.t) + (f.t > S.ref ? '|' + iso(S.ref) : '');
  const keep = new Map();
  S.frames.forEach(f => { f.key = key(f); const u = S.cache.get(f.key); f.url = u || null; if (u) keep.set(f.key, u); });
  S.cache.forEach((u, k) => { if (!keep.has(k)) URL.revokeObjectURL(u); }); S.cache = keep;
  const order = S.frames.map((f, i) => i).filter(i => !S.frames[i].url).sort((a, b) => Math.abs(a - S.nowIdx) - Math.abs(b - S.nowIdx) || b - a);
  if (order.includes(S.idx) && order[0] !== S.idx) { order.splice(order.indexOf(S.idx), 1); order.unshift(S.idx); }
  let done = S.frames.filter(f => f.url).length, fail = 0;
  if (S.frames[S.idx].url) { placed = true; setRadarImage(S.frames[S.idx].url, box.coords); }
  const one = async i => {
    const f = S.frames[i];
    for (let a = 0; a < 2; a++) {
      try {
        const r = await fetch(frameUrl(f, box), { signal: ctrl.signal });
        if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image/')) throw new Error('kein Bild');
        const blob = await r.blob(); if (gen !== S.gen) return;
        f.url = URL.createObjectURL(blob); S.cache.set(f.key, f.url); done++;
        if (!placed && i === S.idx) { placed = true; setRadarImage(f.url, box.coords); showFrame(S.idx); }
        if (done + fail < S.frames.length) state(`Lade Radarbilder … ${done}/${S.frames.length}`);
        return;
      } catch (e) { if (ctrl.signal.aborted) return; }
    }
    fail++;
  };
  const queue = order.slice(), workers = Array.from({ length: 6 }, async () => { while (queue.length && gen === S.gen) await one(queue.shift()); });
  await Promise.all(workers);
  if (gen !== S.gen) return;
  if (!done) throw new Error('Keine Radarbilder');
  if (!placed) { const f = S.frames.find(x => x.url); setRadarImage(f.url, box.coords); }
  showFrame(S.idx); stateOk(fail);
}
function stateOk(fail) {
  const age = (Date.now() - S.ref) / 60e3;
  const t = S.src === 'dwd' ? `Stand ${hm(S.ref)} Uhr · Vorhersage bis ${hm(S.end)} Uhr` : `Stand ${hm(S.ref)} Uhr · RainViewer, letzte 2 h`;
  if (age > 30) state(`${t} · Daten verzögert`, 'warn'); else state(fail ? `${t} · ${fail} Bilder fehlen` : t, 'live');
}
async function pointForecast(pos) {
  // Niederschlag am Standort als Zeitreihe (ein GetFeatureInfo-Aufruf für „Jetzt“ bis Vorhersageende)
  if (!pos || !inDWD(pos)) return;
  const d = .01, q = new URLSearchParams({ SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetFeatureInfo', LAYERS: LAYER, QUERY_LAYERS: LAYER, STYLES: '', CRS: 'EPSG:4326',
    BBOX: [pos.lat - d, pos.lon - d, pos.lat + d, pos.lon + d].join(','), WIDTH: 3, HEIGHT: 3, I: 1, J: 1, INFO_FORMAT: 'application/json', FEATURE_COUNT: 60,
    TIME: iso(S.ref) + '/' + iso(S.end), REFERENCE_TIME: iso(S.ref) });
  try {
    const j = await (await fetch(WMS + '?' + q, { cache: 'no-store' })).json();
    const s = (j.features || []).map(f => ({ t: new Date(f.properties.TIME), v: +f.properties.RV_ANALYSIS * 12 })) // RV-Werte sind mm je 5 min → mm/h.filter(x => isFinite(x.v) && x.v < 5000).sort((a, b) => a.t - b.t);
    if (!s.length) { $('here').textContent = 'Am Standort: keine Radardaten'; return; }
    const wet = x => x.v >= .1, word = v => v < 2.5 ? 'leichter Regen' : v < 10 ? 'mäßiger Regen' : 'starker Regen';
    const now = s[0], last = s[s.length - 1];
    let html;
    if (wet(now)) {
      const dry = s.find(x => !wet(x)), mx = Math.max(...s.filter(x => !dry || x.t < dry.t).map(x => x.v));
      html = `Am Standort: <b>${word(now.v)}</b> (${num(now.v)} mm/h)` + (dry ? ` · trocken ab ca. ${hm(dry.t)} Uhr` : ` · hält bis mind. ${hm(last.t)} Uhr an`);
      if (mx >= 2 * now.v && mx >= 2.5) html += ` · bis ${num(mx)} mm/h`;
    } else {
      const w = s.find(wet);
      html = w ? `Am Standort: trocken · <b>Regen ab ca. ${hm(w.t)} Uhr</b> (${num(Math.max(...s.filter(x => x.t >= w.t && x.t < +w.t + 30 * 60e3).map(x => x.v)))} mm/h)`
               : `Am Standort: <b>trocken</b> bis mind. ${hm(last.t)} Uhr`;
    }
    $('here').innerHTML = html;
  } catch (e) { $('here').textContent = 'Am Standort: Vorhersage derzeit nicht abrufbar'; }
}
async function loadDWD() {
  const { ref, end } = await dwdTimes();
  const keepFuture = S.src === 'dwd' && S.ref && S.idx > S.nowIdx;
  const rel = S.frames.length ? S.idx - S.nowIdx : 0;
  if (S.rvLayers) { S.rvLayers.forEach(id => { map.removeLayer(id); map.removeSource(id); }); S.rvLayers = null; }
  map.setLayoutProperty('radar', 'visibility', 'visible');
  S.ref = ref; S.end = end; S.src = 'dwd';
  const fr = [];
  for (let t = +ref - PAST * 60e3; t <= +end; t += STEP * 60e3) fr.push({ t: new Date(t), url: null });
  S.frames = fr; S.nowIdx = fr.findIndex(f => +f.t === +ref);
  S.idx = keepFuture || S.playing ? Math.min(fr.length - 1, Math.max(0, S.nowIdx + rel)) : S.nowIdx;
  buildTicks(); showFrame(S.idx);
  setLegend('dwd');
  $('src').innerHTML = 'Quelle: <a href="https://www.dwd.de" target="_blank" rel="noopener">Deutscher Wetterdienst</a>';
  await Promise.all([loadImages(), pointForecast(S.pos)]);
}

// ---------- RainViewer (außerhalb Deutschlands / Ausfall DWD) ----------
async function loadRV() {
  const j = await (await fetch('https://api.rainviewer.com/public/weather-maps.json', { cache: 'no-store' })).json();
  const past = (j.radar && j.radar.past) || [], nc = (j.radar && j.radar.nowcast) || [];
  if (!past.length) throw new Error('RainViewer leer');
  (S.rvLayers || []).forEach(id => { map.removeLayer(id); map.removeSource(id); });
  setRadarImage(BLANK); map.setLayoutProperty('radar', 'visibility', 'none');
  const all = past.concat(nc);
  S.src = 'rv'; S.ref = new Date(past[past.length - 1].time * 1000); S.end = new Date(all[all.length - 1].time * 1000);
  S.frames = all.map(f => ({ t: new Date(f.time * 1000) })); S.nowIdx = past.length - 1; S.idx = S.nowIdx;
  S.rvLayers = all.map((f, i) => {
    const id = 'rv' + i;
    map.addSource(id, { type: 'raster', tiles: [j.host + f.path + '/256/{z}/{x}/{y}/2/1_1.png'], tileSize: 256, maxzoom: 7, attribution: '<a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>' });
    map.addLayer({ id, type: 'raster', source: id, paint: { 'raster-opacity': 0, 'raster-fade-duration': 0 } }, S.firstSymbol);
    return id;
  });
  buildTicks(); showFrame(S.idx); setLegend('rv');
  $('src').innerHTML = 'Quelle: <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>';
  $('here').textContent = 'Außerhalb des DWD-Gebiets: Radar ohne Vorhersage';
  stateOk(0);
}

// ---------- Legende ----------
function setLegend(src) {
  const el = $('legend');
  if (src === 'rv') { el.innerHTML = '<div class="lbar" style="background:linear-gradient(90deg,#726e61,#88ddee,#0099cc,#0077aa,#005588,#ffee00,#ffaa00,#ff4400,#c10000,#ffaaff)"></div><div class="llab"><span>schwach</span><span class="end" style="left:100%">stark</span></div>'; return; }
  const n = DWD_LEG.length;
  el.innerHTML = '<div class="lbar">' + DWD_LEG.map(([, c]) => `<i style="background:${c}"></i>`).join('') + '</div><div class="llab">' +
    [[0, '0,1'], [3, '1'], [6, '5'], [9, '15'], [11, '45'], [n, '150 mm/h']].map(([i, t]) => `<span${i === n ? ' class="end"' : ''} style="left:${i / n * 100}%">${t}</span>`).join('') + '</div>';
}

// ---------- Ablauf ----------
let busy = false;
async function refresh(relocate) {
  if (busy) return; busy = true;
  try {
    if (relocate || !S.pos) await locate(!S.loadedAt);
    await mapReady;
    const useDWD = !S.pos || inDWD(S.pos);
    if (useDWD) {
      try { await loadDWD(); }
      catch (e) { console.warn('DWD', e); msg('DWD nicht erreichbar – zeige RainViewer'); setTimeout(() => msg(''), 4000); await loadRV(); }
    } else await loadRV();
    S.loadedAt = Date.now();
  } catch (e) { console.error(e); state('Radardaten derzeit nicht abrufbar – neuer Versuch in Kürze', 'warn'); }
  finally { busy = false; }
}
let moveT = null;
map.on('moveend', () => {
  if (S.src !== 'dwd' || !S.box || busy) return;
  clearTimeout(moveT);
  moveT = setTimeout(() => {
    const b = map.getBounds(), e = S.box.ext;
    const inside = b.getWest() >= e.W && b.getEast() <= e.E && b.getNorth() <= e.N && b.getSouth() >= e.S;
    if (Math.abs(map.getZoom() - S.box.z) >= 1 || !inside) loadImages().catch(() => {});
  }, 350);
});
$('slider').addEventListener('input', e => { setPlaying(false); showFrame(+e.target.value); });
$('play').addEventListener('click', () => setPlaying(!S.playing));
$('nowBtn').addEventListener('click', () => { setPlaying(false); showFrame(S.nowIdx); });
$('locBtn').addEventListener('click', async () => { const p = await locate(true); if (p) { if (!S.pos || inDWD(p) !== (S.src === 'dwd')) refresh(false); else pointForecast(p); } });
setInterval(() => { if (!document.hidden && Date.now() - S.loadedAt >= REFRESH) refresh(true); }, 30e3);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - S.loadedAt >= 2 * 60e3) refresh(true); });
window.S = S; window.showFrame = showFrame; window.refresh = refresh; // für Tests
setPlaying(false); setLegend('dwd'); refresh(true);
