# Vehicle catalog audit

**Status: IN PROGRESS — NOT APPROVED FOR RELEASE**

**Safety mitigation now active:** all catalog-derived vehicle rows are forced to low confidence until row-specific OEM source provenance and configuration scope are reviewed. This is intentionally conservative; it does not mean all 291 rows have been verified.

This audit covers the complete current US-market catalog in `www/data.js`, not a sample. The source currently contains **291 rows across 47 makes**, spanning model years 1980–2025.

## Why this audit is required

The current database stores one curb weight, wheelbase and ground-clearance value for each row, while many rows cover multiple redesigns and trim/drivetrain variants. The app's current confidence logic marks rows as lower confidence when the year span is broad, but a short year span is not proof that its specifications have been verified. The catalog has no per-row source provenance today. Until that is remedied, every catalog row is treated as unverified by the application, regardless of year-span length.

- **199 rows** cover seven or more model years.
- **114 rows** cover eleven or more model years.
- **11 rows** currently receive the default higher-confidence flag despite having no recorded source provenance. That flag is not evidence of verification.

The companion CSV, `docs/vehicle-catalog-audit.csv`, lists every current row and its audit status.

## Identity / generation corrections applied

The catalog now separates Mazda MX-5 Miata NA/NB/NC/ND generations, Mazda3 sedan and hatchback generation ranges, BMW 3 Series chassis generations E36/E46/E90/F30/G20 (year boundaries are catalog working ranges and require US model-year confirmation), and Mercedes-Benz C-Class W202/W203/W204/W205/W206, E-Class W124/W210/W211/W212/W213/W214, and S-Class W140/W220/W221/W222/W223 model series. These are identity/year corrections only. Their curb weight, wheelbase and ground-clearance numbers remain provisional legacy baselines and are not verified for each generation or trim. They remain low-confidence and must not be used instead of measuring the actual vehicle.

## Verified source-backed update — Honda CR-V

The former 2017–2025 CR-V row was split at the 2023 redesign because the wheelbase changed from approximately 104.7–104.8 in (2017–2022) to 106.3 in (2023–2025). Honda's US specification pages also document drivetrain-dependent unladen clearance: 7.8 in (2WD) and 8.2 in (AWD). The app retains a conservative 7.8 in catalog baseline and keeps both rows low-confidence; operators must identify drivetrain and measure the actual vehicle. Sources: [2022 Honda CR-V specifications](https://www.hondainfocenter.com/2022/CR-V/Feature-Guide/Specifications/) and [2025 Honda CR-V specifications](https://www.hondainfocenter.com/2025/cr-v/feature-guide/specifications/).


## Verified source-backed update — Toyota Camry Hybrid

The former 2018–2025 Camry Hybrid row crossed the 2025 redesign. Toyota's 2024 US brochure lists 111.2 in wheelbase and 5.7 in ground clearance for the listed hybrid trims; the 2025 US brochure lists 111.2 in wheelbase and 5.4 in ground clearance. The catalog now separates 2018–2024 from 2025 and uses the lower 2025 clearance for that one-year row. Curb weight and drivetrain availability vary by trim, so both entries remain low-confidence and operators must verify the exact configuration and measure the actual vehicle. Sources: [2024 Toyota Camry eBrochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2024/camry_ebrochure.pdf) and [2025 Toyota Camry eBrochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2025/my25-camry-ebrochure.pdf).


## Partial source review — Toyota Sienna (2021–2025)

Toyota's US newsroom confirms the fourth-generation Sienna debuted for model year 2021 and lists a 120.5 in wheelbase. Toyota also explicitly states that the 2022 Woodland Edition has increased ground clearance compared with other Sienna grades; the 2024 Woodland Edition retains that added-clearance distinction. This means a single 6.5 in clearance value cannot safely be presented as universal across the 2021–2025 FWD/AWD and trim range. The catalog retains its existing 6.5 in value only as an unverified low-confidence legacy baseline, with an explicit warning; it is not a verified specification and must not replace measuring the actual vehicle. Exact trim-specific clearance, curb weight and variant coverage remain unresolved. Sources: [2021 Toyota Sienna model overview](https://pressroom.toyota.com/toyota-sienna-2021/), [2022 Sienna Woodland Edition](https://pressroom.toyota.com/2022-toyota-sienna-expands-adventure-possibilities-with-new-woodland-edition/), [2024 Toyota Sienna](https://pressroom.toyota.com/seize-the-day-in-style-with-the-2024-toyota-sienna/).

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
