# TowGuide

Android app for tow operators. Pick a vehicle (or decode its VIN) and it tells you:

1. **How to tow it** - flatbed only vs. wheel-lift allowed, and which wheels to lift. Rules cover EV, hybrid, AWD/4WD, dual-clutch, FWD and RWD.
2. **Which truck** - light, medium or heavy duty, sized from curb weight + 15% margin, GVWR and duals.
3. **Will it clear** - belly breakover check at the ramp-to-deck crest, with the max safe angle.
4. **How to load and tie it down** - 8-phase step-by-step procedure, tie-down count and working-load-limit sized to the vehicle, corner-by-corner strap routing, wheel net / ratchet strap / chain and binder technique, gear inspection, troubleshooting, wheel-lift and dolly procedures, and CDL notes.

Works fully offline. VIN decode uses the free NHTSA vPIC service and needs internet.

## Try it on a phone right now (no build)
Host the `www/` folder anywhere (GitHub Pages works), open it in Chrome on the phone, menu > **Install app**.
Local test: `npm run serve`.

## Build the Android APK
**Option A - GitHub (no Android tools needed):** push this folder to a GitHub repo, open the **Actions** tab, run **Build Android APK**, download `TowGuide-debug-apk`. Send the APK to a phone and install it (allow "install unknown apps").

**Option B - Android Studio:** `npm install`, `npx cap sync android`, `npx cap open android`, then Build > Build APK(s).

For the Play Store you need a signed release build (Build > Generate Signed Bundle) and a Google Play developer account.

## Tests
`npm test` runs 47 tests: tow rules, clearance math, tie-down sizing, database integrity (every vehicle x drive x transmission), VIN decode, and UI flows.

## Adding vehicles
Append a row to `ROWS` in `www/data.js` (format documented at the top of the file). `npm test` fails if a row is malformed.

## Important limits
- Specs are typical per model range, not per VIN. Rows marked lower confidence show a warning. Measure on scene.
- The owner's manual and company procedure always win over this app.
- The clearance model covers belly breakover only, not lips, splitters or skirts.
- CDL, strap-rating and re-check guidance is general, not legal advice; rules vary by state.
