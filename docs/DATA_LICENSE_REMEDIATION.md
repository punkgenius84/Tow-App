# Vehicle data licensing and distribution review

**Status: NOT CLEARED for public or commercial redistribution**  
**Reviewed:** 2026-11-20  
**Scope:** Offline vehicle catalog in `www/data.js`

## Current source split

| Source | Intended fields | Current treatment | Distribution status |
|---|---|---|---|
| `abhionlyone/us-car-models-data` | US model/year identity and body style | Imported as a filter / identity source | CC BY 4.0 per upstream repository; retain attribution and licence notice |
| `ilyasozkurt/automobile-models-and-specs` | Vehicle specifications scraped from AutoEvolution | 2,519 rows in current catalog, all marked unverified | **HOLD — no explicit dataset licence identified** |
| OEM manufacturer pages / brochures | Specific model-year specifications | Used for the two current OEM-verified rows and ongoing research | Use the primary source URL and year on each row; retain source scope |

The AutoEvolution-derived upstream repository describes its contents as scraped from autoevolution.com. Its public README does not provide an explicit data licence. A public GitHub repository, public availability, factual numeric content, or an attribution string does not by itself establish permission to copy and redistribute the compiled dataset. This is an engineering release gate, not a legal opinion.

## What must happen before distribution

1. Obtain written permission from the relevant rights holder covering extraction, modification, offline bundling, and redistribution to app users; or replace the affected values with independently sourced OEM data or a dataset with a licence that clearly permits the intended use.
2. Keep source URL, source year, variant scope, units, and licence/provenance information at row level.
3. Preserve all required licence and attribution notices for the CC BY 4.0 identity/body-style source.
4. Rebuild the audit CSV from the final catalog and verify the counts and source-status totals.
5. Have the proposed distribution model and notices reviewed before public or commercial release.

## Importer safeguard

`tools/import-bulk.py` now blocks by default because the specification-source redistribution status is unresolved. The environment variable `TOW_ALLOW_UNLICENSED_SPEC_IMPORT=1` is an explicit opt-in for a deliberate private research run only. It is **not** a licence, permission, waiver, or approval to distribute the resulting database.

## Data-quality status is separate from licensing

As of this review, the catalog has 2,819 rows: 300 curated entries (298 unverified legacy/curated entries plus two OEM-source-verified single-year entries) and 2,519 AutoEvolution-derived entries. The audit CSV records 2 OEM-verified rows and 2,817 unverified rows. A source licence does not prove specification accuracy, and OEM verification does not resolve the rights status of unrelated imported rows.

Ground-clearance values remain reference data only. No catalog value may produce a positive loading clearance verdict; the operator must measure the actual vehicle's lowest point and wheelbase on scene.
