'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../www/engine.js');
const D = require('../www/data.js');

const find = (make, model) => {
  const v = D.vehicles.find(x => x.make === make && x.model === model);
  assert.ok(v, 'missing vehicle ' + make + ' ' + model);
  return v;
};

/* ---------- tow method ---------- */
test('resolved vehicle carries catalog dimensions and their provenance', () => {
  const v = find('Honda', 'Passport');
  const r = E.recommend(v);
  assert.equal(r.spec.len, 189.1);
  assert.equal(r.spec.wid, 78.6);
  assert.equal(r.spec.ht, 72.2);
  assert.equal(r.spec.dimensionsVerified, true);
  assert.equal(r.spec.sourceYear, 2025);
});

test('catalog dimensions are not treated as on-scene measurements', () => {
  const r = E.recommend(find('Ford', 'Mustang'));
  assert.equal(r.spec.measured, false);
  assert.equal(r.clearance.status, 'unknown');
});

test('EV is flatbed only', () => {
  const r = E.recommend(find('Tesla', 'Model 3'), { drive: 'RWD' });
  assert.equal(r.method.flatbedOnly, true);
  assert.match(r.method.primary, /Flatbed/);
  assert.match(r.method.why.join(' '), /model-specific/);
});

test('AWD and 4WD are flatbed only', () => {
  assert.equal(E.recommend(find('Subaru', 'Outback')).method.flatbedOnly, true);
  assert.equal(E.recommend(find('Ford', 'F-150'), { drive: '4WD' }).method.flatbedOnly, true);
  assert.equal(E.recommend(find('Toyota', 'Camry'), { drive: 'AWD' }).method.flatbedOnly, true);
});

test('dual-clutch is flatbed only even when RWD', () => {
  const r = E.recommend(find('Chevrolet', 'Corvette (C8)'));
  assert.equal(r.spec.trans, 'DCT');
  assert.equal(r.method.flatbedOnly, true);
});

test('FWD automatic: lift the front (drive) wheels, never the rear', () => {
  const r = E.recommend(find('Toyota', 'Corolla'));
  assert.equal(r.method.flatbedOnly, false);
  assert.ok(r.method.alternates.some(a => /FRONT/.test(a)));
  assert.ok(r.method.never.some(a => /rear/i.test(a)));
  assert.ok(r.tiedown.wheelLift.some(s => /FRONT/.test(s)));
});

test('RWD automatic: lift the rear (drive) wheels or pull the driveshaft', () => {
  const r = E.recommend(find('Ford', 'F-150'), { drive: 'RWD' });
  assert.equal(r.method.flatbedOnly, false);
  assert.ok(r.method.alternates.some(a => /REAR/.test(a)));
  assert.ok(r.method.alternates.some(a => /driveshaft/i.test(a)));
});

test('hybrid FWD is explained as hybrid', () => {
  const r = E.recommend(find('Toyota', 'Prius (2016-2022)'), { drive: 'FWD' });
  assert.equal(r.method.flatbedOnly, false);
  assert.ok(r.method.why.some(w => /Hybrid/.test(w)));
});

test('selection falls back to a valid drive and transmission', () => {
  const r = E.recommend(find('Toyota', 'Corolla'), { drive: '4WD', trans: 'DCT' });
  assert.equal(r.spec.drive, 'FWD');
  assert.equal(r.spec.trans, 'CVT');
});

/* ---------- truck class ---------- */
test('half-ton pickup needs a light-duty unit', () => {
  const r = E.recommend(find('Ford', 'F-150'));
  assert.equal(r.truck.id, 'light');
  assert.equal(r.truck.requiredLb, Math.round(5000 * 1.15));
});

test('dually pickups need at least medium-duty', () => {
  for (const [mk, md] of [['Ford', 'F-350 Super Duty (dually)'], ['Ram', '3500 (dually)'], ['Chevrolet', 'Silverado 3500HD (dually)']]) {
    assert.notEqual(E.recommend(find(mk, md)).truck.id, 'light', md);
  }
});

