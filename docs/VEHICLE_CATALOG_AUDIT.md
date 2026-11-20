# Vehicle catalog audit

**Status: IN PROGRESS — NOT APPROVED FOR RELEASE**

This audit covers the complete current US-market catalog in `www/data.js`, not a sample. The source currently contains **263 rows across 47 makes**, spanning model years 1980–2025.

## Why this audit is required

The current database stores one curb weight, wheelbase and ground-clearance value for each row, while many rows cover multiple redesigns and trim/drivetrain variants. The app's current confidence logic marks rows as lower confidence when the year span is broad, but a short year span is not proof that its specifications have been verified. The catalog has no per-row source provenance today.

- **199 rows** cover seven or more model years.
- **114 rows** cover eleven or more model years.
- **11 rows** currently receive the default higher-confidence flag despite having no recorded source provenance. That flag is not evidence of verification.

The companion CSV, `docs/vehicle-catalog-audit.csv`, lists every current row and its audit status.

## Verification standard

Each row must be checked against the correct model-year generation and US-market configuration. The audit must separately consider:
1. Model identity and year coverage.
2. Generation / redesign boundaries.
3. Drivetrain, engine, trim, wheel/tire and suspension differences that affect dimensions or clearance.
4. Ground clearance, including the manufacturer's stated measurement convention and whether it is unladen.
5. Wheelbase and curb weight, with trim/configuration ranges where material.
6. A primary source URL and the model year(s) it supports.

Manufacturer specifications, owner's manuals and model-year brochures are preferred. Government vehicle catalogs can help verify identity and model-year coverage, but must not be treated as a source for ground clearance unless they explicitly contain that measurement. For example, NHTSA vPIC describes itself as a manufacturer-submitted VIN decoding and vehicle identity dataset; it documents make/model/year lookup and VIN variables, not a comprehensive ground-clearance specification source. See [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/) and [NHTSA vPIC overview](https://vpic.nhtsa.dot.gov/About).

## Safety rules during the audit

- Do not infer a generation's clearance from another generation.
- Do not treat one trim's measurement as universal when drivetrain, wheel/tire, suspension or off-road packages differ.
- Do not upgrade confidence without a source attached to the specific row/configuration.
- If reliable clearance cannot be established, mark it unknown / lower confidence and require an on-scene measurement before a positive loading decision.
- A database clearance estimate never replaces measuring the vehicle's lowest point and checking approach, departure and breakover.
- Keep the APK workflow manual-only. No APK generation until the complete audit, regression tests and documentation are finished and explicitly approved.

## Completion gate

The audit is complete only when every CSV row has a reviewed status, source reference(s), verified generation boundaries, and a documented disposition for clearance, wheelbase, curb weight and variant coverage. Any unresolved item must remain visibly unverified and must not be represented as a confirmed specification.
