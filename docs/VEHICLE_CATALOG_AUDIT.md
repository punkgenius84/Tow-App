# Vehicle catalog audit

**Status: IN PROGRESS — NOT APPROVED FOR RELEASE**

**Safety mitigation now active:** catalog-derived values are not treated as confirmed specifications unless a row has an explicit, scoped OEM verification record. Unverified values remain provisional and cannot substitute for on-scene measurements.

This audit covers the complete current US-market catalog in `www/data.js`: **2,844 rows across 47 makes**, comprising **318 curated rows** and **2,526 aggregator-derived rows**, spanning model years 1980–2025. Of the 315 curated rows, 11 are OEM-source-verified for a single model year and 307 remain unverified. All 2,524 aggregator-derived rows remain unverified. Across the full catalog, 2,833 rows remain unverified. All three body dimensions are present on 2,512 rows; 330 lack at least one. Field presence: length 2,531; width 2,518; height 2,523. These are completeness counts, not accuracy claims. The audit inventory is maintained in `docs/vehicle-catalog-audit.csv`.

## Body-dimension gap inventory (2026-11-23)

A fresh row-by-row count of `docs/vehicle-catalog-audit.csv` found **330 of 2,842 rows** missing at least one of length, width or height. The gaps are concentrated in the curated rows, not evenly distributed across the catalog. Missing-row counts by make:

| Make | Rows missing one or more body dimensions |
|---|---:|
| Mazda | 34 |
| Ford | 28 |
| Mercedes-Benz | 26 |
| Subaru | 17 |
| Audi | 17 |
| Chevrolet | 16 |
| Toyota | 15 |
| BMW | 14 |
| Honda | 12 |
| Mitsubishi | 9 |
| Hyundai | 8 |
| Kia | 8 |
| Lexus | 8 |
| GMC | 7 |
| Jeep | 7 |
| Nissan | 7 |
| Volvo | 7 |
| Porsche | 7 |
| Volkswagen | 6 |
| Ram | 5 |
| Tesla | 5 |
| Acura | 5 |
| Pontiac | 5 |
| Dodge | 4 |
| Chrysler | 4 |
| Land Rover | 4 |
| Cadillac | 3 |
| Isuzu | 3 |
| Suzuki | 3 |
| Oldsmobile | 3 |
| Saturn | 3 |
| Mercury | 3 |
| Hummer | 3 |
| Infiniti | 2 |
| Plymouth | 2 |
| Alfa Romeo | 2 |
| Genesis | 2 |
| Smart | 2 |
| McLaren | 2 |
| Lincoln | 1 |
| Buick | 1 |
| Rivian | 1 |
| Saab | 1 |
| Jaguar | 1 |
| Mini | 1 |
| Fiat | 1 |
| Eagle | 1 |
| Daewoo | 1 |
| Aston Martin | 1 |
| Bentley | 1 |
| Lamborghini | 1 |

These are missing-field counts, not a statement that the remaining values are OEM verified. Fill gaps from manufacturer specifications where available, preserve model-year/trim scope and source URL, and leave a field blank when a reliable value cannot be established. Do not copy one cab, wheelbase, body style, or trim's dimensions across a broader model range without documenting the variant limitation.

## Clearance input validation

The clearance calculator requires both actual on-scene measurements: lowest fixed underbody clearance and wheelbase. It now refuses to calculate a verdict when entered values are outside the supported ranges: clearance 0.5–40 inches, wheelbase 40–400 inches, and crest angle greater than 0 through 30 degrees. An out-of-range entry returns **NO VERDICT** and directs the operator to recheck the measurements. These are input sanity limits for this calculator, not universal vehicle-dimension limits or an engineering certification.

## Why this audit is required

The database stores one curb-weight, wheelbase and ground-clearance baseline per row, while many rows cover multiple redesigns, trims, drivetrains, wheel/tire packages or suspension configurations. A narrow model-year range is not proof that the values are correct for every configuration. Each row must retain clear provenance and scope before any specification can be treated as verified.

The companion CSV, `docs/vehicle-catalog-audit.csv`, is intended to list every current row and its audit status. The release gate remains open until every row has a reviewed disposition, adequate source provenance, and a safe treatment for missing or configuration-dependent specifications.

## Identity / generation corrections applied

