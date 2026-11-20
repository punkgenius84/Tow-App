# Big Jay's Tow Guide

A mobile-first towing reference app for Big Jay's Towing and Auto Center. Choose a vehicle or decode its VIN to review towing method, truck suitability, ground-clearance risk, and loading/tie-down guidance.

## What it helps operators check

1. **Tow method** - flatbed versus permitted wheel-lift use, including drive-wheel considerations for EVs, hybrids, AWD/4WD, dual-clutch, FWD, and RWD vehicles.
2. **Truck suitability** - light, medium, or heavy-duty recommendations using vehicle weight, a planning margin, GVWR, and dual-wheel considerations.
3. **Ground clearance** - belly breakover at the ramp-to-deck crest and a calculated maximum angle.
4. **Loading and securement** - an eight-phase workflow covering tie-down count, working-load-limit sizing, corner-by-corner routing, wheel nets, ratchet straps, chains and binders, equipment inspection, troubleshooting, wheel-lift and dolly procedures, and CDL notes.

The app works offline after its files are available on the device. VIN decoding uses the free NHTSA vPIC service and therefore requires internet access.

## Branding and application identity

- Customer-facing name: **Big Jay's Tow Guide**
- Android application ID: `com.bigjaysstowing.towguide`
- Original company artwork is retained in `www/assets/branding/`
- Web/PWA icons are in `www/icons/`
- Android launcher resources are in `android/app/src/main/res/`

## Run as a web app

Host the `www/` folder (GitHub Pages works), open it in Chrome on a phone, then use the browser menu and choose **Install app**. For local testing, run `npm run serve`.

## Build the Android app

The Android project uses Gradle 8.11.1 and requires **JDK 21** for compilation.

1. Run `npm ci`.
2. Run `npm test`.
3. Run `npx cap sync android`.
4. Build with `cd android && ./gradlew assembleDebug` (Windows: `gradlew.bat assembleDebug` from the `android` folder).

You can also use the repository's **Build Android APK** GitHub Actions workflow. It runs the tests, synchronizes Capacitor, builds the debug APK with JDK 21, and uploads an artifact named `TowGuide-debug-apk`. Open the repository's **Actions** tab, select **Build Android APK**, choose **Run workflow**, and download the artifact when the run succeeds.

The debug APK output path is `android/app/build/outputs/apk/debug/app-debug.apk`.

A Play Store release requires a separately signed release build and a Google Play developer account.

## Tests

Run `npm test` for the tow-rule, clearance, tie-down, vehicle-database, VIN-decoding, and UI regression tests.

## Adding vehicles

Append a row to `ROWS` in `www/data.js` (format documented at the top of that file). The test suite checks row structure and database integrity.

## Operational limits

- Vehicle specifications are typical for a model range, not guaranteed VIN-specific values. Treat lower-confidence entries cautiously and verify the vehicle on scene.
- The vehicle owner's manual and company procedures take precedence.
- The clearance calculation covers belly breakover only; it does not model lips, splitters, skirts, or every underbody obstruction.
- CDL, strap-rating, and re-check guidance is general information, not legal advice. Requirements vary by jurisdiction.


## Signed Android release

The workflow always builds the debug APK. It also builds and uploads a signed release APK when all four repository Actions secrets are configured:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded JKS/PKCS12 signing keystore
- `ANDROID_KEYSTORE_PASSWORD`: keystore password
- `ANDROID_KEY_ALIAS`: signing key alias
- `ANDROID_KEY_PASSWORD`: key password

Add these under **Repository Settings → Secrets and variables → Actions**. Never commit the keystore or passwords. The release artifact is named `TowGuide-release-signed-apk`. Keep the same keystore and alias for every future update; losing the signing key can prevent updates to the installed app.

## Clearance safety margin

The clearance estimate now requires at least 1.5 inches beyond the calculated ramp-crest rise before showing a positive result. A smaller reserve is marked tight or likely to scrape and recommends a low-deck, long-bed rollback with adjustable tilt and long ramp extensions, or go-jacks/skates / a different carrier. This is a screening aid, not a guarantee: measure the lowest point, inspect approach/departure lips, and account for uneven pavement and suspension movement.
