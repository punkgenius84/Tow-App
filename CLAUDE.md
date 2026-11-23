# Big Jay's Tow Guide — project rules

Capacitor 7 Android app, plain JS. `www/engine.js` (tow rules), `www/data.js` (vehicle database), `www/app.js` (UI).
GitHub Actions on `main` builds the APK.

## Rules
- Run `npm test` before every commit; all tests must pass.
- Do not change the VIN barcode/photo scanner code (`NativeBarcodeScannerActivity`, OCR, CameraX) unless asked — it works.
- Vehicle data is safety data. Values are conservative per model range: LOWEST common ground clearance, LONGEST common
  wheelbase, HEAVIEST common curb weight, highest GVWR. Unconfirmed rows carry `c: 0` (shown as a warning in the app).
- Never hand-edit the ROWS block in `www/data.js`. Edit `tools/vehicle-db/data/*.json`, then run
  `python3 tools/vehicle-db/merge.py` (use the `vehicle-db` skill).
- Vehicle ids are stable (`make-model-firstyear`); renaming a model changes its id.
- Model names must match what NHTSA vPIC decodes (e.g. BMW "330i", not "3 Series") or VIN matching fails.

## Map
- `tests/engine.test.js`, `tests/ui.test.js` — node:test + jsdom
- `tools/vehicle-db/` — research spec, validator, merge, sanity check, source JSON per make group
- `docs/VEHICLE_SOURCES.md` — generated; every row with its sources