The catalog now separates Mazda MX-5 Miata NA/NB/NC/ND generations, Mazda3 sedan and hatchback generation ranges, BMW 3 Series chassis generations E36/E46/E90/F30/G20 (year boundaries are catalog working ranges and require US model-year confirmation), and Mercedes-Benz C-Class W202/W203/W204/W205/W206, E-Class W124/W210/W211/W212/W213/W214, and S-Class W140/W220/W221/W222/W223 model series. These are identity/year corrections only. Their curb weight, wheelbase and ground-clearance numbers remain provisional legacy baselines and are not verified for each generation or trim. They remain low-confidence and must not be used instead of measuring the actual vehicle.

## Verified source-backed update — Honda CR-V

The CR-V is split at the 2023 redesign: the 2017–2022 and 2023–2024 entries remain unverified catalog baselines. The 2025 model is now split into separate gasoline and hybrid rows, each OEM-verified for model year 2025 only. Honda's US specification page lists 106.3 in wheelbase, 184.8 in length, 73.5 in width, 66.2–66.5 in height, and unladen clearance of 7.8 in (2WD) / 8.2 in (AWD). Gas curb weights vary from 3,472–3,635 lb; hybrid curb weights vary from 3,752–3,926 lb. Each row stores the highest curb weight within its own powertrain group and the conservative 7.8 in clearance baseline. Exact trim and drivetrain still matter; measure the actual vehicle before loading. Source: [2025 Honda CR-V specifications](https://www.hondainfocenter.com/2025/CR-V/Feature-Guide/Specifications/).


## Verified source-backed update — Toyota Camry Hybrid

The former 2018–2025 Camry Hybrid row crossed the 2025 redesign. Toyota's 2024 US brochure lists 111.2 in wheelbase and 5.7 in ground clearance for the listed hybrid trims; the 2025 US brochure lists 111.2 in wheelbase and 5.4 in ground clearance. The catalog now separates 2018–2024 from 2025 and uses the lower 2025 clearance for that one-year row. The 2018–2024 entry remains low-confidence because it spans multiple configurations. The separate 2025 entry is OEM-verified for that model year only; its curb-weight maximum is trim-scoped and AWD availability varies by trim. Operators must still identify the exact configuration and measure the actual vehicle. Sources: [2024 Toyota Camry eBrochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2024/camry_ebrochure.pdf) and [2025 Toyota Camry eBrochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2025/my25-camry-ebrochure.pdf).


## Partial source review — Toyota Sienna (2021–2025)

Toyota's US newsroom confirms the fourth-generation Sienna debuted for model year 2021 and lists a 120.5 in wheelbase. Toyota also explicitly states that the 2022 Woodland Edition has increased ground clearance compared with other Sienna grades; the 2024 Woodland Edition retains that added-clearance distinction. This means a single 6.5 in clearance value cannot safely be presented as universal across the 2021–2025 FWD/AWD and trim range. The catalog retains its existing 6.5 in value only as an unverified low-confidence legacy baseline, with an explicit warning; it is not a verified specification and must not replace measuring the actual vehicle. Exact trim-specific clearance, curb weight and variant coverage remain unresolved. Sources: [2021 Toyota Sienna model overview](https://pressroom.toyota.com/toyota-sienna-2021/), [2022 Sienna Woodland Edition](https://pressroom.toyota.com/2022-toyota-sienna-expands-adventure-possibilities-with-new-woodland-edition/), [2024 Toyota Sienna](https://pressroom.toyota.com/seize-the-day-in-style-with-the-2024-toyota-sienna/).


## Verified generation split — Toyota Prius

The former 2016–2025 Prius row crossed the 2023 redesign. Toyota's 2022 US brochure lists a 106.3 in wheelbase and ground clearance of 5.1 in for FWD trims / 5.3 in for AWD-e trims; 2022 curb weights vary from 3,010–3,220 lb by trim. Toyota's 2023 US brochure lists a 108.3 in wheelbase and clearance of 5.6 in (LE) / 6.0 in (XLE and Limited). The catalog is split into 2016–2022 and 2023–2025 entries. Each stores a conservative low-end clearance baseline and remains low-confidence because the values vary by trim and drivetrain; neither is a substitute for measuring the actual vehicle. Sources: [2022 Toyota Prius eBrochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2022/prius_ebrochure.pdf), [2023 Toyota Prius eBrochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2023/prius_ebrochure.pdf).

