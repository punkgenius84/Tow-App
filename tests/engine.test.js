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
test('EV is flatbed only', () => {
  const r = E.recommend(find('Tesla', 'Model 3'), { drive: 'RWD' });
  assert.equal(r.method.flatbedOnly, true);
  assert.match(r.method.primary, /Flatbed/);
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
  const r = E.recommend(find('Toyota', 'Prius'), { drive: 'FWD' });
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
test('breakover formula: (wb/4)*sin(angle)', () => {
  const k = E.clearanceCheck({ wb: 100, gc: 6, angle: 30, low: false, measured: false, conf: 1 });
  assert.equal(k.neededIn, 12.5);              // 100/4 * 0.5
});

test('max safe angle is asin(4*gc/wb)', () => {
  const k = E.clearanceCheck({ wb: 100, gc: 12.5, angle: 10, low: false, measured: false, conf: 1 });
  assert.equal(k.maxAngleDeg, 30);             // asin(0.5)
});

test('Mustang scrapes on a standard bed, clears on a low-angle bed', () => {
  const v = find('Ford', 'Mustang');
  assert.equal(E.recommend(v, { angle: 12 }).clearance.status, 'fail');
  assert.equal(E.recommend(v, { angle: 8 }).clearance.status, 'ok');
});

test('tall trucks clear a standard bed', () => {
  assert.equal(E.recommend(find('Jeep', 'Wrangler Unlimited (JL)')).clearance.status, 'ok');
});

test('status bands: ok >= 1.15, marginal >= 0.90, fail below', () => {
  const mk = gc => E.clearanceCheck({ wb: 100, gc, angle: 30, low: false, measured: false, conf: 1 }).status;  // need 12.5
  assert.equal(mk(14.4), 'ok');
  assert.equal(mk(13), 'marginal');
  assert.equal(mk(11.3), 'marginal');
  assert.equal(mk(11.2), 'fail');
});

test('measured clearance overrides the database value', () => {
  const v = find('Ford', 'Mustang');
  const r = E.recommend(v, { angle: 12, gc: 7 });
  assert.equal(r.clearance.gc, 7);
  assert.equal(r.clearance.status, 'ok');
  assert.equal(r.spec.measured, true);
});

test('wheelbase 0 / bad numbers never produce NaN', () => {
  const r = E.recommend(find('Ford', 'Mustang'), { gc: NaN, wb: -3, angle: 0 });
  assert.ok(Number.isFinite(r.clearance.neededIn));
  assert.ok(Number.isFinite(r.clearance.maxAngleDeg));
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

/* ---------- database integrity ---------- */
test('database rows are well formed and unique', () => {
  const seen = new Set();
  for (const v of D.vehicles) {
    const id = v.make + '|' + v.model + '|' + v.yFrom;
    assert.ok(!seen.has(id), 'duplicate ' + id);
    seen.add(id);
    assert.ok(v.make && v.model && v.body, id);
    assert.ok(v.yFrom >= 1990 && v.yTo <= 2030 && v.yFrom <= v.yTo, 'years ' + id);
    assert.ok(v.drives.length >= 1 && v.drives.every(d => ['FWD', 'RWD', 'AWD', '4WD'].includes(d)), 'drives ' + id);
    assert.ok(['ICE', 'HEV', 'PHEV', 'EV'].includes(v.power), 'power ' + id);
    assert.ok(v.trans.every(t => ['AT', 'CVT', 'MT', 'DCT', 'EV'].includes(t)), 'trans ' + id);
    assert.ok(v.curb >= 2000 && v.curb <= 12000, 'curb ' + id);
    assert.ok(v.wb >= 95 && v.wb <= 190, 'wheelbase ' + id);
    assert.ok(v.gc >= 3.5 && v.gc <= 12, 'clearance ' + id);
    if (v.gvwr) assert.ok(v.gvwr >= v.curb, 'gvwr below curb ' + id);
    if (v.power === 'EV') assert.deepEqual(v.trans, ['EV'], 'EV trans ' + id);
  }
  assert.ok(D.vehicles.length >= 90);
});

test('every vehicle produces a complete recommendation for every drive and transmission', () => {
  for (const v of D.vehicles) {
    for (const drive of v.drives) {
      for (const trans of v.trans) {
        const r = E.recommend(v, { drive, trans });
        assert.ok(r.method.primary && r.truck.label && r.tiedown.steps.tiedown.length, v.model);
        assert.ok(Number.isFinite(r.clearance.neededIn) && Number.isFinite(r.clearance.maxAngleDeg), v.model);
        if (v.power === 'EV' || drive === 'AWD' || drive === '4WD') assert.equal(r.method.flatbedOnly, true, v.model + ' ' + drive);
      }
    }
  }
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
  assert.equal(ms[0].model, 'Camry Hybrid');
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