test('GVWR over 10,000 lb forces medium-duty even with a light curb weight', () => {
  const t = E.truckClass(E.resolve({ curb: 6800, gvwr: 10001, wb: 150, gc: 8, drives: ['RWD'], trans: ['AT'], power: 'ICE' }, {}));
  assert.equal(t.id, 'medium');
});

test('extra cargo weight can bump the class', () => {
  const v = find('Ford', 'F-150');
  assert.equal(E.recommend(v, { extraLb: 0 }).truck.id, 'light');
  assert.equal(E.recommend(v, { extraLb: 5000 }).truck.id, 'medium');
});

test('very heavy vehicles reach heavy-duty', () => {
  const t = E.truckClass(E.resolve({ curb: 20000, wb: 200, gc: 10, drives: ['RWD'], trans: ['AT'], power: 'ICE' }, {}));
  assert.equal(t.id, 'heavy');
});

/* ---------- clearance math ---------- */

test('unverified catalog dimensions never produce a positive clearance verdict', () => {
  const vehicle = D.vehicles.find(v => v.make === 'Mazda' && v.model === '6 i Grand Touring');
  const estimate = E.recommend(vehicle, {});
  assert.equal(estimate.clearance.status, 'unknown');
  assert.match(estimate.clearance.advice.join(' '), /NO CLEARANCE VERDICT/);
  const onlyClearance = E.resolve(vehicle, { gc: 5.5 });
  assert.equal(onlyClearance.measured, false);
  assert.equal(E.clearanceCheck(onlyClearance).status, 'unknown');
  const measured = E.resolve(vehicle, { gc: 5.5, wb: 107.4 });
  assert.equal(measured.measured, true);
  assert.notEqual(E.clearanceCheck(measured).status, 'unknown');
});
test('breakover formula: (wb/4)*sin(angle)', () => {
  const k = E.clearanceCheck({ wb: 100, gc: 6, angle: 30, low: false, measured: true, conf: 1 });
  assert.equal(k.neededIn, 12.5);              // 100/4 * 0.5
});

test('max recommended angle preserves the 1.5-inch reserve', () => {
  const k = E.clearanceCheck({ wb: 100, gc: 12.5, angle: 10, low: false, measured: true, conf: 1 });
  assert.ok(k.maxAngleDeg < 30);
  assert.ok(k.maxAngleDeg > 25);
});

test('Mustang scrapes on a standard bed, clears on a low-angle bed', () => {
  const v = find('Ford', 'Mustang');
  assert.equal(E.recommend(v, { angle: 12, gc: v.gc, wb: v.wb }).clearance.status, 'fail');
  assert.equal(E.recommend(v, { angle: 6, gc: v.gc, wb: v.wb }).clearance.status, 'ok');
});

test('tall trucks clear a standard bed', () => {
  assert.equal(E.recommend(find('Jeep', 'Wrangler Unlimited (JL)'), { gc: 9.7, wb: 118.4 }).clearance.status, 'ok');
});

test('clearance bands reserve 1.5 inches for uneven pavement and variation', () => {
  const mk = gc => E.clearanceCheck({ wb: 100, gc, angle: 10, low: false, measured: true, conf: 1 }).status;
  // At 100-inch wheelbase and 10 degrees, the modeled crest rise is about 4.3 inches.
  assert.equal(mk(6.0), 'ok');       // about 1.7 inches remaining
  assert.equal(mk(5.8), 'marginal'); // about 1.5 inches remaining (below reserve)
  assert.equal(mk(4.8), 'fail');     // about 0.5 inches remaining
  assert.equal(mk(4.5), 'fail');
});