## Verified generation split — Toyota 4Runner

The former 2010–2025 4Runner row crossed the 2025 sixth-generation redesign. Toyota's 2024 US brochure lists a 109.8 in wheelbase and drivetrain-dependent ground clearance of 9.0 in (2WD) / 9.6 in (4WD); the catalog uses the conservative 9.0 in baseline for 2010–2024. The 2025 Toyota USVI brochure lists a 112.2 in wheelbase and 8.1 in ground clearance for its documented configurations, while Toyota USA confirms the all-new sixth generation and its expanded grade and powertrain lineup. The catalog is now split into 2010–2024 and 2025 entries. Both remain low-confidence: clearance varies by trim/package, curb weight varies materially, and the 2025 catalog weight is a provisional estimate rather than a verified universal value. Confirm the exact trim, drivetrain and powertrain, then measure the actual vehicle. Sources: [2024 Toyota 4Runner eBrochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2024/4runner_ebrochure.pdf), [2025 Toyota 4Runner eBrochure — Toyota USVI](https://www.toyotausvi.com/dynamic/ebrochure/2025_4runner_ebrochure_usvi.pdf), [Toyota USA — all-new 2025 4Runner](https://pressroom.toyota.com/the-all-new-2025-toyota-4runner-the-icon-that-inspires-exploration/).

## Verified generation split — Honda Pilot

The former 2016–2025 Pilot row crossed the 2023 redesign. Honda's 2022 US specifications list a 111.0 in wheelbase and 7.3 in unladen ground clearance on standard trims; the 2022 TrailSport is 7.9 in and has a 110.9 in wheelbase. Honda's 2023 US specifications list a 113.8 in wheelbase, 7.3 in unladen clearance on most trims, and 8.3 in for TrailSport AWD. The catalog is split into 2016–2022 and 2023–2025 entries, each using the conservative 7.3 in baseline. Curb weight varies by trim and drivetrain; the newer row's 4,400 lb is a provisional catalog estimate. Both remain low-confidence and require exact trim confirmation and an on-scene measurement. Sources: [2022 Honda Pilot specifications](https://www.hondainfocenter.com/2022/Pilot/Feature-Guide/Specifications/) and [2023 Honda Pilot specifications](https://hondanews.com/en-US/honda-automobiles/releases/release-4e58b4e0fcd795affa5685a66a1953ae-2023-honda-pilot-specifications-features).

## Verified generation split — Honda Civic Sedan

