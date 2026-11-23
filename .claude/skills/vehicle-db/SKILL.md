---
name: vehicle-db
description: Add, verify or correct vehicles in the tow app database (ground clearance, wheelbase, curb weight, GVWR). Use for any change to vehicle data in www/data.js.
---
1. Read `tools/vehicle-db/SPEC.md` (row schema, conservative rules, verified rule, fast sources).
2. Edit or add rows in the right `tools/vehicle-db/data/bNN.json` (b01 Ford/Lincoln, b02 GM, b03 Stellantis, b04 Toyota/Lexus,
   b05 Honda/Acura/Nissan/Infiniti, b06 Hyundai/Kia/Genesis, b07 Subaru/Mazda/Mitsubishi/VW, b08 European, b09 EV/medium duty).
   For many models, delegate research to the `vehicle-researcher` subagent, max 3-4 at once (shared web-fetch limit).
3. `python3 tools/vehicle-db/validate.py tools/vehicle-db/data/bNN.json` — fix every error.
4. `python3 tools/vehicle-db/sanity.py` — review flags (odd clearance for body type, big changes vs old values).
5. `python3 tools/vehicle-db/merge.py` — rewrites ROWS in www/data.js and docs/VEHICLE_SOURCES.md. Rows in
   `data/carried_over.json` stay in (unverified) until a batch covers the same make+model+power; remove them from there once covered.
6. `npm test`, then commit.
