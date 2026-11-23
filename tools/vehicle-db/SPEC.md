# Tow app vehicle database: research spec (read fully before starting)

You are filling rows for a towing reference app used by tow-truck operators (Big Jay's Towing, Florida, US market).
For each vehicle the app needs: curb weight, wheelbase and ground clearance, plus drive/power/transmission options.
Ground clearance and wheelbase drive the ramp break-over safety check; curb weight / GVWR pick the truck class.
Wrong numbers can damage a customer's car, so accuracy beats coverage. Never invent a number.

## Your output
Write ONE JSON file: `tools/vehicle-db/data/{NAME}.json` — a JSON array of row objects:
```json
{
  "make": "Ford",                       // exactly as NHTSA vPIC spells the make (Ford, Chevrolet, Mercedes-Benz, Land Rover...)
  "model": "F-150",                     // NHTSA vPIC model name, then an optional variant/generation in parentheses
  "yFrom": 2015, "yTo": 2020,           // US model years this row covers (inclusive). Newest generation may end at 2026.
  "body": "Pickup",                     // one of: Pickup, SUV, Sedan, Coupe, Hatchback, Minivan, Van  (wagon->Hatchback, convertible->Coupe)
  "drives": "RWD|4WD",                  // every drive offered in this range, pipe-separated, from FWD RWD AWD 4WD
  "power": "ICE",                       // ICE | HEV | PHEV | EV   (separate rows for hybrid/PHEV/EV versions of a model)
  "trans": "AT",                        // pipe list from AT CVT MT DCT EV. EV-only rows use exactly "EV". Hybrids with eCVT use CVT.
                                        // DCT (dual-clutch) matters a lot for towing rules: include it whenever any trim had one.
  "curb": 5000,                         // lb, see conservative rules below, rounded to nearest 50
  "wb": 145.4,                          // inches, 1 decimal
  "gc": 8.4,                            // inches, 1 decimal, see conservative rules below
  "gvwr": 7050,                         // lb; REQUIRED for pickups, vans and full-size SUVs; otherwise omit
  "dually": false,                      // true only for dual-rear-wheel rows
  "air": false,                         // true = air/adaptive height suspension standard; "opt" = optional; false = none
  "low": false,                         // true = sports/low car (gc under ~4.8 in or long overhangs/splitter)
  "note": "",                           // short operator note, only if it changes how the car is towed or measured (<=160 chars)
  "verified": true,                     // see confidence rule
  "sources": ["https://...", "https://..."],   // URLs you actually opened that support curb / wb / gc
  "check": "gc 8.4 (Ford spec sheet) and 8.4 (Edmunds); wb 145.4 SuperCrew 5.5 ft; curb 4WD 3.5L"  // one line: where each number came from
}
```

## Conservative rules (towing safety)
- **gc** = the LOWEST ground clearance among the common factory trims of that range (ignore aftermarket; ignore one-off
  sport/lowered trims only if you give them their own row). Off-road trims with more clearance do not raise the value.
- **wb** = the LONGEST common wheelbase in that range (longer wheelbase = worse break-over). Mention other wheelbases in `note` if they differ by more than 6 in.
- **curb** = the HEAVIEST common configuration (e.g. 4WD crew cab, bigger engine, AWD), rounded to nearest 50 lb.
- **gvwr** = the highest common GVWR in the range.
- Split a model into separate rows (generations) when gc changes by >0.5 in, wb by >2 in, curb by >300 lb, or drive/power/trans options change.
- Model years: cover the US-market generations from roughly **2005 through 2026** (only generations that were actually sold in the US).

## Confidence rule
`verified: true` only if gc AND wb AND curb were each confirmed from at least one reliable page you actually opened
(manufacturer spec/press page, autopadre, Edmunds, KBB, Car and Driver, MotorTrend, Cars.com, NHTSA, Wikipedia infobox/specs table),
AND gc came from the manufacturer, autopadre, or two other reliable sources agreeing within 0.3 in.
Source priority (owner rule): manufacturer figure for that exact make/model/year/trim > autopadre > others. Otherwise `verified: false`
(still give your best sourced number). Never guess a number with no source: drop the row instead and list it in your final message.

## Naming (VIN decode matching depends on this)
The app matches a decoded VIN to rows by make + model name prefix + year. Use the model name NHTSA vPIC returns. Check it with
`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/{make}?format=json` (WebFetch) when unsure (e.g. Mazda3 is "3"? check!).
Keep the plain model name for every generation (years separate them), e.g. "Camry" 2018-2024 and "Camry" 2012-2017. Add a
parenthesised tag only for real variants that NHTSA also calls by the same model name (e.g. "Silverado 3500HD (dually)",
"Wrangler Unlimited (JL)") or the trim matters ("Mustang (Shelby GT500)"). Hybrid/EV versions: same model name + " Hybrid" /
" Plug-in Hybrid" only if NHTSA names it that way, otherwise same name with a different `power`.
**Existing rows given to you keep their exact make + model strings** (tests use them); you may change years/values and you
may split them into more generations (keep the existing name on the newest generation).

## Process
1. Read your assignment `the assignment in your prompt` (existing rows to verify + models to add).
2. Research with WebSearch (mode standard) / WebFetch. Batch several searches per turn. A good fast pattern: one search per
   model+generation for "{year} {make} {model} ground clearance wheelbase curb weight specs", open 1-2 spec pages.
3. Write the JSON file as you go (rewrite it after every few models so work is never lost).
4. Run `python3 tools/vehicle-db/validate.py tools/vehicle-db/data/{NAME}.json` and fix every error.
5. Final message: number of rows, how many verified, any existing value you changed by >0.3 in gc / >2 in wb / >300 lb curb
   (old -> new, with source), and any requested model you dropped and why. Keep it short.
Do not edit any other files. Do not touch the app repo.

## Fast sources (learned in round 1)
- **autopadre.com** — PRIMARY source (owner-approved). One page per model covers every year and lists the trims:
  `https://www.autopadre.com/ground-clearance/{make}-{model}`, plus `/vehicle-dimensions/{make}-{model}` (wheelbase, in rounded feet - prefer an exact
  inch figure when you have one) and `/vehicle-weight/{make}-{model}` (curb weight). Some slugs use the numbered model
  (lexus-rx-350). Watch for autopadre listing GVWR as curb weight on big SUVs, and obvious typos. Take the lowest gc, longest wb
  and heaviest curb across trims for each range. A row is `verified: true` when gc, wb and curb all come from autopadre
  (or autopadre plus another reliable page). No second source is needed. Use KBB/Edmunds/maker only to fill what
  autopadre lacks (e.g. model years after its last update, GVWR).
- **OEM overrides autopadre** (owner rule): if you have the manufacturer's own figure (maker spec sheet, brochure, press
  release, owner's manual) for the same make, model, year and trim, use the OEM number instead of autopadre's for that
  trim, then apply the conservative rule across trims as usual. Put the OEM URL in sources (no override note needed). Only override from a page you actually opened, never from memory.
- **KBB** `kbb.com/{make}/{model}/{year}/specs/` and **Edmunds** features-specs pages: per-trim gc/wb/curb. Note KBB,
  Edmunds, CarBuzz and iseecars often share one data feed, so two of them agreeing is weaker than maker + one of them.
- **Maker brochures/spec PDFs** (Toyota `toyota.com/content/dam/toyota/brochures/pdf/{year}/{model}_ebrochure.pdf`,
  Honda Canada spec PDFs, Ford spec sheets) are the best sources when they load.
- **Lexus Canada** `media.lexus.ca/en/specifications/{year}/{year}-lexus-{model}-specifications.html` counts as maker data.
- **Skip:** cars.com for gc (rounds to whole inches), GM media pages and Car and Driver / MotorTrend (blocked).
- WebFetch has a shared hourly limit across all agents; run at most 3-4 research agents at once.
