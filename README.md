# Big Jay's Tow Guide

A mobile-first towing reference app for Big Jay's Towing and Auto Center. Choose a vehicle or decode its VIN to review the towing method, suitable truck class, ground-clearance risk, and step-by-step loading and tie-down guidance.

## What it helps operators check

1. **Tow method** - flatbed versus permitted wheel-lift use, including drive-wheel considerations for EVs, hybrids, AWD/4WD, dual-clutch, FWD, and RWD vehicles.
2. **Truck suitability** - light, medium, or heavy-duty recommendations using vehicle weight, a planning margin, GVWR, and dual-wheel considerations.
3. **Ground clearance** - belly breakover at the ramp-to-deck crest and a calculated maximum angle.
4. **Loading and securement** - an eight-phase workflow covering tie-down count, working-load-limit sizing, corner-by-corner routing, wheel nets, ratchet straps, chains and binders, equipment inspection, troubleshooting, wheel-lift and dolly procedures, and CDL notes.

The app works offline once its files are installed on the device. VIN decoding uses the free NHTSA vPIC service and requires an internet connection.

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

The repository's **Build Android APK** workflow is currently manual-only and intentionally paused from automatic push / pull-request builds while the vehicle catalog audit is in progress. Do not generate another APK until the full audit, regression tests and documentation are complete and the release is explicitly approved.

The debug APK output path is `android/app/build/outputs/apk/debug/app-debug.apk`.

A Play Store release requires a separately signed release build and a Google Play developer account. The workflow's debug-certificate APK is for personal testing only.

## Tests

Run `npm test` for the tow-rule, clearance, tie-down, vehicle-database, VIN-decoding, and UI regression tests.

## Adding vehicles

Append a row to `ROWS` in `www/data.js` (format documented at the top of that file). The test suite checks row structure and database integrity. The complete catalog audit is tracked in [`docs/VEHICLE_CATALOG_AUDIT.md`](docs/VEHICLE_CATALOG_AUDIT.md), with one inventory line for every current database row in [`docs/vehicle-catalog-audit.csv`](docs/vehicle-catalog-audit.csv).

## Operational limits

- Vehicle specifications are typical for a model range, not guaranteed VIN-specific values. Treat lower-confidence entries cautiously and verify the vehicle on scene.
- The vehicle owner's manual and company procedures take precedence.
- The clearance calculation covers belly breakover only; it does not model lips, splitters, skirts, or every underbody obstruction.
- CDL, strap-rating, and re-check guidance is general information, not legal advice. Requirements vary by jurisdiction.


## Clearance safety margin

The clearance estimate requires at least 1.5 inches of calculated clearance beyond the modeled ramp-crest rise before showing a positive result. A smaller reserve is marked tight or likely to scrape and recommends a low-deck, long-bed rollback with adjustable tilt and long ramp extensions, or go-jacks/skates / a different carrier. This is a screening aid, not a guarantee: measure the lowest point, inspect approach/departure lips, and account for uneven pavement and suspension movement.


## Expanded vehicle coverage and clearance guidance

The US-market reference database now includes additional Mazda (including the 2014 Mazda 6 i Grand Touring example), Mercedes-Benz, Audi, BMW, Volkswagen, Hyundai, Kia, Mitsubishi, Volvo and Lexus model families, alongside the existing makes. Many entries are broad model/year estimates and are explicitly marked lower confidence. Confirm the exact year, trim, drivetrain, curb weight, wheelbase and lowest ground-clearance point before dispatch; use the custom vehicle inputs when the exact configuration is not listed.

## Personal/testing APK signing

For this tinkering build, the release APK is signed with Gradle's debug certificate so no private keystore or passwords are needed. This is suitable for personal sideload testing, not Play Store distribution. A debug certificate generated on a hosted runner may change between runs, so a later APK may require uninstalling the previous test build before installing the new one. No signing secrets need to be shared in chat or committed to the repository.



## Vehicle catalog audit — release gate

The catalog-wide audit is **in progress**. It covers all 263 current rows across 47 makes, not only selected examples. Each entry must be checked for model-year generation boundaries, drivetrain / trim differences, ground clearance, wheelbase, curb weight and source provenance. Unverified values must remain identified as estimates; the audit must not upgrade confidence based only on plausible-looking numbers.

**No APKs are to be generated until the audit is complete, regression tests pass, documentation is updated, and the release is explicitly approved.** The Android build workflow is manual-only during this work.
