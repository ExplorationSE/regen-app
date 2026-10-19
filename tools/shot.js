// Test in Headless-Chromium: 412x915 (bzw. Argumente), Standort Berlin simuliert
const { chromium } = require('/workspace/shot/node_modules/playwright');
const [W, H, out, lat, lon] = [+(process.argv[2] || 412), +(process.argv[3] || 915), process.argv[4] || __dirname + '/../screenshot.png', +(process.argv[5] || 52.52), +(process.argv[6] || 13.405)];
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-DE', timezoneId: 'Europe/Berlin', ...(process.argv[7] === 'deny' ? {} : { geolocation: { latitude: lat, longitude: lon }, permissions: ['geolocation'] }) });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
  const t0 = Date.now();
  await p.goto((process.env.URL || 'http://localhost:8091/'), { waitUntil: 'load' });
  await p.waitForFunction(() => window.S && S.frames.length && S.frames[S.nowIdx].url, null, { timeout: 120000 }).catch(() => {});
  console.log('erstes Radarbild nach', Date.now() - t0, 'ms');
  await p.waitForFunction(() => /Stand|nicht/.test(document.getElementById('stateTxt').textContent) && !/Lade/.test(document.getElementById('stateTxt').textContent), null, { timeout: 120000 });
  console.log('geladen nach', Date.now() - t0, 'ms');
  await p.waitForTimeout(2500);
  const info = () => p.evaluate(() => ({ time: frameTime.textContent, kind: frameKind.textContent, here: here.textContent, state: stateTxt.textContent, foot: document.querySelector('footer').textContent, scroll: [document.documentElement.scrollHeight, innerHeight], loaded: (window.S || {}).frames ? null : null }));
  console.log(JSON.stringify(await info()));
  console.log('Frames:', await p.evaluate(() => S.frames.length + ' gesamt, ' + S.frames.filter(f => f.url).length + ' geladen, jetzt=' + S.nowIdx));
  await p.screenshot({ path: out });
  if (process.argv[7] === 'more') {
    const t1 = Date.now(); await p.evaluate(() => { S.loadedAt = 0; }); await p.waitForTimeout(100);
    await p.evaluate(() => showFrame(S.frames.length - 1)); await p.waitForTimeout(500);
    console.log(JSON.stringify(await info())); await p.screenshot({ path: out.replace('.png', '-vorhersage.png') });
    await p.click('#play'); await p.waitForTimeout(2000); console.log('play ->', await p.evaluate(() => S.idx + ' ' + S.playing)); await p.click('#play');
  }
  console.log('Fehler:', errs); await b.close();
})();
