'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const WWW = path.join(__dirname, '..', 'www');

function boot(network) {
  const html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8')
    .replace(/<script src="[^"]+"><\/script>/g, '');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://example.test/', pretendToBeVisual: true });
  dom.window.scrollTo = () => {};
  if (network) dom.window.AndroidNetwork = network;
  for (const f of ['data.js', 'engine.js', 'app.js']) dom.window.eval(fs.readFileSync(path.join(WWW, f), 'utf8'));
  return dom;
}
const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const type = (w, el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };

test('index.html references only files that exist', () => {
  const html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1]).filter(r => !/^https?:/.test(r));
  assert.ok(refs.length >= 5);
  for (const r of refs) assert.ok(fs.existsSync(path.join(WWW, r)), 'missing ' + r);
  const manifest = JSON.parse(fs.readFileSync(path.join(WWW, 'manifest.webmanifest'), 'utf8'));
  for (const i of manifest.icons) assert.ok(fs.existsSync(path.join(WWW, i.src)), 'missing icon ' + i.src);
});

test('service worker caches every file the app loads', () => {
  const sw = fs.readFileSync(path.join(WWW, 'sw.js'), 'utf8');
  for (const f of ['index.html', 'styles.css', 'data.js', 'engine.js', 'app.js']) assert.ok(sw.includes("'" + f + "'"), f);
});


test('Android native connectivity status controls the offline badge on launch', () => {
  let calls = 0;
  const { window: w } = boot({ isConnected: () => { calls++; return false; } });
  assert.ok(calls >= 1, 'native connectivity is checked on launch');
  assert.equal(w.document.querySelector('#net').textContent, 'Offline (app works)');
  assert.ok(w.document.querySelector('#net').classList.contains('off'));
  w.close();
});

test('Android native online state is shown as online', () => {
  const { window: w } = boot({ isConnected: () => true });
  assert.equal(w.document.querySelector('#net').textContent, 'Online');
  w.close();
});

test('find screen lists vehicles and filters by search, make and year', () => {
  const { window: w } = boot();
  const d = w.document;
  assert.ok(d.querySelectorAll('.item').length > 0);
  type(w, d.querySelector('#q'), 'f-150');
  const names = [...d.querySelectorAll('.item b')].map(b => b.textContent);
  assert.ok(names.length >= 1 && names.every(n => /F-150/.test(n)), names.join());
  type(w, d.querySelector('#q'), '');
  const mk = d.querySelector('#make'); mk.value = 'Tesla'; mk.dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.ok([...d.querySelectorAll('.item b')].every(b => /^Tesla/.test(b.textContent)));
  mk.value = ''; mk.dispatchEvent(new w.Event('input', { bubbles: true }));
  type(w, d.querySelector('#year'), '2010');
  assert.ok(![...d.querySelectorAll('.item b')].some(b => /Model 3/.test(b.textContent)));
});

test('opening a vehicle shows method, truck, clearance, tie-downs and every procedure section', () => {
  const { window: w } = boot();
  const d = w.document;
  type(w, d.querySelector('#q'), 'mustang');
  click(w, [...d.querySelectorAll('.item')].find(b => /Mustang$/.test(b.querySelector('b').textContent)));
  const text = d.body.textContent;
  for (const s of ['HOW TO TOW', 'TRUCK REQUIRED', 'GROUND CLEARANCE CHECK', 'TIE-DOWNS (SIZED', 'STEP-BY-STEP PROCEDURE', 'HANDS-ON TECHNIQUE',
    '5. Tie it down', 'Corner-by-corner strap routing', 'How to use wheel nets', 'How to use ratchet straps', 'How to use chains and binders',
    'If something goes wrong', 'Driver license and legal', 'Wheel-lift procedure']) {
    assert.ok(text.includes(s), 'missing section: ' + s);
  }
  assert.ok(d.querySelector('details[open]'), 'tie-down section opens by default');
});

test('changing crest angle and measured clearance updates the verdict', () => {
  const { window: w } = boot();
  const d = w.document;
  type(w, d.querySelector('#q'), 'mustang');
  click(w, [...d.querySelectorAll('.item')].find(b => /Mustang$/.test(b.querySelector('b').textContent)));
  assert.match(d.body.textContent, /MEASUREMENTS REQUIRED/);
  const gc = d.querySelector('[data-sel="gc"]'); type(w, gc, '9');
  assert.match(d.body.textContent, /MEASUREMENTS REQUIRED/);
  const wb = d.querySelector('[data-sel="wb"]'); type(w, wb, '107');
  assert.match(d.body.textContent, /MEASURED: CLEARANCE INDICATED/);
  assert.equal(d.querySelector('[data-sel="gc"]').value, '9', 'typed input is kept after re-render');
});

