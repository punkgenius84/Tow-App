'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const WWW = path.join(__dirname, '..', 'www');

function boot() {
  const html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8')
    .replace(/<script src="[^"]+"><\/script>/g, '');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://example.test/', pretendToBeVisual: true });
  dom.window.scrollTo = () => {};
  for (const f of ['data.js', 'engine.js', 'app.js']) dom.window.eval(fs.readFileSync(path.join(WWW, f), 'utf8'));
  return dom;
}
const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const type = (w, el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };

test('index.html references only files that exist', () => {
  const html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1]).filter(r => !/^https?:/.test(r));
  assert.ok(refs.length >= 5);
  for (const r of refs) assert.ok(fs.existsSync(path.join(WWW, decodeURIComponent(r))), 'missing ' + r);
  const manifest = JSON.parse(fs.readFileSync(path.join(WWW, 'manifest.webmanifest'), 'utf8'));
  for (const i of manifest.icons) assert.ok(fs.existsSync(path.join(WWW, i.src)), 'missing icon ' + i.src);
});

test('service worker caches every file the app loads', () => {
  const sw = fs.readFileSync(path.join(WWW, 'sw.js'), 'utf8');
  for (const f of ['index.html', 'styles.css', 'data.js', 'engine.js', 'app.js']) assert.ok(sw.includes("'" + f + "'"), f);
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
  assert.match(d.body.textContent, /WILL LIKELY SCRAPE/);
  const gc = d.querySelector('[data-sel="gc"]'); type(w, gc, '9');
  assert.match(d.body.textContent, /SHOULD CLEAR/);
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


test('VIN camera scanner is present and OCR candidates are normalized safely', () => {
  const { window: w } = boot();
  const d = w.document;
  click(w, d.querySelector('[data-tab="vin"]'));
  assert.ok(d.querySelector('#vin-photo'));
  assert.equal(d.querySelector('#vin-photo').getAttribute('capture'), 'environment');
  assert.ok(d.querySelector('#vin-ocr'));
  const candidates = w.__tow.extractVinCandidates('VIN: 1FTFW1E50NFA00000\nOther text');
  assert.deepEqual(Array.from(candidates), ['1FTFW1E50NFA00000']);
});

test('VIN OCR helper corrects common OCR-only I/O/Q substitutions but leaves review to operator', () => {
  const { window: w } = boot();
  const candidates = w.__tow.extractVinCandidates('1FTFW1E5ONFA00000');
  assert.ok(Array.from(candidates).includes('1FTFW1E50NFA00000'));
});

test('VIN OCR ranks the labeled, checksum-valid VIN above door-sticker numbers', () => {
  const { window: w } = boot();
  const text = [
    'GVWR 6200 LB GAWR FRONT 3450 LB',
    'MFD BY AMERICAN MOTORS 11/2023',
    'TIRE 235/65R17 104H PRESSURE 240 KPA',
    'VIN NO: 1HGCM82633A004352',
    'ASSEMBLED IN USA PLANT 2'
  ].join('\\n');
  const candidates = Array.from(w.__tow.extractVinCandidates(text));
  assert.equal(candidates[0], '1HGCM82633A004352');
});

test('VIN OCR corrects Q as a zero only in OCR text and ranks checksum match first', () => {
  const { window: w } = boot();
  const candidates = Array.from(w.__tow.extractVinCandidates('VIN: 1HGCM82633AQQ4352'));
  assert.equal(candidates[0], '1HGCM82633A004352');
});


test('VIN barcode scanner is available and accepts only a valid 17-character VIN', () => {
  const { window: w } = boot();
  const d = w.document;
  click(w, d.querySelector('[data-tab="vin"]'));
  assert.ok(d.querySelector('#vin-barcode-start'));
  assert.ok(d.querySelector('#vin-barcode-video'));
  assert.equal(w.__tow.extractBarcodeVin('1FTFW1E50NFA00000'), '1FTFW1E50NFA00000');
  assert.equal(w.__tow.extractBarcodeVin('VIN: 1FTFW1E50NFA00000'), '1FTFW1E50NFA00000');
  assert.equal(w.__tow.extractBarcodeVin('1FTFW1E50NFA0000'), '');
  // Barcodes are exact: a letter O is not silently turned into a zero.
  assert.equal(w.__tow.extractBarcodeVin('1FTFW1E5ONFA00000'), '');
});

test('barcode VIN extraction handles real label payload shapes', () => {
  const { window: w } = boot();
  const f = w.__tow.extractBarcodeVin, VIN = '1HGCM82633A004352';
  assert.equal(f(VIN), VIN);
  assert.equal(f('*' + VIN + '*'), VIN, 'Code 39 start/stop');
  assert.equal(f('I' + VIN), VIN, 'leading I prefix must not shift the VIN');
  assert.equal(f('VIN' + VIN), VIN, 'label glued to value');
  assert.equal(f('VIN: ' + VIN), VIN);
  assert.equal(f(VIN + '\x1dSN12345678'), VIN, 'VIN then GS separator');
  assert.equal(f('PART12345678\x1d' + VIN), VIN, 'other field first must not bleed into the VIN');
  assert.equal(f('DL ABCDEFGHJKLMNPRST 12345 ' + VIN + ' 20291231'), VIN, 'PDF417 text');
  assert.equal(f('ABCDEFGHJKLMNPRST'), '', 'all-letter text is not a VIN');
  assert.equal(f('PART-0001'), '');
  assert.equal(f(''), '');
});

test('native barcode scanner reopens until a barcode contains a VIN', async () => {
  const { window: w } = boot();
  const calls = [];
  const seq = [{ rawValue: 'PART-0001' }, { rawValue: 'I1HGCM82633A004352' }];
  // Real Android shape: the bridge exposes plugins on Capacitor.Plugins and there is no registerPlugin().
  w.Capacitor = { Plugins: { NativeVinScanner: { scanBarcode: () => { calls.push(1); return Promise.resolve(seq[calls.length - 1]); } } } };
  const d = w.document;
  click(w, d.querySelector('[data-tab="vin"]'));
  click(w, d.querySelector('#vin-barcode-start'));
  for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0));
  assert.equal(calls.length, 2, 'scanner reopened after a non-VIN barcode');
  assert.equal(d.querySelector('#vin').value, '1HGCM82633A004352');
});