test('Mazda 6 5.5-inch clearance needs a low-angle carrier, not a barely-clear pass', () => {
  const mazda = find('Mazda', '6 i Grand Touring');
  assert.equal(mazda.gc, 5.5);
  const standard = E.recommend(mazda, { angle: 12, gc: 5.5, wb: mazda.wb });
  assert.equal(standard.clearance.status, 'fail');
  assert.match(standard.clearance.setup, /low-deck, long-bed rollback/i);
  const lowAngle = E.recommend(mazda, { angle: 6, gc: 5.5, wb: mazda.wb });
  assert.equal(lowAngle.clearance.status, 'ok');
  assert.ok(lowAngle.clearance.remainingIn >= 1.5);
});

test('measured clearance overrides the database value', () => {
  const v = find('Ford', 'Mustang');
  const r = E.recommend(v, { angle: 12, gc: 7.2, wb: v.wb });
  assert.equal(r.clearance.gc, 7.2);
  assert.equal(r.clearance.status, 'ok');
  assert.equal(r.spec.measured, true);
});

test('wheelbase 0 / bad numbers never produce NaN', () => {
  const r = E.recommend(find('Ford', 'Mustang'), { gc: NaN, wb: -3, angle: 0 });
  assert.equal(r.clearance.status, 'unknown');
  assert.equal(r.clearance.neededIn, '—');
});

/* ---------- tie-down plan ---------- */
test('tie-down plan sizes WLL from weight', () => {
  const r = E.recommend(find('Ford', 'F-150'));          // 5,000 lb
  const td = r.tiedown;
  assert.equal(td.count, 4);
  assert.equal(td.legalAggLb, 2500);                     // 50% of weight
  assert.equal(td.recAggLb, 5000);
  assert.equal(td.perTiedownLb, 1300);                   // 5000/4 = 1250 -> next 100
  assert.match(td.gear, /2-inch ratchet/);
});

test('heavy or long vehicles get six tie-downs and chain', () => {
  const r = E.recommend(find('Ford', 'F-350 Super Duty (dually)'));
  assert.equal(r.tiedown.count, 6);
  assert.ok(r.tiedown.perTiedownLb * 6 >= r.tiedown.recAggLb);
});

test('tie-down procedure has every phase with real steps', () => {
  const td = E.recommend(find('Toyota', 'Corolla')).tiedown;
  for (const k of ['before', 'prepare', 'setup', 'load', 'tiedown', 'final', 'road', 'unload']) {
    assert.ok(Array.isArray(td.steps[k]) && td.steps[k].length >= 3, k);
    td.steps[k].forEach(s => assert.ok(typeof s === 'string' && s.length > 20, k + ': ' + s));
  }
  assert.ok(td.operator.some(s => /26,001/.test(s)));
  assert.ok(td.steps.road.some(s => /50 miles/.test(s)));
  assert.ok(td.glossary.length >= 5);
});

test('hands-on technique cards are complete', () => {
  const T = E.recommend(find('Toyota', 'Corolla')).tiedown.techniques;
  assert.equal(T.corners.length, 4);
  assert.equal(E.recommend(find('Ford', 'F-350 Super Duty (dually)')).tiedown.techniques.corners.length, 5);
  for (const k of ['wheelNets', 'straps', 'chains', 'inspect']) {
    assert.ok(T[k].length >= 5, k);
  }
  assert.ok(T.problems.length >= 5 && T.problems.every(p => p.length === 2 && p[1].length > 20));
  assert.ok(T.chains.some(s => /grade 70/i.test(s)));
  assert.ok(T.straps.some(s => /ratchet/i.test(s)));
});

test('flatbed-only vehicles have no wheel-lift procedure', () => {
  assert.equal(E.recommend(find('Tesla', 'Model 3')).tiedown.wheelLift, null);
  assert.notEqual(E.recommend(find('Toyota', 'Corolla')).tiedown.wheelLift, null);
});

test('EV tie-down advice says not to strap the underbody', () => {
  const td = E.recommend(find('Tesla', 'Model 3')).tiedown;
  assert.ok(td.methodAdvice.some(s => /underbody/i.test(s)));
});

