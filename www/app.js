/* TowGuide UI. Vanilla JS, no dependencies, works offline. */
(function () {
  'use strict';

  var E = window.TowEngine;
  var D = window.TowData;
  var LS_KEY = 'towguide.custom.v1';

  var state = { tab: 'find', q: '', make: '', year: '', cur: null, vin: null, vinMsg: '', prefill: null, vinFile: null, vinPreviewUrl: '', ocrStatus: '', ocrLoader: null, ocrWorker: null, barcodeStatus: '', barcodeScanning: false, barcodeControls: null, barcodeLoader: null };
  var custom = loadCustom();

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ul(items, cls) {
    return '<ul class="plain ' + (cls || '') + '">' + items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
  }
  function ol(items) {
    return '<ol class="steps">' + items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
  }
  function loadCustom() {
    try { var a = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function saveCustom() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(custom)); } catch (e) { /* storage blocked: ignore */ }
  }
  function allVehicles() { return D.vehicles.concat(custom); }
  function findVehicle(id) {
    var all = allVehicles();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }
  function years(v) { return v.custom ? 'Custom' : (v.yFrom === v.yTo ? v.yFrom : v.yFrom + '-' + v.yTo); }
  var POWER = { ICE: 'Gas / diesel', HEV: 'Hybrid', PHEV: 'Plug-in hybrid', EV: 'Electric' };
  var TRANS = { AT: 'Automatic', CVT: 'CVT', MT: 'Manual', DCT: 'Dual-clutch', EV: 'Single-speed' };

  /* ---------- navigation ---------- */
  function setTab(t) {
    stopBarcodeScanner();
    state.tab = t; state.cur = null; render();
    window.scrollTo(0, 0);
  }

  function render() {
    var tabs = document.querySelectorAll('.tabs button');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('on', tabs[i].getAttribute('data-tab') === state.tab);
    if (state.cur) return renderDetail();
    if (state.tab === 'find') return renderFind();
    if (state.tab === 'vin') return renderVin();
    if (state.tab === 'custom') return renderCustom();
    return renderInfo();
  }

  /* ---------- FIND ---------- */
  function renderFind() {
    $('#view').innerHTML =
      '<section class="stack">' +
      '<input id="q" type="search" autocomplete="off" placeholder="Search make or model (F-150, Camry, Model 3)" value="' + esc(state.q) + '">' +
      '<div class="row2"><select id="make"><option value="">All makes</option>' +
      allMakes().map(function (m) { return '<option' + (m === state.make ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') +
      '</select><input id="year" inputmode="numeric" maxlength="4" placeholder="Year" value="' + esc(state.year) + '"></div>' +
      '<div id="count" class="muted"></div><div id="list" class="list"></div></section>';
    drawList();
  }

  function allMakes() {
    var seen = {}, out = [];
    allVehicles().forEach(function (v) { if (!seen[v.make]) { seen[v.make] = 1; out.push(v.make); } });
    return out.sort();
  }

  function matches(v) {
    if (state.make && v.make !== state.make) return false;
    var y = parseInt(state.year, 10);
    if (y && !v.custom && (y < v.yFrom || y > v.yTo)) return false;
    var hay = E.norm(v.make + ' ' + v.model + ' ' + v.body);
    var toks = state.q.trim().split(/\s+/).filter(Boolean);
    return toks.every(function (t) { return hay.indexOf(E.norm(t)) !== -1; });
  }

  function drawList() {
    var list = $('#list'); if (!list) return;
    var res = allVehicles().filter(matches);
    res.sort(function (a, b) { return (a.make + a.model).localeCompare(b.make + b.model); });
    $('#count').textContent = res.length + ' vehicle' + (res.length === 1 ? '' : 's') +
      '. Not listed? Use the Custom tab.';
    list.innerHTML = res.slice(0, 80).map(function (v) {
      return '<button class="item" data-open="' + esc(v.id) + '"><b>' + esc(v.make + ' ' + v.model) + '</b>' +
        '<span>' + esc(years(v)) + ' · ' + esc(v.body) + ' · ' + esc(v.drives.join('/')) + ' · ' + esc(POWER[v.power]) + '</span></button>';
    }).join('') + (res.length > 80 ? '<div class="muted">Showing 80. Type more to narrow.</div>' : '');
  }

  function openVehicle(v, pre) {
    pre = pre || {};
    state.cur = {
      v: v,
      sel: {
        drive: v.drives.indexOf(pre.drive) !== -1 ? pre.drive : v.drives[0],
        trans: v.trans.indexOf(pre.trans) !== -1 ? pre.trans : v.trans[0],
        angle: 12, extraLb: 0, gc: undefined, wb: undefined
      }
    };
    render(); window.scrollTo(0, 0);
  }

  /* ---------- DETAIL ---------- */
  function renderDetail() {
    var v = state.cur.v;
    $('#view').innerHTML =
      '<section class="stack">' +
      '<button class="btn ghost" id="back">← Back</button>' +
      '<div><h1>' + esc(v.make + ' ' + v.model) + '</h1><div class="chips">' +
      '<span class="chip">' + esc(years(v)) + '</span><span class="chip">' + esc(v.body) + '</span>' +
      '<span class="chip">' + esc(POWER[v.power]) + '</span></div></div>' +
      '<div class="card stack" id="controls"></div><div id="result" class="stack"></div></section>';
    renderControls(); renderResult();
  }

  function seg(name, opts, cur, labels) {
    return '<div class="seg">' + opts.map(function (o) {
      return '<button data-seg="' + name + '" data-val="' + esc(o) + '" class="' + (o === cur ? 'on' : '') + '">' + esc(labels ? (labels[o] || o) : o) + '</button>';
    }).join('') + '</div>';
  }

  function renderControls() {
    var c = state.cur, v = c.v, s = c.sel, h = '';
    if (v.drives.length > 1) h += '<div><label class="f">Drive type (check badges, VIN or underside)</label>' + seg('drive', v.drives, s.drive) + '</div>';
    else h += '<div class="muted">Drive type: <b>' + esc(v.drives[0]) + '</b></div>';
    if (v.power !== 'EV' && v.trans.length > 1) h += '<div><label class="f">Transmission</label>' + seg('trans', v.trans, s.trans, TRANS) + '</div>';
    h += '<div><label class="f">Crest angle where ramp meets deck</label><select data-sel="angle">' +
      E.ANGLE_PRESETS.map(function (p) { return '<option value="' + p.deg + '"' + (p.deg === s.angle ? ' selected' : '') + '>' + esc(p.label) + '</option>'; }).join('') +
      '</select></div>';
    h += '<div class="grid2"><div><label class="f">Cargo / extra weight (lb)</label><input data-sel="extraLb" inputmode="numeric" placeholder="0"></div>' +
      '<div><label class="f">Measured clearance (in)</label><input data-sel="gc" inputmode="decimal" placeholder="' + v.gc + '"></div></div>';
    h += '<div><label class="f">Measured wheelbase (in, optional)</label><input data-sel="wb" inputmode="decimal" placeholder="' + v.wb + '"></div>';
    $('#controls').innerHTML = h;
  }

  function detailsBlock(title, body, open) {
    return '<details' + (open ? ' open' : '') + '><summary>' + esc(title) + '</summary><div class="body">' + body + '</div></details>';
  }

  function renderResult() {
    var c = state.cur, v = c.v;
    var r = E.recommend(v, c.sel);
    var m = r.method, t = r.truck, k = r.clearance, td = r.tiedown, h = '';

    h += '<div class="card ' + (m.flatbedOnly ? 'edge-bad' : 'edge-ok') + '"><div class="label">HOW TO TOW</div>' +
      '<div class="big">' + esc(m.primary) + '</div>' +
      (m.flatbedOnly ? '<span class="badge bad">FLATBED ONLY</span>' : '<span class="badge ok">FLATBED PREFERRED</span>') +
      ul(m.why) +
      (m.alternates.length ? '<h3>' + (m.flatbedOnly ? 'If no flatbed is possible' : 'Acceptable alternative') + '</h3>' + ul(m.alternates) : '') +
      (m.never.length ? '<h3 class="neg">Never</h3>' + ul(m.never, 'neg') : '') + '</div>';

    h += '<div class="card edge-info"><div class="label">TRUCK REQUIRED</div><div class="big">' + esc(t.label) + '</div>' +
      '<div>' + esc(t.detail) + '</div>' +
      '<div class="stats"><div class="stat"><b>' + E.fmt(t.weightLb) + '</b><span>vehicle lb</span></div>' +
      '<div class="stat"><b>' + E.fmt(t.requiredLb) + '</b><span>rated for (lb)</span></div>' +
      '<div class="stat"><b>' + (r.method.flatbedOnly ? 'Flatbed' : 'Flatbed') + '</b><span>unit type</span></div></div>' +
      ul(t.reasons) + '<div class="muted">' + esc(t.note) + '</div></div>';

    var kcls = { ok: 'ok', marginal: 'warn', fail: 'bad' }[k.status];
    var klabel = { ok: 'SHOULD CLEAR', marginal: 'TIGHT', fail: 'WILL LIKELY SCRAPE' }[k.status];
    h += '<div class="card edge-' + kcls + '"><div class="label">GROUND CLEARANCE CHECK</div>' +
      '<div class="big"><span class="badge ' + kcls + '">' + klabel + '</span></div>' +
      '<div class="stats"><div class="stat"><b>' + k.gc + '"</b><span>clearance</span></div>' +
      '<div class="stat"><b>' + k.neededIn + '"</b><span>needed at ' + k.angle + '°</span></div>' +
      '<div class="stat"><b>' + k.maxAngleDeg + '°</b><span>max safe angle</span></div></div>' +
      ul(k.advice) +
      '<div class="muted">Covers belly breakover only. Also check the front lip, side skirts and rear bumper by eye.</div></div>';

    if (r.warnings.length) h += '<div class="card edge-warn"><div class="label">WATCH FOR</div>' + ul(r.warnings) + '</div>';

    h += '<div class="card edge-info"><div class="label">TIE-DOWNS (SIZED TO THIS VEHICLE)</div>' +
      '<div class="stats"><div class="stat"><b>' + td.count + '</b><span>tie-downs min</span></div>' +
      '<div class="stat"><b>' + E.fmt(td.perTiedownLb) + '</b><span>lb WLL each</span></div>' +
      '<div class="stat"><b>' + E.fmt(td.legalAggLb) + '</b><span>lb federal min total</span></div></div>' +
      '<div>Suggested gear: ' + esc(td.gear) + '.</div>' +
      '<h3>Where to attach</h3>' + ul(td.methodAdvice) + '</div>';

    var S = td.steps;
    h += '<div class="label" style="margin-top:6px">STEP-BY-STEP PROCEDURE</div>';
    h += detailsBlock('1. Scene and vehicle check', ol(S.before));
    h += detailsBlock('2. Prepare the vehicle', ol(S.prepare));
    h += detailsBlock('3. Set up the flatbed', ol(S.setup));
    h += detailsBlock('4. Load the vehicle', ol(S.load));
    h += detailsBlock('5. Tie it down', ol(S.tiedown), true);
    h += detailsBlock('6. Final checks before moving', ol(S.final));
    h += detailsBlock('7. On the road', ol(S.road));
    h += detailsBlock('8. Unloading', ol(S.unload));
    var T = td.techniques;
    h += '<div class="label" style="margin-top:10px">HANDS-ON TECHNIQUE</div>';
    h += detailsBlock('Corner-by-corner strap routing', '<dl class="gl">' + T.corners.map(function (c) { return '<dt>' + esc(c[0]) + '</dt><dd>' + esc(c[1]) + '</dd>'; }).join('') + '</dl>');
    h += detailsBlock('How to use wheel nets', ol(T.wheelNets));
    h += detailsBlock('How to use ratchet straps', ol(T.straps));
    h += detailsBlock('How to use chains and binders', ol(T.chains));
    h += detailsBlock('Inspect your gear', ul(T.inspect));
    h += detailsBlock('If something goes wrong', '<dl class="gl">' + T.problems.map(function (c) { return '<dt>' + esc(c[0]) + '</dt><dd>' + esc(c[1]) + '</dd>'; }).join('') + '</dl>');
    if (td.wheelLift) h += detailsBlock('Wheel-lift procedure (only if no flatbed)', ol(td.wheelLift));
    h += detailsBlock('Skates and dollies', ol(td.dollies));
    h += detailsBlock('Equipment to bring', ul(r.equipment));
    h += detailsBlock('Driver license and legal', ul(td.operator));
    h += detailsBlock('Terms', '<dl class="gl">' + td.glossary.map(function (g) { return '<dt>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + '</dd>'; }).join('') + '</dl>');

    var sp = r.spec;
    h += detailsBlock('Vehicle specs used', '<table class="specs">' +
      row('Drive', sp.drive) + row('Powertrain', POWER[sp.power]) + row('Transmission', TRANS[sp.trans] || sp.trans) +
      row('Curb weight', E.fmt(sp.curb) + ' lb') + row('GVWR', sp.gvwr ? E.fmt(sp.gvwr) + ' lb' : 'n/a') +
      row('Wheelbase', k.wb + ' in') + row('Ground clearance', k.gc + ' in' + (sp.measured ? ' (measured)' : (sp.conf ? '' : ' (estimate)'))) +
      '</table><div class="muted" style="margin-top:8px">Typical values for the model range. Trim, tires, load and modifications change them.</div>');

    h += '<div class="grid2"><button class="btn ghost" id="copy">Copy summary</button>' +
      (v.custom ? (isSaved(v) ? '<button class="btn danger" id="del-custom">Delete saved</button>' : '<button class="btn" id="save-custom">Save vehicle</button>') : '<span></span>') + '</div>';
    h += '<div class="notice">Always confirm with the vehicle\'s owner\'s manual and your company procedures. This app gives general guidance and can be wrong for a given vehicle.</div>';

    $('#result').innerHTML = h;
    state.cur.last = r;
  }

  function row(a, b) { return '<tr><td>' + esc(a) + '</td><td>' + esc(b) + '</td></tr>'; }
  function isSaved(v) { return custom.some(function (c) { return c.id === v.id; }); }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
    fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  /* ---------- VIN ---------- */
  function renderVin() {
    var h = '<section class="stack"><div class="card stack">' +
      '<div class="label">SCAN VIN WITH CAMERA</div>' +
      '<label class="f">Fastest: scan the VIN barcode on the vehicle label</label>' +
      '<video id="vin-barcode-video" class="vin-preview barcode-video" autoplay muted playsinline' + (state.barcodeScanning ? '' : ' hidden') + '></video>' +
      '<button class="btn block" id="vin-barcode-start" type="button">' + (state.barcodeScanning ? 'Barcode scanner starting…' : 'Start barcode scan') + '</button>' +
      '<div id="vin-barcode-status" class="muted" aria-live="polite">' + esc(state.barcodeStatus || 'Point the camera at the VIN barcode and hold steady. Supports common 1D and 2D barcode formats.') + '</div>' +
      '<div class="divider-text">OR USE A PHOTO</div>' +
      '<label class="f" for="vin-photo">Photograph the VIN text on the windshield or driver-door label</label>' +
      '<input id="vin-photo" type="file" accept="image/*" capture="environment">' +
      '<div class="muted">OCR is the fallback when there is no readable barcode. Recognition runs on this device; the photo is not uploaded or saved by this app.</div>' +
      '<img id="vin-preview" class="vin-preview" alt="VIN photo preview" hidden>' +
      '<button class="btn block" id="vin-ocr" type="button">Read VIN from photo</button>' +
      '<div id="vin-ocr-status" class="muted" aria-live="polite">' + esc(state.ocrStatus || 'Camera scan works best in good light with minimal glare.') + '</div>' +
      '</div><div class="card stack"><div class="label">OR ENTER VIN MANUALLY</div>' +
      '<label class="f" for="vin">17-character VIN (NHTSA lookup needs internet)</label>' +
      '<input id="vin" autocapitalize="characters" autocomplete="off" maxlength="17" placeholder="1FTFW1E50NFA00000" value="' + esc(state.vinText || '') + '">' +
      '<button class="btn block" id="vin-go">Decode VIN</button>' +
      '<div class="muted">Uses the free US government (NHTSA) VIN service. Drive type, powertrain and transmission come from the VIN. Weight and clearance still come from the database or your measurements.</div></div>';
    if (state.vinMsg) h += '<div class="notice ' + (state.vinErr ? 'err' : '') + '">' + esc(state.vinMsg) + '</div>';
    var p = state.vin;
    if (p) {
      h += '<div class="card"><div class="label">DECODED</div><div class="big">' + esc((p.year || '') + ' ' + p.make + ' ' + p.model) + '</div>' + ul([
        'Body: ' + (p.body || 'unknown'),
        'Drive: ' + (p.drive || 'not reported (check manually)'),
        'Powertrain: ' + POWER[p.power],
        'Transmission: ' + (p.trans ? TRANS[p.trans] : 'not reported')
      ]) + '</div>';
      var ms = E.matchVehicles(allVehicles(), p);
      if (ms.length) {
        h += '<div class="label">MATCHES IN DATABASE</div><div class="list">' + ms.map(function (v) {
          return '<button class="item" data-open="' + esc(v.id) + '" data-pre="1"><b>' + esc(v.make + ' ' + v.model) + '</b><span>' +
            esc(years(v)) + ' · ' + esc(v.drives.join('/')) + ' · ' + esc(POWER[v.power]) + '</span></button>';
        }).join('') + '</div>';
      } else {
        h += '<div class="notice">No match in the database for this vehicle.</div>';
      }
      h += '<button class="btn ghost block" data-vin-custom="1">Use decoded info in Custom form</button>';
    }
    $('#view').innerHTML = h + '</section>';
    var preview = $('#vin-preview');
    if (preview && state.vinPreviewUrl) { preview.src = state.vinPreviewUrl; preview.hidden = false; }
  }

  function extractVinCandidates(text) {
    var found = [], lines = String(text || '').toUpperCase().split(/\r?\n/);
    function addCandidate(raw) {
      if (/^[A-HJ-NPR-Z0-9]{17}$/.test(raw) && found.indexOf(raw) === -1) found.push(raw);
      var corrected = raw.replace(/O/g, '0').replace(/[IQ]/g, '1');
      if (/^[A-HJ-NPR-Z0-9]{17}$/.test(corrected) && found.indexOf(corrected) === -1) found.push(corrected);
    }
    lines.forEach(function (line) {
      // Prefer a VIN explicitly following its printed label; this avoids false
      // overlapping 17-character fragments from nearby words such as "VIN:".
      var labelled = line.match(/\bVIN\b\s*[:#-]?\s*([A-Z0-9]{17})/);
      if (labelled) { addCandidate(labelled[1]); return; }
      var compact = line.replace(/[^A-Z0-9]/g, '');
      for (var i = 0; i <= compact.length - 17; i++) addCandidate(compact.slice(i, i + 17));
    });
    return found;
  }

  function extractBarcodeVin(raw) {
    var value = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(value) ? value : '';
  }

  function loadBarcodeEngine() {
    if (window.ZXingBrowser && window.ZXingBrowser.BrowserMultiFormatReader) return Promise.resolve(window.ZXingBrowser);
    if (state.barcodeLoader) return state.barcodeLoader;
    state.barcodeLoader = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/umd/zxing-browser.min.js';
      script.async = true;
      script.onload = function () {
        if (window.ZXingBrowser && window.ZXingBrowser.BrowserMultiFormatReader) resolve(window.ZXingBrowser);
        else reject(new Error('Barcode scanner did not initialize.'));
      };
      script.onerror = function () { reject(new Error('Could not load barcode scanner. Check your internet connection.')); };
      document.head.appendChild(script);
    });
    return state.barcodeLoader;
  }

  function stopBarcodeScanner() {
    if (state.barcodeControls && state.barcodeControls.stop) {
      try { state.barcodeControls.stop(); } catch (e) { /* camera may already be closed */ }
    }
    state.barcodeControls = null;
    state.barcodeScanning = false;
  }

  function startBarcodeScan() {
    var video = $('#vin-barcode-video'), status = $('#vin-barcode-status'), button = $('#vin-barcode-start');
    if (!video) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (status) status.textContent = 'Camera access is unavailable. Open the app over HTTPS or use the photo scanner below.';
      return;
    }
    if (button) button.disabled = true;
    if (status) status.textContent = 'Loading barcode scanner…';
    loadBarcodeEngine().then(function (ZXing) {
      state.barcodeScanning = true;
      video.hidden = false;
      if (status) status.textContent = 'Starting camera… allow camera access, then aim at the VIN barcode.';
      var reader = new ZXing.BrowserMultiFormatReader();
      return reader.decodeFromVideoDevice(undefined, video, function (result, err, controls) {
        if (controls && !state.barcodeControls) state.barcodeControls = controls;
        if (result) {
          var vin = extractBarcodeVin(result.getText ? result.getText() : result.text);
          if (vin) {
            state.vinText = vin;
            state.barcodeStatus = 'VIN barcode read successfully. Verify the number below, then tap Decode VIN.';
            stopBarcodeScanner();
            renderVin();
          } else if (status) {
            status.textContent = 'Barcode detected, but it did not contain a valid 17-character VIN. Keep scanning or use the photo/manual option.';
          }
        }
      });
    }).then(function (controls) {
      if (controls && state.barcodeScanning) state.barcodeControls = controls;
    }).catch(function (err) {
      stopBarcodeScanner();
      state.barcodeStatus = err && err.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in Android settings, or use the photo/manual option.' : (err && err.message ? err.message : 'Could not start barcode camera.');
      renderVin();
    }).finally(function () {
      var current = $('#vin-barcode-start');
      if (current) current.disabled = false;
    });
  }

  function loadOcrEngine() {
    if (window.Tesseract && window.Tesseract.createWorker) return Promise.resolve(window.Tesseract);
    if (state.ocrLoader) return state.ocrLoader;
    state.ocrLoader = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.onload = function () {
        if (window.Tesseract && window.Tesseract.createWorker) resolve(window.Tesseract);
        else reject(new Error('OCR engine loaded, but its worker API is unavailable. Please reload the app.'));
      };
      script.onerror = function () { reject(new Error('Could not load the OCR engine. Check your internet connection.')); };
      document.head.appendChild(script);
    }).catch(function (err) {
      state.ocrLoader = null;
      throw err;
    });
    return state.ocrLoader;
  }

  function prepareVinImage(file) {
    return new Promise(function (resolve, reject) {
      var url = window.URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(3, Math.max(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight)));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) throw new Error('Could not prepare the photo for text recognition.');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var data = pixels.data;
          for (var i = 0; i < data.length; i += 4) {
            var gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            // Lift midtones and increase contrast so stamped/printed VIN characters stand out.
            var enhanced = Math.max(0, Math.min(255, (gray - 128) * 1.55 + 128));
            data[i] = data[i + 1] = data[i + 2] = enhanced;
          }
          ctx.putImageData(pixels, 0, 0);
          window.URL.revokeObjectURL(url);
          resolve(canvas);
        } catch (err) {
          window.URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = function () {
        window.URL.revokeObjectURL(url);
        reject(new Error('The photo could not be opened. Try taking it again.'));
      };
      img.src = url;
    });
  }

  function getOcrWorker(Tesseract, status) {
    if (state.ocrWorker) return Promise.resolve(state.ocrWorker);
    return Tesseract.createWorker('eng', 1, {
      logger: function (m) {
        if (!status) return;
        if (m.status === 'loading tesseract core') status.textContent = 'Preparing text recognition…';
        else if (m.status === 'loading language traineddata') status.textContent = 'Downloading English recognition data…';
        else if (m.status === 'recognizing text') status.textContent = 'Reading VIN… ' + Math.round((m.progress || 0) * 100) + '%';
      }
    }).then(function (worker) {
      state.ocrWorker = worker;
      return worker;
    });
  }

  function scanVinPhoto() {
    var file = state.vinFile;
    if (!file) { state.ocrStatus = 'Take or choose a VIN photo first.'; return renderVin(); }
    if (!/^image\//i.test(file.type)) { state.ocrStatus = 'Please choose an image file.'; return renderVin(); }
    var button = $('#vin-ocr');
    if (button) button.disabled = true;
    var status = $('#vin-ocr-status');
    if (status) status.textContent = 'Loading on-device text recognition…';
    loadOcrEngine().then(function (Tesseract) {
      return Promise.all([getOcrWorker(Tesseract, status), prepareVinImage(file)]);
    }).then(function (items) {
      var worker = items[0], image = items[1];
      return worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        tessedit_pageseg_mode: '6'
      }).then(function () { return worker.recognize(image); });
    }).then(function (result) {
      var text = result && result.data ? result.data.text : '';
      var candidates = extractVinCandidates(text);
      if (!candidates.length && state.ocrWorker) {
        return state.ocrWorker.setParameters({ tessedit_pageseg_mode: '11' })
          .then(function () { return state.ocrWorker.recognize(file); })
          .then(function (retry) { return { candidates: extractVinCandidates(retry && retry.data ? retry.data.text : ''), original: candidates }; });
      }
      return { candidates: candidates, original: candidates };
    }).then(function (result) {
      var candidates = result.candidates;
      if (candidates.length === 1) {
        state.vinText = candidates[0];
        state.ocrStatus = 'VIN found. Check every character below, then tap Decode VIN.';
      } else if (candidates.length > 1) {
        state.ocrStatus = 'More than one possible VIN was found. Choose and verify the correct 17 characters below.';
        state.vinText = candidates[0];
      } else {
        state.ocrStatus = 'No clear 17-character VIN found. Try filling more of the frame with the VIN, avoid glare, or enter it manually.';
      }
      renderVin();
      if (candidates.length > 1) {
        var msg = $('#vin-ocr-status');
        if (msg) msg.textContent += ' First candidate shown; compare it with the photo.';
      }
    }).catch(function (err) {
      state.ocrStatus = err && err.message ? err.message : 'Photo reading failed. Please try again or enter the VIN manually.';
      renderVin();
    }).finally(function () {
      var current = $('#vin-ocr');
      if (current) current.disabled = false;
    });
  }

  function decodeVin() {
    var vin = ($('#vin').value || '').trim().toUpperCase();
    state.vinText = vin; state.vin = null; state.vinErr = false;
    if (!E.validVin(vin)) { state.vinMsg = 'A VIN is 17 letters and digits (no I, O or Q).'; state.vinErr = true; return renderVin(); }
    state.vinMsg = 'Looking up...'; renderVin();
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 10000);
    fetch('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/' + encodeURIComponent(vin) + '?format=json', ctl ? { signal: ctl.signal } : {})
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(function (json) {
        clearTimeout(timer);
        var p = E.parseVinDecode(json);
        if (!p || !p.ok) { state.vinMsg = 'The VIN service could not identify this vehicle. Use Find or Custom.'; state.vinErr = true; }
        else { state.vin = p; state.vinMsg = ''; }
        if (state.tab === 'vin' && !state.cur) renderVin();
      })
      .catch(function () {
        clearTimeout(timer);
        state.vinMsg = 'Could not reach the VIN service. Check your connection, or use Find / Custom.'; state.vinErr = true;
        if (state.tab === 'vin' && !state.cur) renderVin();
      });
  }

  /* ---------- CUSTOM ---------- */
  function renderCustom() {
    var pre = state.prefill || {};
    var keys = Object.keys(E.BODY_PRESETS);
    var firstKey = pre.preset || 'sedan';
    var P = E.BODY_PRESETS[firstKey];
    $('#view').innerHTML =
      '<section class="stack"><div class="card stack">' +
      '<div class="muted">For any vehicle not in the list. Pick the closest type, then enter what you can measure.</div>' +
      '<div><label class="f">Name (optional)</label><input id="c-name" placeholder="e.g. 2014 Kia Soul" value="' + esc(pre.name || '') + '"></div>' +
      '<div><label class="f">Vehicle type</label><select id="c-preset">' +
      keys.map(function (k) { return '<option value="' + k + '"' + (k === firstKey ? ' selected' : '') + '>' + esc(E.BODY_PRESETS[k].label) + '</option>'; }).join('') + '</select></div>' +
      '<div class="grid2"><div><label class="f">Drive</label><select id="c-drive">' + opt(['FWD', 'RWD', 'AWD', '4WD'], pre.drive) + '</select></div>' +
      '<div><label class="f">Powertrain</label><select id="c-power">' + opt(['ICE', 'HEV', 'PHEV', 'EV'], pre.power, POWER) + '</select></div></div>' +
      '<div><label class="f">Transmission</label><select id="c-trans">' + opt(['AT', 'CVT', 'MT', 'DCT'], pre.trans, TRANS) + '</select></div>' +
      '<div class="grid2"><div><label class="f">Curb weight (lb)</label><input id="c-curb" inputmode="numeric" value="' + P.curb + '"></div>' +
      '<div><label class="f">GVWR (lb, door sticker)</label><input id="c-gvwr" inputmode="numeric" value="' + (P.gvwr || '') + '"></div></div>' +
      '<div class="grid2"><div><label class="f">Wheelbase (in)</label><input id="c-wb" inputmode="decimal" value="' + P.wb + '"></div>' +
      '<div><label class="f">Ground clearance (in)</label><input id="c-gc" inputmode="decimal" value="' + P.gc + '"></div></div>' +
      '<label class="check"><input type="checkbox" id="c-dually"' + (P.dually ? ' checked' : '') + '> Dual rear wheels (dually)</label>' +
      '<label class="check"><input type="checkbox" id="c-air"> Air suspension</label>' +
      '<div id="c-err" class="err"></div>' +
      '<button class="btn block" id="custom-go">Check this vehicle</button></div></section>';
    state.prefill = null;
  }

  function opt(list, cur, labels) {
    return list.map(function (o) { return '<option value="' + o + '"' + (o === cur ? ' selected' : '') + '>' + esc(labels ? labels[o] : o) + '</option>'; }).join('');
  }

  function num(id) { var x = parseFloat($(id).value); return isFinite(x) ? x : NaN; }

  function customGo() {
    var curb = num('#c-curb'), wb = num('#c-wb'), gc = num('#c-gc'), gvwr = num('#c-gvwr') || 0;
    var err = $('#c-err');
    if (!(curb >= 1000 && curb <= 40000)) { err.textContent = 'Curb weight should be 1,000 to 40,000 lb.'; return; }
    if (!(wb >= 60 && wb <= 300)) { err.textContent = 'Wheelbase should be 60 to 300 in.'; return; }
    if (!(gc >= 2 && gc <= 30)) { err.textContent = 'Ground clearance should be 2 to 30 in.'; return; }
    var key = $('#c-preset').value, power = $('#c-power').value;
    var trans = power === 'EV' ? 'EV' : $('#c-trans').value;
    var body = /pickup|dually/i.test(key) ? 'Pickup' : (key === 'van' ? 'Van' : (key === 'minivan' ? 'Minivan' : E.BODY_PRESETS[key].label));
    var v = {
      id: 'c' + Date.now(), custom: true, make: 'Custom', model: ($('#c-name').value || '').trim() || E.BODY_PRESETS[key].label,
      yFrom: 0, yTo: 9999, body: body, drives: [$('#c-drive').value], power: power, trans: [trans],
      curb: curb, wb: wb, gc: gc, gvwr: gvwr, dually: $('#c-dually').checked, air: $('#c-air').checked,
      low: gc < E.LOW_CLEARANCE_IN, note: '', conf: 1
    };
    openVehicle(v);
  }

  /* ---------- INFO ---------- */
  function renderInfo() {
    $('#view').innerHTML = '<section class="stack">' +
      '<div class="card"><div class="label">ABOUT</div><div class="big">TowGuide</div>' +
      '<div>Tells you how a vehicle should be towed, which class of truck is needed, whether it will clear the ramp, and how to load and tie it down step by step.</div></div>' +
      '<div class="card edge-warn"><div class="label">READ THIS</div>' + ul([
        'Specs are typical values per model range, not per-VIN. Ground clearance and weight change with trim, tires, load and modifications. Measure on scene.',
        'The tow method comes from the drivetrain (EV, hybrid, AWD/4WD, dual-clutch, FWD, RWD). The vehicle maker\'s owner\'s manual always wins if it differs.',
        'The clearance check models belly breakover at a ramp-to-deck crest. It does not check the front lip, splitter, side skirts or rear diffuser.',
        'Strap and chain ratings, CDL rules and re-check intervals are general information and vary by state and employer. This is not legal advice.'
      ]) + '</div>' +
      '<div class="card"><div class="label">DATA</div><div>' + D.vehicles.length + ' vehicle entries across ' + D.makes.length + ' makes. ' +
      custom.length + ' saved custom vehicle' + (custom.length === 1 ? '' : 's') + ' on this device.</div></div></section>';
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button, [data-open]') : null;
    if (!t) return;
    if (t.hasAttribute('data-tab')) return setTab(t.getAttribute('data-tab'));
    if (t.hasAttribute('data-open')) {
      var v = findVehicle(t.getAttribute('data-open'));
      var pre = t.hasAttribute('data-pre') && state.vin ? { drive: state.vin.drive, trans: state.vin.trans } : null;
      return v && openVehicle(v, pre);
    }
    if (t.id === 'back') { state.cur = null; return render(); }
    if (t.hasAttribute('data-seg')) {
      state.cur.sel[t.getAttribute('data-seg')] = t.getAttribute('data-val');
      renderControlsKeepInputs(); return renderResult();
    }
    if (t.id === 'copy') {
      copyText(E.summaryText(state.cur.last));
      t.textContent = 'Copied'; return setTimeout(function () { t.textContent = 'Copy summary'; }, 1500);
    }
    if (t.id === 'save-custom') { custom.push(state.cur.v); saveCustom(); return renderResult(); }
    if (t.id === 'del-custom') {
      var id = state.cur.v.id; custom = custom.filter(function (c) { return c.id !== id; }); saveCustom();
      state.cur = null; return render();
    }
    if (t.id === 'vin-go') return decodeVin();
    if (t.id === 'vin-ocr') return scanVinPhoto();
    if (t.id === 'vin-barcode-start') return startBarcodeScan();
    if (t.id === 'custom-go') return customGo();
    if (t.hasAttribute('data-vin-custom') && state.vin) {
      var p = state.vin;
      state.prefill = { name: ((p.year || '') + ' ' + p.make + ' ' + p.model).trim(), drive: p.drive, power: p.power, trans: p.trans,
        preset: p.power === 'EV' ? 'evsedan' : E.guessPreset(p.body, p.gvwrLb) };
      state.tab = 'custom'; return render();
    }
  });

  function renderControlsKeepInputs() {
    var keep = {};
    document.querySelectorAll('#controls [data-sel]').forEach(function (el) { keep[el.getAttribute('data-sel')] = el.value; });
    renderControls();
    document.querySelectorAll('#controls [data-sel]').forEach(function (el) {
      var k = el.getAttribute('data-sel');
      if (keep[k] !== undefined) el.value = keep[k];
    });
  }

  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'vin-photo') {
      var file = e.target.files && e.target.files[0];
      state.vinFile = file || null;
      if (state.vinPreviewUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(state.vinPreviewUrl);
      state.vinPreviewUrl = file && window.URL && URL.createObjectURL ? URL.createObjectURL(file) : '';
      state.ocrStatus = file ? 'Photo ready. Tap “Read VIN from photo”.' : '';
      var preview = $('#vin-preview'), status = $('#vin-ocr-status');
      if (preview) { preview.src = state.vinPreviewUrl; preview.hidden = !state.vinPreviewUrl; }
      if (status) status.textContent = state.ocrStatus;
    }
  });

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.id === 'q') { state.q = el.value; return drawList(); }
    if (el.id === 'make') { state.make = el.value; return drawList(); }
    if (el.id === 'year') { state.year = el.value.replace(/\D/g, ''); return drawList(); }
    if (el.id === 'c-preset') {
      var P = E.BODY_PRESETS[el.value];
      $('#c-curb').value = P.curb; $('#c-wb').value = P.wb; $('#c-gc').value = P.gc; $('#c-gvwr').value = P.gvwr || '';
      $('#c-dually').checked = !!P.dually; return;
    }
    if (el.id === 'c-power') { $('#c-trans').disabled = el.value === 'EV'; return; }
    if (el.hasAttribute && el.hasAttribute('data-sel') && state.cur) {
      var k = el.getAttribute('data-sel'), val = parseFloat(el.value);
      state.cur.sel[k] = isFinite(val) ? val : undefined;
      if (k === 'angle' && !isFinite(val)) state.cur.sel.angle = 12;
      renderResult();
    }
  });

  function netBadge() {
    var n = $('#net'); if (!n) return;
    var on = navigator.onLine !== false;
    n.textContent = on ? 'Online' : 'Offline (app works)';
    n.classList.toggle('off', !on);
  }
  window.addEventListener('online', netBadge);
  window.addEventListener('offline', netBadge);

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* ignore */ }); });
  }

  netBadge();
  render();

  // exposed for tests
  window.__tow = { state: state, openVehicle: openVehicle, findVehicle: findVehicle, render: render, extractVinCandidates: extractVinCandidates, extractBarcodeVin: extractBarcodeVin };
})();