test('switching drive to AWD switches the method to flatbed only', () => {
  const { window: w } = boot();
  const d = w.document;
  type(w, d.querySelector('#q'), 'camry');
  click(w, [...d.querySelectorAll('.item')].find(b => /^Toyota Camry$/.test(b.querySelector('b').textContent)));
  assert.doesNotMatch(d.body.textContent, /FLATBED ONLY/);
  click(w, d.querySelector('[data-seg="drive"][data-val="AWD"]'));
  assert.match(d.body.textContent, /FLATBED ONLY/);
});

test('custom vehicle form validates and produces a result', () => {
  const { window: w } = boot();
  const d = w.document;
  click(w, d.querySelector('[data-tab="custom"]'));
  type(w, d.querySelector('#c-curb'), '10');
  click(w, d.querySelector('#custom-go'));
  assert.match(d.querySelector('#c-err').textContent, /Curb weight/);
  type(w, d.querySelector('#c-curb'), '3200');
  type(w, d.querySelector('#c-name'), '2014 Kia Soul');
  click(w, d.querySelector('#custom-go'));
  assert.match(d.body.textContent, /2014 Kia Soul/);
  assert.match(d.body.textContent, /TIE-DOWNS/);
});

test('custom form presets fill the numbers', () => {
  const { window: w } = boot();
  const d = w.document;
  click(w, d.querySelector('[data-tab="custom"]'));
  const sel = d.querySelector('#c-preset'); sel.value = 'dually'; sel.dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.equal(d.querySelector('#c-dually').checked, true);
  assert.equal(d.querySelector('#c-wb').value, '176');
});

test('VIN tab rejects a malformed VIN without calling the network', () => {
  const { window: w } = boot();
  const d = w.document;
  let called = false; w.fetch = () => { called = true; return Promise.reject(new Error('no')); };
  click(w, d.querySelector('[data-tab="vin"]'));
  type(w, d.querySelector('#vin'), 'SHORT');
  click(w, d.querySelector('#vin-go'));
  assert.match(d.body.textContent, /17 letters and digits/);
  assert.equal(called, false);
});

test('VIN tab decodes, matches the database and pre-selects the drive', async () => {
  const { window: w } = boot();
  const d = w.document;
  w.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ Results: [{ Make: 'FORD', Model: 'F-150', ModelYear: '2021', BodyClass: 'Pickup',
    DriveType: '4WD/4-Wheel Drive/4x4', FuelTypePrimary: 'Gasoline', ElectrificationLevel: '', TransmissionStyle: 'Automatic', GVWR: '', ErrorText: '0' }] }) });
  click(w, d.querySelector('[data-tab="vin"]'));
  type(w, d.querySelector('#vin'), '1FTFW1E50NFA00000');
  click(w, d.querySelector('#vin-go'));
  await new Promise(r => setTimeout(r, 20));
  assert.match(d.body.textContent, /2021 Ford F-150/);
  click(w, d.querySelector('[data-open][data-pre]'));
  assert.match(d.body.textContent, /FLATBED ONLY/, '4WD from the VIN is applied');
});

test('VIN lookup failure shows a friendly message', async () => {
  const { window: w } = boot();
  const d = w.document;
  w.fetch = () => Promise.reject(new Error('offline'));
  click(w, d.querySelector('[data-tab="vin"]'));
  type(w, d.querySelector('#vin'), '1FTFW1E50NFA00000');
  click(w, d.querySelector('#vin-go'));
  await new Promise(r => setTimeout(r, 20));
  assert.match(d.body.textContent, /Could not reach the VIN service/);
});

test('user text is escaped, not injected as HTML', () => {
  const { window: w } = boot();
  const d = w.document;
  click(w, d.querySelector('[data-tab="custom"]'));
  type(w, d.querySelector('#c-name'), '<img src=x onerror=alert(1)>');
  click(w, d.querySelector('#custom-go'));
  assert.equal(d.querySelectorAll('#view img').length, 0);
  assert.ok(d.querySelector('h1').textContent.includes('<img'));
});

test('brand header uses the supplied logo rather than the orange BJ text badge', () => {
  const html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
  assert.match(html, /brand-logo/);
  assert.match(html, /assets\/branding\/big_jays_logo_300x300\.png/);
  assert.doesNotMatch(html, /<span class="mark">BJ<\/span>/);
});
