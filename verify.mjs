import { chromium } from 'playwright';

const URL = process.env.TARGET || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const results = {};

/* ---------- DESKTOP: scroll integrity ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // A) Does the page ever move the scroll position by itself?
  const selfScroll = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = [];
    for (const y of [400, 1400, 2600, 4200]) {
      window.scrollTo(0, y);
      await sleep(500);
      const start = window.scrollY;
      await sleep(1800); // sit completely still, well past the old 150ms snap timer
      out.push({ parkedAt: y, settled: start, after: window.scrollY, moved: Math.round(window.scrollY - start) });
    }
    return out;
  });

  // B) Slow creep with real wheel events: does the animation ever run backwards
  //    while the user is scrolling forwards?
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.mouse.move(720, 450);
  const samples = [];
  for (let i = 0; i < 90; i++) {
    await page.mouse.wheel(0, 18); // deliberately slow
    await page.waitForTimeout(85);
    samples.push(await page.evaluate(() => ({ y: window.scrollY, p: window.APEROL_P })));
  }
  let backwards = 0, maxBack = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].y > samples[i - 1].y && samples[i].p < samples[i - 1].p - 1e-4) {
      backwards++;
      maxBack = Math.max(maxBack, samples[i - 1].p - samples[i].p);
    }
  }

  // C) Idle drift of a parallax element while stationary mid-sequence.
  const drift = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const ice = document.querySelector('#s1 [id="ice 1"]');
    const read = () => {
      const m = (ice.getAttribute('transform') || '').match(/translate\(([-\d.]+),([-\d.]+)\)/);
      return m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0];
    };
    const out = [];
    for (const y of [1200, 2200, 3200]) {
      window.scrollTo(0, y);
      await sleep(1400); // let the scrub settle first
      const s = [];
      for (let i = 0; i < 18; i++) { s.push(read()); await sleep(100); }
      out.push({
        y,
        xDrift: +(Math.max(...s.map((v) => v[0])) - Math.min(...s.map((v) => v[0]))).toFixed(2),
        yDrift: +(Math.max(...s.map((v) => v[1])) - Math.min(...s.map((v) => v[1]))).toFixed(2),
      });
    }
    return out;
  });

  // D) Pin integrity: does the pinned block stay put through the section?
  const pin = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const p = document.querySelector('#s1 .pin');
    const track = document.querySelector('#s1 .track');
    const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 68;
    const h = track.offsetHeight;
    const tops = [];
    for (let f = 0.15; f <= 0.85; f += 0.05) {
      window.scrollTo(0, Math.round(h * f));
      await sleep(220);
      tops.push(Math.round(p.getBoundingClientRect().top));
    }
    return { nav, spread: Math.max(...tops) - Math.min(...tops), tops };
  });

  results.desktop = { selfScroll, slowWheel: { samples: samples.length, backwards, maxBack: +maxBack.toFixed(4) }, drift, pin, errs: errs.slice(0, 10) };
  await ctx.close();
}

/* ---------- MOBILE: no pinning anywhere, controls usable ---------- */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const m = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // no element should be sticky/fixed-pinned inside a track
    const pins = [...document.querySelectorAll('.pin')].map((p) => getComputedStyle(p).position);
    const selfScrollStart = (window.scrollTo(0, 1500), await sleep(500), window.scrollY);
    await sleep(1800);
    const selfScrollEnd = window.scrollY;
    return {
      pinPositions: pins,
      trackHeights: [...document.querySelectorAll('.track')].map((t) => t.offsetHeight),
      docScreens: +(document.documentElement.scrollHeight / innerHeight).toFixed(2),
      selfScrollMoved: Math.round(selfScrollEnd - selfScrollStart),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  // Tap targets on the controls
  await page.evaluate(() => document.getElementById('s2').scrollIntoView());
  await page.waitForTimeout(1200);
  const targets = await page.evaluate(() => {
    const small = [];
    document.querySelectorAll('#s2 button, #s2 input[type=range], #nav a').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && r.height < 44) small.push({ el: el.id || el.className || el.tagName, h: Math.round(r.height) });
    });
    return small;
  });

  // The sense rows must respond to a dial, and the touch tooltip must open.
  const modes = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const vals = () =>
      [...document.querySelectorAll('#senselist .srow2')].map((x) => x.querySelector('em').textContent);
    document.getElementById('s2').scrollIntoView({ block: 'start' });
    await sleep(800);
    const before = vals().join(',');
    const inp = document.querySelector('input[data-d="sweeter"]');
    inp.value = 150;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(500);
    const after = vals().join(',');
    document.getElementById('dialreset').click();
    await sleep(500);
    const reset = vals().join(',');
    const mineFills = (() => {
      const i2 = document.querySelector('input[data-d="colder"]');
      i2.value = 150; i2.dispatchEvent(new Event('input', { bubbles: true }));
      const filled = [...document.querySelectorAll('#s5 .gcell.mine')].every(c => c.textContent.trim() !== '\u2014');
      i2.value = 100; i2.dispatchEvent(new Event('input', { bubbles: true }));
      return filled;
    })();

    // touch tooltip
    const tip = document.getElementById('tip');
    const row = document.querySelector('#senselist .srow2');
    row.scrollIntoView({ block: 'center' });
    await sleep(300);
    row.click();
    await sleep(350);
    const tipOpened = tip.classList.contains('on') && getComputedStyle(tip).display !== 'none';
    document.body.click();
    await sleep(300);
    const tipClosed = !tip.classList.contains('on');

    return {
      dialCount: document.querySelectorAll('#s2 .dial').length,
      senseRowsRespondToDial: before !== after,
      resetRestoresDefaults: reset === before,
      stepFigures: document.querySelectorAll('#s1 .stepfig').length,
      mineColumnFills: mineFills,
      tipOpened,
      tipClosed,
      modeToggleGone: !document.getElementById('mode-adv'),
      glassCount: document.querySelectorAll('#s5 .vsgrid .glass').length,
      comparisonCells: document.querySelectorAll('#s5 .gcell').length,
      badgeRemoved: getComputedStyle(document.querySelector('#minehead .dname'), '::after').content === 'none',
      s5ScrollsSideways: (() => { const sc = document.querySelector('#s5 .vsscroll'); return sc ? sc.scrollWidth > sc.clientWidth : false; })(),
      masksInDoc: document.querySelectorAll('mask').length,
      // Layout assertions. These exist because appending a desktop rule after
      // the mobile media query silently reverted the phone layout twice.
      chartRowSingleColumn:
        getComputedStyle(document.querySelector('#s2 .s2chartrow')).gridTemplateColumns.split(' ').length === 1,
      // The three glasses must be the same size and stand on the same line.
      glassGeometry: (() => {
        const gs = [...document.querySelectorAll('#s5 .vsgrid .glass')];
        const m = gs.map((g) => {
          const svg = g.querySelector('svg');
          const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
          const box = svg.getBoundingClientRect();
          const scale = box.height / vb[3];
          const u = svg.querySelector('[id$="Union"]') || svg.querySelector('g');
          const bb = u.getBBox();
          return {
            h: bb.height * scale,
            bottom: box.top + (bb.y + bb.height - vb[1]) * scale,
          };
        });
        const hs = m.filter((_, i) => i < 2).map((x) => x.h); // the two Aperol glasses
        const bots = m.map((x) => x.bottom);
        return {
          aperolHeightDeltaPx: Math.round(Math.abs(hs[0] - hs[1])),
          baselineSpreadPx: Math.round(Math.max(...bots) - Math.min(...bots)),
        };
      })(),
      dialGridSingleColumn:
        getComputedStyle(document.querySelector('#s2 .dialgrid')).gridTemplateColumns.split(' ').length === 1,
      dupIds: (() => { const seen = new Set(), dup = []; document.querySelectorAll('[id]').forEach(e => { if (seen.has(e.id)) dup.push(e.id); seen.add(e.id); }); return dup; })(),
    };
  });

  results.mobile = { ...m, subMinTapTargets: targets, modes, errs: errs.slice(0, 10) };
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
