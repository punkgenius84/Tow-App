# Vehicle catalog audit

**Status: IN PROGRESS — NOT APPROVED FOR RELEASE**

**Safety mitigation now active:** all catalog-derived vehicle rows are forced to low confidence until row-specific OEM source provenance and configuration scope are reviewed. This is intentionally conservative; it does not mean all 298 rows have been verified.

This audit covers the complete current US-market catalog in `www/data.js`, not a sample. The source currently contains **298 rows across 47 makes**, spanning model years 1980–2025.

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