The former 2016–2025 Civic Sedan row crossed the 2022 redesign. Honda's 2021 US specifications list a 106.3 in wheelbase and curb weights of 2,771–2,963 lb by trim; its 2022 specifications list a 107.7 in wheelbase and 2,877–3,077 lb. Honda's 2025 specifications retain the 107.7 in wheelbase and list curb weights from 2,877–3,252 lb across the published sedan configurations. The catalog is split into 2016–2021 and 2022–2025 entries. Important limitation: the cited Honda specification pages do not publish ground clearance. The existing 5.3 in catalog value is retained only as an explicitly unverified legacy placeholder, not a verified OEM dimension. Both rows remain low-confidence; confirm exact trim and measure the actual vehicle. Sources: [2021 Honda Civic Sedan specifications](https://www.hondainfocenter.com/2021/Civic-Sedan/Feature-Guide/Civic-Sedan-Specifications/), [2022 Honda Civic Sedan specifications](https://www.hondainfocenter.com/2022/Civic-Sedan/Feature-Guide/Civic-Sedan-Specifications/), [2025 Honda Civic Sedan specifications](https://hondanews.com/en-US/honda-automobiles/releases/release-c28e8d1efb94e520fef21ff3f800cb30-2025-honda-civic-sedan-specifications-features).

## Honda Civic Sedan — clearance source update

The earlier broad 2016–2021 row is now split into 2016–2020 and 2021 because the newly located clearance source is specific to 2021. Honda's 2021 US spec page confirms a 106.3 in wheelbase and 2,771–2,963 lb curb-weight range by trim. Honda Canada's 2021 specification table gives 125 mm (4.92 in) unloaded and 108 mm (4.25 in) at full load. The catalog's 2021 baseline is 4.9 in unloaded, with the 4.25 in loaded figure explicitly retained in the row note. The 2016–2020 5.3 in value remains an unverified legacy placeholder, not an OEM-confirmed value.

For 2022, Honda Canada lists 134 mm (5.28 in) no-load clearance for LX/EX/Sport/Touring and 129 mm (5.08 in) for Si, with a 107.7 in wheelbase. The 2022–2025 combined row uses a conservative 5.1 in reference and flags trim/powertrain variation; exact year/trim separation remains part of the ongoing audit. Honda's 2025 US specifications confirm 107.7 in wheelbase and trim-specific curb weights of 2,877–3,252 lb. Ground-clearance measurements are market- and load-condition-sensitive; actual vehicle measurement remains required for towing decisions.

Sources: [2021 Honda US Civic specs](https://www.hondainfocenter.com/2021/Civic-Sedan/Feature-Guide/Civic-Sedan-Specifications/), [2021 Honda Canada Civic specs](https://hondanews.ca/en-CA/hci-automobiles/releases/release-9d4b663caef09e412c833d744cfc3398-2021-civic-sedan-specifications), [2022 Honda Canada Civic specs](https://integration.honda.ca/civic_sedan/2022/specs), [2025 Honda US Civic specs](https://hondanews.com/en-US/honda-automobiles/releases/release-c28e8d1efb94e520fef21ff3f800cb30-2025-honda-civic-sedan-specifications-features).

## New OEM-verified 2025 records — Honda HR-V, Subaru Crosstrek, Subaru Impreza and Toyota Corolla

Five scoped records were added from US-market manufacturer sources. The former broad curated Corolla (2019–2025), Crosstrek (2018–2025) and Impreza (1993–2025) rows now stop at 2024; their earlier model years remain unverified. The prior 2022–2025 HR-V aggregator row now stops at 2024, and 2025 is a separate OEM-verified row. This prevents the 2025 values from being applied backward.

- **2025 Honda HR-V gasoline:** Honda lists 104.5 in wheelbase, 179.8 in length, 72.4 in width, 63.4 in height and 7.0 in unladen ground clearance. Curb weight varies from 3,159–3,333 lb; the catalog uses the maximum. FWD/AWD varies by trim. Source: [2025 Honda HR-V specifications](https://www.hondainfocenter.com/2025/HR-V/Feature-Guide/Specifications/).
- **2025 Subaru Crosstrek non-Wilderness:** Base, Premium, Sport and Limited are separated from Wilderness. Subaru lists 105.1 in wheelbase, 176.4 in length, 70.9 in body width, 62.8 in height (63.0 with roof rails), 8.7 in clearance and curb weights up to 3,349 lb. The brochure lists 79.4 in width including mirrors. Source: [2025 Subaru Crosstrek trim comparison](https://www.subaru.com/services/vehicles/pdf/trimComparison/2025/CTK).
- **2025 Subaru Crosstrek Wilderness:** separate configuration with 104.9 in wheelbase, 176.4 in length, 71.7 in body width, 63.6 in height, 9.3 in clearance and 3,369 lb curb weight. The published body width excludes mirrors. Same Subaru source as above.
- **2025 Subaru Impreza hatchback:** Subaru lists 105.1 in wheelbase, 176.2 x 70.1 x 58.3 in exterior dimensions, 5.1 in clearance and curb weights up to 3,275 lb. Source: [2025 Subaru Impreza trim comparison](https://www.subaru.com/services/vehicles/pdf/trimComparison/2025/IMP).
- **2025 Toyota Corolla gasoline sedan:** Toyota lists 106.3 in wheelbase, 70.1 in width, 182.3–182.5 in length, 55.9–56.5 in height and trim-specific clearance of 4.7–5.3 in. Gasoline curb weights range 2,955–3,150 lb. The row uses maximum dimensions/weight and minimum clearance; hybrid variants are excluded. Source: [2025 Toyota Corolla eBrochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2025/corolla_ebrochure.pdf).

These records are verified only for the stated 2025 US configurations. Width may exclude mirrors; roof rails and installed accessories affect height. The row-level catalog values are conservative envelopes where trims differ, not a claim that every trim has the same exact dimensions. Confirm the specific trim and measure the actual vehicle before loading.

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


## Honda Accord — 2025 OEM specification reference

Honda's 2025 US Accord specification release confirms a 111.4 in wheelbase, 5.3 in unladen ground clearance, and curb weights from 3,239 to 3,532 lb depending on trim. It also lists body dimensions of 195.7 in length, 73.3 in width and 57.1 in height. These measurements are recorded as a 2025 reference only; the catalog's 2018–2025 row crosses a generation change, so the row remains low-confidence and the 2025 values must not be assumed to describe every year or trim. The current database schema stores curb weight, wheelbase and clearance but not overall length/width/height; those dimensions are retained in the audit record pending a deliberate fitment-schema enhancement. Source: [2025 Honda Accord specifications](https://hondanews.com/en-US/honda-automobiles/releases/release-008e554add341b8444085beaa2074089-2025-honda-accord-specifications-features).


## Toyota RAV4 — gas-model clearance and dimensions reference

Toyota's 2024 US RAV4 brochure documents 8.4 in ground clearance for LE/XLE and 8.6 in for XLE Premium, Adventure, TRD Off-Road and Limited gas trims. The 2025 Toyota US product page continues to advertise up to 8.6 in, and the 2025 owner's-manual specification table confirms a 105.9 in wheelbase. The gas RAV4 row keeps 8.4 in as a conservative baseline; it is not a universal trim value. Curb weight varies by trim/drivetrain, and the catalog remains low-confidence until exact year/trim coverage is reviewed. The separate RAV4 Hybrid row retains its own lower 8.1 in baseline. Sources: [2024 Toyota RAV4 brochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2024/rav4_ebrochure.pdf), [2025 Toyota RAV4 product page](https://www.buyatoyota.com/home/vehicles/rav4/2025/), [2025 RAV4 owner's-manual specifications](https://cdn.dealereprocess.org/cdn/servicemanuals/toyota/2025-rav4.pdf).


## Toyota Tacoma — 2024 generation split

The Tacoma was completely redesigned for model year 2024. The catalog now separates 2016–2023 from 2024–2025 and represents the i-FORCE MAX hybrid powertrain separately. Toyota's 2023 US brochure confirms 9.4 in ground clearance across its listed Access Cab and Double Cab trims. For 2024, Toyota documents materially different configurations: 131.9 in wheelbase on short-bed versions and 145.1 in on many 6-ft Double Cab versions; overall length is 213 in or 226.2 in depending on cab/bed. The 2024 brochure lists i-FORCE curb-weight examples from 4,145 to 4,715 lb. Toyota states running ground clearance reaches 11.5 in on TRD Off-Road, while other grades and hybrid variants have distinct suspension and ride heights. The 2024 rows therefore keep 9.4 in only as an explicitly unverified placeholder; neither 9.4 nor the 11.5-in maximum should be treated as universal. The hybrid row's 5,300-lb curb weight is also a placeholder, not a verified specification. Exact trim/cab/bed/powertrain must be identified and the actual vehicle measured before use. Sources: [2023 Tacoma brochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2023/tacoma_ebrochure.pdf), [2024 Tacoma brochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2024/tacoma_ebrochure.pdf), [Toyota 2024 redesign announcement](https://pressroom.toyota.com/all-new-2024-toyota-tacoma-is-adventure-ready-out-of-the-box/), [Toyota 2024 i-FORCE MAX details](https://pressroom.toyota.com/legendary-performance-modern-power-2024-toyota-tacoma-with-i-force-max/).

## Current machine-reconciled inventory (2026-11-21)

The figures below were recomputed directly from every data row in `docs/vehicle-catalog-audit.csv`. The CSV contains **2,839 rows**: **315 curated rows** (11 `OEM_VERIFIED` full-dimension rows and 304 other curated rows) plus **2,524 `AGGREGATOR_UNVERIFIED` rows**. Confidence totals are 11 `OEM_VERIFIED_SINGLE_YEAR` and 2,828 `LOW_UNVERIFIED`. Separately, **12 rows carry 2024–2025 OEM ground-clearance-only evidence**; these do not upgrade whole-row confidence. See the CSV for the complete row-level audit-status breakdown.

Field-presence audit: 496 rows have no ground-clearance value and 21 have no wheelbase value. All three body dimensions (length, width and height) are present in 2,512 rows; 327 rows lack at least one. Per-field presence: length 2,531, width 2,518, height 2,523. These are field-presence counts only—not evidence of accuracy or OEM verification. The 159 curated rows spanning eight or more model years remain a high-priority mismatch risk. Coverage of US models listed for 2015–2025 remains 596 of 808; the remaining models are in `docs/vehicle-catalog-missing-us-models.csv`. **Release status remains IN PROGRESS — NOT APPROVED FOR RELEASE.**

### Dimension inventory and operator display

The audit CSV now includes `length_in`, `width_in`, `height_in`, and `dimension_status` for every catalog row. Status values distinguish `OEM_VERIFIED_SCOPED`, `AGGREGATOR_UNVERIFIED`, and `CURATED_UNVERIFIED`. The app's vehicle detail screen displays the available dimensions, identifies whether the row has a scoped OEM source, and labels all other dimensions as unverified references. A populated field is not a verified specification. The app must not use catalog dimensions as a substitute for on-scene measurements or the exact vehicle's OEM documentation.

## OEM-verified rows (first batch)

The OEM-verified rows are each scoped to a **single model year** with their primary source URLs and scope recorded in the audit CSV. The first named batch includes the 2025 Honda Passport, Hyundai Santa Cruz, Toyota Camry Hybrid, Toyota Crown Signia, and Honda CR-V gasoline and hybrid. Later additions bring the current machine-reconciled total to **11 OEM-verified single-year rows**. The complete current set must be read from the CSV rather than relying on this historical list. A row can only be verified with an HTTPS source URL, a source year inside the row's years, and an explicit verified flag (enforced in `www/data.js` and tests). Verified rows still never give a clearance verdict from catalog numbers; on-scene measurements are always required. Everything else remains unverified. Third-party sites that agree with each other (KBB, JD Power, Edmunds, TrueDelta) are not treated as OEM sources.


## Verified source-backed update — Toyota Camry Hybrid (2025)

The 2025 US Camry is hybrid-only. Toyota's 2025 US eBrochure lists 111.2 in wheelbase and 5.4 in ground clearance across LE, SE, XSE and XLE. The brochure's FWD/AWD curb-weight figures range from 3,450 to 3,682 lb; the catalog row uses the highest listed curb weight (3,682 lb) for conservative truck-planning calculations. The same brochure lists 193.5 in length, 72.4 in width and 56.9 in height. The prior audit CSV row had the source label and source URL in the wrong columns, preventing the row's source provenance from being machine-validated. This has been corrected; the row is now marked OEM_VERIFIED for model year 2025 only. It does not verify 2018–2024 Camry entries, and it does not replace on-scene measurement. Source: [2025 Toyota Camry eBrochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2025/my25-camry-ebrochure.pdf).


## OEM-verified update — Toyota Crown Signia (2025)

Toyota's 2025 US eBrochure lists the XLE and Limited at 4,210 lb curb weight, 112.2 in wheelbase, and 6.7 in ground clearance. Both grades share exterior dimensions of 194.1 in length, 74.0 in width and 64.0 in height. Toyota specifies the 2.5L hybrid system, standard electronic on-demand AWD and electronically controlled CVT. The catalog adds a single-year 2025 row only; these values do not establish specifications for other years or unlisted future variants. AWD means flatbed-only guidance remains in effect, and the database's ground-clearance value is reference data only: measure the actual vehicle before loading. Source: [2025 Toyota Crown Signia eBrochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2025/toyotacrownsignia_ebrochure.pdf).


## OEM ground-clearance research batch — 2025 model year

The catalog now contains **12 clearance-only OEM evidence entries** for 2025 configurations across Ford, Kia, Hyundai and Toyota. These are separate from full-dimension verification: curb weight, wheelbase and/or body dimensions remain low-confidence unless independently sourced. Clearance source URL, source model year, verified value and configuration caveat are recorded separately. Earlier model years remain separate and are not upgraded from 2025 evidence.

| Make / model | 2025 conservative catalog clearance | OEM source scope |
|---|---:|---|
| Ford F-150 | 8.2 in | Standard configurations; Tremor/Raptor higher |
| Ford F-250 Super Duty SRW | 9.2 in | Lowest listed cab/drive/bed configuration |
| Ford F-350 Super Duty SRW | 9.1 in | Lowest listed cab/drive/bed configuration |
| Ford F-350 Super Duty DRW | 9.2 in | Lowest listed cab/drive/bed configuration |
| Kia Sorento gas / PHEV | 6.9 in | 2025 FWD/AWD specifications as applicable |
| Hyundai Tucson | 7.1 in | 2WD; AWD listed at 8.3 in |
| Hyundai Santa Fe | 7.0 in | Most trims; XRT listed at 8.3 in |
| Toyota 4Runner | 8.1 in | SR5; higher grades list 8.8–10.1 in |
| Genesis GV70 (2025) | 7.3 in | 2.5T / 3.5T Sport |
| Genesis Electrified GV70 (2024) | 6.9 in | AWD US specification |

Sources: [Ford F-150 2025](https://www.ford.com/trucks/f150/2025/pricing-and-incentives/); [Ford 2025 Super Duty technical specifications](https://www.fromtheroad.ford.com/content/dam/fordmediasite/us/en/library/2025/specs/2025-Ford-Super-Duty-Technical-Specs.pdf); [Kia Sorento 2025](https://www.kiamedia.com/us/en/models/sorento/2025/specifications); [Hyundai Tucson 2025](https://www.hyundaiusa.com/us/en/vehicles/2025-tucson/compare-specs); [Hyundai Santa Fe 2025](https://aws-sweb.hyundaiusa.com/us/en/vehicles/2025-santa-fe/compare-specs); [Toyota 4Runner 2025 grade guide](https://engage.toyota.com/static/articles/2025_4runner_sales_consultant_guide/2025_4Runner_Sales_Consultant_Guide.pdf).

**Safety:** published manufacturer clearance is reference data, not a measurement of an individual tow-in vehicle. The app continues to require actual lowest-point clearance and wheelbase measurements before it can return anything other than **NO VERDICT — MEASURE FIRST**.


## Verified clearance-only update — Ford Ranger and Honda Pilot (2024–2025)

The Ford Ranger catalog row is now split into 2019–2023, 2024 and 2025 slices. Ford's 2024 technical specifications list 9.3 in minimum running ground clearance for both 4x2 and 4x4; the 2025 specifications list 8.8 in for 4x2 and 9.3 in for 4x4, so the 2025 row uses 8.8 in as the conservative baseline. The Honda Pilot row is split into 2023–2024 and 2025. Honda's 2025 US specifications list 7.3 in unladen clearance for most trims and 8.3 in for TrailSport AWD; the catalog uses 7.3 in. These are clearance-only OEM records: curb weight, wheelbase and body dimensions remain unverified, and the calculator still requires on-scene measurements. Sources: [2024 Ford Ranger specifications](https://www.fromtheroad.ford.com/content/dam/fordmediasite/us/en/library/2024/specs/2024-Ford-Ranger-Technical-Specs.pdf), [2025 Ford Ranger specifications](https://www.fromtheroad.ford.com/content/dam/fordmediasite/us/en/library/2025/specs/2025_Ford_Ranger_Technical_Specifications.pdf), and [2025 Honda Pilot specifications](https://hondanews.com/en-US/honda-automobiles/releases/2025-honda-pilot-specifications-features).


## Verified clearance-only update — GMC Savana 3500 and Nissan Versa (2025)

The 2025 GMC Savana 3500 entry now carries an OEM clearance-only baseline of 8.60 in, the lowest rear ground-clearance figure across the reviewed 3500 cargo/passenger configurations. The 2025 Nissan Versa entry uses 5.0 in, the lowest published value across S, S CVT, SV and SR trims (SR is 5.2 in). Both remain aggregator-derived, low-confidence rows for curb weight, wheelbase and body dimensions; the separate clearance provenance does not certify those fields. Sources: [GMC 2025 Savana cargo specifications](https://www.gmc.com/byo-vc/client/en/US/gmc/savana-cargo/2025/savana-cargo/config/specifications/3), [GMC 2025 Savana passenger specifications](https://www.gmc.com/byo-vc/client/en/US/gmc/savana-passenger/2025/savana-passenger/config/specifications/2), and [Nissan 2025 Versa specifications](https://www.nissanusa.com/vehicles/cars/versa-sedan/specs-trims.html).
