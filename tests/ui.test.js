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

test('OEM-verified vehicle displays its complete dimensions and scoped source', () => {
  const { window: w } = boot();
  const d = w.document;
  type(w, d.querySelector('#q'), 'passport');
  click(w, [...d.querySelectorAll('.item')].find(b => /Passport/.test(b.querySelector('b').textContent)));
  const text = d.body.textContent;
  for (const s of ['Overall length (catalog)', '189.1 in', 'Overall width (catalog)', '78.6 in',
    'Overall height (catalog)', '72.2 in', 'OEM source-verified for model year 2025',
    'hondainfocenter.com/2025/Passport/Feature-Guide/Specifications/']) {
    assert.ok(text.includes(s), 'missing dimension/provenance detail: ' + s);
  }
});

test('unverified catalog dimensions are visibly labeled as unverified', () => {
  const { window: w } = boot();
  const d = w.document;
  type(w, d.querySelector('#q'), 'mustang');
  click(w, [...d.querySelectorAll('.item')].find(b => /Mustang$/.test(b.querySelector('b').textContent)));
  assert.match(d.body.textContent, /UNVERIFIED/);
  assert.match(d.body.textContent, /Overall length \(catalog\)/);
});

test('opening a vehicle shows method, truck, clearance, tie-downs and every procedure section', () => {
  const { window: w } = boot();
  const d = w.document;
  type(w, d.querySelector('#q'), 'mustang');
  click(w, [...d.querySelectorAll('.item')].find(b => /Mustang$/.test(b.querySelector('b').textContent)));
  const text = d.body.textContent;
  for (const s of ['HOW TO TOW', 'TRUCK REQUIRED', 'USABLE & PREFERRED TRUCK TYPES', 'Preferred', 'GROUND CLEARANCE CHECK', 'TIE-DOWNS (SIZED', 'STEP-BY-STEP PROCEDURE', 'HANDS-ON TECHNIQUE',
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
  // Supply the measurements now required by the safety engine.
  const wb = d.querySelector('[data-sel="wb"]'); type(w, wb, '110');
  const gc = d.querySelector('[data-sel="gc"]'); type(w, gc, '5');
  assert.match(d.body.textContent, /WILL LIKELY SCRAPE/);
  type(w, gc, '9');
  assert.match(d.body.textContent, /SHOULD CLEAR/);
  assert.equal(d.querySelector('[data-sel="gc"]').value, '9', 'typed input is kept after re-render');
});

test('switching drive to AWD switches the method to flatbed only', () => {
  const { window: w } = boot();
  const d = w.document;
  type(w, d.querySelector('#q'), 'camry');
  click(w, [...d.querySelectorAll('.item')].find(b => /^Toyota Camry$/.test(b.querySelector('b').textContent)));
  assert.doesNotMatch(d.body.textContent, /FLATBED DEFAULT/);
  click(w, d.querySelector('[data-seg="drive"][data-val="AWD"]'));
  assert.match(d.body.textContent, /FLATBED DEFAULT/);
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
  assert.match(d.body.textContent, /FLATBED DEFAULT/, '4WD from the VIN is applied');
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
  ].join('\n');
  const candidates = Array.from(w.__tow.extractVinCandidates(text));
  assert.equal(candidates[0], '1HGCM82633A004352');
});

test('VIN label priority beats an unrelated checksum-valid number elsewhere on the sticker', () => {
  const { window: w } = boot();
  const labelledButCheckDigitUnclear = '1HGCM82633A004353';
  const unrelatedChecksumValid = '1HGCM82633A004352';
  const candidates = Array.from(w.__tow.extractVinCandidates(
    'SERIAL NUMBER ' + unrelatedChecksumValid + '\nVIN NO.: ' + labelledButCheckDigitUnclear
  ));
  assert.equal(candidates[0], labelledButCheckDigitUnclear);
});

test('VIN OCR recognizes VIN NUMBER label before the 17-character value', () => {
  const { window: w } = boot();
  const candidates = Array.from(w.__tow.extractVinCandidates('VIN NUMBER: 1HGCM82633A004352'));
  assert.equal(candidates[0], '1HGCM82633A004352');
});

test('VIN OCR pairs a value printed to the right of its label using ML Kit line geometry', () => {
  const { window: w } = boot();
  const reading = { text: 'VIN\nGVWR 6200', lines: [
    { text: 'VIN', left: 40, top: 100, right: 90, bottom: 120, width: 50, height: 20, confidence: 0.98 },
    { text: '1HGCM82633A004352', left: 105, top: 101, right: 270, bottom: 121, width: 165, height: 20, confidence: 0.95 },
    { text: 'GVWR 6200 LB', left: 40, top: 145, right: 170, bottom: 165, width: 130, height: 20, confidence: 0.99 }
  ] };
  const candidates = Array.from(w.__tow.extractVinCandidatesFromOcrResults([reading]));
  assert.equal(candidates[0], '1HGCM82633A004352');
});

test('VIN OCR pairs a value directly below its label without consuming distant sticker fields', () => {
  const { window: w } = boot();
  const reading = { text: 'VEHICLE IDENTIFICATION NUMBER\nGVWR 6200', lines: [
    { text: 'VEHICLE IDENTIFICATION NUMBER', left: 35, top: 80, right: 260, bottom: 100, width: 225, height: 20, confidence: 0.98 },
    { text: '1HGCM82633A004352', left: 35, top: 105, right: 200, bottom: 125, width: 165, height: 20, confidence: 0.96 },
    { text: 'GVWR 6200 LB', left: 35, top: 165, right: 150, bottom: 185, width: 115, height: 20, confidence: 0.99 }
  ] };
  const candidates = Array.from(w.__tow.extractVinCandidatesFromOcrResults([reading]));
  assert.equal(candidates[0], '1HGCM82633A004352');
});

test('VIN OCR accepts a VIN split over two lines immediately after its label', () => {
  const { window: w } = boot();
  const candidates = Array.from(w.__tow.extractVinCandidates(
    'VEHICLE IDENTIFICATION NUMBER\n1HGCM8263\n3A004352\nGVWR 6200 LB'
  ));
  assert.equal(candidates[0], '1HGCM82633A004352');
});

test('VIN OCR does not join weight fields after a VIN label into a false VIN', () => {
  const { window: w } = boot();
  const candidates = w.__tow.extractVinCandidates('VIN\nGVWR 6200\nGAWR 3450');
  assert.equal(candidates.length, 0);
});

test('VIN OCR does not manufacture VIN candidates by joining unrelated sticker fields', () => {
  const { window: w } = boot();
  const candidates = w.__tow.extractVinCandidates(
    'GVWR6200LBGAWRFRONT3450LB\nMFD2023TIRE23565R17104H'
  );
  assert.equal(candidates.length, 0);
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

test('Android uses the native CameraX scanner and returns the confirmed VIN to the form', async () => {
  const { window: w } = boot();
  const d = w.document;
  let nativeCalls = 0, browserCalls = 0;
  w.Capacitor = {
    getPlatform: () => 'android',
    Plugins: { NativeVinScanner: {
      scanLiveBarcode: () => {
        nativeCalls++;
        return Promise.resolve({ cancelled: false, rawValue: '1HGCM82633A004352', vin: '1HGCM82633A004352', format: 'Data Matrix' });
      }
    } }
  };
  w.ZXingBrowser = {
    BrowserMultiFormatReader: function () {
      this.decodeFromConstraints = () => { browserCalls++; return Promise.resolve({ stop: () => {} }); };
    }
  };
  click(w, d.querySelector('[data-tab="vin"]'));
  click(w, d.querySelector('#vin-barcode-start'));
  await new Promise(r => setTimeout(r, 0));
  assert.equal(nativeCalls, 1, 'Android launches the native CameraX scanner');
  assert.equal(browserCalls, 0, 'Android does not start the browser ZXing camera');
  assert.equal(d.querySelector('#vin').value, '1HGCM82633A004352');
  assert.match(d.querySelector('#vin-barcode-status').textContent, /native barcode scanner \(Data Matrix\)/i);
});

test('Android native barcode cancellation returns to the VIN form without losing OCR fallback', async () => {
  const { window: w } = boot();
  const d = w.document;
  w.Capacitor = {
    getPlatform: () => 'android',
    Plugins: { NativeVinScanner: { scanLiveBarcode: () => Promise.resolve({ cancelled: true, permissionDenied: true }) } }
  };
  click(w, d.querySelector('[data-tab="vin"]'));
  click(w, d.querySelector('#vin-barcode-start'));
  await new Promise(r => setTimeout(r, 0));
  assert.match(d.querySelector('#vin-barcode-status').textContent, /permission was denied/i);
  assert.ok(d.querySelector('#vin-photo'));
  assert.ok(d.querySelector('#vin-ocr'));
});

test('Android native scanner source declares supported formats and releases analyzed frames', () => {
  const activity = fs.readFileSync(path.join(WWW, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'bigjaysstowing', 'towguide', 'NativeBarcodeScannerActivity.java'), 'utf8');
  const gradle = fs.readFileSync(path.join(WWW, '..', 'android', 'app', 'build.gradle'), 'utf8');
  const manifest = fs.readFileSync(path.join(WWW, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  for (const format of ['FORMAT_DATA_MATRIX', 'FORMAT_QR_CODE', 'FORMAT_PDF417', 'FORMAT_AZTEC', 'FORMAT_CODE_39', 'FORMAT_CODE_128']) {
    assert.ok(activity.includes(format), 'missing native barcode format ' + format);
  }
  assert.ok(activity.includes('STRATEGY_KEEP_ONLY_LATEST'));
  assert.ok(activity.includes('addOnCompleteListener(task -> proxy.close())'), 'each analyzed camera frame must be released');
  assert.ok(activity.includes('consecutiveMatches >= 2'), 'require a stable repeated VIN before returning it');
  assert.ok(activity.includes('toggleTorch') && activity.includes('startFocusAndMetering'));
  assert.ok(activity.includes('setZoomSuggestionOptions'), 'undecoded barcode regions should trigger ML Kit automatic zoom');
  assert.ok(activity.includes('setMaxSupportedZoomRatio(maxZoom)'), 'automatic zoom must respect the camera hardware limit');
  assert.ok(activity.includes('new Size(1920, 1080)'), 'barcode analysis should request a higher-detail 1080p frame');
  assert.ok(activity.includes('Math.max(currentZoom, Math.max(lastAutoZoomRatio, zoomRatio))'), 'auto-zoom must never step backwards');
  assert.ok(activity.includes('lastAutoZoomRatio = targetZoom'), 'remember the highest accepted automatic zoom');
  assert.ok(activity.includes('no VIN payload was decoded'), 'undecoded barcode feedback should be explicit and useful');
  assert.ok(activity.includes('bounds.width() + "×" + bounds.height() + " px"'), 'show detected barcode dimensions for troubleshooting');
  assert.ok(gradle.includes('com.google.mlkit:barcode-scanning:17.3.0'));
  assert.ok(gradle.includes('androidx.camera:camera-lifecycle'));
  assert.ok(manifest.includes('.NativeBarcodeScannerActivity'));
});

test('Android OCR reparses both photo passes together so candidate ranking is retained', () => {
  const app = fs.readFileSync(path.join(WWW, 'app.js'), 'utf8');
  const start = app.indexOf('function scanVinPhoto()');
  const end = app.indexOf('function decodeVin()', start);
  const androidPath = app.slice(start, end);
  assert.match(androidPath, /prepareVinImage\(file, true\)/);
  assert.ok(androidPath.includes("extractVinCandidatesFromOcrResults([readings.enhanced, readings.original])"));
  assert.ok(androidPath.includes("readings.enhanced.text"));
  assert.ok(androidPath.includes("readings.original.text"));
  assert.doesNotMatch(androidPath, /candidates\.sort\(function \(a, b\) \{ return Number\(vinCheckDigitValid/);
});

test('VIN scanners use working browser APIs and Android camera permission is declared', () => {
  const app = fs.readFileSync(path.join(WWW, 'app.js'), 'utf8');
  const manifest = fs.readFileSync(path.join(WWW, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  assert.ok(app.includes('@zxing/browser@0.2.1/umd/zxing-browser.min.js'));
  assert.ok(app.includes("Tesseract.createWorker('eng'"));
  assert.ok(app.includes('worker.recognize(image)'));
  assert.ok(!app.includes('Tesseract.recognize('));
  assert.ok(manifest.includes('android.permission.CAMERA'));
});



test('native OCR plugin is detected through Capacitor.Plugins or registerPlugin, and never faked', () => {
  let w = boot().window;
  w.Capacitor = { Plugins: { NativeVinScanner: { recognizeText: () => Promise.resolve({ text: 'VIN 1HGCM82633A004352' }) } } };
  assert.equal(w.__tow.nativeScannerAvailable(), true);
  w = boot().window;
  w.Capacitor = { registerPlugin: () => ({ recognizeText: () => Promise.resolve({ text: '' }) }) };
  assert.equal(w.__tow.nativeScannerAvailable(), true);
  w = boot().window;
  w.Capacitor = { getPlatform: () => 'android' };
  assert.equal(w.__tow.nativeScannerAvailable(), false);
});


test('fleet screen records real truck payloads locally and removes units', () => {
  const { window: w } = boot();
  const d = w.document;
  click(w, d.querySelector('[data-tab="fleet"]'));
  assert.match(d.body.textContent, /No fleet trucks have been entered yet/);
  type(w, d.querySelector('#fleet-name'), 'Rollback 12');
  type(w, d.querySelector('#fleet-unit'), 'Carrier 5500');
  type(w, d.querySelector('#fleet-payload'), '9000');
  click(w, d.querySelector('#fleet-add'));
  assert.match(d.body.textContent, /Rollback 12/);
  assert.match(d.body.textContent, /9,000/);
  assert.equal(JSON.parse(w.localStorage.getItem('towguide.fleet.v1')).length, 1);
  click(w, d.querySelector('[data-fleet-del]'));
  assert.match(d.body.textContent, /No fleet trucks have been entered yet/);
});

test('vehicle result only names fleet units with sufficient recorded flatbed payload', () => {
  const { window: w } = boot();
  const d = w.document;
  click(w, d.querySelector('[data-tab="fleet"]'));
  type(w, d.querySelector('#fleet-name'), 'Rollback 12');
  type(w, d.querySelector('#fleet-payload'), '9000');
  click(w, d.querySelector('#fleet-add'));
  click(w, d.querySelector('[data-tab="find"]'));
  type(w, d.querySelector('#q'), 'mustang');
  click(w, [...d.querySelectorAll('.item')].find(b => /Mustang$/.test(b.querySelector('b').textContent)));
  assert.match(d.body.textContent, /BIG JAY’S FLEET MATCH/);
  assert.match(d.body.textContent, /Preferred unit: Rollback 12/);
});

test('unmeasured clearance is explicitly shown as no verdict', () => {
  const { window: w } = boot();
  const d = w.document;
  type(w, d.querySelector('#q'), 'mustang');
  click(w, [...d.querySelectorAll('.item')].find(b => /Mustang$/.test(b.querySelector('b').textContent)));
  assert.match(d.body.textContent, /NO VERDICT — MEASURE FIRST/);
});