test('native barcode scanner uses displayValue when rawValue is unavailable', async () => {
  const { window: w } = boot();
  w.Capacitor = { Plugins: { NativeVinScanner: {
    scanBarcode: () => Promise.resolve({ rawValue: null, displayValue: '1HGCM82633A004352', format: 2 })
  } } };
  const d = w.document;
  click(w, d.querySelector('[data-tab="vin"]'));
  click(w, d.querySelector('#vin-barcode-start'));
  for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0));
  assert.equal(d.querySelector('#vin').value, '1HGCM82633A004352');
  assert.match(d.querySelector('#vin-barcode-status').textContent, /VIN barcode read successfully/i);
});

test('native barcode scanner decodes raw payload bytes when text values are missing', async () => {
  const { window: w } = boot();
  w.Capacitor = { Plugins: { NativeVinScanner: {
    scanBarcode: () => Promise.resolve({ rawValue: null, displayValue: null, rawBytesBase64: 'MUhHQ004MjYzM0EwMDQzNTI=', format: 2 })
  } } };
  const d = w.document;
  click(w, d.querySelector('[data-tab="vin"]'));
  click(w, d.querySelector('#vin-barcode-start'));
  for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0));
  assert.equal(d.querySelector('#vin').value, '1HGCM82633A004352');
  assert.match(d.querySelector('#vin-barcode-status').textContent, /VIN captured from barcode/i);
});

test('cancelling the native scanner is a calm message, not an error', async () => {
  const { window: w } = boot();
  w.Capacitor = { Plugins: { NativeVinScanner: { scanBarcode: () => Promise.reject(Object.assign(new Error('Barcode scan cancelled.'), { code: 'CANCELLED' })) } } };
  const d = w.document;
  click(w, d.querySelector('[data-tab="vin"]'));
  click(w, d.querySelector('#vin-barcode-start'));
  for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0));
  assert.match(d.querySelector('#vin-barcode-status').textContent, /cancelled/i);
  assert.equal(d.querySelector('#vin-barcode-start').disabled, false);
});

test('VIN scanners use working browser APIs and Android camera permission is declared', () => {
  const app = fs.readFileSync(path.join(WWW, 'app.js'), 'utf8');
  const manifest = fs.readFileSync(path.join(WWW, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  assert.ok(app.includes('@zxing/browser@0.1.5/umd/zxing-browser.min.js'));
  assert.ok(app.includes("Tesseract.createWorker('eng'"));
  assert.ok(app.includes('worker.recognize(image)'));
  assert.ok(!app.includes('Tesseract.recognize('));
  assert.ok(manifest.includes('android.permission.CAMERA'));
});


test('native scanner is found through Capacitor.Plugins (Android) or registerPlugin, and never faked', async () => {
  // 1. Android bridge shape
  let w = boot().window, hit = 0;
  w.Capacitor = { Plugins: { NativeVinScanner: { scanBarcode: () => { hit++; return Promise.resolve({ rawValue: '1HGCM82633A004352' }); } } } };
  click(w, w.document.querySelector('[data-tab="vin"]'));
  click(w, w.document.querySelector('#vin-barcode-start'));
  for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0));
  assert.equal(hit, 1);
  // 2. bundled-runtime shape
  w = boot().window; hit = 0;
  w.Capacitor = { registerPlugin: () => ({ scanBarcode: () => { hit++; return Promise.resolve({ rawValue: '1HGCM82633A004352' }); } }) };
  click(w, w.document.querySelector('[data-tab="vin"]'));
  click(w, w.document.querySelector('#vin-barcode-start'));
  for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0));
  assert.equal(hit, 1);
  // 3. Capacitor present but no plugin and no registerPlugin: not treated as native
  w = boot().window;
  w.Capacitor = { getPlatform: () => 'android' };
  assert.equal(w.__tow.nativeScannerAvailable(), false);
});
