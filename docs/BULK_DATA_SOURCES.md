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
