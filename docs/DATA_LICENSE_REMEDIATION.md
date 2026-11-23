# Vehicle data licensing and distribution review

**Status: NOT CLEARED for public or commercial redistribution**  
**Reviewed:** 2026-11-20  
**Scope:** Offline vehicle catalog in `www/data.js`

## Current source split

| Source | Intended fields | Current treatment | Distribution status |
|---|---|---|---|
| `abhionlyone/us-car-models-data` | US model/year identity and body style | Imported as a filter / identity source | CC BY 4.0 per upstream repository; retain attribution and licence notice |
| `ilyasozkurt/automobile-models-and-specs` | Vehicle specifications scraped from AutoEvolution | 2,519 rows in current catalog, all marked unverified | **HOLD — no explicit dataset licence identified** |
| OEM manufacturer pages / brochures | Specific model-year specifications | Used for 11 current OEM-verified single-year rows and ongoing research | Use the primary source URL and year on each row; retain source scope |

The AutoEvolution-derived upstream repository describes its contents as scraped from autoevolution.com. Its public README does not provide an explicit data licence. This review does **not** assume that a royalty or individual credit is owed for every factual vehicle measurement: facts and individual numeric measurements are generally not protected by copyright in the United States. However, source prose, photographs, protected database rights in some jurisdictions, contractual terms, and the selection/arrangement of a compiled dataset can raise separate questions. Public accessibility alone does not establish that the entire upstream compilation is public domain or licensed for redistribution. This is an engineering risk note, not a legal opinion; it does not prevent continued research, independent recording of factual dimensions, or internal testing.

## What must happen before distribution

1. For any external release, confirm the applicable rights and terms for the specific source material being bundled. Where the data are independently recorded factual measurements, preserve the source URL and model-year/variant scope; do not copy protected prose, images, or other expressive material. If a source imposes applicable terms, comply with them or use an independently compiled alternative.
2. Keep source URL, source year, variant scope, units, and licence/provenance information at row level.
3. Preserve all required licence and attribution notices for the CC BY 4.0 identity/body-style source.
4. Rebuild the audit CSV from the final catalog and verify the counts and source-status totals.
5. Have the proposed distribution model and notices reviewed before public or commercial release.

## Importer safeguard

`tools/import-bulk.py` now blocks by default because the specification-source redistribution status is unresolved. The environment variable `TOW_ALLOW_UNLICENSED_SPEC_IMPORT=1` is an explicit opt-in for a deliberate private research run only. It is **not** a licence, permission, waiver, or approval to distribute the resulting database.

## Data-quality status is separate from licensing

As of 2026-11-21, the catalog has 2,837 rows: 315 curated entries (304 unverified curated entries plus 11 OEM-source-verified single-year entries) and 2,522 AutoEvolution-derived entries. The audit CSV records 11 OEM-verified rows and 2,826 low-confidence/unverified rows. These figures were recomputed from all 2,837 CSV data rows. A source licence does not prove specification accuracy, and OEM verification does not resolve the rights status of unrelated imported rows.

Ground-clearance values remain reference data only. No catalog value may produce a positive loading clearance verdict; the operator must measure the actual vehicle's lowest point and wheelbase on scene.


## Clearance-only OEM evidence added (2026-11-23)

Eleven 2025 model-year ground-clearance references were added across Ford F-150 / Super Duty, Kia Sorento, Hyundai Tucson / Santa Fe and Toyota 4Runner. Clearance provenance is stored separately from whole-row dimension provenance. These entries do **not** make their rows fully OEM-verified: curb weight, wheelbase and body dimensions remain unverified where not separately sourced. The 2,522 AutoEvolution-derived rows remain unverified and the redistribution hold remains in force.
