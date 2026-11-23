# Big Jay's Tow Guide

A mobile-first towing reference app for Big Jay's Towing and Auto Center. Choose a vehicle or decode its VIN to review towing method, truck suitability, ground-clearance risk, and loading/tie-down guidance.

## What it helps operators check

1. **Tow method** - flatbed versus permitted wheel-lift use, including drive-wheel considerations for EVs, hybrids, AWD/4WD, dual-clutch, FWD, and RWD vehicles.
2. **Truck suitability** - light, medium, or heavy-duty recommendations using vehicle weight, a planning margin, GVWR, and dual-wheel considerations.
3. **Ground clearance** - belly breakover at the ramp-to-deck crest and a calculated maximum angle.
4. **Loading and securement** - an eight-phase workflow covering tie-down count, working-load-limit sizing, corner-by-corner routing, wheel nets, ratchet straps, chains and binders, equipment inspection, troubleshooting, wheel-lift and dolly procedures, and CDL notes.

The app works offline after its files are available on the device. VIN decoding uses the free NHTSA vPIC service and therefore requires internet access. The VIN screen supports native continuous camera barcode scanning on Android, then photo-based OCR and manual entry as fallbacks. Barcode scanning reads common 1D/2D formats, checks for a 17-character VIN, and can use raw barcode bytes when the scanner does not provide decoded text. Photo OCR ranks possible VINs using the VIN character restrictions, the position-9 check digit, the position-10 model-year code, and whether the text appears beside a VIN label. OCR-only I/O/Q corrections are applied to photo text, never to machine-read barcode values. The North American check digit is a strong ranking signal, not a universal rejection rule for every international VIN; the operator must verify every suggested number before decoding. Door-jamb labels also contain tire, weight, manufacturing, and other identifiers, so OCR results are suggestions rather than guaranteed identification. The installed Android app uses a native CameraX preview with bundled on-device ML Kit barcode recognition for continuous scanning. It targets Data Matrix, QR, PDF417, Aztec, Code 39, Code 128, Code 93, Codabar and ITF formats, waits for the same VIN to appear in consecutive frames, and includes tap-to-focus, zoom and a torch control when supported. Barcode recognition processes only the latest camera frame to prevent a growing frame queue. Photo OCR continues to use on-device ML Kit text recognition. Non-Android browsers retain the ZXing fallback. The photo pipeline decodes the selected image in the browser, draws the EXIF-oriented image to a canvas, and sends a newly encoded JPEG to ML Kit; the native bitmap is therefore already upright and uses zero additional rotation. Android ProGuard rules preserve ML Kit classes if release minification is enabled later. The scanner library and browser fallback OCR engine are downloaded from a CDN when first used and require internet access. Android photo OCR now checks both contrast-enhanced and untouched copies of the image, then ranks candidates together using VIN-label proximity and VIN structure. Camera access requires permission and a secure app origin (HTTPS or the installed Android app). Photos are processed locally and are not uploaded or saved by the app.

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

Do not edit ROWS in www/data.js by hand. Rows live in `tools/vehicle-db/data/*.json` with their sources; follow `.claude/skills/vehicle-db/SKILL.md` (validate, sanity check, `python3 tools/vehicle-db/merge.py`, `npm test`). Every row and its sources are listed in `docs/VEHICLE_SOURCES.md`.

The database has about 710 model ranges across 34 makes. Values are conservative for each range: lowest common ground clearance, longest common wheelbase, heaviest common curb weight. Rows not confirmed on published spec pages are flagged as lower confidence in the app.

## Operational limits

- Vehicle specifications are typical for a model range, not guaranteed VIN-specific values. Treat lower-confidence entries cautiously and verify the vehicle on scene.
- The vehicle owner's manual and company procedures take precedence.
- The clearance calculation covers belly breakover only; it does not model lips, splitters, skirts, or every underbody obstruction.
- CDL, strap-rating, and re-check guidance is general information, not legal advice. Requirements vary by jurisdiction.
