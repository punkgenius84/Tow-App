# Bulk vehicle data sources

This file records the external datasets evaluated for the offline vehicle catalog. The app does not call these sources at runtime.

## Approved supplementary catalogue

- **VehiclesDB** — https://github.com/vehiclesdb/vehiclesdb
- Release evaluated: 2026.11.12
- License: CC BY 4.0
- Coverage: official-register-backed make/model identities across cars, motorcycles, vans, trucks and buses.
- Required attribution: "Vehicle data by VehiclesDB (CC-BY 4.0), built from official public registers — full source notices in ATTRIBUTION.md."
- Use: supplement make/model/year identity and vehicle-type coverage. This dataset is not a source for ground clearance, wheelbase, curb weight or deck-fit measurements.

## Technical specification reference evaluated

- **AutoEvolution-derived automobile-models-and-specs** — https://github.com/ilyasozkurt/automobile-models-and-specs
- Upstream README describes 124 brands, 7,207 models and approximately 30,066 engine variants; scrape date stated as 2024-10-23.
- Fields include dimensions, wheelbase, ground clearance and unladen/gross weight among engine and transmission specifications.
- Use is limited to factual numeric specifications after normalization. Do not import source descriptions, images, logos or other expressive material.
- The repository does not provide an explicit dataset license file. Its data is therefore tracked as a research/reference source, not represented as CC-licensed or independently verified OEM data. Each imported value must retain its source reference and be marked unverified until reviewed against a manufacturer document.

## Accuracy and safety rules

1. The bundled catalog remains the runtime source; no per-lookup network requests or paid API.
2. Missing fields stay missing. Never infer ground clearance from body style, tire size, or a neighboring trim.
3. Keep units explicit during conversion (mm to inches; kg to pounds); round only for display.
4. Preserve variant/engine/trim distinctions where they affect dimensions, weight or clearance.
5. Third-party values are reference values, not OEM verification. On-scene measurement and the actual vehicle placard/manual remain authoritative.
6. A vehicle-to-truck result must separately evaluate physical fit, rated capacity and recovery/equipment suitability. Dimensions alone cannot produce a safe-to-load approval.

## Bulk import status (2026-11-20)

Imported into the bundled catalog by `tools/import-bulk.py` (build-time only; the app makes no network calls for lookups):

- **Specs:** `ilyasozkurt/automobile-models-and-specs` (scrape of autoevolution.com, 2024-10-23). The repo has no LICENSE file; the project owner accepted this risk on 2026-11-20. Attribution is kept in every row (`agg`) and in the audit CSV.
- **US-market filter and body style:** `abhionlyone/us-car-models-data` (CC BY 4.0, 1992-2026). Only models listed there for an overlapping year are imported.
- Not used for dimensions: `vehiclesdb/vehiclesdb`, `n8barr/automotive-model-year-data` (identity only).

Rules applied: no invented values. Curb weight is required (it decides truck class); wheelbase, ground clearance and length/width/height stay **unknown (0 in the app)** when the source lacks them, flagged "NOT IN SOURCE" in the row note, and the app still never gives a clearance verdict from catalog numbers. Across trims: clearance = MIN, curb = MAX, wheelbase = median, length/width/height = MAX (largest listed trim; widths exclude mirrors per the source). Hybrids/EVs are split from the ICE rows of the same generation. Body style shows every style the US list gives when the model name does not decide it. Pre-1992 generations are not bulk-imported (no US-market list to confirm them); the curated rows cover those. Hand-entered rows spanning 8+ model years or lumping models ("G70 / G80 / G90") get a computed warning note and no longer block generation-specific imported rows; where an imported row shares a name with one of them it is renamed with its years.

Known source noise: drive type has no 4WD value (all-wheel and four-wheel are lumped; pickups get both AWD and 4WD offered). FWD is removed from pickups except Maverick, Ridgeline, Santa Cruz and similar FWD-based models. Clearance, wheelbase and length/width/height come from millimetre values converted to 0.1 in.

Models still missing (no curb weight in the source, or not listed there) are tracked in `vehicle-catalog-missing-us-models.csv` for OEM-sourced research.