test('low car gets ramp-extension step', () => {
  const td = E.recommend(find('Ford', 'Mustang')).tiedown;
  assert.ok(td.steps.setup.some(s => /ramp extensions/i.test(s)));
});

test('summary text mentions method, truck, clearance and tie-downs', () => {
  const t = E.summaryText(E.recommend(find('Ford', 'Mustang')));
  assert.match(t, /Method:/);
  assert.match(t, /Truck:/);
  assert.match(t, /Clearance:/);
  assert.match(t, /Tie-downs:/);
});


test('all unverified catalog rows remain low-confidence until OEM provenance is reviewed', () => {
  const curated = D.vehicles.filter(v => !v.agg);
  assert.equal(curated.length, 301, '297 unverified estimate rows + 4 OEM-verified rows');
  assert.ok(D.vehicles.length > 298, 'bulk rows imported');
  for (const v of D.vehicles) {
    const id = v.make + ' ' + v.model + ' ' + v.yFrom;
    if (v.source) {
      // OEM-verified: only with an https primary source and a source year inside the row's years
      assert.equal(v.conf, 1, id);
      assert.match(v.source, /^https:\/\//, id);
      assert.ok(v.sourceYear >= v.yFrom && v.sourceYear <= v.yTo, id + ' source year outside row years');
      assert.ok(!v.agg, id + ' aggregator rows can never be verified');
    } else {
      assert.equal(v.conf, 0, id + ' must not imply verified specs');
      assert.equal(v.sourceYear, 0, id + ' has no reviewed source year yet');
    }
  }
});

test('2025 Toyota Crown Signia has exact single-year OEM specifications', () => {
  const v = find('Toyota', 'Crown Signia');
  assert.equal(v.yFrom, 2025);
  assert.equal(v.yTo, 2025);
  assert.equal(v.conf, 1);
  assert.equal(v.source, 'https://www.toyota.com/content/dam/toyota/brochures/pdf/2025/toyotacrownsignia_ebrochure.pdf');
  assert.equal(v.sourceYear, 2025);
  assert.deepEqual(v.drives, ['AWD']);
  assert.equal(v.power, 'HEV');
  assert.deepEqual(v.trans, ['CVT']);
  assert.equal(v.curb, 4210);
  assert.equal(v.wb, 112.2);
  assert.equal(v.gc, 6.7);
  assert.equal(v.len, 194.1);
  assert.equal(v.wid, 74.0);
  assert.equal(v.ht, 64.0);
  const recommendation = E.recommend(v);
  assert.equal(recommendation.method.flatbedOnly, true);
  assert.equal(recommendation.clearance.status, 'unknown');
});

/* ---------- database integrity ---------- */
test('US model-year catalog includes 1980-era Subaru and Mazda entries', () => {
  assert.ok(find('Subaru', 'BRAT').yFrom <= 1980);
  assert.ok(find('Subaru', 'Loyale / DL / GL').yFrom <= 1980);
  assert.ok(find('Mazda', '626').yFrom <= 1980);
  assert.ok(find('Mazda', 'RX-7').yFrom <= 1980);
});

test('database rows are well formed and unique', () => {
  const seen = new Set();
  for (const v of D.vehicles) {
    const id = v.make + '|' + v.model + '|' + v.yFrom;
    assert.ok(!seen.has(id), 'duplicate ' + id);
    seen.add(id);
    assert.ok(v.make && v.model && v.body, id);
    assert.ok(v.yFrom >= 1980 && v.yTo <= 2030 && v.yFrom <= v.yTo, 'years ' + id);
    assert.ok(v.drives.length >= 1 && v.drives.every(d => ['FWD', 'RWD', 'AWD', '4WD'].includes(d)), 'drives ' + id);
    assert.ok(['ICE', 'HEV', 'PHEV', 'EV'].includes(v.power), 'power ' + id);
    assert.ok(v.trans.every(t => ['AT', 'CVT', 'MT', 'DCT', 'EV'].includes(t)), 'trans ' + id);
    assert.ok(v.curb >= 1500 && v.curb <= 12000, 'curb ' + id);
    assert.ok(v.wb === 0 || (v.wb >= 70 && v.wb <= 190), 'wheelbase ' + id);
    assert.ok(v.gc === 0 || (v.gc >= 3.5 && v.gc <= 18), 'clearance ' + id);
    if (v.len) assert.ok(v.len >= 100 && v.len <= 280, 'length ' + id);
    if (v.wid) assert.ok(v.wid >= 55 && v.wid <= 100, 'width ' + id);
    if (v.ht) assert.ok(v.ht >= 40 && v.ht <= 110, 'height ' + id);
    if (v.gvwr) assert.ok(v.gvwr >= v.curb, 'gvwr below curb ' + id);
    if (v.power === 'EV') assert.deepEqual(v.trans, ['EV'], 'EV trans ' + id);
  }
  assert.ok(D.vehicles.length >= 165);
  for (const make of ['Subaru', 'Mazda', 'Mercedes-Benz', 'Audi', 'BMW', 'Volkswagen', 'Hyundai', 'Kia', 'Volvo', 'Lexus']) {
    assert.ok(D.makes.includes(make), 'missing manufacturer ' + make);
  }
});

test('every vehicle produces a complete recommendation for every drive and transmission', () => {
  for (const v of D.vehicles) {
    for (const drive of v.drives) {
      for (const trans of v.trans) {
        const r = E.recommend(v, { drive, trans });
        assert.ok(r.method.primary && r.truck.label && r.tiedown.steps.tiedown.length, v.model);
        assert.equal(r.clearance.status, 'unknown', v.model);
        if (v.power === 'EV' || drive === 'AWD' || drive === '4WD') assert.equal(r.method.flatbedOnly, true, v.model + ' ' + drive);
      }
    }
  }
});


test('generation-split catalog entries match model years without reusing a cross-generation row', () => {
  const by = (make, model, year) => {
    const found = D.vehicles.filter(v => v.make === make && v.model === model && year >= v.yFrom && year <= v.yTo);
    assert.equal(found.length, 1, make + ' ' + model + ' ' + year + ' should resolve to one generation row');
    return found[0];
  };
  assert.equal(by('Mazda', 'MX-5 Miata (NA)', 1995).conf, 0);
  assert.equal(by('Mazda', 'MX-5 Miata (NB)', 2002).yFrom, 1999);
  assert.equal(by('Mazda', 'MX-5 Miata (NC)', 2010).yTo, 2015);
  assert.equal(by('Mazda', 'MX-5 Miata (ND)', 2024).yFrom, 2016);
  assert.equal(by('BMW', '3 Series (E46)', 2004).yTo, 2006);
  assert.equal(by('BMW', '3 Series (G20)', 2022).yFrom, 2019);
  assert.equal(by('Mercedes-Benz', 'C-Class (W205)', 2018).yTo, 2021);
  assert.equal(by('Mercedes-Benz', 'E-Class (W214)', 2025).yFrom, 2024);
  assert.equal(by('Mercedes-Benz', 'S-Class (W223)', 2022).yFrom, 2021);
  for (const v of D.vehicles) if (!v.source) assert.equal(v.conf, 0, v.make + ' ' + v.model);
});

/* ---------- VIN decode ---------- */
const sample = (o) => ({ Results: [Object.assign({ Make: 'FORD', Model: 'F-150', ModelYear: '2021', BodyClass: 'Pickup',
  DriveType: '4WD/4-Wheel Drive/4x4', FuelTypePrimary: 'Gasoline', ElectrificationLevel: '', TransmissionStyle: 'Automatic',
  GVWR: 'Class 2E: 6,001 - 7,000 lb (2,722 - 3,175 kg)', ErrorText: '0 - VIN decoded clean' }, o)] });

test('VIN validation', () => {
  assert.equal(E.validVin('1FTFW1E50NFA00000'), true);
  assert.equal(E.validVin('1FTFW1E50NFA0000'), false);
  assert.equal(E.validVin('1FTFW1E50NFA0000O'), false);
});

test('VIN decode maps fields', () => {
  const p = E.parseVinDecode(sample());
  assert.equal(p.make, 'Ford'); assert.equal(p.model, 'F-150'); assert.equal(p.year, 2021);
  assert.equal(p.drive, '4WD'); assert.equal(p.power, 'ICE'); assert.equal(p.trans, 'AT'); assert.equal(p.gvwrLb, 7000);
  assert.equal(p.ok, true);
});

test('VIN decode: AWD, FWD, 4x2 and electric/hybrid/dual-clutch', () => {
  assert.equal(E.mapDrive('AWD/All-Wheel Drive'), 'AWD');
  assert.equal(E.mapDrive('FWD/Front-Wheel Drive'), 'FWD');
  assert.equal(E.mapDrive('RWD/Rear-Wheel Drive'), 'RWD');
  assert.equal(E.mapDrive('4x2'), null);
  assert.equal(E.mapPower('BEV (Battery Electric Vehicle)', 'Electric'), 'EV');
  assert.equal(E.mapPower('HEV (Hybrid Electric Vehicle) - Full', 'Gasoline'), 'HEV');
  assert.equal(E.mapPower('PHEV (Plug-in Hybrid Electric Vehicle)', 'Gasoline'), 'PHEV');
  assert.equal(E.mapPower('MHEV (Mild Hybrid Electric Vehicle)', 'Gasoline'), 'ICE');
  assert.equal(E.mapTrans('Dual-Clutch Transmission (DCT)'), 'DCT');
  assert.equal(E.mapTrans('Continuously Variable Transmission (CVT)'), 'CVT');
  assert.equal(E.mapTrans('Manual/Standard'), 'MT');
});

test('VIN match finds the right database entry', () => {
  let ms = E.matchVehicles(D.vehicles, E.parseVinDecode(sample()));
  assert.equal(ms[0].model, 'F-150');
  ms = E.matchVehicles(D.vehicles, E.parseVinDecode(sample({ Make: 'GMC', Model: 'Sierra 1500', ModelYear: '2022' })));
  assert.equal(ms[0].make, 'GMC');
  ms = E.matchVehicles(D.vehicles, E.parseVinDecode(sample({ Make: 'JEEP', Model: 'Wrangler', ModelYear: '2012' })));
  assert.equal(ms[0].model, 'Wrangler Unlimited (JK)');
  ms = E.matchVehicles(D.vehicles, E.parseVinDecode(sample({ Make: 'TOYOTA', Model: 'Camry', ModelYear: '2022', ElectrificationLevel: 'HEV (Hybrid Electric Vehicle) - Full' })));
  assert.equal(ms[0].model, 'Camry Hybrid (2018-2024)');
});

test('VIN match returns nothing for unknown vehicles and bad payloads', () => {
  assert.deepEqual(E.matchVehicles(D.vehicles, E.parseVinDecode(sample({ Make: 'LADA', Model: 'Niva' }))), []);
  assert.equal(E.parseVinDecode({}), null);
  assert.deepEqual(E.matchVehicles(D.vehicles, null), []);
});

test('body-type guess for unlisted vehicles', () => {
  assert.equal(E.guessPreset('Pickup', 7000), 'pickup');
  assert.equal(E.guessPreset('Pickup', 9900), 'hdpickup');
  assert.equal(E.guessPreset('Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)', 5000), 'crossover');
  assert.equal(E.guessPreset('Coupe', 0), 'sports');
  assert.equal(E.guessPreset('Minivan', 0), 'minivan');
});


test('bulk aggregator rows are tagged, low-confidence, and never carry a verified source', () => {
  const bulk = D.vehicles.filter(v => v.agg);
  assert.ok(bulk.length >= 1500, 'expected bulk import, got ' + bulk.length);
  for (const v of bulk) {
    const id = v.make + ' ' + v.model + ' ' + v.yFrom;
    assert.equal(v.conf, 0, id);
    assert.equal(v.source, '', id + ' aggregator rows must not claim a verified source');
    assert.match(v.agg, /autoevolution/, id);
    assert.match(v.note, /UNVERIFIED/, id + ' note must say unverified');
    assert.match(v.note, /Source variants:/, id + ' note must keep variant ranges');
  }
});

test('every bulk row has a matching audit CSV row marked AGGREGATOR_UNVERIFIED', () => {
  const fs = require('node:fs'), path = require('node:path');
  const lines = fs.readFileSync(path.join(__dirname, '..', 'docs', 'vehicle-catalog-audit.csv'), 'utf8').trim().split('\n');
  const agg = lines.filter(l => l.includes('"AGGREGATOR_UNVERIFIED"')).length;
  assert.equal(agg, D.vehicles.filter(v => v.agg).length);
  assert.equal(lines.length - 1, D.vehicles.length, 'audit CSV must track every catalog row');
});


test('unknown catalog clearance/wheelbase stay unknown: never low-flagged, never a verdict', () => {
  const unk = D.vehicles.filter(v => v.agg && (v.gc === 0 || v.wb === 0));
  assert.ok(unk.length > 0, 'expected rows with unknown clearance or wheelbase');
  for (const v of unk) {
    const id = v.make + ' ' + v.model + ' ' + v.yFrom;
    assert.match(v.note, /NOT IN SOURCE/, id);
    const r = E.recommend(v, { drive: v.drives[0], trans: v.trans[0] });
    assert.equal(r.clearance.status, 'unknown', id);
    if (v.gc === 0) assert.equal(r.spec.low, !!v.low, id + ' unknown clearance must not set the low flag');
  }
  const r = E.recommend(unk[0], { drive: unk[0].drives[0], trans: unk[0].trans[0], gc: 6, wb: 110 });
  assert.notEqual(r.clearance.status, 'unknown', 'measured values still produce a verdict');
});

test('pickups do not offer FWD except for known FWD-based models', () => {
  for (const v of D.vehicles) {
    if (/Pickup/.test(v.body) && v.drives.includes('FWD')) {
      assert.match(v.model, /maverick|ridgeline|santa cruz|rampage|caddy|rabbit/i, v.make + ' ' + v.model);
    }
  }
});

test('broad or lumped hand-entered rows carry an explicit warning note', () => {
  const broad = D.vehicles.filter(v => !v.agg && v.yTo - v.yFrom >= 8);
  assert.ok(broad.length > 0);
  for (const v of broad) assert.match(v.note, /BROAD YEAR RANGE/, v.make + ' ' + v.model);
  for (const v of D.vehicles.filter(v => !v.agg && / \/ /.test(v.model))) assert.match(v.note, /LUMPED ENTRY/, v.model);
});

test('bulk rows expose length/width/height when the source has them', () => {
  const withDims = D.vehicles.filter(v => v.agg && v.len && v.wid && v.ht);
  assert.ok(withDims.length >= 1000, 'dimension coverage ' + withDims.length);
});


test('OEM-verified rows still never produce a clearance verdict without on-scene measurements', () => {
  const ver = D.vehicles.filter(v => v.source);
  assert.equal(ver.length, 4);
  for (const v of ver) {
    const r = E.recommend(v, { drive: v.drives[0], trans: v.trans[0] });
    assert.equal(r.clearance.status, 'unknown', v.model);
    assert.ok(v.len && v.wid && v.ht && v.wb && v.gc, v.model + ' complete dimensions');
  }
});


test('audit CSV source URLs are in the correct column and verified rows are single-year scoped', () => {
  const fs = require('node:fs'), path = require('node:path');
  const lines = fs.readFileSync(path.join(__dirname, '..', 'docs', 'vehicle-catalog-audit.csv'), 'utf8').trim().split('\n');
  for (const line of lines.slice(1)) {
    const cols = [...line.matchAll(/"(?:[^"]|"")*"/g)].map(m => m[0].slice(1, -1).replace(/""/g, '"'));
    const status = cols[12], sourceUrl = cols[13];
    if (sourceUrl) assert.match(sourceUrl, /^https:\/\//, cols[0] + ' ' + cols[1] + ' source URL column');
    if (status === 'OEM_VERIFIED') {
      assert.equal(cols[11], 'OEM_VERIFIED_SINGLE_YEAR', cols[0] + ' ' + cols[1]);
      assert.equal(cols[2], cols[3], cols[0] + ' ' + cols[1] + ' must be single-year scoped');
      assert.match(sourceUrl, /^https:\/\//, cols[0] + ' ' + cols[1]);
      assert.equal(cols[15], cols[2], cols[0] + ' ' + cols[1] + ' source year must match row year');
    }
  }
});

test('every OEM-verified row has an OEM_VERIFIED audit CSV row with the same source URL', () => {
  const fs = require('node:fs'), path = require('node:path');
  const text = fs.readFileSync(path.join(__dirname, '..', 'docs', 'vehicle-catalog-audit.csv'), 'utf8');
  for (const v of D.vehicles.filter(v => v.source)) assert.ok(text.includes('"OEM_VERIFIED"') && text.includes('"' + v.source + '"'), v.model);
});


test('unverified catalog curb weight produces an explicitly provisional truck class', () => {
  const v = find('Ford', 'F-150');
  assert.equal(v.conf, 0);
  const t = E.recommend(v).truck;
  assert.equal(t.provisional, true);
  assert.equal(t.weightConfirmed, false);
  assert.match(t.label, /^Provisional/);
  assert.ok(t.reasons.some(x => /unverified catalog estimate/i.test(x)));
});

test('unverified catalog GVWR cannot silently upgrade truck class', () => {
  const t = E.truckClass(E.resolve({
    curb: 6800, gvwr: 14000, wb: 150, gc: 8,
    drives: ['RWD'], trans: ['AT'], power: 'ICE', conf: 0
  }, {}));
  assert.equal(t.id, 'light');
  assert.equal(t.gvwrConfirmed, false);
  assert.ok(t.reasons.some(x => /GVWR is unverified/i.test(x)));
  assert.equal(t.provisional, true);
});

test('operator-entered curb weight and GVWR overrides are treated as confirmed inputs', () => {
  const v = find('Ford', 'F-150');
  const curbOnly = E.recommend(v, { curb: 6200 }).truck;
  assert.equal(curbOnly.provisional, false);
  assert.equal(curbOnly.weightConfirmed, true);
  assert.equal(curbOnly.gvwrConfirmed, false);
  const withGvwr = E.recommend(v, { curb: 6200, gvwrOverride: 14000 }).truck;
  assert.equal(withGvwr.gvwrConfirmed, true);
  assert.equal(withGvwr.id, 'medium');
});


test('2025 Camry Hybrid uses Toyota OEM dimensions and conservative trim-weight maximum', () => {
  const v = find('Toyota', 'Camry Hybrid (2025)');
  assert.equal(v.conf, 1);
  assert.equal(v.sourceYear, 2025);
  assert.match(v.source, /^https:\/\//);
  assert.equal(v.gc, 5.4);
  assert.equal(v.wb, 111.2);
  assert.equal(v.curb, 3682);
  assert.equal(v.len, 193.5);
  assert.equal(v.wid, 72.4);
  assert.equal(v.ht, 56.9);
  const r = E.recommend(v, {});
  assert.equal(r.clearance.status, 'unknown', 'OEM catalog values still cannot replace on-scene measurements');
});
