# Big Jay's Tow Guide

A mobile-first towing reference app for Big Jay's Towing and Auto Center. Choose a vehicle or decode its VIN to review towing method, truck suitability, ground-clearance risk, and loading/tie-down guidance.

## What it helps operators check

1. **Tow method** - flatbed versus permitted wheel-lift use, including drive-wheel considerations for EVs, hybrids, AWD/4WD, dual-clutch, FWD, and RWD vehicles.
2. **Truck suitability** - light, medium, or heavy-duty recommendations using vehicle weight, a planning margin, GVWR, and dual-wheel considerations.
3. **Ground clearance** - belly breakover at the ramp-to-deck crest and a calculated maximum angle.
4. **Loading and securement** - an eight-phase workflow covering tie-down count, working-load-limit sizing, corner-by-corner routing, wheel nets, ratchet straps, chains and binders, equipment inspection, troubleshooting, wheel-lift and dolly procedures, and CDL notes.

The app works offline after its files are available on the device. VIN decoding uses the free NHTSA vPIC service and therefore requires internet access. The VIN screen also supports taking a photo of the windshield or driver-door VIN label; browser-based OCR reads the photo locally, then the operator must verify the suggested 17 characters before decoding. The OCR engine and its language data are downloaded from a CDN when scanning, so photo recognition requires an internet connection. The photo itself is not sent to the OCR provider or saved by the app.

## Branding and application identity

- Customer-facing name: **Big Jay's Tow Guide**
- Android application ID: com.bigjaysstowing.towguide
- Launcher and web icon artwork: navy, white, and amber tow-truck mark
- Web/PWA icon source: www/icons/icon.svg

## Run as a web app

Host the www/ folder (GitHub Pages works), open it in Chrome on a phone, then use the browser menu and choose **Install app**. For local testing, run npm run serve.

## Build the Android app

1. Run npm install.
2. Run npx cap sync android.
3. Open the project with npx cap open android, or build from the Android folder with ./gradlew assembleDebug (Windows: gradlew.bat assembleDebug).
4. The debug APK is written to android/app/build/outputs/apk/debug/app-debug.apk.

A Play Store release requires a separately signed release build and a Google Play developer account.

## Tests

Run npm test for the tow-rule, clearance, tie-down, vehicle-database, VIN-decoding, and UI regression tests.

## Adding vehicles

Append a row to ROWS in www/data.js (format documented at the top of that file). The test suite checks row structure and database integrity.

## Operational limits

- Vehicle specifications are typical for a model range, not guaranteed VIN-specific values. Treat lower-confidence entries cautiously and verify the vehicle on scene.
- The vehicle owner's manual and company procedures take precedence.
- The clearance calculation covers belly breakover only; it does not model lips, splitters, skirts, or every underbody obstruction.
- CDL, strap-rating, and re-check guidance is general information, not legal advice. Requirements vary by jurisdiction.
